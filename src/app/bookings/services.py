from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import UserRole
from app.auth.models import User
from app.config import settings
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.messages import services as messages_services
from app.payments import repository as payments_repository
from app.payments.constants import PaymentStatus
from app.payments.models import Payment
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.shared.outbox import write_event

from . import repository as bookings_repository
from .constants import BookingStatus
from .models import Booking
from .schemas import (
    BookingCancellationPreview,
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    StayArrivalInfo,
    StayHostInfo,
    StayInfoResponse,
    StayPropertyInfo,
)

# Statuses from which a booking can still be cancelled. A booking that was
# already rejected, cancelled, or fully completed has nothing left to cancel.
_CANCELLABLE_STATUSES = (
    BookingStatus.REQUESTED,
    BookingStatus.ACCEPTED,
    BookingStatus.CONFIRMED,
)


def _compute_stay_phase(booking: Booking) -> str:
    """Derive the guest-facing stay phase without touching `status`.

    Kept entirely separate from BookingStatus so nothing that already
    branches on status (calendar overlap checks, review eligibility,
    finance completion, host/admin list filters) is affected by adding
    operational check-in/checkout tracking.
    """
    status = BookingStatus(booking.status)
    if status == BookingStatus.CANCELLED:
        return "cancelled"
    if status == BookingStatus.REJECTED:
        return "rejected"
    if status == BookingStatus.COMPLETED:
        return "completed"

    if booking.checked_out_at is not None:
        return "checked_out"
    if booking.checked_in_at is not None:
        today = datetime.now(UTC).date()
        return "checkout_ready" if today >= booking.check_out else "checked_in"

    if status != BookingStatus.CONFIRMED:
        # REQUESTED (awaiting host) or ACCEPTED (awaiting payment) — nothing
        # to check into yet regardless of dates.
        return "upcoming"

    today = datetime.now(UTC).date()
    return "check_in_ready" if today >= booking.check_in else "upcoming"


def _arrival_info_eligible(booking: Booking, listing: Any | None = None) -> bool:
    """Whether arrival/access instructions have crossed their release time.

    Only a CONFIRMED, non-cancelled booking within the configured pre-arrival
    release window of check-in (or already checked in) is eligible. Listing-
    specific configuration takes precedence, then the global default. This is
    enforced server-side, not left to the client to hide fields.
    """
    if BookingStatus(booking.status) != BookingStatus.CONFIRMED:
        return False
    if booking.checked_in_at is not None:
        return True
    release_hours = settings.PRE_ARRIVAL_INFO_RELEASE_HOURS
    if listing is not None and listing.pre_arrival_info_release_hours is not None:
        release_hours = listing.pre_arrival_info_release_hours
    check_in_start = datetime.combine(booking.check_in, datetime.min.time(), tzinfo=UTC)
    return datetime.now(UTC) >= check_in_start - timedelta(hours=release_hours)


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
        stay_phase=_compute_stay_phase(booking),
        check_in=booking.check_in,
        check_out=booking.check_out,
        adults=booking.adults,
        children=booking.children,
        infants=booking.infants,
        requested_at=booking.requested_at,
        accepted_at=booking.accepted_at,
        rejected_at=booking.rejected_at,
        cancelled_at=booking.cancelled_at,
        cancelled_by=booking.cancelled_by,
        checked_in_at=booking.checked_in_at,
        checked_out_at=booking.checked_out_at,
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


def _cancellation_actor(booking: Booking, user: User) -> str:
    """Determine who is cancelling, from the booking's point of view.

    Also doubles as the authorization check: raises if `user` has no
    standing to touch this booking at all.
    """
    if booking.guest_id == user.id:
        return "guest"
    if booking.unit is not None and booking.unit.host_id == user.id:
        return "host"
    if user.role == UserRole.ADMIN:
        return "admin"
    raise AuthorizationError("Only the guest, host, or an admin can cancel a booking")


