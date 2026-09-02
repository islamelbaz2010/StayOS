from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User

from .models import Review


async def get_review_by_booking(session: AsyncSession, booking_id: str) -> Review | None:
    result = await session.execute(select(Review).where(Review.booking_id == booking_id))
    return result.scalar_one_or_none()


async def create_review(
    session: AsyncSession, *, booking_id: str, unit_id: str, guest_id: str, rating: int, comment: str | None
) -> Review:
    review = Review(
        booking_id=booking_id,
        unit_id=unit_id,
        guest_id=guest_id,
        rating=rating,
        comment=comment,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review


async def list_reviews_for_unit(
    session: AsyncSession, unit_id: str, limit: int, offset: int
) -> list[tuple[Review, str | None]]:
    result = await session.execute(
        select(Review, User.display_name)
        .join(User, User.id == Review.guest_id)
        .where(Review.unit_id == unit_id)
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [(review, guest_name) for review, guest_name in result.all()]


async def get_rating_aggregate_for_unit(
    session: AsyncSession, unit_id: str
) -> tuple[float | None, int]:
    result = await session.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.unit_id == unit_id)
    )
    avg_rating, count = result.one()
    return (round(float(avg_rating), 2) if avg_rating is not None else None, count or 0)


async def get_rating_aggregates_for_units(
    session: AsyncSession, unit_ids: list[str]
) -> dict[str, tuple[float, int]]:
    if not unit_ids:
        return {}
    result = await session.execute(
        select(Review.unit_id, func.avg(Review.rating), func.count(Review.id))
        .where(Review.unit_id.in_(unit_ids))
        .group_by(Review.unit_id)
    )
    return {
        unit_id: (round(float(avg_rating), 2), count)
        for unit_id, avg_rating, count in result.all()
    }
