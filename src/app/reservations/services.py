import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.config import settings
from app.finance import providers as payment_providers
from app.listings import pricing
from app.listings import repository as listings_repository
from app.listings.constants import CalendarStatus, UnitStatus
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    PaymentError,
    ValidationError,
)
from app.shared.outbox import write_event

from . import repository as reservations_repository
from .constants import (
    CancellationReason,
    PaymentMethod,
    PaymentProvider,
    PaymentStatus,
    ReservationStatus,
)
from .models import Reservation
from .schemas import (
    PaginationInfo,
    PaymentConfirmationRequest,
    PaymentIntentResponse,
    PromoApplicationResponse,
    PromoApplyRequest,
    ReservationCancelRequest,
    ReservationCreate,
    ReservationListFilters,
    ReservationListResponse,
    ReservationResponse,
)

logger = logging.getLogger(__name__)


def _to_response(reservation: Reservation) -> ReservationResponse:
    paymob_iframe_url: str | None = None
    for pi in reservation.payment_intents:
        if pi.provider == "paymob" and isinstance(pi.provider_metadata, dict):
            paymob_iframe_url = pi.provider_metadata.get("iframe_url")
            break

    return ReservationResponse(
        id=reservation.id,
        unit_id=reservation.unit_id,
        guest_id=reservation.guest_id,
        status=reservation.status,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        adults=reservation.adults,
        children=reservation.children,
        infants=reservation.infants,
        total_amount_egp=reservation.total_amount_egp,
        host_amount_egp=reservation.host_amount_egp,
        platform_fee_egp=reservation.platform_fee_egp,
        guest_fee_egp=reservation.guest_fee_egp,
        payment_method=reservation.payment_method,
        checked_in_at=reservation.checked_in_at,
        checked_out_at=reservation.checked_out_at,
        cancelled_at=reservation.cancelled_at,
        cancel_reason=reservation.cancel_reason,
        refund_amount_egp=reservation.refund_amount_egp,
        payment_intents=[
            PaymentIntentResponse.model_validate(pi)
            for pi in reservation.payment_intents
        ],
        promo_applications=[
            PromoApplicationResponse.model_validate(pa)
            for pa in reservation.promo_applications
        ],
        paymob_iframe_url=paymob_iframe_url,
    )




def _calculate_amounts(subtotal_egp: int, discount_pct: float = 0.0) -> dict[str, int]:
    discount_amount = int(round(subtotal_egp * discount_pct))
    discounted = subtotal_egp - discount_amount
    guest_fee = int(round(discounted * settings.GUEST_SERVICE_FEE_PCT))
    platform_fee = int(round(discounted * settings.PLATFORM_TAKE_RATE_PCT))
    host_commission = int(round(discounted * settings.HOST_COMMISSION_PCT))
    host_amount = discounted - host_commission - platform_fee
    total = discounted + guest_fee
    return {
        "subtotal": discounted,
        "discount_amount": discount_amount,
        "guest_fee": guest_fee,
        "platform_fee": platform_fee,
        "host_amount": host_amount,
        "total": total,
    }


def _assert_guest(user: User) -> None:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can create reservations")


def _assert_kyc_verified(user: User) -> None:
    if user.kyc_status != KycStatus.VERIFIED:
        raise ConflictError("KYC verification required to make a booking")


def _assert_authorized_to_view(reservation: Reservation, user: User) -> None:
    if reservation.guest_id == user.id or user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.HOST:
        # ownership is verified by the caller when needed.
        return
    raise AuthorizationError("Not authorized to view this reservation")


async def _require_host_or_staff_for_unit(
    session: AsyncSession, reservation: Reservation, user: User
) -> None:
    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    if unit is None:
        raise NotFoundError("Unit not found")
    if user.role == UserRole.HOST and unit.host_id != user.id:
        raise AuthorizationError("Not authorized to manage this reservation")
    if user.role not in (UserRole.HOST, UserRole.FIELD_STAFF, UserRole.ADMIN):
        raise AuthorizationError("Not authorized to manage this reservation")


