import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.database import get_session
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.payments import repository as payments_repository
from app.payments import router as payments_router
from app.payments import services as payment_services
from app.payments.constants import PaymentMethod, PaymentStatus
from app.payments.models import Payment
from app.payments.schemas import PaymentListItem, PaymentProofPresignResponse, PaymentResponse
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError


def test_build_instructions_uses_settings_payment_destination(monkeypatch) -> None:
    """The manual payment instructions must be sourced from settings (so the
    founder can swap in the real account/number via env var, without a code
    change) rather than from hardcoded literals in this module."""
    monkeypatch.setattr(
        payment_services.settings, "PAYMENT_BANK_ACCOUNT_NUMBER", "9999888877776666"
    )
    monkeypatch.setattr(
        payment_services.settings, "PAYMENT_VODAFONE_CASH_NUMBER", "01099998888"
    )

    ar = payment_services._build_instructions("ar")
    en = payment_services._build_instructions("en")

    assert "9999888877776666" in ar
    assert "01099998888" in ar
    assert "9999888877776666" in en
    assert "01099998888" in en


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_unit(
    unit_id: str = "unit-1",
    host_id: str = "host-1",
) -> Unit:
    return Unit(
        id=unit_id,
        host_id=host_id,
        property_type="APARTMENT",
        status=UnitStatus.LISTED,
        coordinates=WKTElement("POINT(31.0 30.0)", srid=4326),
        governorate="Cairo",
        city="Cairo",
        district=None,
        google_place_id=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
    )


def _make_listing(unit: Unit) -> UnitListing:
    return UnitListing(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        title_ar="شقة فاخرة",
        title_en="Luxury apartment",
        description_ar="وصف",
        description_en="Description",
        country="Egypt",
        category="ENTIRE_PLACE",
        amenities=["wifi"],
        cultural_tags=[],
        house_rules="No smoking",
        check_in_instructions="Key under mat",
        policies="",
        base_price_egp=500,
        cleaning_fee_egp=50,
        currency="EGP",
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        cover_photo_id=None,
    )


def _make_booking(
    unit: Unit,
    guest: User,
    status: BookingStatus = BookingStatus.ACCEPTED,
) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status=str(status),
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        accepted_at=now,
        created_at=now,
        updated_at=now,
        unit=unit,
    )


def _make_payment(
    booking: Booking,
    guest: User,
    host: User,
    status: PaymentStatus = PaymentStatus.PENDING,
) -> Payment:
    now = datetime.now(UTC)
    return Payment(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        guest_id=guest.id,
        host_id=host.id,
        unit_id=booking.unit_id,
        status=str(status),
        method=str(PaymentMethod.MANUAL),
        amount_egp=2050,
        nights=4,
        reference_number="STY-ABCDEFGH",
        proof_s3_key=None,
        proof_url=None,
        proof_uploaded_at=None,
        verified_at=None,
        verified_by=None,
        rejected_at=None,
        rejected_by=None,
        reject_reason=None,
        cancelled_at=None,
        instructions="Transfer instructions",
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_create_payment_for_booking_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit)
    booking = _make_booking(unit, guest)

    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        "app.payments.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.payments.services.payments_repository.create_payment",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        "app.bookings.repository.count_global_completed_bookings",
        AsyncMock(return_value=0),
    )

    result = await payment_services.create_payment_for_booking(fake_session, booking, guest)
    assert result.status == PaymentStatus.PENDING
    assert result.amount_egp == 2050  # 500*4 + 50, no guest fee (Alpha)
    assert result.reference_number.startswith("STY-")


@pytest.mark.asyncio
async def test_create_payment_idempotent(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    existing = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_by_booking",
        AsyncMock(return_value=existing),
    )

    result = await payment_services.create_payment_for_booking(fake_session, booking, guest)
    assert result.id == existing.id


