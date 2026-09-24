import hmac
import logging
import secrets
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

import boto3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import UserRole
from app.auth.models import User
from app.auth.staff import has_permission
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.finance import commercial
from app.listings import pricing
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import (
    AuthorizationError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)
from app.shared.models import OutboxEvent

from . import repository as payments_repository
from .constants import PaymentStatus
from .models import Payment
from .schemas import (
    BookingQuote,
    InternalQuote,
    PaymentListItem,
    PaymentProofDownloadResponse,
    PaymentProofPresignResponse,
    PaymentResponse,
    PaymentReturnStatusResponse,
)

logger = logging.getLogger(__name__)

_PROOF_UPLOAD_TTL_SECONDS = 900
_PROOF_DOWNLOAD_TTL_SECONDS = 300


def _manual_instructions_ar() -> str:
    return (
        "لإتمام عملية الحجز، يرجى تحويل المبلغ المطلوب إلى الحساب التالي:\n"
        f"{settings.PAYMENT_BANK_NAME_AR}\n"
        f"رقم الحساب: {settings.PAYMENT_BANK_ACCOUNT_NUMBER}\n"
        f"اسم الحساب: {settings.PAYMENT_ACCOUNT_NAME}\n"
        f"أو عبر فودافون كاش على الرقم: {settings.PAYMENT_VODAFONE_CASH_NUMBER}\n\n"
        "بعد التحويل، يرجى رفع إيصال الدفع (صورة أو PDF) من هذه الصفحة.\n"
        "سيتم مراجعة الدفع خلال 24 ساعة وتأكيد حجزك."
    )


def _manual_instructions_en() -> str:
    return (
        "To complete your booking, please transfer the required amount to:\n"
        f"{settings.PAYMENT_BANK_NAME_EN}\n"
        f"Account Number: {settings.PAYMENT_BANK_ACCOUNT_NUMBER}\n"
        f"Account Name: {settings.PAYMENT_ACCOUNT_NAME}\n"
        f"Or via Vodafone Cash to: {settings.PAYMENT_VODAFONE_CASH_NUMBER}\n\n"
        "After transferring, please upload your payment receipt (image or PDF) from this page.\n"
        "Your payment will be reviewed within 24 hours and your booking confirmed."
    )


def _require_storage_config() -> None:
    missing = [
        name
        for name in (
            "S3_PAYMENT_PROOF_BUCKET",
            "AWS_REGION",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
        )
        if not getattr(settings, name)
    ]
    if missing:
        # Infrastructure detail stays in server logs — the API must not
        # leak env var names or storage configuration to clients.
        logger.error(
            "Payment proof storage is not configured (missing: %s)",
            ", ".join(missing),
        )
        raise ServiceUnavailableError(
            "File upload is temporarily unavailable. Please try again later."
        )


def _s3_client() -> Any:
    _require_storage_config()
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _build_instructions(locale: str = "ar") -> str:
    if locale == "ar":
        return _manual_instructions_ar()
    return _manual_instructions_en()


def _generate_reference() -> str:
    return f"STY-{uuid.uuid4().hex[:8].upper()}"


def _payment_unit_context(payment: Payment) -> tuple[str | None, str | None]:
    unit_title: str | None = None
    unit_cover_image: str | None = None
    unit = getattr(payment, "unit", None)
    if isinstance(unit, Unit) and unit.listing is not None:
        listing = unit.listing
        unit_title = listing.title_en or listing.title_ar
        # Canonical cover resolution — same fallbacks as search/detail.
        from app.listings.configuration import resolve_cover_image_url

        unit_cover_image = resolve_cover_image_url(unit, listing)
    return unit_title, unit_cover_image


