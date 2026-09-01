from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings import repository as listings_repository
from app.listings.models import CalendarRule
from app.reservations.constants import ReservationStatus
from app.reservations.models import Reservation


async def get_calendar_rules_for_unit(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
) -> list[CalendarRule]:
    return await listings_repository.get_calendar_rules_in_range(
        session, unit_id, check_in, check_out
    )


async def get_accepted_bookings_for_unit(
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
            Booking.status.in_(
                (
                    BookingStatus.REQUESTED,
                    BookingStatus.ACCEPTED,
                    BookingStatus.CONFIRMED,
                    BookingStatus.COMPLETED,
                )
            ),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        .order_by(Booking.check_in)
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_confirmed_reservations_for_unit(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
) -> list[Reservation]:
    result = await session.execute(
        select(Reservation)
        .where(
            Reservation.unit_id == unit_id,
            Reservation.status.in_(
                (
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.CHECKED_IN,
                    ReservationStatus.CHECKED_OUT,
                    ReservationStatus.COMPLETED,
                )
            ),
            Reservation.check_in < check_out,
            Reservation.check_out > check_in,
        )
        .order_by(Reservation.check_in)
    )
    return list(result.scalars().all())


async def replace_host_availability_rules(
    session: AsyncSession,
    unit_id: str,
    rules: list[tuple[date, date, str, str | None]],
) -> list[CalendarRule]:
    # Map the simplified (date_from, date_to, status, block_type) to the bulk API.
    bulk: list[tuple[date, date, str, str | None, int | None]] = [
        (date_from, date_to, status, block_type, None)
        for date_from, date_to, status, block_type in rules
    ]
    return await listings_repository.bulk_replace_calendar_rules(
        session, unit_id, bulk
    )