def _compute_guest_cancellation_refund(
    *, requested_at: datetime, check_in: date, amount_egp: int
) -> int:
    """Refund owed when the GUEST cancels, per the configured policy.

    A 24h no-questions-asked grace period from booking creation always
    fully refunds. After that, the refund scales down the closer check-in
    gets, per CANCELLATION_FULL_REFUND_DAYS / CANCELLATION_PARTIAL_REFUND_DAYS.
    """
    now = datetime.now(UTC)
    booking_age_hours = (now - requested_at).total_seconds() / 3600
    days_before_checkin = (check_in - now.date()).days

    if booking_age_hours <= 24:
        return amount_egp
    if days_before_checkin > settings.CANCELLATION_FULL_REFUND_DAYS:
        return amount_egp
    if days_before_checkin > settings.CANCELLATION_PARTIAL_REFUND_DAYS:
        return int(round(amount_egp * settings.CANCELLATION_PARTIAL_REFUND_PCT))
    return 0


def _refund_policy_label(refund_amount: int, total_paid: int) -> str:
    if total_paid == 0:
        return "NO_PAYMENT_COLLECTED"
    if refund_amount == total_paid:
        return "FULL_REFUND"
    if refund_amount == 0:
        return "NO_REFUND"
    return "PARTIAL_REFUND"


def _evaluate_cancellation_refund(
    *, cancelled_by: str, payment: Payment | None, requested_at: datetime, check_in: date
) -> tuple[int, int]:
    """Returns (refund_amount_egp, total_paid_egp).

    Only a VERIFIED payment represents money actually collected from the
    guest — PENDING/PROOF_UPLOADED/REJECTED payments never moved money, so
    there is nothing to refund. A host- or admin-initiated cancellation is
    never charged to the guest: they didn't choose to cancel, so they get
    everything back regardless of the check-in-distance policy.
    """
    total_paid = payment.amount_egp if payment is not None and payment.status == PaymentStatus.VERIFIED else 0
    if total_paid == 0:
        return 0, 0
    if cancelled_by in ("host", "admin"):
        return total_paid, total_paid
    return (
        _compute_guest_cancellation_refund(
            requested_at=requested_at, check_in=check_in, amount_egp=total_paid
        ),
        total_paid,
    )


async def _settle_payment_on_cancel(
    session: AsyncSession, payment: Payment | None, refund_amount: int
) -> str:
    """Apply cancellation consequences to the booking's payment record.

    Returns the resulting payment status label for the audit/notification
    event. This platform only collects payment manually (bank transfer /
    Vodafone Cash) — there is no payment-provider refund API to call
    automatically, so money owed back is flagged REFUND_PENDING for finance
    to wire back and reconcile by hand. Never mark REFUNDED here: that would
    claim money moved when it didn't.
    """
    if payment is None:
        return "no_payment"

    if payment.status in (PaymentStatus.PENDING, PaymentStatus.PROOF_UPLOADED, PaymentStatus.REJECTED):
        # No funds were ever collected for this payment request — close it
        # out so a stale receipt can't later be verified against a dead
        # booking.
        await payments_repository.update_payment(
            session,
            payment,
            status=PaymentStatus.CANCELLED,
            cancelled_at=datetime.now(UTC),
        )
        return str(PaymentStatus.CANCELLED)

    if payment.status != PaymentStatus.VERIFIED:
        # Already cancelled/refund-pending/refunded — idempotent no-op so a
        # retried or duplicate cancel request can't double-mutate state.
        return str(payment.status)

    if refund_amount > 0:
        await payments_repository.update_payment(
            session,
            payment,
            status=PaymentStatus.REFUND_PENDING,
            refund_amount_egp=refund_amount,
        )
        return str(PaymentStatus.REFUND_PENDING)

    # Forfeited per policy (late guest cancellation): the payment stands as
    # VERIFIED — it was legitimately collected and nothing is owed back.
    return str(PaymentStatus.VERIFIED)


async def preview_booking_cancellation(
    session: AsyncSession, user: User, booking_id: str
) -> BookingCancellationPreview:
    """Let the caller see the financial consequence before confirming."""
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    cancelled_by = _cancellation_actor(booking, user)

    current_status = BookingStatus(booking.status)
    payment = await payments_repository.get_payment_by_booking(session, booking.id)
    refund_amount, total_paid = _evaluate_cancellation_refund(
        cancelled_by=cancelled_by,
        payment=payment,
        requested_at=booking.requested_at,
        check_in=booking.check_in,
    )

    return BookingCancellationPreview(
        booking_id=booking.id,
        cancellable=current_status in _CANCELLABLE_STATUSES,
        cancelled_by=cancelled_by,
        total_paid_egp=total_paid,
        refund_amount_egp=refund_amount,
        refund_policy_applied=_refund_policy_label(refund_amount, total_paid),
    )


