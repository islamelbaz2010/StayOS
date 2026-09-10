# ruff: noqa: I001
# Import ordering differs between local Ruff (0.1.8: treats ``app`` as
# third-party, ``app`` sorts before ``sqlalchemy``) and CI Ruff (0.16.1:
# treats ``app`` as first-party). No single ordering satisfies both, so
# I001 is suppressed for this file only.
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

from app.auth import dependencies as auth_dependencies
from app.auth.constants import UserRole
from app.auth.models import User
from app.config import settings
from app.host import permissions as host_permissions
from app.host.constants import CoHostPermissionScope
from app.listings import repository as listings_repository
from app.listings.constants import CalendarStatus, CancellationPolicy, UnitStatus
from app.listings.models import Unit, UnitListing
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
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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
    if status == BookingStatus.NO_SHOW:
        return "no_show"
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


def _unit_cover_image(unit: Any | None) -> str | None:
    if unit is None:
        return None
    listing = getattr(unit, "listing", None)
    if listing is None:
        return None
    cover = getattr(listing, "cover_photo", None)
    return cover.url if cover is not None else None


def _to_response(
    booking: Booking,
    permission_scope: str | None = None,
    guest_name: str | None = None,
    guest_kyc_status: str | None = None,
    guest_member_since: datetime | None = None,
    guest_reviews_count: int | None = None,
) -> BookingResponse:
    host_id: str | None = None
    unit_title: str | None = None
    unit_cover_image: str | None = None
    if booking.unit is not None:
        host_id = booking.unit.host_id
        listing = getattr(booking.unit, "listing", None)
        if listing is not None:
            unit_title = listing.title_en or listing.title_ar
        unit_cover_image = _unit_cover_image(booking.unit)
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
        unit_title=unit_title,
        unit_cover_image=unit_cover_image,
        permission_scope=permission_scope,
        guest_name=guest_name,
        guest_kyc_status=guest_kyc_status,
        guest_member_since=guest_member_since,
        guest_reviews_count=guest_reviews_count,
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


def _assert_booking_nights(check_in: date, check_out: date, listing: UnitListing) -> None:
    nights = (check_out - check_in).days
    if nights < listing.min_nights or nights > listing.max_nights:
        raise ValidationError(
            f"Stay must be between {listing.min_nights} and {listing.max_nights} nights"
        )


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

    # Respect host calendar blocks and legacy reservation calendar rules.
    rules = await listings_repository.get_calendar_rules_in_range(
        session, unit_id, check_in, check_out
    )
    for rule in rules:
        if rule.status in (
            CalendarStatus.BLOCKED,
            CalendarStatus.BOOKED,
            CalendarStatus.HOLD,
        ):
            raise ConflictError("Requested dates are not available")


# Co-host scopes allowed to act on bookings (accept/reject/cancel/check-in/
# check-out). ``full_access`` is the only co-host scope that covers
# reservation operations; calendar-only and calendar+messaging co-hosts can
# view bookings but cannot act on them.
_BOOKING_MANAGE_SCOPES = ("owner", "admin", CoHostPermissionScope.FULL_ACCESS)


async def _unit_permission_scope(
    session: AsyncSession, booking: Booking, user: User
) -> str | None:
    """Delegate to the host permission source of truth (owner / admin /
    active co-host scope / None)."""
    if booking.unit is None:
        return None
    scope = await host_permissions.get_unit_permission_scope(
        session, user, booking.unit
    )
    return scope if isinstance(scope, str) else None


async def _assert_authorized_to_view(
    session: AsyncSession, booking: Booking, user: User
) -> None:
    if booking.guest_id == user.id:
        return
    if user.role == UserRole.ADMIN:
        return
    if await _unit_permission_scope(session, booking, user) is not None:
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
        BookingStatus.CONFIRMED: [
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.NO_SHOW,
        ],
        BookingStatus.REJECTED: [],
        BookingStatus.COMPLETED: [],
        BookingStatus.CANCELLED: [],
        BookingStatus.NO_SHOW: [],
    }
    if new not in allowed.get(current, []):
        raise ValidationError(
            f"Cannot transition booking from {current} to {new}"
        )