async def _get_host_id_for_reservation(
    session: AsyncSession, reservation: Reservation
) -> str | None:
    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    return unit.host_id if unit is not None else None


def _payment_method_to_provider(method: PaymentMethod) -> str:
    # Local payment methods route through Paymob in Phase 1.
    # Cards can be routed to Stripe when a Stripe secret key is configured.
    if method == PaymentMethod.CARD and settings.STRIPE_SECRET_KEY:
        return PaymentProvider.STRIPE
    return PaymentProvider.PAYMOB


async def _create_provider_payment(
    provider: str, reservation_id: str, amount_egp: int
) -> dict[str, Any]:
    if provider == PaymentProvider.STRIPE:
        return await payment_providers.create_stripe_payment_intent(
            reservation_id, amount_egp
        )
    return await payment_providers.create_paymob_payment(reservation_id, amount_egp)


async def create_reservation(
    session: AsyncSession, user: User, request: ReservationCreate
) -> ReservationResponse:
    _assert_guest(user)
    _assert_kyc_verified(user)

    unit = await listings_repository.get_unit_with_listing(
        session, request.unit_id
    )
    if unit is None or unit.status != UnitStatus.LISTED:
        raise NotFoundError("Listing not available")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    nights = (request.check_out - request.check_in).days
    if nights < listing.min_nights or nights > listing.max_nights:
        raise ValidationError(
            f"Stay must be between {listing.min_nights} and {listing.max_nights} nights"
        )

    total_guests = request.adults + request.children + request.infants
    if total_guests > unit.max_guests:
        raise ValidationError(
            f"Maximum {unit.max_guests} guests allowed for this unit"
        )

    calendar_rules = await listings_repository.get_calendar_rules_in_range(
        session, unit.id, request.check_in, request.check_out
    )
    for rule in calendar_rules:
        if rule.status in (CalendarStatus.BLOCKED, CalendarStatus.BOOKED, CalendarStatus.HOLD):
            raise ConflictError("Requested dates are not available")

    subtotal = pricing.compute_subtotal(listing, calendar_rules, request.check_in, request.check_out)
    amounts = _calculate_amounts(subtotal)

    reservation = Reservation(
        id=str(uuid4()),
        unit_id=unit.id,
        guest_id=user.id,
        status=ReservationStatus.PENDING_PAYMENT,
        check_in=request.check_in,
        check_out=request.check_out,
        adults=request.adults,
        children=request.children,
        infants=request.infants,
        total_amount_egp=amounts["total"],
        host_amount_egp=amounts["host_amount"],
        platform_fee_egp=amounts["platform_fee"],
        guest_fee_egp=amounts["guest_fee"],
        payment_method=request.payment_method,
    )
    session.add(reservation)
    await session.flush()

    provider = _payment_method_to_provider(request.payment_method)
    try:
        payment_result = await _create_provider_payment(
            provider, reservation.id, reservation.total_amount_egp
        )
    except PaymentError as exc:
        logger.error("Payment provider failed for reservation: %s", exc)
        raise

    raw_provider_ref = payment_result.get("order_id") or payment_result.get("payment_intent_id")
    if not raw_provider_ref:
        raise PaymentError("Provider did not return a payment reference")
    provider_ref = str(raw_provider_ref)

    checkout_token = payment_result.get("payment_token") or payment_result.get("client_secret")
    iframe_url = payment_result.get("iframe_url")
    provider_metadata = {
        "checkout_token": checkout_token,
        "iframe_url": iframe_url,
    }

    intent = await reservations_repository.create_payment_intent(
        session,
        reservation.id,
        provider,
        provider_ref,
        reservation.total_amount_egp,
        provider_metadata=provider_metadata,
    )

    await reservations_repository.acquire_calendar_lock(
        session, unit.id, reservation.id, request.check_in, request.check_out
    )

    await write_event(
        session,
        aggregate_type="PaymentIntent",
        aggregate_id=UUID(intent.id),
        event_type="payment.created",
        payload={
            "reservation_id": reservation.id,
            "payment_intent_id": intent.id,
            "provider": intent.provider,
            "provider_ref": intent.provider_ref,
            "amount_egp": intent.amount_egp,
            "checkout_token": checkout_token,
            "iframe_url": iframe_url,
        },
    )

    await reservations_repository.write_booking_event(
        session,
        "booking.initiated",
        reservation,
        extra={
            "payment_method": reservation.payment_method,
            "payment_intent_id": intent.id,
            "provider": intent.provider,
            "provider_ref": intent.provider_ref,
        },
    )

    return _to_response(reservation)


