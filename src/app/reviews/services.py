from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.shared.exceptions import AuthorizationError, ConflictError, ValidationError

from . import repository as reviews_repository
from .models import Review
from .schemas import (
    GuestReviewListResponse,
    HostReviewResponse,
    RatingAggregate,
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
)


def _to_response(
    review: Review, guest_display_name: str | None, reviewer_display_name: str | None = None
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
        created_at=review.created_at,
    )


def _to_host_review_response(
    review: Review, reviewer_display_name: str | None, guest_display_name: str | None
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

    review = await reviews_repository.create_review(
        session,
        booking_id=booking_id,
        unit_id=booking.unit_id,
        guest_id=user.id,
        reviewer_id=user.id,
        reviewer_role="guest",
        rating=request.rating,
        comment=request.comment,
    )
    return _to_response(review, user.display_name, user.display_name)


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

    from sqlalchemy import select

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

    review = await reviews_repository.create_review(
        session,
        booking_id=booking_id,
        unit_id=booking.unit_id,
        guest_id=booking.guest_id,
        reviewer_id=user.id,
        reviewer_role="host",
        rating=request.rating,
        comment=request.comment,
    )
    return _to_host_review_response(
        review,
        user.display_name,
        guest_user.display_name if guest_user else None,
    )


async def get_guest_reviews(
    session: AsyncSession, guest_id: str, limit: int, offset: int
) -> GuestReviewListResponse:
    rows = await reviews_repository.list_host_reviews_for_guest(
        session, guest_id, limit, offset
    )
    average_rating, review_count = await reviews_repository.get_guest_rating_aggregate(
        session, guest_id
    )
    return GuestReviewListResponse(
        data=[
            _to_host_review_response(review, host_name, None)
            for review, host_name in rows
        ],
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