async def cancel_booking(
    session: AsyncSession, user: User, booking_id: str, reason: str | None = None
) -> BookingResponse:
    """Cancel a booking as a real lifecycle operation, not a status flip.

    Validates the actor and current state, computes the refund owed under
    the cancellation policy, settles the payment record accordingly,
    updates the booking, and emits a `booking.cancelled` event carrying the
    financial outcome so notifications/finance can act on it.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    cancelled_by = _cancellation_actor(booking, user)

    current_status = BookingStatus(booking.status)
    if current_status not in _CANCELLABLE_STATUSES:
        raise ValidationError(f"Cannot cancel a booking that is {current_status}")

    payment = await payments_repository.get_payment_by_booking(session, booking.id)
    refund_amount, total_paid = _evaluate_cancellation_refund(
        cancelled_by=cancelled_by,
        payment=payment,
        requested_at=booking.requested_at,
        check_in=booking.check_in,
    )
    refund_status = await _settle_payment_on_cancel(session, payment, refund_amount)

    updated = await bookings_repository.update_booking(
        session,
        booking,
        status=str(BookingStatus.CANCELLED),
        cancelled_at=datetime.now(UTC),
        cancelled_by=user.id,
        cancel_reason=reason,
    )

    host_id = booking.unit.host_id if booking.unit is not None else None
    guest_result = await session.execute(select(User).where(User.id == booking.guest_id))
    guest_user = guest_result.scalar_one_or_none()

    await write_event(
        session,
        aggregate_type="Booking",
        aggregate_id=UUID(booking.id),
        event_type="booking.cancelled",
        payload={
            "reservation_id": booking.id,
            "booking_id": booking.id,
            "unit_id": booking.unit_id,
            "host_id": host_id,
            "cancelled_by": cancelled_by,
            "cancellation_reason": reason,
            "total_paid_egp": total_paid,
            "refund_amount_egp": refund_amount,
            "refund_policy_applied": _refund_policy_label(refund_amount, total_paid),
            "refund_status": refund_status,
            "refund_days": settings.REFUND_PROCESSING_DAYS,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    return _to_response(updated)


async def check_in_booking(session: AsyncSession, user: User, booking_id: str) -> BookingResponse:
    """Self-reported (guest or host) check-in.

    Deliberately does not touch `status` — the booking stays CONFIRMED.
    This only records that the stay has operationally started, which
    drives the Mobile stay-phase UI and unlocks nothing financial.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    _cancellation_actor(booking, user)  # authorization only; raises if unrelated

    if BookingStatus(booking.status) != BookingStatus.CONFIRMED:
        raise ValidationError("Booking must be confirmed before check-in")
    if booking.checked_in_at is not None:
        raise ValidationError("This booking has already been checked in")
    if datetime.now(UTC).date() < booking.check_in:
        raise ValidationError("Check-in is not yet available for this booking")

    now = datetime.now(UTC)
    updated = await bookings_repository.update_booking(session, booking, checked_in_at=now)

    host_id = booking.unit.host_id if booking.unit is not None else None
    await write_event(
        session,
        aggregate_type="Booking",
        aggregate_id=UUID(booking.id),
        event_type="booking.checked_in",
        payload={
            "reservation_id": booking.id,
            "booking_id": booking.id,
            "unit_id": booking.unit_id,
            "host_id": host_id,
            "checked_in_at": now.isoformat(),
        },
    )

    return _to_response(updated)


