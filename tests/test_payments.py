import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.payments import services as payment_services
from app.payments.constants import PaymentMethod, PaymentStatus
from app.payments.models import Payment
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