@pytest.mark.asyncio
async def test_get_payment_authorized_guest(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    result = await payment_services.get_payment(fake_session, guest, payment.id)
    assert result.id == payment.id


@pytest.mark.asyncio
async def test_get_payment_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    with pytest.raises(AuthorizationError):
        await payment_services.get_payment(fake_session, other, payment.id)


@pytest.mark.asyncio
async def test_presign_proof_guest_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/upload"
    monkeypatch.setattr("app.payments.services._s3_client", lambda: mock_client)

    result = await payment_services.presign_proof_upload(
        fake_session, guest, payment.id, "receipt.jpg", "image/jpeg"
    )
    assert result.upload_url == "https://s3.example.com/upload"
    assert "proof_" in result.proof_key


@pytest.mark.asyncio
async def test_presign_proof_wrong_status(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.VERIFIED)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    with pytest.raises(ValidationError):
        await payment_services.presign_proof_upload(
            fake_session, guest, payment.id, "receipt.jpg", "image/jpeg"
        )


@pytest.mark.asyncio
async def test_presign_proof_invalid_content_type(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    with pytest.raises(ValidationError):
        await payment_services.presign_proof_upload(
            fake_session, guest, payment.id, "receipt.txt", "text/plain"
        )


@pytest.mark.asyncio
async def test_upload_proof_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    updated_payment = _make_payment(booking, guest, host, status=PaymentStatus.PROOF_UPLOADED)
    updated_payment.proof_s3_key = "payments/xxx/proof_abc.jpg"
    updated_payment.proof_url = "https://s3.example.com/payments/xxx/proof_abc.jpg"

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        "app.payments.services.payments_repository.update_payment",
        AsyncMock(return_value=updated_payment),
    )

    mock_execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = guest
    mock_execute.return_value = mock_result
    fake_session.execute = mock_execute

    result = await payment_services.upload_proof(
        fake_session, guest, payment.id, "payments/xxx/proof_abc.jpg", "https://s3.example.com/payments/xxx/proof_abc.jpg"
    )
    assert result.status == PaymentStatus.PROOF_UPLOADED


@pytest.mark.asyncio
async def test_upload_proof_wrong_user(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    with pytest.raises(AuthorizationError):
        await payment_services.upload_proof(
            fake_session, other, payment.id, "key", "url"
        )


@pytest.mark.asyncio
async def test_verify_payment_success(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.PROOF_UPLOADED)

    verified_payment = _make_payment(booking, guest, host, status=PaymentStatus.VERIFIED)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        "app.payments.services.payments_repository.update_payment",
        AsyncMock(return_value=verified_payment),
    )
    monkeypatch.setattr(
        "app.payments.services.bookings_repository.get_booking",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        "app.payments.services.bookings_repository.update_booking",
        AsyncMock(return_value=booking),
    )

    mock_execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = guest
    mock_execute.return_value = mock_result
    fake_session.execute = mock_execute

    result = await payment_services.verify_payment(fake_session, admin, payment.id)
    assert result.status == PaymentStatus.VERIFIED


@pytest.mark.asyncio
async def test_verify_payment_non_admin(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await payment_services.verify_payment(fake_session, guest, "any-id")


@pytest.mark.asyncio
async def test_verify_payment_wrong_status(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.PENDING)

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )

    with pytest.raises(ValidationError):
        await payment_services.verify_payment(fake_session, admin, payment.id)


@pytest.mark.asyncio
async def test_reject_payment_success(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.PROOF_UPLOADED)

    rejected_payment = _make_payment(booking, guest, host, status=PaymentStatus.PENDING)
    rejected_payment.reject_reason = "Receipt unclear"

    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        "app.payments.services.payments_repository.update_payment",
        AsyncMock(return_value=rejected_payment),
    )

    mock_execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = guest
    mock_execute.return_value = mock_result
    fake_session.execute = mock_execute

    result = await payment_services.reject_payment(fake_session, admin, payment.id, "Receipt unclear")
    assert result.status == PaymentStatus.PENDING