def _to_response(payment: Payment, *, include_breakdown: bool = False) -> PaymentResponse:
    unit_title, unit_cover_image = _payment_unit_context(payment)
    return PaymentResponse(
        id=payment.id,
        booking_id=payment.booking_id,
        guest_id=payment.guest_id,
        host_id=payment.host_id,
        unit_id=payment.unit_id,
        status=payment.status,
        method=payment.method,
        provider=payment.provider,
        checkout_url=payment.checkout_url,
        amount_egp=payment.amount_egp,
        accommodation_amount_egp=(
            payment.accommodation_amount_egp if include_breakdown else None
        ),
        guest_service_fee_egp=(
            payment.guest_service_fee_egp if include_breakdown else None
        ),
        cleaning_fee_egp=(
            payment.cleaning_fee_egp if include_breakdown else None
        ),
        # VAT is the guest's own tax line — visible to everyone; the
        # internal economics breakdown stays gated by include_breakdown.
        vat_egp=payment.vat_egp,
        refund_amount_egp=payment.refund_amount_egp,
        nights=payment.nights,
        reference_number=payment.reference_number,
        payment_deadline_at=payment.payment_deadline_at,
        proof_rejection_count=payment.proof_rejection_count or 0,
        proof_s3_key=payment.proof_s3_key,
        proof_url=None if payment.proof_s3_key else payment.proof_url,
        proof_uploaded_at=payment.proof_uploaded_at,
        verified_at=payment.verified_at,
        verified_by=payment.verified_by,
        rejected_at=payment.rejected_at,
        rejected_by=payment.rejected_by,
        reject_reason=payment.reject_reason,
        cancelled_at=payment.cancelled_at,
        refunded_at=payment.refunded_at,
        instructions=payment.instructions,
        unit_title=unit_title,
        unit_cover_image=unit_cover_image,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


def _to_list_item(payment: Payment) -> PaymentListItem:
    unit_title, unit_cover_image = _payment_unit_context(payment)
    return PaymentListItem(
        id=payment.id,
        booking_id=payment.booking_id,
        guest_id=payment.guest_id,
        host_id=payment.host_id,
        unit_id=payment.unit_id,
        status=payment.status,
        method=payment.method,
        amount_egp=payment.amount_egp,
        refund_amount_egp=payment.refund_amount_egp,
        reference_number=payment.reference_number,
        payment_deadline_at=payment.payment_deadline_at,
        refunded_at=payment.refunded_at,
        proof_rejection_count=payment.proof_rejection_count or 0,
        proof_s3_key=payment.proof_s3_key,
        proof_url=None if payment.proof_s3_key else payment.proof_url,
        proof_uploaded_at=payment.proof_uploaded_at,
        reject_reason=payment.reject_reason,
        unit_title=unit_title,
        unit_cover_image=unit_cover_image,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


def _assert_guest(user: User) -> None:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can manage payments")


def _assert_admin(user: User) -> None:
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise AuthorizationError("Only admins can verify payments")


async def _assert_authorized_to_view(
    session: AsyncSession, payment: Payment, user: User
) -> None:
    if payment.guest_id == user.id or payment.host_id == user.id:
        return
    if await has_permission(session, user, "payments"):
        return
    raise AuthorizationError("Not authorized to view this payment")


async def _fetch_unit_and_listing(
    session: AsyncSession, unit_id: str
) -> tuple[Unit, UnitListing]:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Unit not found")
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")
    return unit, listing


async def _emit_outbox_event(
    session: AsyncSession,
    aggregate_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    event = OutboxEvent(
        id=str(uuid.uuid4()),
        aggregate_type="payment",
        aggregate_id=aggregate_id,
        event_type=event_type,
        payload=payload,
    )
    session.add(event)
    await session.flush()


async def get_booking_quote(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
) -> BookingQuote:
    """Public price quote for a prospective booking — same math as payment
    creation so the displayed total always matches the charged amount."""
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    unit, listing = await _fetch_unit_and_listing(session, unit_id)
    if unit.status != UnitStatus.LISTED:
        raise ValidationError("Unit is not available for booking")
    nights = (check_out - check_in).days
    internal = await compute_booking_quote(
        session, unit_id, check_in.isoformat(), check_out.isoformat(), listing, nights
    )
    # Guest-facing contract: the booking components the guest is paying
    # for (accommodation, cleaning, VAT) plus the total. Internal
    # economics — platform share, host net — never leave this function.
    return BookingQuote(
        unit_id=internal.unit_id,
        check_in=internal.check_in,
        check_out=internal.check_out,
        nights=internal.nights,
        nightly_rate_egp=internal.nightly_rate_egp,
        accommodation_egp=internal.accommodation_egp,
        cleaning_fee_egp=internal.cleaning_fee_egp,
        vat_egp=internal.vat_egp,
        total_egp=internal.total_egp,
    )


async def compute_booking_quote(
    session: AsyncSession,
    unit_id: str,
    check_in: str,
    check_out: str,
    listing: UnitListing,
    nights: int,
) -> "InternalQuote":
    """Single source of truth for guest pricing: nightly base + cleaning
    fee + VAT on the taxable amount. Shared by the quote endpoint and
    payment creation so clients never have to guess the total.

    Uses the same pricing engine as search results — weekend multipliers
    and calendar-rule price overrides are applied per night — so the
    quote always matches the total shown on the search/listing page.
    """
    check_in_date = date.fromisoformat(check_in)
    check_out_date = date.fromisoformat(check_out)
    rules = await listings_repository.get_calendar_rules_in_range(
        session, unit_id, check_in_date, check_out_date
    )
    accommodation_egp = pricing.compute_subtotal(
        listing, rules, check_in_date, check_out_date
    )
    discount_pct = pricing.applicable_discount_pct(listing, nights)
    discount_egp = int(round(accommodation_egp * discount_pct / 100))
    discounted_accommodation_egp = accommodation_egp - discount_egp
    nightly_rate_egp = (
        discounted_accommodation_egp // nights
        if nights > 0
        else listing.base_price_egp
    )
    cleaning_fee_egp = listing.cleaning_fee_egp or 0

    # All-inclusive guest pricing (Founder commercial decision): the guest
    # total is the discounted accommodation amount plus host-set charges
    # like cleaning, plus VAT on that taxable amount. StayOS's 12%
    # economics come OUT of the taxable amount via the canonical engine —
    # never on top, never a guest-facing line item.
    economics = commercial.compute_booking_economics(
        discounted_accommodation_egp, cleaning_fee_egp
    )

    return InternalQuote(
        unit_id=unit_id,
        check_in=check_in,
        check_out=check_out,
        nights=nights,
        nightly_rate_egp=nightly_rate_egp,
        accommodation_egp=discounted_accommodation_egp,
        cleaning_fee_egp=cleaning_fee_egp,
        vat_egp=economics.vat_egp,
        total_egp=economics.guest_total_egp,
    )


async def create_payment_for_booking(
    session: AsyncSession,
    booking: Booking,
    guest: User,
) -> PaymentResponse:
    """Create a pending payment request after a host accepts a booking."""
    existing = await payments_repository.get_payment_by_booking(session, booking.id)
    if existing is not None:
        return _to_response(existing)

    unit, listing = await _fetch_unit_and_listing(session, booking.unit_id)

    nights = (booking.check_out - booking.check_in).days
    quote = await compute_booking_quote(
        session,
        booking.unit_id,
        booking.check_in.isoformat(),
        booking.check_out.isoformat(),
        listing,
        nights,
    )
    # A host custom offer (FD-07) overrides the listing-priced quote: the
    # offered total IS the all-inclusive guest price — the guest pays
    # exactly what the host offered, so VAT is the tax component inside
    # that VAT-inclusive total.
    if booking.custom_total_egp is not None:
        amount = booking.custom_total_egp
        vat_egp = commercial.vat_inclusive_portion(amount)
        subtotal = amount - vat_egp
        cleaning_fee = 0
    else:
        subtotal = quote.accommodation_egp + quote.cleaning_fee_egp
        cleaning_fee = quote.cleaning_fee_egp
        vat_egp = commercial.compute_vat(subtotal)
        amount = quote.total_egp

    # VAT is a separate tax on the taxable booking amount (accommodation
    # + cleaning) — computed by the canonical engine and added on top of
    # the taxable total. It is NOT part of the 12% StayOS share and is
    # never waived by the alpha free-bookings incentive.

    instructions = _build_instructions(guest.locale or "ar")
    reference = _generate_reference()
    # V1 policy §1.2 — the guest has PAYMENT_DEADLINE_HOURS from host
    # acceptance (payment creation) to submit proof before the booking may
    # be cancelled by the expiry sweep.
    deadline = datetime.now(UTC) + timedelta(hours=settings.PAYMENT_DEADLINE_HOURS)

    payment = await payments_repository.create_payment(
        session,
        booking_id=booking.id,
        guest_id=booking.guest_id,
        host_id=unit.host_id,
        unit_id=booking.unit_id,
        amount_egp=amount,
        accommodation_amount_egp=subtotal,
        # New commercial model: there is no guest service fee. The column is
        # kept for legacy rows whose stored value still drives refund math.
        guest_service_fee_egp=0,
        cleaning_fee_egp=cleaning_fee,
        vat_egp=vat_egp,
        nights=nights,
        reference_number=reference,
        instructions=instructions,
        payment_deadline_at=deadline,
    )

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.required",
        payload={
            "booking_id": booking.id,
            "payment_id": payment.id,
            "amount_egp": amount,
            "reference_number": reference,
            "guest_phone": guest.phone_number,
            "guest_email": guest.email,
            "guest_name": guest.display_name,
            "locale": guest.locale or "ar",
        },
    )

    return _to_response(payment)


async def _can_view_breakdown(session: AsyncSession, user: User) -> bool:
    """Only admin/staff holding the payments permission may see internal
    amount breakdowns — guests and hosts get total-only responses."""
    return await has_permission(session, user, "payments")


async def create_card_checkout_session(
    session: AsyncSession, user: User, payment_id: str
) -> PaymentResponse:
    """Issue a Paymob hosted-checkout session for a pending booking payment.

    Canonical card path: the Paymob merchant order id is the booking id so
    the signed transaction callback resolves back to this payment. The
    server stays authoritative for the amount — the provider intention is
    created from ``payment.amount_egp``, never from client input.
    """
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id:
        raise AuthorizationError("Only the guest can pay this booking")
    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        raise ValidationError(
            "Card checkout is only available for a pending payment"
        )

    from app.finance import providers as payment_providers

    # After hosted checkout the browser returns to the StayOS checkout page;
    # the webhook — not the redirect — remains authoritative for state.
    # The return token lets a guest who returns WITHOUT an authenticated
    # session (payment browser ≠ booking browser, expired session) still see
    # a safe read-only payment status. It is unguessable, scoped to this
    # checkout attempt, and expires — it is never payment proof.
    return_token = secrets.token_urlsafe(32)
    return_token_issued_at = datetime.now(UTC).isoformat()
    redirection_url = None
    if settings.WEB_BASE_URL:
        redirection_url = (
            f"{settings.WEB_BASE_URL.rstrip('/')}"
            f"/checkout/{payment.booking_id}?from=paymob&pr={return_token}"
        )

    try:
        result = await payment_providers.create_paymob_payment(
            payment.booking_id,
            payment.amount_egp,
            redirection_url=redirection_url,
        )
    except Exception as exc:
        raise ServiceUnavailableError(
            "Card checkout is unavailable right now"
        ) from exc

    provider_ref = result.get("order_id") or result.get("payment_intent_id")
    if not provider_ref:
        raise ServiceUnavailableError("Payment provider did not return a reference")

    updated = await payments_repository.update_payment(
        session,
        payment,
        provider="paymob",
        provider_ref=str(provider_ref),
        checkout_url=result.get("iframe_url"),
        provider_metadata={
            "checkout_token": result.get("payment_token")
            or result.get("client_secret"),
            "checkout_url": result.get("checkout_url") or result.get("iframe_url"),
            "return_token": return_token,
            "return_token_issued_at": return_token_issued_at,
        },
    )
    return _to_response(updated)


async def get_payment_return_status(
    session: AsyncSession, booking_id: str, token: str
) -> PaymentReturnStatusResponse:
    """Read-only payment status for a guest returning from hosted checkout
    without an authenticated session.

    Authorized solely by the unguessable per-checkout return token stored on
    the payment at checkout-session creation — never by redirect params.
    Invalid, expired, or mismatched tokens are indistinguishable from a
    missing payment (no enumeration oracle)."""
    payment = await payments_repository.get_payment_by_booking(session, booking_id)

    meta = (payment.provider_metadata or {}) if payment else {}
    stored = meta.get("return_token")
    issued_at_raw = meta.get("return_token_issued_at")

    valid = bool(stored) and bool(token) and hmac.compare_digest(stored, token)
    if valid and issued_at_raw:
        try:
            issued_at = datetime.fromisoformat(str(issued_at_raw))
            if issued_at.tzinfo is None:
                issued_at = issued_at.replace(tzinfo=UTC)
            if issued_at + timedelta(
                hours=settings.PAYMENT_RETURN_TOKEN_TTL_HOURS
            ) < datetime.now(UTC):
                valid = False
        except ValueError:
            valid = False

    if payment is None or not valid:
        raise NotFoundError("Payment return link not found")

    booking = await bookings_repository.get_booking(session, payment.booking_id)

    return PaymentReturnStatusResponse(
        booking_id=payment.booking_id,
        payment_id=payment.id,
        payment_status=str(payment.status),
        booking_status=str(booking.status) if booking else "unknown",
        amount_egp=payment.amount_egp,
        reference_number=payment.reference_number,
        verified_at=payment.verified_at,
    )


async def confirm_payment_by_provider(
    session: AsyncSession,
    booking_id: str,
    provider_ref: str,
    amount_egp: int | None,
) -> bool:
    """Reconcile a successful Paymob callback to a booking payment.

    Returns True when the callback was applied; False when no pending
    provider payment exists for the booking id (the webhook then reports
    "not found"). Amount is verified against the stored payment so a
    tampered callback cannot mark the wrong amount as collected.
    """
    payment = await payments_repository.get_payment_by_booking(session, booking_id)
    if payment is None or payment.provider != "paymob":
        return False
    if payment.status == PaymentStatus.VERIFIED:
        return True
    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        return False
    if amount_egp is not None and int(amount_egp) != payment.amount_egp:
        raise ValidationError("Callback amount does not match the payment")

    now = datetime.now(UTC)
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.VERIFIED,
        method="paymob",
        transaction_ref=provider_ref,
        verified_at=now,
        verified_by=None,
    )

    booking = await bookings_repository.get_booking(session, payment.booking_id)
    if booking is not None:
        await bookings_repository.update_booking(
            session, booking, status=BookingStatus.CONFIRMED
        )

    guest = await session.execute(select(User).where(User.id == payment.guest_id))
    guest_user = guest.scalar_one_or_none()

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.verified",
        payload={
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )
    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="booking.payment_confirmed",
        payload={
            "reservation_id": payment.booking_id,
            "booking_id": payment.booking_id,
            "payment_id": payment.id,
            "amount_egp": payment.amount_egp,
            "host_id": payment.host_id,
            "accommodation_egp": (
                payment.accommodation_amount_egp
                if payment.accommodation_amount_egp is not None
                else payment.amount_egp
                - (payment.cleaning_fee_egp or 0)
                - (payment.vat_egp or 0)
            ),
            "cleaning_fee_egp": payment.cleaning_fee_egp or 0,
        },
    )
    return bool(updated)


