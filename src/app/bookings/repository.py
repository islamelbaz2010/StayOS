# ruff: noqa: I001
# Import ordering differs between local Ruff (0.1.8: ``app`` sorts with
# third-party) and CI Ruff (0.16.1: ``app`` is first-party). No single
# ordering satisfies both, so I001 is suppressed for this file only.
from datetime import date
from uuid import uuid4

from app.listings.models import Unit, UnitListing
from app.shared.exceptions import NotFoundError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .constants import BookingStatus
from .models import Booking


async def create_booking(
    session: AsyncSession,
    unit_id: str,
    guest_id: str,
    check_in: date,
    check_out: date,
    adults: int,
    children: int,
    infants: int,
) -> Booking:
    booking = Booking(
        id=str(uuid4()),
        unit_id=unit_id,
        guest_id=guest_id,
        status=BookingStatus.REQUESTED,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        children=children,
        infants=infants,
    )
    session.add(booking)
    await session.flush()
    await session.refresh(booking)
    return booking


async def get_booking(session: AsyncSession, booking_id: str) -> Booking | None:
    result = await session.execute(
        select(Booking)
        .options(
            selectinload(Booking.unit)
            .selectinload(Unit.listing)
            .selectinload(UnitListing.cover_photo)
        )
        .where(Booking.id == booking_id)
    )
    return result.scalar_one_or_none()


async def get_booking_or_raise(session: AsyncSession, booking_id: str) -> Booking:
    booking = await get_booking(session, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


async def list_overlapping_bookings(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
    exclude_booking_id: str | None = None,
) -> list[Booking]:
    stmt = (
        select(Booking)
        .where(
            Booking.unit_id == unit_id,
            Booking.status.notin_([BookingStatus.CANCELLED, BookingStatus.REJECTED]),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        .order_by(Booking.check_in)
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_booking(session: AsyncSession, booking: Booking, **kwargs: object) -> Booking:
    for key, value in kwargs.items():
        setattr(booking, key, value)
    session.add(booking)
    await session.flush()
    await session.refresh(booking)
    return booking


async def list_guest_bookings(
    session: AsyncSession,
    guest_id: str,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Booking]:
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.unit)
            .selectinload(Unit.listing)
            .selectinload(UnitListing.cover_photo)
        )
        .where(Booking.guest_id == guest_id)
        .order_by(Booking.created_at.desc(), Booking.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_host_bookings(
    session: AsyncSession,
    host_id: str,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    unit_ids: list[str] | None = None,
) -> list[Booking]:
    """List bookings for a host's units.

    When ``unit_ids`` is provided (e.g. owned + co-hosted units from
    ``host.permissions.get_managed_unit_ids``) the query scopes to those
    units; otherwise it falls back to units owned by ``host_id``.
    """
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.unit)
            .selectinload(Unit.listing)
            .selectinload(UnitListing.cover_photo)
        )
        .join(Unit, Booking.unit_id == Unit.id)
        .order_by(Booking.created_at.desc(), Booking.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if unit_ids is not None:
        stmt = stmt.where(Booking.unit_id.in_(unit_ids))
    else:
        stmt = stmt.where(Unit.host_id == host_id)
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_host_completed_bookings(
    session: AsyncSession,
    host_id: str,
    exclude_booking_id: str | None = None,
) -> int:
    """Count completed bookings for a host, optionally excluding one booking."""
    stmt = (
        select(func.count(Booking.id))
        .join(Unit, Booking.unit_id == Unit.id)
        .where(
            Unit.host_id == host_id,
            Booking.status == BookingStatus.COMPLETED,
        )
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    result = await session.execute(stmt)
    return result.scalar_one()


async def count_global_completed_bookings(
    session: AsyncSession,
    exclude_booking_id: str | None = None,
) -> int:
    """Count all completed bookings globally, optionally excluding one booking."""
    stmt = select(func.count(Booking.id)).where(
        Booking.status == BookingStatus.COMPLETED
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    result = await session.execute(stmt)
    return result.scalar_one()