async def get_reservation(
    session: AsyncSession, user: User, reservation_id: str
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")

    _assert_authorized_to_view(reservation, user)
    if user.role in (UserRole.HOST, UserRole.FIELD_STAFF):
        unit = await listings_repository.get_unit_with_listing(
            session, reservation.unit_id
        )
        if unit is None or unit.host_id != user.id:
            raise AuthorizationError("Not authorized to view this reservation")

    return _to_response(reservation)


async def list_reservations(
    session: AsyncSession, user: User, filters: ReservationListFilters
) -> ReservationListResponse:
    unit_ids: list[str] | None = None
    guest_id: str | None = None
    if user.role == UserRole.HOST:
        unit_ids = await listings_repository.get_host_unit_ids(session, user.id)
    elif user.role in (UserRole.GUEST,):
        guest_id = user.id
    elif user.role != UserRole.ADMIN:
        raise AuthorizationError("Not authorized to list reservations")

    offset = filters.get_offset()
    total = await reservations_repository.count_user_reservations(
        session, unit_ids, guest_id, filters.status
    )
    rows = await reservations_repository.list_user_reservations(
        session, unit_ids, guest_id, filters.status, offset, filters.limit
    )

    has_more = offset + len(rows) < total
    next_cursor = (
        ReservationListFilters.encode_cursor(offset + filters.limit)
        if has_more
        else None
    )

    return ReservationListResponse(
        data=[_to_response(row) for row in rows],
        pagination=PaginationInfo(
            next_cursor=next_cursor,
            has_more=has_more,
            total_count=total,
        ),
    )


async def _confirm_reservation(
    session: AsyncSession,
    reservation_id: str,
    provider: str,
    provider_ref: str,
    provider_metadata: dict[str, Any] | None = None,
    admin_override: bool = False,
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")
    if reservation.status != ReservationStatus.PENDING_PAYMENT:
        raise ValidationError("Reservation is not awaiting payment")

    intent = await reservations_repository.get_payment_intent_by_provider_ref(
        session, provider_ref
    )
    if intent is None:
        raise NotFoundError("Payment intent not found")
    if intent.reservation_id != reservation_id:
        raise ValidationError("Payment intent does not belong to reservation")

    if intent.status == PaymentStatus.CAPTURED:
        return _to_response(reservation)

    intent.status = PaymentStatus.CAPTURED
    intent.captured_at = datetime.now(UTC)
    if provider_metadata:
        merged = intent.provider_metadata or {}
        merged.update(provider_metadata)
        intent.provider_metadata = merged
    session.add(intent)

    reservation.status = ReservationStatus.CONFIRMED
    session.add(reservation)
    await session.flush()

    await reservations_repository.confirm_calendar_booking(session, reservation.id)

    host_id = await _get_host_id_for_reservation(session, reservation)
    await write_event(
        session,
        aggregate_type="PaymentIntent",
        aggregate_id=UUID(intent.id),
        event_type="payment.captured",
        payload={
            "reservation_id": reservation.id,
            "payment_intent_id": intent.id,
            "provider": provider,
            "provider_ref": intent.provider_ref,
            "amount_egp": intent.amount_egp,
            "admin_override": admin_override,
        },
    )
    await write_event(
        session,
        aggregate_type="Reservation",
        aggregate_id=UUID(reservation.id),
        event_type="reservation.confirmed",
        payload={
            "reservation_id": reservation.id,
            "unit_id": reservation.unit_id,
            "guest_id": reservation.guest_id,
            "host_id": host_id,
            "payment_intent_id": intent.id,
            "provider": provider,
            "amount_egp": reservation.total_amount_egp,
            "host_amount_egp": reservation.host_amount_egp,
            "admin_override": admin_override,
        },
    )

    return _to_response(reservation)


async def confirm_reservation_by_provider(
    session: AsyncSession,
    reservation_id: str,
    provider: str,
    provider_ref: str,
    provider_metadata: dict[str, Any] | None = None,
) -> ReservationResponse:
    return await _confirm_reservation(
        session,
        reservation_id,
        provider,
        provider_ref,
        provider_metadata=provider_metadata,
        admin_override=False,
    )


async def confirm_reservation(
    session: AsyncSession, reservation_id: str, request: PaymentConfirmationRequest
) -> ReservationResponse:
    return await _confirm_reservation(
        session,
        reservation_id,
        request.provider,
        request.provider_ref,
        admin_override=True,
    )


async def fail_reservation_by_provider(
    session: AsyncSession,
    reservation_id: str,
    provider_ref: str,
    failure_reason: str | None = None,
) -> ReservationResponse | None:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        return None

    intent = await reservations_repository.get_payment_intent_by_provider_ref(
        session, provider_ref
    )
    if intent is not None and intent.reservation_id == reservation_id:
        if intent.status == PaymentStatus.CAPTURED:
            return _to_response(reservation)
        intent.status = PaymentStatus.FAILED
        merged = intent.provider_metadata or {}
        merged["failure_reason"] = failure_reason
        intent.provider_metadata = merged
        session.add(intent)

    if reservation.status == ReservationStatus.PENDING_PAYMENT:
        reservation.status = ReservationStatus.CANCELLED
        reservation.cancelled_at = datetime.now(UTC)
        reservation.cancel_reason = CancellationReason.PAYMENT_FAILURE
        reservation.refund_amount_egp = 0
        session.add(reservation)
        await reservations_repository.release_calendar_lock(session, reservation.id)

    await session.flush()

    if intent is not None:
        await write_event(
            session,
            aggregate_type="PaymentIntent",
            aggregate_id=UUID(intent.id),
            event_type="payment.failed",
            payload={
                "reservation_id": reservation.id,
                "payment_intent_id": intent.id,
                "provider": intent.provider,
                "provider_ref": provider_ref,
                "failure_reason": failure_reason,
            },
        )

    host_id = await _get_host_id_for_reservation(session, reservation)
    await reservations_repository.write_booking_event(
        session,
        "booking.cancelled",
        reservation,
        extra={
            "cancelled_by": "system",
            "cancellation_reason": "payment_failure",
            "refund_amount_egp": 0,
            "refund_policy_applied": "NO_REFUND",
            "refund_days": settings.REFUND_PROCESSING_DAYS,
            "host_id": host_id,
        },
    )

    return _to_response(reservation)


async def cancel_reservation(
    session: AsyncSession, user: User, reservation_id: str, request: ReservationCancelRequest
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")

    await _authorize_cancellation(session, reservation, user)

    if reservation.status in (ReservationStatus.CANCELLED,):
        raise ValidationError("Reservation is already cancelled")
    if reservation.status in (ReservationStatus.CHECKED_IN, ReservationStatus.CHECKED_OUT, ReservationStatus.COMPLETED):
        raise ValidationError("Cannot cancel an active or completed stay")

    refund_amount = _compute_refund(reservation)

    reservation.status = ReservationStatus.CANCELLED
    reservation.cancelled_at = datetime.now(UTC)
    reservation.cancel_reason = request.reason
    reservation.refund_amount_egp = refund_amount
    session.add(reservation)
    await session.flush()

    for intent in reservation.payment_intents:
        if intent.status == PaymentStatus.CAPTURED:
            # Only touch the provider (and only mark REFUNDED) when money is
            # actually owed back. A late cancellation that forfeits the full
            # amount leaves the payment CAPTURED — it was never refunded, so
            # labelling it REFUNDED would be a silent, incorrect financial
            # mutation the guest and finance team would both be misled by.
            if refund_amount > 0:
                intent.status = await _issue_refund(
                    intent, refund_amount, reservation.total_amount_egp
                )
            session.add(intent)
        elif intent.status in (PaymentStatus.PENDING, PaymentStatus.AUTHORIZED):
            intent.status = PaymentStatus.CANCELLED if refund_amount == 0 else PaymentStatus.REFUNDED
            session.add(intent)
    await session.flush()

    await reservations_repository.release_calendar_lock(session, reservation.id)

    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    host_id = unit.host_id if unit is not None else None
    await reservations_repository.write_booking_event(
        session,
        "booking.cancelled",
        reservation,
        extra={
            "cancelled_by": user.role,
            "cancellation_reason": request.reason,
            "refund_amount_egp": refund_amount,
            "refund_policy_applied": _refund_policy_label(
                refund_amount, reservation.total_amount_egp
            ),
            "refund_days": settings.REFUND_PROCESSING_DAYS,
            "host_id": host_id,
        },
    )

    return _to_response(reservation)


async def _issue_refund(intent: Any, refund_amount: int, total_amount: int) -> PaymentStatus:
    """Return funds to the guest through the original payment provider.

    Returns the terminal status to persist on the payment intent: REFUNDED
    once the provider has confirmed the funds were returned, or
    REFUND_PENDING when this codebase cannot yet call the provider
    automatically — the refund is owed but must be issued and reconciled
    manually by finance rather than silently reported as complete.
    """
    partial_amount = None if refund_amount >= total_amount else refund_amount
    if intent.provider == PaymentProvider.STRIPE:
        try:
            await payment_providers.refund_stripe_payment(intent.provider_ref, partial_amount)
        except PaymentError as exc:
            logger.error("Stripe refund failed for payment intent %s: %s", intent.id, exc)
            raise
        return PaymentStatus.REFUNDED

    # Paymob refund API is not yet integrated in this codebase — no verified
    # credentials/endpoint have been tested against it. FOUNDER DECISION
    # NEEDED: activate/confirm the Paymob refund API before this can be
    # automated. Until then, flag for manual finance reconciliation instead
    # of falsely claiming the refund was issued.
    logger.warning(
        "Paymob refund not automated for payment intent %s; manual "
        "reconciliation required (amount_egp=%s)",
        intent.id,
        refund_amount,
    )
    return PaymentStatus.REFUND_PENDING


def _refund_policy_label(refund_amount: int, total_amount: int) -> str:
    if refund_amount == total_amount:
        return "FULL_REFUND"
    if refund_amount == 0:
        return "NO_REFUND"
    return "PARTIAL_REFUND"


async def _authorize_cancellation(
    session: AsyncSession, reservation: Reservation, user: User
) -> None:
    if reservation.guest_id == user.id:
        return
    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    if unit is None:
        raise NotFoundError("Unit not found")
    if user.role == UserRole.HOST and unit.host_id == user.id:
        return
    if user.role == UserRole.ADMIN:
        return
    raise AuthorizationError("Not authorized to cancel this reservation")


def _compute_refund(reservation: Reservation) -> int:
    now = datetime.now(UTC)
    now_date = now.date()
    booking_age_hours = (now - reservation.created_at).total_seconds() / 3600
    days_before_checkin = (reservation.check_in - now_date).days

    # 24-hour grace period: a booking cancelled within a day of being made is
    # always fully refunded, regardless of how close check-in is. This must be
    # checked before the check-in-distance rules below, or it can never apply
    # (a booking is at most 24h old at check time, so any check-in-distance
    # branch that also requires "> CANCELLATION_FULL_REFUND_DAYS" is dead code).
    if booking_age_hours <= 24:
        return reservation.total_amount_egp
    if days_before_checkin > settings.CANCELLATION_FULL_REFUND_DAYS:
        return reservation.total_amount_egp
    if days_before_checkin > settings.CANCELLATION_PARTIAL_REFUND_DAYS:
        return int(
            reservation.total_amount_egp
            * settings.CANCELLATION_PARTIAL_REFUND_PCT
        )
    return 0


async def check_in_reservation(
    session: AsyncSession, user: User, reservation_id: str
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")

    await _require_host_or_staff_for_unit(session, reservation, user)

    if reservation.status != ReservationStatus.CONFIRMED:
        raise ValidationError("Reservation must be confirmed before check-in")

    today = datetime.now(UTC).date()
    if today < reservation.check_in:
        raise ValidationError("Cannot check in before the scheduled check-in date")

    reservation.status = ReservationStatus.CHECKED_IN
    reservation.checked_in_at = datetime.now(UTC)
    session.add(reservation)
    await session.flush()

    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    host_id = unit.host_id if unit is not None else None
    await reservations_repository.write_booking_event(
        session,
        "booking.checked_in",
        reservation,
        extra={
            "host_id": host_id,
            "checked_in_at": reservation.checked_in_at.isoformat(),
        },
    )

    return _to_response(reservation)


async def check_out_reservation(
    session: AsyncSession, user: User, reservation_id: str
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")

    await _require_host_or_staff_for_unit(session, reservation, user)

    if reservation.status != ReservationStatus.CHECKED_IN:
        raise ValidationError("Reservation must be checked in before check-out")

    reservation.status = ReservationStatus.CHECKED_OUT
    reservation.checked_out_at = datetime.now(UTC)
    session.add(reservation)
    await session.flush()

    unit = await listings_repository.get_unit_with_listing(
        session, reservation.unit_id
    )
    host_id = unit.host_id if unit is not None else None
    await reservations_repository.write_booking_event(
        session,
        "booking.checked_out",
        reservation,
        extra={
            "host_id": host_id,
            "checked_out_at": reservation.checked_out_at.isoformat(),
            "next_check_in": None,
        },
    )

    return _to_response(reservation)


async def apply_promo_code(
    session: AsyncSession, user: User, reservation_id: str, request: PromoApplyRequest
) -> ReservationResponse:
    reservation = await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )
    if reservation is None:
        raise NotFoundError("Reservation not found")
    if reservation.guest_id != user.id:
        raise AuthorizationError("Not authorized to modify this reservation")
    if reservation.status != ReservationStatus.PENDING_PAYMENT:
        raise ValidationError("Promo code can only be applied to pending reservations")
    if reservation.promo_applications:
        raise ValidationError("A promo code has already been applied to this reservation")

    promo_code = await reservations_repository.get_promo_code_by_code(
        session, request.code
    )
    if promo_code is None:
        raise NotFoundError("Promo code not found")
    if not promo_code.is_active:
        raise ValidationError("Promo code is not active")
    if promo_code.max_uses is not None and promo_code.uses >= promo_code.max_uses:
        raise ValidationError("Promo code usage limit exceeded")
    now = datetime.now(UTC)
    if promo_code.valid_from is not None and now < promo_code.valid_from:
        raise ValidationError("Promo code is not yet valid")
    if promo_code.valid_until is not None and now > promo_code.valid_until:
        raise ValidationError("Promo code has expired")

    # Reverse-engineer current subtotal before guest fee to apply discount consistently.
    current_subtotal = reservation.total_amount_egp - reservation.guest_fee_egp
    discount_pct = float(promo_code.discount_pct) / 100.0
    amounts = _calculate_amounts(current_subtotal, discount_pct)

    reservation.total_amount_egp = amounts["total"]
    reservation.host_amount_egp = amounts["host_amount"]
    reservation.platform_fee_egp = amounts["platform_fee"]
    reservation.guest_fee_egp = amounts["guest_fee"]
    session.add(reservation)

    await reservations_repository.create_promo_application(
        session, reservation.id, promo_code, amounts["discount_amount"]
    )
    await session.flush()

    return _to_response(reservation)
