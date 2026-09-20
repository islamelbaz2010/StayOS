from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User

from .constants import PUBLICATION_WINDOW_DAYS
from .models import Review


async def get_review_by_booking(session: AsyncSession, booking_id: str) -> Review | None:
    result = await session.execute(select(Review).where(Review.booking_id == booking_id))
    return result.scalar_one_or_none()


async def get_guest_review_by_booking(session: AsyncSession, booking_id: str) -> Review | None:
    result = await session.execute(
        select(Review).where(
            Review.booking_id == booking_id,
            Review.reviewer_role == "guest",
        )
    )
    return result.scalar_one_or_none()


async def get_host_review_by_booking(session: AsyncSession, booking_id: str) -> Review | None:
    result = await session.execute(
        select(Review).where(
            Review.booking_id == booking_id,
            Review.reviewer_role == "host",
        )
    )
    return result.scalar_one_or_none()


async def get_review_by_id(session: AsyncSession, review_id: str) -> Review | None:
    result = await session.execute(select(Review).where(Review.id == review_id))
    return result.scalar_one_or_none()


async def create_review(
    session: AsyncSession,
    *,
    booking_id: str,
    unit_id: str,
    guest_id: str,
    reviewer_id: str,
    reviewer_role: str,
    rating: int,
    comment: str | None,
    subratings: dict[str, int] | None = None,
) -> Review:
    review = Review(
        booking_id=booking_id,
        unit_id=unit_id,
        guest_id=guest_id,
        reviewer_id=reviewer_id,
        reviewer_role=reviewer_role,
        rating=rating,
        comment=comment,
        subratings=subratings,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review


async def set_host_response(
    session: AsyncSession, review: Review, response: str
) -> Review:
    """Set the host's public response on a guest review."""
    review.host_response = response
    review.host_response_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(review)
    return review


def is_review_published(
    review: Review,
    has_counterpart: bool,
    now: datetime | None = None,
) -> bool:
    """Determine if a review is visible per Airbnb's simultaneous
    publication rule.

    A review is published when:
    - ``published_at`` is already set (backfilled or previously
      computed), OR
    - the other party's review for the same booking exists, OR
    - PUBLICATION_WINDOW_DAYS have elapsed since ``created_at``.

    Computed on read to avoid a background sweep.
    """
    if review.published_at is not None:
        return True
    if has_counterpart:
        return True
    now = now or datetime.now(timezone.utc)
    window = timedelta(days=PUBLICATION_WINDOW_DAYS)
    return (now - review.created_at) >= window


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def list_reviews_for_unit(
    session: AsyncSession,
    unit_id: str,
    limit: int,
    offset: int,
    query: str | None = None,
) -> list[tuple[Review, str | None]]:
    """List published guest reviews for a unit, newest first."""
    stmt = (
        select(Review, User.display_name)
        .join(User, User.id == Review.guest_id)
        .where(
            Review.unit_id == unit_id,
            Review.reviewer_role == "guest",
        )
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if query:
        stmt = stmt.where(Review.comment.ilike(f"%{_escape_like(query)}%", escape="\\"))
    result = await session.execute(stmt)
    rows = [(review, guest_name) for review, guest_name in result.all()]
    if not rows:
        return []
    booking_ids = [review.booking_id for review, _ in rows]
    # For each booking, check whether a host review exists (counterpart).
    counterpart_result = await session.execute(
        select(Review.booking_id)
        .where(
            Review.booking_id.in_(booking_ids),
            Review.reviewer_role == "host",
        )
        .group_by(Review.booking_id)
    )
    has_host_review = {row[0] for row in counterpart_result.all()}
    now = datetime.now(timezone.utc)
    return [
        (review, guest_name)
        for review, guest_name in rows
        if is_review_published(review, review.booking_id in has_host_review, now)
    ]


async def get_rating_aggregate_for_unit(
    session: AsyncSession, unit_id: str
) -> tuple[float | None, int]:
    """Aggregate over ALL guest reviews (published or not) — the
    aggregate is the same whether or not we filter for publication
    because unpublished reviews are temporary (14-day window)."""
    result = await session.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.unit_id == unit_id,
            Review.reviewer_role == "guest",
        )
    )
    avg_rating, count = result.one()
    return (round(float(avg_rating), 2) if avg_rating is not None else None, count or 0)