async def _assert_authorized_to_update(
    session: AsyncSession, booking: Booking, user: User, new_status: BookingStatus
) -> None:
    scope = await _unit_permission_scope(session, booking, user)
    can_manage = scope in _BOOKING_MANAGE_SCOPES
    is_guest = booking.guest_id == user.id

    if new_status in (BookingStatus.ACCEPTED, BookingStatus.REJECTED):
        if not can_manage:
            raise AuthorizationError(
                "Only the host or an admin can accept or reject a booking"
            )

    if new_status == BookingStatus.CANCELLED:
        if not (is_guest or can_manage):
            raise AuthorizationError(
                "Only the guest, host, or an admin can cancel a booking"
            )


async def _cancellation_actor(
    session: AsyncSession, booking: Booking, user: User
) -> str:
    """Determine who is cancelling, from the booking's point of view.

    Also doubles as the authorization check: raises if `user` has no
    standing to touch this booking at all. A full-access co-host acts on
    the host's behalf, so the actor is recorded as ``host``.
    """
    if booking.guest_id == user.id:
        return "guest"
    scope = await _unit_permission_scope(session, booking, user)
    if scope in ("owner", CoHostPermissionScope.FULL_ACCESS):
        return "host"
    if scope == "admin":
        return "admin"
    raise AuthorizationError("Only the guest, host, or an admin can cancel a booking")


def _check_in_datetime(booking: Booking, listing: Any | None) -> datetime:
    """The moment the tier windows are measured against: check-in day at the
    listing's check-in time (fallback to the global display default)."""
    time_str = getattr(listing, "check_in_time", None)
    if not isinstance(time_str, str) or not time_str:
        time_str = settings.DEFAULT_CHECK_IN_TIME
    try:
        hour, minute = (int(part) for part in time_str.split(":", 1))
    except (ValueError, AttributeError):
        hour, minute = 15, 0
    return datetime.combine(
        booking.check_in, datetime.min.time(), tzinfo=UTC
    ).replace(hour=hour, minute=minute)


def _compute_guest_accommodation_refund(
    *,
    booking: Booking,
    listing: Any | None,
    accommodation_amount_egp: int,
) -> int:
    """Accommodation refund owed when the GUEST cancels, per the decided V1
    cancellation tiers (STAYOS_CANCELLATION_REFUND_POLICY_V1 §3).

    The listing's ``cancellation_policy`` selects the tier:

    - FLEXIBLE: full accommodation refund if cancelled ≥24h before check-in
    - MODERATE: full accommodation refund if cancelled ≥5 days before check-in
    - STRICT: 50% accommodation refund if cancelled ≥7 days before check-in
    - Otherwise: no accommodation refund

    The 24h grace period from booking creation (existing StayOS behaviour)
    still fully refunds the accommodation amount regardless of tier. The
    guest service fee is handled by the caller — it is non-refundable for
    guest-initiated cancellations per the same policy.
    """
    now = datetime.now(UTC)
    booking_age_hours = (now - booking.requested_at).total_seconds() / 3600
    if booking_age_hours <= 24:
        return accommodation_amount_egp

    policy = getattr(listing, "cancellation_policy", None)
    if not isinstance(policy, str) or not policy:
        policy = CancellationPolicy.FLEXIBLE
    hours_before_checkin = (_check_in_datetime(booking, listing) - now).total_seconds() / 3600

    if policy == CancellationPolicy.FLEXIBLE:
        return accommodation_amount_egp if hours_before_checkin >= 24 else 0
    if policy == CancellationPolicy.MODERATE:
        return accommodation_amount_egp if hours_before_checkin >= 5 * 24 else 0
    if policy == CancellationPolicy.STRICT:
        return (
            int(round(accommodation_amount_egp * 0.5))
            if hours_before_checkin >= 7 * 24
            else 0
        )
    return accommodation_amount_egp


def _refund_policy_label(refund_amount: int, total_paid: int) -> str:
    if total_paid == 0:
        return "NO_PAYMENT_COLLECTED"
    if refund_amount == total_paid:
        return "FULL_REFUND"
    if refund_amount == 0:
        return "NO_REFUND"
    return "PARTIAL_REFUND"