@pytest.mark.asyncio
async def test_reject_payment_non_admin(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await payment_services.reject_payment(fake_session, guest, "any-id", "reason")


@pytest.mark.asyncio
async def test_list_pending_payments_admin_only(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await payment_services.list_pending_payments(fake_session, guest)


@pytest.mark.asyncio
async def test_list_guest_payments_guest_only(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST)
    with pytest.raises(AuthorizationError):
        await payment_services.list_guest_payments(fake_session, host)


@pytest.mark.asyncio
async def test_get_payment_by_booking_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)

    monkeypatch.setattr(
        "app.payments.services.bookings_repository.get_booking_or_raise",
        AsyncMock(side_effect=NotFoundError("Booking not found")),
    )

    with pytest.raises(NotFoundError):
        await payment_services.get_payment_by_booking(fake_session, guest, "nonexistent")


def test_payment_status_values() -> None:
    assert PaymentStatus.PENDING == "pending"
    assert PaymentStatus.PROOF_UPLOADED == "proof_uploaded"
    assert PaymentStatus.VERIFIED == "verified"
    assert PaymentStatus.REJECTED == "rejected"
    assert PaymentStatus.CANCELLED == "cancelled"


def test_payment_method_values() -> None:
    assert PaymentMethod.MANUAL == "manual"


# ============================================================
# SERVICES COVERAGE
# ============================================================

def test_s3_client_initializes_boto3_client(monkeypatch) -> None:
    mock_client = MagicMock()
    monkeypatch.setattr("app.payments.services.boto3.client", mock_client)
    result = payment_services._s3_client()
    assert result is mock_client.return_value
    mock_client.assert_called_once()


def test_to_list_item() -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    item = payment_services._to_list_item(payment)
    assert item.id == payment.id


@pytest.mark.asyncio
async def test_get_payment_authorized_as_host(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    result = await payment_services.get_payment(fake_session, host, payment.id)
    assert result.id == payment.id


@pytest.mark.asyncio
async def test_get_payment_authorized_as_admin(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    result = await payment_services.get_payment(fake_session, admin, payment.id)
    assert result.id == payment.id


@pytest.mark.asyncio
async def test_create_payment_for_booking_unit_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        payment_services.listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=None),
    )
    with pytest.raises(NotFoundError):
        await payment_services.create_payment_for_booking(fake_session, booking, guest)


@pytest.mark.asyncio
async def test_create_payment_for_booking_listing_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    unit.listing = None
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        payment_services.listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    with pytest.raises(NotFoundError):
        await payment_services.create_payment_for_booking(fake_session, booking, guest)


@pytest.mark.asyncio
async def test_get_payment_by_booking_payment_missing(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    monkeypatch.setattr(
        payment_services.bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    with pytest.raises(NotFoundError):
        await payment_services.get_payment_by_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_get_payment_by_booking_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(AuthorizationError):
        await payment_services.get_payment_by_booking(fake_session, other, booking.id)


@pytest.mark.asyncio
async def test_get_payment_by_booking_authorized_as_host(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )
    result = await payment_services.get_payment_by_booking(fake_session, host, booking.id)
    assert result.id == payment.id


@pytest.mark.asyncio
async def test_presign_proof_upload_as_admin(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    s3_client = MagicMock()
    s3_client.generate_presigned_url = MagicMock(return_value="https://s3.example.com/upload")
    monkeypatch.setattr(payment_services, "_s3_client", MagicMock(return_value=s3_client))
    result = await payment_services.presign_proof_upload(
        fake_session, admin, payment.id, "receipt.jpg", "image/jpeg"
    )
    assert result.upload_url == "https://s3.example.com/upload"


@pytest.mark.asyncio
async def test_presign_proof_upload_unauthorized_host_raises(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    other_host = _make_user(user_id="host-2", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(AuthorizationError):
        await payment_services.presign_proof_upload(
            fake_session, other_host, payment.id, "receipt.jpg", "image/jpeg"
        )


@pytest.mark.asyncio
async def test_upload_proof_wrong_status_raises(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.VERIFIED)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(ValidationError):
        await payment_services.upload_proof(fake_session, guest, payment.id, "key", "url")


@pytest.mark.asyncio
async def test_reject_payment_wrong_status_raises(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host, status=PaymentStatus.PENDING)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(ValidationError):
        await payment_services.reject_payment(fake_session, admin, payment.id, "bad receipt")


@pytest.mark.asyncio
async def test_list_pending_payments_success(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "list_pending_payments",
        AsyncMock(return_value=[payment]),
    )
    result = await payment_services.list_pending_payments(fake_session, admin)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_list_guest_payments_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    payment = _make_payment(booking, guest, host)
    monkeypatch.setattr(
        payment_services.payments_repository,
        "list_guest_payments",
        AsyncMock(return_value=[payment]),
    )
    result = await payment_services.list_guest_payments(fake_session, guest)
    assert len(result) == 1


# ============================================================
# ROUTER EXCEPTION COVERAGE
# ============================================================

def _assert_payment_route_returns_404(payments_client, monkeypatch, route_func_name, method, url, json=None, role=UserRole.GUEST):
    user = _make_user(role=role)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        payments_router,
        route_func_name,
        AsyncMock(side_effect=NotFoundError("missing")),
    )
    token = _token_for(user)
    caller = getattr(payments_client, method)
    kwargs = {"headers": {"Authorization": f"Bearer {token}"}}
    if json is not None:
        kwargs["json"] = json
    response = caller(url, **kwargs)
    assert response.status_code == 404


def test_get_payment_for_booking_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "get_payment_by_booking",
        "get",
        "/api/v1/payments/booking/booking-1",
    )


def test_get_payment_detail_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "get_payment",
        "get",
        "/api/v1/payments/payment-1",
    )


def test_list_my_payments_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "list_guest_payments",
        "get",
        "/api/v1/payments",
    )


def test_presign_proof_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "presign_proof_upload",
        "post",
        "/api/v1/payments/payment-1/proof/presign",
        json={"filename": "receipt.jpg", "content_type": "image/jpeg"},
    )


def test_submit_proof_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "upload_proof",
        "post",
        "/api/v1/payments/payment-1/proof",
        json={"s3_key": "key", "url": "url"},
    )