async def fail_payment_by_provider(
    session: AsyncSession,
    booking_id: str,
    provider_ref: str,
    failure_reason: str,
) -> bool:
    """Record a failed card attempt on a booking payment.

    The payment stays PENDING so the guest can retry within the payment
    deadline — a declined card must not cancel the accepted booking.
    """
    payment = await payments_repository.get_payment_by_booking(session, booking_id)
    if payment is None or payment.provider != "paymob":
        return False
    if payment.status != PaymentStatus.PENDING:
        return True
    metadata = dict(payment.provider_metadata or {})
    metadata["last_failure"] = {
        "provider_ref": provider_ref,
        "reason": failure_reason,
        "at": datetime.now(UTC).isoformat(),
    }
    await payments_repository.update_payment(
        session, payment, provider_metadata=metadata
    )
    return True


async def get_payment(
    session: AsyncSession, user: User, payment_id: str
) -> PaymentResponse:
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    await _assert_authorized_to_view(session, payment, user)
    return _to_response(
        payment, include_breakdown=await _can_view_breakdown(session, user)
    )


async def get_payment_by_booking(
    session: AsyncSession, user: User, booking_id: str
) -> PaymentResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    if booking.guest_id != user.id and not await has_permission(
        session, user, "payments"
    ):
        unit = booking.unit
        if unit is None or unit.host_id != user.id:
            raise AuthorizationError("Not authorized to view this booking")

    payment = await payments_repository.get_payment_by_booking(session, booking_id)
    if payment is None:
        raise NotFoundError("Payment not found for this booking")
    return _to_response(
        payment, include_breakdown=await _can_view_breakdown(session, user)
    )


