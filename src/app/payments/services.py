import uuid
from datetime import UTC, datetime
from typing import Any

import boto3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.listings import repository as listings_repository
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.shared.models import OutboxEvent

from . import repository as payments_repository
from .constants import PaymentStatus
from .models import Payment
from .schemas import (
    PaymentListItem,
    PaymentProofPresignResponse,
    PaymentResponse,
)

_PROOF_UPLOAD_TTL_SECONDS = 900


def _manual_instructions_ar(account_number: str, vodafone_number: str) -> str:
    return (
        "لإتمام عملية الحجز، يرجى تحويل المبلغ المطلوب إلى الحساب التالي:\n"
        "بنك مصر\n"
        f"رقم الحساب: {account_number}\n"
        "اسم الحساب: StayOS\n"
        f"أو عبر فودافون كاش على الرقم: {vodafone_number}\n\n"
        "بعد التحويل، يرجى رفع إيصال الدفع (صورة أو PDF) من هذه الصفحة.\n"
        "سيتم مراجعة الدفع خلال 24 ساعة وتأكيد حجزك."
    )


def _manual_instructions_en(account_number: str, vodafone_number: str) -> str:
    return (
        "To complete your booking, please transfer the required amount to:\n"
        "Bank of Egypt\n"
        f"Account Number: {account_number}\n"
        "Account Name: StayOS\n"
        f"Or via Vodafone Cash to: {vodafone_number}\n\n"
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
    account_number = settings.PAYMENT_BANK_ACCOUNT_NUMBER
    vodafone_number = settings.PAYMENT_VODAFONE_CASH_NUMBER
    if locale == "ar":
        return _manual_instructions_ar(account_number, vodafone_number)
    return _manual_instructions_en(account_number, vodafone_number)


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
        nights=payment.nights,
        reference_number=payment.reference_number,
        proof_s3_key=payment.proof_s3_key,
        proof_url=payment.proof_url,
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
        proof_url=payment.proof_url,
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
    subtotal = listing.base_price_egp * nights
    if listing.cleaning_fee_egp:
        subtotal += listing.cleaning_fee_egp

    from app.bookings import repository as bookings_repository

    global_completed = await bookings_repository.count_global_completed_bookings(session)
    if global_completed < settings.ALPHA_GUEST_FREE_BOOKINGS:
        guest_fee = 0
    else:
        guest_fee = int(round(subtotal * settings.GUEST_SERVICE_FEE_PCT))
    amount = subtotal + guest_fee

    instructions = _build_instructions(guest.locale or "ar")
    reference = _generate_reference()

    payment = await payments_repository.create_payment(
        session,
        booking_id=booking.id,
        guest_id=booking.guest_id,
        host_id=unit.host_id,
        unit_id=booking.unit_id,
        amount_egp=amount,
        nights=nights,
        reference_number=reference,
        instructions=instructions,
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
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the guest or admin can upload proof")

    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        raise ValidationError(
            "Proof can only be uploaded when payment is pending or rejected"
        )

    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if content_type not in allowed_types:
        raise ValidationError("Only JPG, PNG, WebP images or PDF files are accepted")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    proof_key = f"payments/{payment.id}/proof_{uuid.uuid4().hex}.{ext}"

    client = _s3_client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_LISTINGS_BUCKET,
            "Key": proof_key,
            "ContentType": content_type,
        },
        ExpiresIn=_PROOF_UPLOAD_TTL_SECONDS,
    )

    return PaymentProofPresignResponse(upload_url=upload_url, proof_key=proof_key)


async def upload_proof(
    session: AsyncSession,
    user: User,
    payment_id: str,
    s3_key: str,
    url: str,
) -> PaymentResponse:
    payment = await payments_repository.get_payment_or_raise(session, payment_id)
    if payment.guest_id != user.id:
        raise AuthorizationError("Only the guest can upload payment proof")

    if payment.status not in (PaymentStatus.PENDING, PaymentStatus.REJECTED):
        raise ValidationError(
            "Proof can only be uploaded when payment is pending or rejected"
        )

    now = datetime.now(UTC)
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.PROOF_UPLOADED,
        proof_s3_key=s3_key,
        proof_url=url,
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
    updated = await payments_repository.update_payment(
        session,
        payment,
        status=PaymentStatus.PENDING,
        rejected_at=now,
        rejected_by=user.id,
        reject_reason=reject_reason,
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
            "guest_name": guest_user.display_name if guest_user else "Guest",
            "guest_phone": guest_user.phone_number if guest_user else None,
            "guest_email": guest_user.email if guest_user else None,
            "locale": guest_user.locale if guest_user else "ar",
        },
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