def test_verify_payment_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "verify_payment",
        "post",
        "/api/v1/payments/payment-1/verify",
        role=UserRole.ADMIN,
    )


def test_reject_payment_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "reject_payment",
        "post",
        "/api/v1/payments/payment-1/reject",
        json={"reject_reason": "bad"},
        role=UserRole.ADMIN,
    )


def test_payment_queue_route_not_found(payments_client, monkeypatch) -> None:
    _assert_payment_route_returns_404(
        payments_client,
        monkeypatch,
        "list_pending_payments",
        "get",
        "/api/v1/payments/admin/queue",
        role=UserRole.ADMIN,
    )


# ============================================================
# REPOSITORY COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_create_payment(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    payment = await payments_repository.create_payment(
        fake_session,
        booking_id="booking-1",
        guest_id="guest-1",
        host_id="host-1",
        unit_id="unit-1",
        amount_egp=2050,
        nights=4,
        reference_number="STY-ABCDEFGH",
        instructions="Transfer instructions",
    )
    assert payment.booking_id == "booking-1"
    assert payment.status == PaymentStatus.PENDING
    assert fake_session.add.called
    assert fake_session.flush.await_count == 1


@pytest.mark.asyncio
async def test_get_payment(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = payment
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.get_payment(fake_session, payment.id)
    assert result == payment


@pytest.mark.asyncio
async def test_get_payment_or_raise_found(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = payment
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.get_payment_or_raise(fake_session, payment.id)
    assert result == payment


@pytest.mark.asyncio
async def test_get_payment_or_raise_not_found(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    fake_session.execute = AsyncMock(return_value=mock_result)
    with pytest.raises(NotFoundError):
        await payments_repository.get_payment_or_raise(fake_session, "missing")


@pytest.mark.asyncio
async def test_get_payment_by_booking(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = payment
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.get_payment_by_booking(fake_session, payment.booking_id)
    assert result == payment


@pytest.mark.asyncio
async def test_update_payment(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    result = await payments_repository.update_payment(
        fake_session, payment, status=PaymentStatus.VERIFIED, verified_by="admin-1"
    )
    assert result.status == PaymentStatus.VERIFIED
    assert result.verified_by == "admin-1"
    assert fake_session.add.called


@pytest.mark.asyncio
async def test_list_pending_payments_default_status(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [payment]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.list_pending_payments(fake_session)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_list_pending_payments_with_status(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    payment.status = PaymentStatus.VERIFIED
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [payment]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.list_pending_payments(fake_session, status=PaymentStatus.VERIFIED)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_list_guest_payments(fake_session: AsyncMock) -> None:
    payment = _make_payment(_make_booking(_make_unit(), _make_user()), _make_user(), _make_user(user_id="host-1", role=UserRole.HOST))
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [payment]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await payments_repository.list_guest_payments(fake_session, payment.guest_id)
    assert len(result) == 1


# ============================================================
# ROUTER COVERAGE
# ============================================================

def _make_payment_response() -> PaymentResponse:
    now = datetime.now(UTC)
    return PaymentResponse(
        id=str(uuid.uuid4()),
        booking_id="booking-1",
        guest_id="guest-1",
        host_id="host-1",
        unit_id="unit-1",
        status=PaymentStatus.PENDING,
        method=PaymentMethod.MANUAL,
        amount_egp=2050,
        nights=4,
        reference_number="STY-ABCDEFGH",
        proof_s3_key=None,
        proof_url=None,
        proof_uploaded_at=None,
        verified_at=None,
        verified_by=None,
        rejected_at=None,
        rejected_by=None,
        reject_reason=None,
        cancelled_at=None,
        instructions="Transfer instructions",
        created_at=now,
        updated_at=now,
    )


def _make_payment_list_item() -> PaymentListItem:
    now = datetime.now(UTC)
    return PaymentListItem(
        id=str(uuid.uuid4()),
        booking_id="booking-1",
        guest_id="guest-1",
        host_id="host-1",
        unit_id="unit-1",
        status=PaymentStatus.PENDING,
        method=PaymentMethod.MANUAL,
        amount_egp=2050,
        reference_number="STY-ABCDEFGH",
        proof_url=None,
        proof_uploaded_at=None,
        created_at=now,
        updated_at=now,
    )


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override():
        yield fake_session

    return _override


@pytest.fixture
def payments_client(client, fake_session):
    client.app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    client.app.dependency_overrides.pop(get_session, None)


def test_get_payment_for_booking_route(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    monkeypatch.setattr(
        payments_router, "get_payment_by_booking", AsyncMock(return_value=_make_payment_response())
    )
    token = _token_for(guest)
    response = payments_client.get(
        "/api/v1/payments/booking/booking-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["booking_id"] == "booking-1"


def test_get_payment_detail_route(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    payment = _make_payment_response()
    monkeypatch.setattr(
        payments_router, "get_payment", AsyncMock(return_value=payment)
    )
    token = _token_for(guest)
    response = payments_client.get(
        f"/api/v1/payments/{payment.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == payment.id


def test_list_my_payments_route(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    monkeypatch.setattr(
        payments_router, "list_guest_payments", AsyncMock(return_value=[_make_payment_list_item()])
    )
    token = _token_for(guest)
    response = payments_client.get(
        "/api/v1/payments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_presign_proof_route(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    payment_id = str(uuid.uuid4())
    monkeypatch.setattr(
        payments_router, "presign_proof_upload",
        AsyncMock(return_value=PaymentProofPresignResponse(upload_url="https://s3.example.com/upload", proof_key="proof_abc")),
    )
    token = _token_for(guest)
    response = payments_client.post(
        f"/api/v1/payments/{payment_id}/proof/presign",
        json={"filename": "receipt.jpg", "content_type": "image/jpeg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["upload_url"] == "https://s3.example.com/upload"


def test_submit_proof_route(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    payment_id = str(uuid.uuid4())
    monkeypatch.setattr(
        payments_router, "upload_proof", AsyncMock(return_value=_make_payment_response())
    )
    token = _token_for(guest)
    response = payments_client.post(
        f"/api/v1/payments/{payment_id}/proof",
        json={"s3_key": "payments/xxx/proof_abc.jpg", "url": "https://s3.example.com/payments/xxx/proof_abc.jpg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_verify_payment_route(payments_client, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, admin)
    payment_id = str(uuid.uuid4())
    monkeypatch.setattr(
        payments_router, "verify_payment", AsyncMock(return_value=_make_payment_response())
    )
    token = _token_for(admin)
    response = payments_client.post(
        f"/api/v1/payments/{payment_id}/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_reject_payment_route(payments_client, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, admin)
    payment_id = str(uuid.uuid4())
    monkeypatch.setattr(
        payments_router, "reject_payment", AsyncMock(return_value=_make_payment_response())
    )
    token = _token_for(admin)
    response = payments_client.post(
        f"/api/v1/payments/{payment_id}/reject",
        json={"reject_reason": "Receipt unclear"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_payment_queue_route(payments_client, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, admin)
    monkeypatch.setattr(
        payments_router, "list_pending_payments", AsyncMock(return_value=[_make_payment_list_item()])
    )
    token = _token_for(admin)
    response = payments_client.get(
        "/api/v1/payments/admin/queue",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_payment_detail_not_found_returns_404(payments_client, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    monkeypatch.setattr(
        payments_router, "get_payment",
        AsyncMock(side_effect=NotFoundError("Payment not found")),
    )
    token = _token_for(guest)
    response = payments_client.get(
        "/api/v1/payments/missing",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
