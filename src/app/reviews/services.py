from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.shared.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError

from . import repository as reviews_repository
from .models import Review
from .schemas import (
    GuestReviewListResponse,
    HostReviewResponse,
    HostResponseCreate,
    RatingAggregate,
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
)


def _to_response(
    review: Review,
    guest_display_name: str | None,
    reviewer_display_name: str | None = None,
    published: bool = True,
) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        unit_id=review.unit_id,
        booking_id=review.booking_id,
        guest_id=review.guest_id,
        reviewer_id=review.reviewer_id,
        reviewer_role=review.reviewer_role,
        guest_display_name=guest_display_name,
        reviewer_display_name=reviewer_display_name,
        rating=review.rating,
        comment=review.comment,
        subratings=review.subratings,
        published=published,
        host_response=review.host_response,
        host_response_at=review.host_response_at,
        created_at=review.created_at,
    )


def _to_host_review_response(
    review: Review,
    reviewer_display_name: str | None,
    guest_display_name: str | None,
    published: bool = True,
) -> HostReviewResponse:
    return HostReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        guest_id=review.guest_id,
        reviewer_id=review.reviewer_id,
        reviewer_display_name=reviewer_display_name,
        guest_display_name=guest_display_name,
        rating=review.rating,
        comment=review.comment,
        published=published,
        created_at=review.created_at,
    )


async def create_review(
    session: AsyncSession, user: User, booking_id: str, request: ReviewCreate
) -> ReviewResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    if booking.guest_id != user.id:
        raise AuthorizationError("You can only review your own bookings")
    # Eligible once the stay is administratively COMPLETED (finance/payout
    # done), OR the guest has self-reported checkout — whichever comes
    # first. A cancelled booking is never eligible even if it was somehow
    # checked out. This only loosens the original COMPLETED-only gate; it
    # never allows a review that wasn't already allowed.
    stay_finished = (
        booking.status == BookingStatus.COMPLETED or booking.checked_out_at is not None
    )
    if not stay_finished or booking.status == BookingStatus.CANCELLED:
        raise ValidationError("You can only review a stay after it's completed")

    existing = await reviews_repository.get_guest_review_by_booking(session, booking_id)
    if existing is not None:
        raise ConflictError("This booking has already been reviewed")

    # Subratings only apply to guest reviews (Airbnb behavior).
    subratings = request.subratings if request.subratings else None

    review = await reviews_repository.create_review(
        session,
        booking_id=booking_id,
        unit_id=booking.unit_id,
        guest_id=user.id,
        reviewer_id=user.id,
        reviewer_role="guest",
        rating=request.rating,
        comment=request.comment,
        subratings=subratings,
    )
    # Determine publication status: published if host review already
    # exists for this booking (simultaneous publication).
    host_review = await reviews_repository.get_host_review_by_booking(
        session, booking_id
    )
    published = reviews_repository.is_review_published(review, host_review is not None)
    return _to_response(review, user.display_name, user.display_name, published)


