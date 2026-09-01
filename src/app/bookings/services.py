from datetime import UTC, date, datetime

from app.auth.constants import UserRole
from app.auth.models import User
from app.availability.services import assert_availability_for_range
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import repository as bookings_repository
from .constants import BookingStatus
from .models import Booking
from .schemas import BookingCreate, BookingResponse, BookingUpdate


def _to_response(booking: Booking) -> BookingResponse:
    host_id: str | None = None
    if booking.unit is not None:
        host_id = booking.unit.host_id
    return BookingResponse(
        id=booking.id,
        unit_id=booking.unit_id,
        guest_id=booking.guest_id,
        host_id=host_id,
        status=booking.status,
        check_in=booking.check_in,
        check_out=booking.check_out,
        adults=booking.adults,
        children=booking.children,
        infants=booking.infants,
        requested_at=booking.requested_at,
        accepted_at=booking.accepted_at,
        rejected_at=booking.rejected_at,
        cancelled_at=booking.cancelled_at,
        reject_reason=booking.reject_reason,
        cancel_reason=booking.cancel_reason,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def _assert_guest(user: User) -> None:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can create bookings")


def _assert_guest_capacity(unit: Unit, request: BookingCreate) -> None:
    total_guests = request.adults + request.children + request.infants
    if total_guests > unit.max_guests:
        raise ValidationError(
            f"This unit accommodates a maximum of {unit.max_guests} guests"
        )


def _assert_authorized_to_view(booking: Booking, user: User) -> None:
    if booking.guest_id == user.id:
        return
    if user.role == UserRole.ADMIN:
        return
    if booking.unit is not None and booking.unit.host_id == user.id:
        return
    raise AuthorizationError("Not authorized to view this booking")


def _assert_status_transition(current: BookingStatus, new: BookingStatus) -> None:
    allowed: dict[BookingStatus, list[BookingStatus]] = {
        BookingStatus.REQUESTED: [
            BookingStatus.ACCEPTED,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED,
        ],
        BookingStatus.ACCEPTED: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
        BookingStatus.CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        BookingStatus.REJECTED: [],
        BookingStatus.COMPLETED: [],
        BookingStatus.CANCELLED: [],
    }
    if new not in allowed.get(current, []):
        raise ValidationError(
            f"Cannot transition booking from {current} to {new}"
        )


def _assert_authorized_to_update(
    booking: Booking, user: User, new_status: BookingStatus
) -> None:
    is_admin = user.role == UserRole.ADMIN
    is_host = booking.unit is not None and booking.unit.host_id == user.id
    is_guest = booking.guest_id == user.id

    if new_status in (BookingStatus.ACCEPTED, BookingStatus.REJECTED):
        if not (is_host or is_admin):
            raise AuthorizationError(
                "Only the host or an admin can accept or reject a booking"
            )

    if new_status == BookingStatus.CANCELLED:
        if not (is_guest or is_host or is_admin):
            raise AuthorizationError(
                "Only the guest, host, or an admin can cancel a booking"
            )


async def create_booking(
    session: AsyncSession, user: User, request: BookingCreate
) -> BookingResponse:
    _assert_guest(user)

    unit = await listings_repository.get_unit_with_listing(session, request.unit_id)
    if unit is None:
        raise NotFoundError("Unit not found")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    _assert_guest_capacity(unit, request)
    await assert_availability_for_range(
        session, unit, listing, request.check_in, request.check_out
    )

    booking = await bookings_repository.create_booking(
        session,
        unit_id=request.unit_id,
        guest_id=user.id,
        check_in=request.check_in,
        check_out=request.check_out,
        adults=request.adults,
        children=request.children,
        infants=request.infants,
    )
    booking.unit = unit
    return _to_response(booking)


async def get_booking(
    session: AsyncSession, user: User, booking_id: str
) -> BookingResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    _assert_authorized_to_view(booking, user)
    return _to_response(booking)


async def update_booking(
    session: AsyncSession, user: User, booking_id: str, request: BookingUpdate
) -> BookingResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    _assert_authorized_to_view(booking, user)
    _assert_authorized_to_update(booking, user, request.status)
    _assert_status_transition(BookingStatus(booking.status), request.status)

    update_fields: dict[str, object] = {"status": str(request.status)}

    if request.status == BookingStatus.ACCEPTED:
        update_fields["accepted_at"] = datetime.now(UTC)
    elif request.status == BookingStatus.REJECTED:
        update_fields["rejected_at"] = datetime.now(UTC)
        if request.reject_reason:
            update_fields["reject_reason"] = request.reject_reason
    elif request.status == BookingStatus.CANCELLED:
        update_fields["cancelled_at"] = datetime.now(UTC)
        if request.cancel_reason:
            update_fields["cancel_reason"] = request.cancel_reason

    updated = await bookings_repository.update_booking(session, booking, **update_fields)

    if request.status == BookingStatus.ACCEPTED:
        from app.payments import services as payment_services

        guest_result = await session.execute(
            select(User).where(User.id == booking.guest_id)
        )
        guest = guest_result.scalar_one_or_none()
        if guest is not None:
            await payment_services.create_payment_for_booking(session, updated, guest)

    return _to_response(updated)


async def list_host_bookings(
    session: AsyncSession,
    user: User,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[BookingResponse]:
    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts can view their bookings")

    bookings = await bookings_repository.list_host_bookings(
        session, user.id, status=status, limit=limit, offset=offset
    )
    return [_to_response(booking) for booking in bookings]


async def list_guest_bookings(
    session: AsyncSession,
    user: User,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[BookingResponse]:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can view their bookings")

    bookings = await bookings_repository.list_guest_bookings(
        session, user.id, status=status, limit=limit, offset=offset
    )
    return [_to_response(booking) for booking in bookings]


async def complete_booking(
    session: AsyncSession, user: User, booking_id: str
) -> BookingResponse:
    """Mark a confirmed booking as completed (admin-only).

    This triggers the finance ledger entry and host wallet crediting,
    applying the Alpha commercial rule based on completed booking counts.
    """
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can complete bookings")

    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    _assert_status_transition(BookingStatus(booking.status), BookingStatus.COMPLETED)

    updated = await bookings_repository.update_booking(
        session, booking, status=str(BookingStatus.COMPLETED)
    )

    from app.finance import services as finance_services
    from app.payments import repository as payments_repository

    payment = await payments_repository.get_payment_by_booking(session, booking_id)
    if payment is not None:
        await finance_services.handle_manual_payment_verified(
            session,
            payment_id=payment.id,
            booking_id=booking_id,
            host_id=payment.host_id,
            amount_egp=payment.amount_egp,
        )

    return _to_response(updated)