async def check_out_booking(session: AsyncSession, user: User, booking_id: str) -> BookingResponse:
    """Self-reported (guest or host) checkout.

    Also does not touch `status` or trigger the finance ledger — that
    remains the admin-only `complete_booking` transition. This only
    unlocks review eligibility and the checked-out Trip UI state.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    _cancellation_actor(booking, user)

    if BookingStatus(booking.status) != BookingStatus.CONFIRMED:
        raise ValidationError("Booking must be confirmed to check out")
    if booking.checked_in_at is None:
        raise ValidationError("Cannot check out before checking in")
    if booking.checked_out_at is not None:
        raise ValidationError("This booking has already been checked out")

    now = datetime.now(UTC)
    updated = await bookings_repository.update_booking(session, booking, checked_out_at=now)

    host_id = booking.unit.host_id if booking.unit is not None else None
    await write_event(
        session,
        aggregate_type="Booking",
        aggregate_id=UUID(booking.id),
        event_type="booking.checked_out",
        payload={
            "reservation_id": booking.id,
            "booking_id": booking.id,
            "unit_id": booking.unit_id,
            "host_id": host_id,
            "checked_out_at": now.isoformat(),
        },
    )

    return _to_response(updated)


async def get_stay_info(session: AsyncSession, user: User, booking_id: str) -> StayInfoResponse:
    """Aggregated Trip/Stay detail: booking + property + host + time-gated
    arrival info + review eligibility, for the Mobile Trip detail screen.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    _assert_authorized_to_view(booking, user)

    unit = await listings_repository.get_unit_with_listing(session, booking.unit_id)
    listing = unit.listing if unit is not None else None

    lat: float | None = None
    lng: float | None = None
    if unit is not None:
        coord_result = await session.execute(
            select(
                func.ST_X(Unit.coordinates).label("lng"),
                func.ST_Y(Unit.coordinates).label("lat"),
            ).where(Unit.id == unit.id)
        )
        coord_row = coord_result.one()
        lat, lng = float(coord_row.lat), float(coord_row.lng)

    host_user: User | None = None
    if unit is not None:
        host_result = await session.execute(select(User).where(User.id == unit.host_id))
        host_user = host_result.scalar_one_or_none()

    arrival_eligible = _arrival_info_eligible(booking, listing)

    check_in_time = settings.DEFAULT_CHECK_IN_TIME
    check_out_time = settings.DEFAULT_CHECK_OUT_TIME
    if listing is not None:
        if listing.check_in_time:
            check_in_time = listing.check_in_time
        if listing.check_out_time:
            check_out_time = listing.check_out_time

    review_eligible = False
    if user.id == booking.guest_id:
        status = BookingStatus(booking.status)
        stay_finished = status == BookingStatus.COMPLETED or booking.checked_out_at is not None
        if stay_finished and status != BookingStatus.CANCELLED:
            from app.reviews import repository as reviews_repository

            existing_review = await reviews_repository.get_review_by_booking(session, booking.id)
            review_eligible = existing_review is None

    return StayInfoResponse(
        booking=_to_response(booking),
        property=StayPropertyInfo(
            unit_id=booking.unit_id,
            title=(listing.title_en or listing.title_ar) if listing is not None else None,
            address=unit.address if unit is not None else None,
            lat=lat,
            lng=lng,
            house_rules=listing.house_rules if listing is not None else None,
            cancellation_policy=listing.cancellation_policy if listing is not None else None,
        ),
        host=StayHostInfo(
            name=host_user.display_name if host_user else None,
            phone=host_user.phone_number if host_user and arrival_eligible else None,
        ),
        arrival=StayArrivalInfo(
            eligible=arrival_eligible,
            check_in_instructions=(
                listing.check_in_instructions if listing is not None and arrival_eligible else None
            ),
            default_check_in_time=check_in_time,
            default_check_out_time=check_out_time,
        ),
        review_eligible=review_eligible,
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

    # Every booking gets a reservation-linked conversation for guest/host
    # communication. This is the foundation for messaging and later support.
    await messages_services.ensure_conversation_for_booking(
        session,
        booking_id=booking.id,
        unit_id=unit.id,
        guest_id=user.id,
        host_id=unit.host_id,
    )

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
    if request.status == BookingStatus.CANCELLED:
        # Cancellation is a full lifecycle operation (refund calculation,
        # payment settlement, notifications) — never a bare status flip.
        # Route it through the real cancellation service so this legacy
        # generic-update path can't bypass that.
        return await cancel_booking(session, user, booking_id, request.cancel_reason)

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
    # BookingStatus.CANCELLED is handled by the early return above, via
    # cancel_booking() — it can't reach this point.

    updated = await bookings_repository.update_booking(session, booking, **update_fields)

    if request.status == BookingStatus.ACCEPTED:
        from app.payments import services as payment_services

        guest_result = await session.execute(
            select(User).where(User.id == booking.guest_id)
        )
        guest = guest_result.scalar_one_or_none()
        if guest is not None:
            await payment_services.create_payment_for_booking(session, updated, guest)

    if request.status == BookingStatus.CONFIRMED and updated.unit is not None:
        listing = updated.unit.listing if updated.unit is not None else None
        await messages_services.send_booking_confirmed(
            session,
            booking=updated,
            listing=listing,
            host_id=updated.unit.host_id,
        )

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