def _evaluate_cancellation_refund(
    *,
    cancelled_by: str,
    payment: Payment | None,
    booking: Booking,
    listing: Any | None,
) -> tuple[int, int, int]:
    """Returns (refund_amount_egp, total_paid_egp, service_fee_retained_egp).

    Only a VERIFIED payment represents money actually collected from the
    guest — PENDING/PROOF_UPLOADED/REJECTED payments never moved money, so
    there is nothing to refund. A host- or admin-initiated cancellation is
    never charged to the guest: they didn't choose to cancel, so they get
    everything back regardless of the check-in-distance policy (V1 policy §4,
    §5, §6). For guest-initiated cancellations the guest service fee is
    non-refundable once paid (V1 policy §3) — only the accommodation amount
    is subject to the tier table.
    """
    total_paid = payment.amount_egp if payment is not None and payment.status == PaymentStatus.VERIFIED else 0
    if total_paid == 0:
        return 0, 0, 0
    if cancelled_by in ("host", "admin", "system"):
        return total_paid, total_paid, 0
    # Rows predating the amount breakdown have no recorded fee — treat the
    # whole amount as refundable accommodation rather than guessing.
    service_fee = payment.guest_service_fee_egp or 0 if payment is not None else 0
    accommodation = (
        payment.accommodation_amount_egp
        if payment is not None and payment.accommodation_amount_egp is not None
        else total_paid - service_fee
    )
    accommodation_refund = _compute_guest_accommodation_refund(
        booking=booking, listing=listing, accommodation_amount_egp=accommodation
    )
    return accommodation_refund, total_paid, min(service_fee, total_paid - accommodation_refund)


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
    cancelled_by = await _cancellation_actor(session, booking, user)

    current_status = BookingStatus(booking.status)
    listing = await _listing_for_booking(session, booking)
    payment = await payments_repository.get_payment_by_booking(session, booking.id)
    refund_amount, total_paid, service_fee_retained = _evaluate_cancellation_refund(
        cancelled_by=cancelled_by,
        payment=payment,
        booking=booking,
        listing=listing,
    )

    return BookingCancellationPreview(
        booking_id=booking.id,
        cancellable=current_status in _CANCELLABLE_STATUSES,
        cancelled_by=cancelled_by,
        cancellation_policy=_policy_name(listing),
        total_paid_egp=total_paid,
        refund_amount_egp=refund_amount,
        service_fee_retained_egp=service_fee_retained,
        refund_policy_applied=_refund_policy_label(refund_amount, total_paid),
    )


def _policy_name(listing: Any | None) -> str | None:
    policy = getattr(listing, "cancellation_policy", None)
    return policy if isinstance(policy, str) and policy else None


async def _listing_for_booking(session: AsyncSession, booking: Booking) -> Any | None:
    # ``booking.unit`` is selectin-loaded but ``unit.listing`` is a separate
    # lazy relationship that can't be awaited here — always go through the
    # repository which eager-loads it.
    fetched = await listings_repository.get_unit_with_listing(
        session, booking.unit_id
    )
    return getattr(fetched, "listing", None) if fetched is not None else None


