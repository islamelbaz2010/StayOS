"""Repository for host operating system queries.

All queries here operate on the LIVE ``bookings + payments`` path, never
the legacy ``reservations`` architecture.
"""

from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings.cohost_models import ListingReadinessCheck, UnitCoHost
from app.listings.models import Unit, UnitListing
from app.payments.constants import PaymentStatus
from app.payments.models import Payment


async def create_co_host(
    session: AsyncSession,
    unit_id: str,
    co_host_user_id: str,
    permission_scope: str,
    invited_by: str | None = None,
) -> UnitCoHost:
    co_host = UnitCoHost(
        id=str(uuid4()),
        unit_id=unit_id,
        co_host_user_id=co_host_user_id,
        permission_scope=permission_scope,
        is_active=True,
        invited_by=invited_by,
    )
    session.add(co_host)
    await session.flush()
    await session.refresh(co_host)
    return co_host


async def get_co_host(
    session: AsyncSession, unit_id: str, co_host_user_id: str
) -> UnitCoHost | None:
    result = await session.execute(
        select(UnitCoHost).where(
            UnitCoHost.unit_id == unit_id,
            UnitCoHost.co_host_user_id == co_host_user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_co_host_by_id(
    session: AsyncSession, co_host_id: str
) -> UnitCoHost | None:
    result = await session.execute(
        select(UnitCoHost).where(UnitCoHost.id == co_host_id)
    )
    return result.scalar_one_or_none()


async def list_co_hosts_for_unit(
    session: AsyncSession, unit_id: str
) -> list[tuple[UnitCoHost, User]]:
    result = await session.execute(
        select(UnitCoHost, User)
        .join(User, User.id == UnitCoHost.co_host_user_id)
        .where(UnitCoHost.unit_id == unit_id)
        .order_by(UnitCoHost.created_at.desc())
    )
    return [(ch, u) for ch, u in result.all()]


async def list_co_hosted_units_for_user(
    session: AsyncSession, user_id: str
) -> list[Unit]:
    result = await session.execute(
        select(Unit)
        .join(UnitCoHost, UnitCoHost.unit_id == Unit.id)
        .where(
            UnitCoHost.co_host_user_id == user_id,
            UnitCoHost.is_active.is_(True),
        )
        .options(selectinload(Unit.listing), selectinload(Unit.photos))
        .order_by(Unit.created_at.desc())
    )
    return list(result.scalars().all())


async def count_co_hosted_units(session: AsyncSession, user_id: str) -> int:
    result = await session.scalar(
        select(func.count(UnitCoHost.id)).where(
            UnitCoHost.co_host_user_id == user_id,
            UnitCoHost.is_active.is_(True),
        )
    )
    return result or 0


async def get_host_bookings(
    session: AsyncSession,
    host_id: str,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Booking]:
    """List bookings for units owned by the host, with unit eagerly loaded."""
    stmt = (
        select(Booking)
        .options(selectinload(Booking.unit).selectinload(Unit.listing))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(Unit.host_id == host_id)
        .order_by(Booking.check_in.desc(), Booking.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_host_bookings_for_today(
    session: AsyncSession, host_id: str, today: date
) -> list[Booking]:
    """Bookings relevant to the host's today view:
    - Check-ins today
    - Check-outs today
    - Current stays (checked in, not checked out)
    - Pending requests
    """
    stmt = (
        select(Booking)
        .options(selectinload(Booking.unit).selectinload(Unit.listing))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(Unit.host_id == host_id)
        .where(
            Booking.status.in_([
                BookingStatus.REQUESTED,
                BookingStatus.ACCEPTED,
                BookingStatus.CONFIRMED,
            ])
        )
        .order_by(Booking.check_in.asc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_host_unread_conversations_count(
    session: AsyncSession, host_id: str
) -> int:
    """Count conversations where the host has unread messages."""
    from app.messages.models import Conversation, ConversationParticipant, Message

    # Subquery: last_read_at for the host across all their conversations
    stmt = (
        select(func.count(Message.id))
        .select_from(Message)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(
            ConversationParticipant.user_id == host_id,
            Message.sender_id != host_id,
            Message.sender_id.is_not(None),
        )
    )
    # Only count messages after last_read_at (or all if last_read_at is null)
    stmt = stmt.where(
        func.coalesce(
            Message.created_at > ConversationParticipant.last_read_at,
            True,
        )
    )
    result = await session.scalar(stmt)
    return result or 0


async def get_host_earnings(
    session: AsyncSession, host_id: str
) -> dict[str, Any]:
    """Compute host earnings from the live payments path.

    This is read-only financial visibility — it does not claim payouts
    or escrow. It shows what the payment records actually say.
    """
    # Get all unit IDs owned by the host
    unit_ids_result = await session.execute(
        select(Unit.id).where(Unit.host_id == host_id)
    )
    unit_ids = [row[0] for row in unit_ids_result.all()]
    if not unit_ids:
        return {
            "total_bookings": 0,
            "confirmed_bookings": 0,
            "completed_stays": 0,
            "total_revenue_egp": 0,
            "pending_verification_egp": 0,
            "refund_pending_egp": 0,
            "net_earnings_egp": 0,
            "per_unit": [],
        }

    # Total bookings for host's units
    total_bookings = await session.scalar(
        select(func.count(Booking.id))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(Unit.host_id == host_id)
    )
    total_bookings = total_bookings or 0

    # Confirmed bookings
    confirmed_bookings = await session.scalar(
        select(func.count(Booking.id))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(Unit.host_id == host_id, Booking.status == BookingStatus.CONFIRMED)
    )
    confirmed_bookings = confirmed_bookings or 0

    # Completed stays (checked out or completed status)
    completed_stays = await session.scalar(
        select(func.count(Booking.id))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(
            Unit.host_id == host_id,
            Booking.checked_out_at.is_not(None),
        )
    )
    completed_stays = completed_stays or 0

    # Revenue: sum of VERIFIED payment amounts
    revenue = await session.scalar(
        select(func.coalesce(func.sum(Payment.amount_egp), 0))
        .where(
            Payment.host_id == host_id,
            Payment.status == PaymentStatus.VERIFIED,
        )
    )
    revenue = int(revenue or 0)

    # Pending verification: PROOF_UPLOADED payments
    pending_verification = await session.scalar(
        select(func.coalesce(func.sum(Payment.amount_egp), 0))
        .where(
            Payment.host_id == host_id,
            Payment.status == PaymentStatus.PROOF_UPLOADED,
        )
    )
    pending_verification = int(pending_verification or 0)

    # Refund pending
    refund_pending = await session.scalar(
        select(func.coalesce(func.sum(Payment.refund_amount_egp), 0))
        .where(
            Payment.host_id == host_id,
            Payment.status == PaymentStatus.REFUND_PENDING,
        )
    )
    refund_pending = int(refund_pending or 0)

    net_earnings = revenue - refund_pending

    # Per-unit breakdown
    per_unit_result = await session.execute(
        select(
            Payment.unit_id,
            func.count(Payment.id).label("booking_count"),
            func.coalesce(func.sum(Payment.amount_egp), 0).label("revenue"),
        )
        .where(
            Payment.host_id == host_id,
            Payment.status == PaymentStatus.VERIFIED,
        )
        .group_by(Payment.unit_id)
    )
    per_unit: list[dict[str, Any]] = []
    for row in per_unit_result.all():
        # Get unit title
        unit_result = await session.execute(
            select(UnitListing.title_ar, UnitListing.title_en)
            .join(Unit, Unit.id == UnitListing.unit_id)
            .where(Unit.id == row.unit_id)
        )
        title_row = unit_result.one_or_none()
        title = (title_row.title_ar if title_row else None) or (title_row.title_en if title_row else None)
        per_unit.append({
            "unit_id": row.unit_id,
            "unit_title": title,
            "booking_count": row.booking_count,
            "revenue_egp": int(row.revenue),
        })

    return {
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_stays": completed_stays,
        "total_revenue_egp": revenue,
        "pending_verification_egp": pending_verification,
        "refund_pending_egp": refund_pending,
        "net_earnings_egp": net_earnings,
        "per_unit": per_unit,
    }


async def get_or_create_readiness_check(
    session: AsyncSession, unit_id: str
) -> ListingReadinessCheck:
    result = await session.execute(
        select(ListingReadinessCheck).where(ListingReadinessCheck.unit_id == unit_id)
    )
    check = result.scalar_one_or_none()
    if check is None:
        check = ListingReadinessCheck(
            id=str(uuid4()),
            unit_id=unit_id,
            status="action_required",
            missing_items=[],
        )
        session.add(check)
        await session.flush()
        await session.refresh(check)
    return check


async def upsert_readiness_check(
    session: AsyncSession,
    unit_id: str,
    status: str,
    missing_items: list[str],
) -> ListingReadinessCheck:
    check = await get_or_create_readiness_check(session, unit_id)
    check.status = status
    check.missing_items = missing_items
    check.computed_at = datetime.now(UTC)
    session.add(check)
    await session.flush()
    await session.refresh(check)
    return check
