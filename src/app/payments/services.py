import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

import boto3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.shared.models import OutboxEvent

from . import repository as payments_repository
from .constants import PaymentStatus
from .models import Payment
from .schemas import (
    BookingQuote,
    PaymentListItem,
    PaymentProofDownloadResponse,
    PaymentProofPresignResponse,
    PaymentResponse,
)

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


def _s3_client() -> Any:
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


def _to_response(payment: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=payment.id,
        booking_id=payment.booking_id,
        guest_id=payment.guest_id,
        host_id=payment.host_id,
        unit_id=payment.unit_id,
        status=payment.status,
        method=payment.method,
        amount_egp=payment.amount_egp,
        accommodation_amount_egp=payment.accommodation_amount_egp,
        guest_service_fee_egp=payment.guest_service_fee_egp,
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
        instructions=payment.instructions,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


def _to_list_item(payment: Payment) -> PaymentListItem:
    return PaymentListItem(
        id=payment.id,
        booking_id=payment.booking_id,
        guest_id=payment.guest_id,
        host_id=payment.host_id,
        unit_id=payment.unit_id,
        status=payment.status,
        method=payment.method,
        amount_egp=payment.amount_egp,
        reference_number=payment.reference_number,
        payment_deadline_at=payment.payment_deadline_at,
        proof_rejection_count=payment.proof_rejection_count or 0,
        proof_s3_key=payment.proof_s3_key,
        proof_url=None if payment.proof_s3_key else payment.proof_url,
        proof_uploaded_at=payment.proof_uploaded_at,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


def _assert_guest(user: User) -> None:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can manage payments")


def _assert_admin(user: User) -> None:
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can verify payments")


def _assert_authorized_to_view(payment: Payment, user: User) -> None:
    if payment.guest_id == user.id:
        return
    if payment.host_id == user.id:
        return
    if user.role == UserRole.ADMIN:
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
    return await compute_booking_quote(
        session, unit_id, check_in.isoformat(), check_out.isoformat(), listing, nights
    )


async def compute_booking_quote(
    session: AsyncSession,
    unit_id: str,
    check_in: str,
    check_out: str,
    listing: UnitListing,
    nights: int,
) -> BookingQuote:
    """Single source of truth for guest pricing: nightly base + cleaning fee
    + the V1 guest service fee (waived while the alpha free-booking
    incentive still applies). Shared by the quote endpoint and payment
    creation so clients never have to guess the total."""
    accommodation_egp = listing.base_price_egp * nights
    cleaning_fee_egp = listing.cleaning_fee_egp or 0
    subtotal = accommodation_egp + cleaning_fee_egp

    global_completed = await bookings_repository.count_global_completed_bookings(session)
    waived = global_completed < settings.ALPHA_GUEST_FREE_BOOKINGS
    service_fee_egp = 0 if waived else int(round(subtotal * settings.GUEST_SERVICE_FEE_PCT))

    return BookingQuote(
        unit_id=unit_id,
        check_in=check_in,
        check_out=check_out,
        nights=nights,
        nightly_rate_egp=listing.base_price_egp,
        accommodation_egp=accommodation_egp,
        cleaning_fee_egp=cleaning_fee_egp,
        service_fee_egp=service_fee_egp,
        service_fee_waived=waived,
        total_egp=subtotal + service_fee_egp,
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
    subtotal = quote.accommodation_egp + quote.cleaning_fee_egp
    guest_fee = quote.service_fee_egp
    amount = quote.total_egp

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
        guest_service_fee_egp=guest_fee,
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


async def get_payment(
    session: AsyncSession, user: User, payment_id: str
) -> PaymentResponse:
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    _assert_authorized_to_view(payment, user)
    return _to_response(payment)


async def get_payment_by_booking(
    session: AsyncSession, user: User, booking_id: str
) -> PaymentResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    if booking.guest_id != user.id and user.role != UserRole.ADMIN:
        unit = booking.unit
        if unit is None or unit.host_id != user.id:
            raise AuthorizationError("Not authorized to view this booking")

    payment = await payments_repository.get_payment_by_booking(session, booking_id)
    if payment is None:
        raise NotFoundError("Payment not found for this booking")
    return _to_response(payment)


async def presign_proof_upload(
    session: AsyncSession,
    user: User,
    payment_id: str,
    filename: str,
    content_type: str,
) -> PaymentProofPresignResponse:
    await auth_dependencies.require_kyc_verified(user)
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id and user.role != UserRole.ADMIN:
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
    if payment.guest_id != user.id and user.role != UserRole.ADMIN:
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

    return _to_response(updated)


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

    return _to_response(updated)


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