async def _apply_cancellation(
    session: AsyncSession,
    booking: Booking,
    *,
    cancelled_by: str,
    cancelled_by_user_id: str | None,
    reason: str | None,
) -> Booking:
    """Shared cancellation engine for user- and system-initiated cancels."""
    current_status = BookingStatus(booking.status)
    if current_status not in _CANCELLABLE_STATUSES:
        raise ValidationError(f"Cannot cancel a booking that is {current_status}")
    if booking.checked_in_at is not None or booking.checked_out_at is not None:
        raise ValidationError("Cannot cancel a booking after check-in or check-out")

    listing = await _listing_for_booking(session, booking)
    payment = await payments_repository.get_payment_by_booking(session, booking.id)
    refund_amount, total_paid, service_fee_retained = _evaluate_cancellation_refund(
        cancelled_by=cancelled_by,
        payment=payment,
        booking=booking,
        listing=listing,
    )
    refund_status = await _settle_payment_on_cancel(session, payment, refund_amount)

    updated = await bookings_repository.update_booking(
        session,
        booking,
        status=str(BookingStatus.CANCELLED),
        cancelled_at=datetime.now(UTC),
        cancelled_by=cancelled_by_user_id,
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
            "cancellation_policy": _policy_name(listing),
            "total_paid_egp": total_paid,
            "refund_amount_egp": refund_amount,
            "service_fee_retained_egp": service_fee_retained,
            "refund_policy_applied": _refund_policy_label(refund_amount, total_paid),
            "refund_status": refund_status,
            "refund_days": settings.REFUND_PROCESSING_DAYS,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    return updated


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
    cancelled_by = await _cancellation_actor(session, booking, user)
    updated = await _apply_cancellation(
        session,
        booking,
        cancelled_by=cancelled_by,
        cancelled_by_user_id=user.id,
        reason=reason,
    )
    return _to_response(updated)


async def cancel_booking_system(
    session: AsyncSession, booking_id: str, reason: str
) -> Booking:
    """System-initiated cancellation (payment deadline expiry, proof
    resubmission exhaustion — V1 policy §1.2/§2.2/§5).

    No actor row is recorded (`cancelled_by` stays NULL); the event payload
    carries ``cancelled_by="system"`` so consumers can distinguish it.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    return await _apply_cancellation(
        session,
        booking,
        cancelled_by="system",
        cancelled_by_user_id=None,
        reason=reason,
    )


async def mark_guest_no_show(
    session: AsyncSession, user: User, booking_id: str
) -> BookingResponse:
    """Mark a confirmed booking as a guest no-show (admin-only).

    V1 policy §7.1: the host declares the no-show via the support contact and
    a StayOS admin confirms it — this endpoint is that confirmation step. A
    no-show is a terminal state with no refund of the accommodation amount or
    the service fee: the property was held for the guest, so the VERIFIED
    payment is left untouched.
    """
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can confirm a no-show")

    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    current_status = BookingStatus(booking.status)
    if current_status != BookingStatus.CONFIRMED:
        raise ValidationError(
            f"Only a confirmed booking can be marked as no-show (currently {current_status})"
        )
    if booking.checked_in_at is not None:
        raise ValidationError("Cannot mark a checked-in booking as no-show")
    if datetime.now(UTC).date() < booking.check_in:
        raise ValidationError("A booking cannot be marked as no-show before check-in")

    updated = await bookings_repository.update_booking(
        session,
        booking,
        status=str(BookingStatus.NO_SHOW),
    )

    host_id = booking.unit.host_id if booking.unit is not None else None
    guest_result = await session.execute(select(User).where(User.id == booking.guest_id))
    guest_user = guest_result.scalar_one_or_none()

    await write_event(
        session,
        aggregate_type="Booking",
        aggregate_id=UUID(booking.id),
        event_type="booking.no_show",
        payload={
            "reservation_id": booking.id,
            "booking_id": booking.id,
            "unit_id": booking.unit_id,
            "host_id": host_id,
            "confirmed_by": user.id,
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
    await _cancellation_actor(session, booking, user)  # authorization only; raises if unrelated

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
    await _cancellation_actor(session, booking, user)

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
    await _assert_authorized_to_view(session, booking, user)

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

            existing_review = await reviews_repository.get_guest_review_by_booking(session, booking.id)
            review_eligible = existing_review is None

    cover_image = _unit_cover_image(unit)

    return StayInfoResponse(
        booking=_to_response(booking),
        property=StayPropertyInfo(
            unit_id=booking.unit_id,
            title=(listing.title_en or listing.title_ar) if listing is not None else None,
            cover_image=cover_image,
            address=unit.address if unit is not None else None,
            lat=lat,
            lng=lng,
            house_rules=listing.house_rules if listing is not None else None,
            cancellation_policy=listing.cancellation_policy if listing is not None else None,
        ),
        host=StayHostInfo(
            name=host_user.display_name if host_user else None,
            phone=host_user.phone_number if host_user and arrival_eligible else None,
            kyc_status=host_user.kyc_status if host_user else None,
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
    await auth_dependencies.require_kyc_verified(user)
    _assert_booking_dates(request.check_in, request.check_out)

    unit = await listings_repository.get_unit_with_listing(session, request.unit_id)
    if unit is None or unit.listing is None:
        raise NotFoundError("Unit not found")
    if unit.status != UnitStatus.LISTED:
        raise ValidationError("Unit is not available for booking")

    _assert_booking_nights(request.check_in, request.check_out, unit.listing)
    _assert_guest_capacity(unit, request)

    # Serialize concurrent booking attempts for this unit before the conflict check.
    await listings_repository.lock_unit_for_booking(session, request.unit_id)
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
    await _assert_authorized_to_view(session, booking, user)
    scope: str | None = None
    if user.role in (UserRole.HOST, UserRole.ADMIN) and booking.guest_id != user.id:
        scope = await _unit_permission_scope(session, booking, user)
    # When the viewer is an authorized host/co-host, populate the
    # guest trust context (name, verification status, member-since,
    # review activity). These fields stay null when the guest views
    # their own booking — the data is host-facing only.
    guest_name: str | None = None
    guest_kyc_status: str | None = None
    guest_member_since: datetime | None = None
    guest_reviews_count: int | None = None
    if scope is not None:
        guest_result = await session.execute(
            select(User).where(User.id == booking.guest_id)
        )
        guest = guest_result.scalar_one_or_none()
        if guest is not None:
            guest_name = guest.display_name
            guest_kyc_status = guest.kyc_status
            guest_member_since = guest.created_at
        from app.reviews import repository as reviews_repository

        guest_reviews_count = await reviews_repository.count_reviews_by_guest(
            session, booking.guest_id
        )
    return _to_response(
        booking,
        permission_scope=scope,
        guest_name=guest_name,
        guest_kyc_status=guest_kyc_status,
        guest_member_since=guest_member_since,
        guest_reviews_count=guest_reviews_count,
    )


async def update_booking(
    session: AsyncSession, user: User, booking_id: str, request: BookingUpdate
) -> BookingResponse:
    if request.status == BookingStatus.CANCELLED:
        # Cancellation is a full lifecycle operation (refund calculation,
        # payment settlement, notifications) — never a bare status flip.
        # Route it through the real cancellation service so this legacy
        # generic-update path can't bypass that.
        return await cancel_booking(session, user, booking_id, request.cancel_reason)

    if request.status not in (BookingStatus.ACCEPTED, BookingStatus.REJECTED):
        raise ValidationError(
            "Only accept or reject can be performed through this endpoint"
        )

    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    await _assert_authorized_to_view(session, booking, user)
    await _assert_authorized_to_update(session, booking, user, request.status)
    _assert_status_transition(BookingStatus(booking.status), request.status)

    update_fields: dict[str, object] = {"status": str(request.status)}

    if request.status == BookingStatus.ACCEPTED:
        update_fields["accepted_at"] = datetime.now(UTC)
    elif request.status == BookingStatus.REJECTED:
        update_fields["rejected_at"] = datetime.now(UTC)
        if request.reject_reason:
            update_fields["reject_reason"] = request.reject_reason

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

    unit_ids = await host_permissions.get_managed_unit_ids(session, user)
    if not unit_ids:
        return []
    bookings = await bookings_repository.list_host_bookings(
        session, user.id, status=status, limit=limit, offset=offset,
        unit_ids=unit_ids,
    )
    scope_map = await host_permissions.get_unit_permission_scopes(
        session, user, unit_ids
    )
    # Batch-count reviews for all guests in this page — one query, not N+1.
    from app.reviews import repository as reviews_repository

    guest_ids = {b.guest_id for b in bookings}
    reviews_count_map = await reviews_repository.count_reviews_by_guests(
        session, list(guest_ids)
    )
    return [
        _to_response(
            booking,
            permission_scope=scope_map.get(booking.unit_id),
            guest_name=booking.guest.display_name if booking.guest else None,
            guest_kyc_status=booking.guest.kyc_status if booking.guest else None,
            guest_member_since=booking.guest.created_at if booking.guest else None,
            guest_reviews_count=reviews_count_map.get(booking.guest_id, 0),
        )
        for booking in bookings
    ]


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

    if booking.checked_out_at is None:
        raise ValidationError("Booking must be checked out before completion")

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