async def presign_proof_upload(
    session: AsyncSession,
    user: User,
    payment_id: str,
    filename: str,
    content_type: str,
) -> PaymentProofPresignResponse:
    await auth_dependencies.require_kyc_verified(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id and not await has_permission(
        session, user, "payments"
    ):
        raise AuthorizationError("Only the guest or admin can upload proof")

    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        raise ValidationError(
            "Proof can only be uploaded when payment is pending or rejected"
        )
    _assert_resubmission_allowed(payment)

    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if content_type not in allowed_types:
        raise ValidationError("Only JPG, PNG, WebP images or PDF files are accepted")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    proof_key = f"payments/{payment.id}/proof_{uuid.uuid4().hex}.{ext}"

    client = _s3_client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.payment_proof_bucket,
            "Key": proof_key,
            "ContentType": content_type,
        },
        ExpiresIn=_PROOF_UPLOAD_TTL_SECONDS,
    )

    return PaymentProofPresignResponse(upload_url=upload_url, proof_key=proof_key)


async def presign_proof_download(
    session: AsyncSession,
    user: User,
    payment_id: str,
) -> PaymentProofDownloadResponse:
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id and not await has_permission(
        session, user, "payments"
    ):
        if payment.host_id != user.id:
            raise AuthorizationError("Not authorized to view this payment proof")

    if not payment.proof_s3_key:
        raise NotFoundError("Payment proof not uploaded")

    client = _s3_client()
    download_url = client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.payment_proof_bucket,
            "Key": payment.proof_s3_key,
        },
        ExpiresIn=_PROOF_DOWNLOAD_TTL_SECONDS,
    )

    return PaymentProofDownloadResponse(
        download_url=download_url,
        expires_in=_PROOF_DOWNLOAD_TTL_SECONDS,
    )