async def create_host_review(
    session: AsyncSession, user: User, booking_id: str, request: ReviewCreate
) -> HostReviewResponse:
    """Host reviews the guest after a completed stay (Airbnb bidirectional reviews)."""
    from app.auth.constants import UserRole

    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts can write host reviews")

    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    # Host must own the unit (or be admin)
    from app.listings.models import Unit

    unit_result = await session.execute(select(Unit).where(Unit.id == booking.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit is None:
        raise ValidationError("Listing not found")
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("You can only review guests for your own listings")

    stay_finished = (
        booking.status == BookingStatus.COMPLETED or booking.checked_out_at is not None
    )
    if not stay_finished or booking.status == BookingStatus.CANCELLED:
        raise ValidationError("You can only review a guest after the stay is completed")

    existing = await reviews_repository.get_host_review_by_booking(session, booking_id)
    if existing is not None:
        raise ConflictError("You have already reviewed this guest")

    # Get guest display name
    guest_result = await session.execute(select(User).where(User.id == booking.guest_id))
    guest_user = guest_result.scalar_one_or_none()

    # Host reviews do not use subratings (Airbnb behavior).
    review = await reviews_repository.create_review(
        session,
        booking_id=booking_id,
        unit_id=booking.unit_id,
        guest_id=booking.guest_id,
        reviewer_id=user.id,
        reviewer_role="host",
        rating=request.rating,
        comment=request.comment,
        subratings=None,
    )
    # Publication: published if guest review already exists.
    guest_review = await reviews_repository.get_guest_review_by_booking(
        session, booking_id
    )
    published = reviews_repository.is_review_published(review, guest_review is not None)
    return _to_host_review_response(
        review,
        user.display_name,
        guest_user.display_name if guest_user else None,
        published,
    )


async def create_host_response(
    session: AsyncSession,
    user: User,
    review_id: str,
    request: HostResponseCreate,
) -> ReviewResponse:
    """Host writes a public response to a guest review (Airbnb behavior).

    Only the host who owns the unit (or an admin) can respond. Only guest
    reviews can receive a host response. One response per review.
    """
    from app.auth.constants import UserRole

    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts can respond to reviews")

    review = await reviews_repository.get_review_by_id(session, review_id)
    if review is None:
        raise NotFoundError("Review not found")

    if review.reviewer_role != "guest":
        raise ValidationError("You can only respond to guest reviews")

    if review.host_response is not None:
        raise ConflictError("A response has already been written for this review")

    # Verify the host owns the unit for this review.
    from app.listings.models import Unit

    unit_result = await session.execute(select(Unit).where(Unit.id == review.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit is None:
        raise ValidationError("Listing not found")
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("You can only respond to reviews for your own listings")

    await reviews_repository.set_host_response(session, review, request.response)

    # Get guest display name for the response.
    guest_result = await session.execute(select(User).where(User.id == review.guest_id))
    guest_user = guest_result.scalar_one_or_none()
    guest_name = guest_user.display_name if guest_user else None

    # Determine publication status.
    host_review = await reviews_repository.get_host_review_by_booking(
        session, review.booking_id
    )
    published = reviews_repository.is_review_published(review, host_review is not None)
    return _to_response(review, guest_name, guest_name, published)


async def get_guest_reviews(
    session: AsyncSession, guest_id: str, limit: int, offset: int
) -> GuestReviewListResponse:
    rows = await reviews_repository.list_host_reviews_for_guest(
        session, guest_id, limit, offset
    )
    average_rating, review_count = await reviews_repository.get_guest_rating_aggregate(
        session, guest_id
    )
    # For host reviews of a guest, publication depends on whether the
    # guest also left a review for the same booking.
    now = datetime.now(timezone.utc)
    data: list[HostReviewResponse] = []
    for review, host_name in rows:
        guest_review = await reviews_repository.get_guest_review_by_booking(
            session, review.booking_id
        )
        published = reviews_repository.is_review_published(
            review, guest_review is not None, now
        )
        data.append(_to_host_review_response(review, host_name, None, published))
    return GuestReviewListResponse(
        data=data,
        average_rating=average_rating,
        review_count=review_count,
        limit=limit,
        offset=offset,
    )


async def get_listing_reviews(
    session: AsyncSession, unit_id: str, limit: int, offset: int
) -> ReviewListResponse:
    rows = await reviews_repository.list_reviews_for_unit(session, unit_id, limit, offset)
    average_rating, review_count = await reviews_repository.get_rating_aggregate_for_unit(
        session, unit_id
    )
    return ReviewListResponse(
        data=[_to_response(review, guest_name, guest_name) for review, guest_name in rows],
        average_rating=average_rating,
        review_count=review_count,
        limit=limit,
        offset=offset,
    )


async def get_listing_rating(session: AsyncSession, unit_id: str) -> RatingAggregate:
    average_rating, review_count = await reviews_repository.get_rating_aggregate_for_unit(
        session, unit_id
    )
    return RatingAggregate(average_rating=average_rating, review_count=review_count)
