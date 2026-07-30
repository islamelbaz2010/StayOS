from datetime import UTC, date, datetime

from app.auth.constants import UserRole
from app.auth.models import User
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
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


def _assert_booking_dates(check_in: date, check_out: date) -> None:
    today = datetime.now(UTC).date()
    if check_in < today:
        raise ValidationError("check_in cannot be in the past")
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")


def _assert_guest_capacity(unit: Unit, request: BookingCreate) -> None:
    total_guests = request.adults + request.children + request.infants
    if total_guests > unit.max_guests:
        raise ValidationError(
            f"This unit accommodates a maximum of {unit.max_guests} guests"
        )


async def _assert_no_conflicts(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
    exclude_booking_id: str | None = None,
) -> None:
    overlaps = await bookings_repository.list_overlapping_bookings(
        session, unit_id, check_in, check_out, exclude_booking_id
    )
    if overlaps:
        raise ConflictError("Requested dates are not available")


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
        BookingStatus.ACCEPTED: [BookingStatus.CANCELLED],
        BookingStatus.REJECTED: [],
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
    _assert_booking_dates(request.check_in, request.check_out)

    unit = await listings_repository.get_unit_with_listing(session, request.unit_id)
    if unit is None:
        raise NotFoundError("Unit not found")
    if unit.status != UnitStatus.LISTED:
        raise ValidationError("Unit is not available for booking")

    _assert_guest_capacity(unit, request)
    await _assert_no_conflicts(session, request.unit_id, request.check_in, request.check_out)

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
    return _to_response(updated)