def _assert_resubmission_allowed(payment: Payment) -> None:
    """V1 policy §2.2 — proof may be resubmitted at most
    PAYMENT_PROOF_MAX_REJECTIONS times within
    PAYMENT_PROOF_RESUBMISSION_WINDOW_HOURS of the first rejection.

    Exhaustion normally cancels the booking at rejection time, so this guard
    is the defence-in-depth backstop for races and pre-existing rows.
    """
    if (
        (payment.proof_rejection_count or 0) >= settings.PAYMENT_PROOF_MAX_REJECTIONS
    ):
        raise ValidationError(
            "Payment proof resubmission limit reached — this booking can no longer be paid"
        )
    if payment.first_rejected_at is not None:
        window_end = payment.first_rejected_at + timedelta(
            hours=settings.PAYMENT_PROOF_RESUBMISSION_WINDOW_HOURS
        )
        if datetime.now(UTC) > window_end:
            raise ValidationError(
                "Payment proof resubmission window has expired — this booking can no longer be paid"
            )


async def upload_proof(
    session: AsyncSession,
    user: User,
    payment_id: str,
    s3_key: str,
    url: str | None,
) -> PaymentResponse:
    await auth_dependencies.require_kyc_verified(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id:
        raise AuthorizationError("Only the guest can upload payment proof")

    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        raise ValidationError(
            "Proof can only be uploaded when payment is pending or rejected"
        )
    _assert_resubmission_allowed(payment)

    now = datetime.now(UTC)
    # P0-3: proof_url is intentionally not stored.  The private S3 key is the
    # source of truth; authorized downloads use the presigned GET endpoint.
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.PROOF_UPLOADED,
        proof_s3_key=s3_key,
        proof_url=None,
        proof_uploaded_at=now,
        rejected_at=None,
        rejected_by=None,
        reject_reason=None,
    )

    guest = await session.execute(select(User).where(User.id == payment.guest_id))
    guest_user = guest.scalar_one_or_none()

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.proof_uploaded",
        payload={
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    return _to_response(updated)


async def verify_payment(
    session: AsyncSession,
    user: User,
    payment_id: str,
) -> PaymentResponse:
    _assert_admin(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.status != PaymentStatus.PROOF_UPLOADED:
        raise ValidationError("Only payments with uploaded proof can be verified")

    now = datetime.now(UTC)
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.VERIFIED,
        verified_at=now,
        verified_by=user.id,
    )

    booking = await bookings_repository.get_booking(session, payment.booking_id)
    if booking is not None:
        await bookings_repository.update_booking(
            session,
            booking,
            status=BookingStatus.CONFIRMED,
        )

    guest = await session.execute(select(User).where(User.id == payment.guest_id))
    guest_user = guest.scalar_one_or_none()

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.verified",
        payload={
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    # Founder payment model: a verified payment means funds are collected
    # and HELD under StayOS control — create the escrow record now so the
    # host cannot be paid before the check-in protection window elapses.
    # The finance consumer splits host net / platform share at release.
    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="booking.payment_confirmed",
        payload={
            "reservation_id": payment.booking_id,
            "booking_id": payment.booking_id,
            "payment_id": payment.id,
            "amount_egp": payment.amount_egp,
            "host_id": payment.host_id,
            "accommodation_egp": (
                payment.accommodation_amount_egp
                if payment.accommodation_amount_egp is not None
                else payment.amount_egp
                - (payment.cleaning_fee_egp or 0)
                - (payment.vat_egp or 0)
            ),
            "cleaning_fee_egp": payment.cleaning_fee_egp or 0,
        },
    )

    return _to_response(updated, include_breakdown=True)


async def refund_payment(
    session: AsyncSession,
    user: User,
    payment_id: str,
) -> PaymentResponse:
    _assert_admin(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.status != PaymentStatus.REFUND_PENDING:
        raise ValidationError("Only refund-pending payments can be marked as refunded")
    if payment.refund_amount_egp is None or payment.refund_amount_egp <= 0:
        raise ValidationError("Refund amount is not set for this payment")

    now = datetime.now(UTC)
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.REFUNDED,
        refunded_at=now,
    )

    guest = await session.execute(select(User).where(User.id == payment.guest_id))
    guest_user = guest.scalar_one_or_none()

    # Admin confirmation is the authoritative signal for manual refunds —
    # settle the guest-refund payable recorded at cancellation into cash.
    from app.finance import services as finance_services

    await finance_services.settle_guest_refund(session, payment.booking_id)

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.refunded",
        payload={
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "refund_amount_egp": payment.refund_amount_egp,
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    return _to_response(updated, include_breakdown=True)


async def reject_payment(
    session: AsyncSession,
    user: User,
    payment_id: str,
    reject_reason: str,
) -> PaymentResponse:
    _assert_admin(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.status != PaymentStatus.PROOF_UPLOADED:
        raise ValidationError("Only payments with uploaded proof can be rejected")

    now = datetime.now(UTC)
    rejection_count = (payment.proof_rejection_count or 0) + 1
    first_rejected_at = payment.first_rejected_at or now
    window_end = first_rejected_at + timedelta(
        hours=settings.PAYMENT_PROOF_RESUBMISSION_WINDOW_HOURS
    )
    exhausted = (
        rejection_count >= settings.PAYMENT_PROOF_MAX_REJECTIONS
        or now > window_end
    )
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.PENDING,
        rejected_at=now,
        rejected_by=user.id,
        reject_reason=reject_reason,
        proof_rejection_count=rejection_count,
        first_rejected_at=first_rejected_at,
    )

    guest = await session.execute(select(User).where(User.id == payment.guest_id))
    guest_user = guest.scalar_one_or_none()

    await _emit_outbox_event(
        session,
        aggregate_id=payment.id,
        event_type="payment.rejected",
        payload={
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "reject_reason": reject_reason,
            "proof_rejection_count": rejection_count,
            "resubmissions_remaining": max(
                0, settings.PAYMENT_PROOF_MAX_REJECTIONS - rejection_count
            ),
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
    )

    if exhausted:
        # V1 policy §2.2 — resubmission attempts exhausted or window elapsed:
        # the booking is cancelled and the guest may submit a new request.
        from app.bookings import services as booking_services

        await booking_services.cancel_booking_system(
            session,
            payment.booking_id,
            reason="payment_proof_resubmission_exhausted",
        )

    return _to_response(updated, include_breakdown=True)


async def list_pending_payments(
    session: AsyncSession,
    user: User,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[PaymentListItem]:
    _assert_admin(user)
    payments = await payments_repository.list_pending_payments(
        session, status=status, limit=limit, offset=offset
    )
    return [_to_list_item(p) for p in payments]


async def list_guest_payments(
    session: AsyncSession,
    user: User,
    limit: int = 50,
    offset: int = 0,
) -> list[PaymentListItem]:
    _assert_guest(user)
    payments = await payments_repository.list_guest_payments(
        session, user.id, limit=limit, offset=offset
    )
    return [_to_list_item(p) for p in payments]


async def _attach_host_earnings(
    session: AsyncSession,
    payments: list[Payment],
    items: list[PaymentListItem],
) -> None:
    """Populate the host-facing earnings fields on payment list items.

    Economics come from the canonical commercial engine (identical to the
    escrow-release path); funds/payout state derives from the booking's
    escrow lifecycle — 24h after confirmed check-in eligibility."""
    from app.finance import services as finance_services
    from app.finance.models import EscrowAccount

    if not payments:
        return
    escrow_rows = await session.execute(
        select(EscrowAccount).where(
            EscrowAccount.reservation_id.in_([p.booking_id for p in payments])
        )
    )
    escrow_by_booking = {
        e.reservation_id: e for e in escrow_rows.scalars().all()
    }
    for payment, item in zip(payments, items):
        economics, waived = await finance_services.booking_economics(
            session, payment
        )
        item.host_net_egp = economics.host_net_egp
        item.platform_fee_egp = economics.platform_share_egp
        item.platform_share_waived = waived
        payout = finance_services.derive_payout_state(
            escrow_by_booking.get(payment.booking_id)
        )
        if payout is not None:
            item.funds_status = payout["funds_status"]
            item.funds_held_egp = payout["funds_held_egp"]
            item.expected_payout_at = payout["expected_payout_at"]
            item.payout_status = payout["payout_status"]
            item.paid_at = payout["paid_at"]


# Host payment-activity tabs map to canonical backend statuses. "Pending"
# covers every payment still awaiting resolution — no proof yet, proof
# under review, or rejected and awaiting resubmission. "Cancelled" stays
# strictly distinct from refund states: a cancelled payment means no money
# was collected (collected-then-cancelled payments sit in refund_pending/
# refunded instead).
_HOST_ACTIVITY_FILTERS: dict[str, list[str]] = {
    "pending": [
        PaymentStatus.PENDING,
        PaymentStatus.PROOF_UPLOADED,
        PaymentStatus.REJECTED,
    ],
    # "Collected" mirrors the total_revenue_egp aggregate on the earnings
    # summary — every payment where money was actually collected from the
    # guest (verified, or collected-then-refunding/refunded).
    "collected": [
        PaymentStatus.VERIFIED,
        PaymentStatus.REFUND_PENDING,
        PaymentStatus.REFUNDED,
    ],
}

# Escrow-lifecycle drill-downs — used by the host earnings cards. These
# mirror the summary aggregates in host/services.get_host_earnings so the
# list a card opens always matches the total it shows.
_HOST_LIFECYCLE_FILTERS = {"funds_held", "payout_ready", "paid_out"}


async def list_host_payments(
    session: AsyncSession,
    user: User,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[PaymentListItem]:
    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts can view their payment activity")
    lifecycle = status if status in _HOST_LIFECYCLE_FILTERS else None
    statuses = (
        _HOST_ACTIVITY_FILTERS.get(status)
        if status and lifecycle is None
        else None
    )
    if status and statuses is None and lifecycle is None:
        statuses = [status]
    payments = await payments_repository.list_host_payments(
        session,
        user.id,
        statuses=statuses,
        lifecycle=lifecycle,
        limit=limit,
        offset=offset,
    )
    items = [_to_list_item(p) for p in payments]
    await _attach_host_earnings(session, payments, items)
    return items