async def get_subrating_averages_for_unit(
    session: AsyncSession, unit_id: str
) -> dict[str, float]:
    """Compute the average for each subrating key across all guest reviews.

    Subratings are stored as a JSONB column; we load them and average in
    Python to stay portable across PostgreSQL versions.
    """
    result = await session.execute(
        select(Review.subratings).where(
            Review.unit_id == unit_id,
            Review.reviewer_role == "guest",
            Review.subratings.is_not(None),
        )
    )
    sums: dict[str, float] = {}
    counts: dict[str, int] = {}
    for (subratings,) in result.all():
        if not subratings:
            continue
        for key, value in subratings.items():
            if not isinstance(value, (int, float)):
                continue
            sums[key] = sums.get(key, 0.0) + float(value)
            counts[key] = counts.get(key, 0) + 1
    return {
        key: round(sums[key] / counts[key], 2)
        for key in sums
        if counts[key] > 0
    }


async def get_rating_distribution_for_unit(
    session: AsyncSession, unit_id: str
) -> dict[int, int]:
    """Count of guest reviews per star rating (1-5). Missing stars are 0."""
    result = await session.execute(
        select(Review.rating, func.count(Review.id)).where(
            Review.unit_id == unit_id,
            Review.reviewer_role == "guest",
        ).group_by(Review.rating)
    )
    counts = {row[0]: row[1] for row in result.all()}
    return {star: counts.get(star, 0) for star in range(1, 6)}


async def get_rating_aggregates_for_units(
    session: AsyncSession, unit_ids: list[str]
) -> dict[str, tuple[float, int]]:
    if not unit_ids:
        return {}
    result = await session.execute(
        select(Review.unit_id, func.avg(Review.rating), func.count(Review.id))
        .where(
            Review.unit_id.in_(unit_ids),
            Review.reviewer_role == "guest",
        )
        .group_by(Review.unit_id)
    )
    return {
        unit_id: (round(float(avg_rating), 2), count)
        for unit_id, avg_rating, count in result.all()
    }


async def count_reviews_by_guest(session: AsyncSession, guest_id: str) -> int:
    """Count reviews written by a single guest — a trust signal for hosts."""
    result = await session.execute(
        select(func.count(Review.id)).where(
            Review.guest_id == guest_id,
            Review.reviewer_role == "guest",
        )
    )
    return result.scalar_one()


async def count_reviews_by_guests(
    session: AsyncSession, guest_ids: list[str]
) -> dict[str, int]:
    """Batch-count reviews written by each guest — avoids N+1 in list views."""
    if not guest_ids:
        return {}
    result = await session.execute(
        select(Review.guest_id, func.count(Review.id))
        .where(
            Review.guest_id.in_(guest_ids),
            Review.reviewer_role == "guest",
        )
        .group_by(Review.guest_id)
    )
    return {guest_id: count for guest_id, count in result.all()}


async def list_host_reviews_for_guest(
    session: AsyncSession, guest_id: str, limit: int, offset: int
) -> list[tuple[Review, str | None]]:
    """List host-written reviews of a specific guest."""
    result = await session.execute(
        select(Review, User.display_name)
        .join(User, User.id == Review.reviewer_id)
        .where(
            Review.guest_id == guest_id,
            Review.reviewer_role == "host",
        )
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [(review, host_name) for review, host_name in result.all()]


async def get_guest_rating_aggregate(
    session: AsyncSession, guest_id: str
) -> tuple[float | None, int]:
    """Average rating and count of host reviews for a guest."""
    result = await session.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.guest_id == guest_id,
            Review.reviewer_role == "host",
        )
    )
    avg_rating, count = result.one()
    return (round(float(avg_rating), 2) if avg_rating is not None else None, count or 0)


async def get_guest_rating_aggregates(
    session: AsyncSession, guest_ids: list[str]
) -> dict[str, tuple[float | None, int]]:
    """Batch average rating + count of host reviews per guest."""
    if not guest_ids:
        return {}
    result = await session.execute(
        select(Review.guest_id, func.avg(Review.rating), func.count(Review.id))
        .where(
            Review.guest_id.in_(guest_ids),
            Review.reviewer_role == "host",
        )
        .group_by(Review.guest_id)
    )
    return {
        guest_id: (
            round(float(avg), 2) if avg is not None else None,
            count or 0,
        )
        for guest_id, avg, count in result.all()
    }
