from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.shared.exceptions import AuthorizationError, ConflictError, ValidationError

from . import repository as reviews_repository
from .models import Review
from .schemas import RatingAggregate, ReviewCreate, ReviewListResponse, ReviewResponse


def _to_response(review: Review, guest_display_name: str | None) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        unit_id=review.unit_id,
        booking_id=review.booking_id,
        guest_id=review.guest_id,
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
    if booking.status != BookingStatus.COMPLETED:
        raise ValidationError("You can only review a stay after it's completed")

    existing = await reviews_repository.get_review_by_booking(session, booking_id)
    if existing is not None:
        raise ConflictError("This booking has already been reviewed")

    review = await reviews_repository.create_review(
        session,
        booking_id=booking_id,
        unit_id=booking.unit_id,
        guest_id=user.id,
        rating=request.rating,
        comment=request.comment,
    )
    return _to_response(review, user.display_name)


async def get_listing_reviews(
    session: AsyncSession, unit_id: str, limit: int, offset: int
) -> ReviewListResponse:
    rows = await reviews_repository.list_reviews_for_unit(session, unit_id, limit, offset)
    average_rating, review_count = await reviews_repository.get_rating_aggregate_for_unit(
        session, unit_id
    )
    return ReviewListResponse(
        data=[_to_response(review, guest_name) for review, guest_name in rows],
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
