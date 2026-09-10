import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings import services as booking_services
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.schemas import BookingCreate, BookingResponse, BookingUpdate
from app.config import settings
from app.database import get_session
from app.listings import repository as listings_repository
from app.listings.constants import CalendarStatus, UnitStatus
from app.listings.models import CalendarRule, Unit, UnitListing
from app.main import app
from app.payments import repository as payments_repository
from app.payments.constants import PaymentStatus
from app.payments.models import Payment
from app.shared.exceptions import AuthorizationError, ConflictError, ValidationError

_TODAY = datetime.now(UTC).date()
_FUTURE_1 = _TODAY + timedelta(days=30)
_FUTURE_2 = _TODAY + timedelta(days=34)
_FUTURE_3 = _TODAY + timedelta(days=40)
_FUTURE_4 = _TODAY + timedelta(days=44)


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
    status: UnitStatus = UnitStatus.LISTED,
    max_guests: int = 4,
) -> Unit:
    unit = Unit(
        id=unit_id,
        host_id=host_id,
        property_type="APARTMENT",
        status=status,
        coordinates=WKTElement("POINT(31.0 30.0)", srid=4326),
        governorate="Cairo",
        city="Cairo",
        district=None,
        google_place_id=None,
        max_guests=max_guests,
        bedrooms=2,
        bathrooms=1,
    )
    unit.listing = _make_listing(unit_id=unit_id)
    return unit


def _make_booking(
    unit: Unit,
    guest: User,
    status: BookingStatus = BookingStatus.REQUESTED,
    **kwargs: object,
) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=kwargs.get("id") or str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status=str(status),
        check_in=kwargs.get("check_in") or _FUTURE_1,
        check_out=kwargs.get("check_out") or _FUTURE_2,
        adults=kwargs.get("adults") or 2,
        children=kwargs.get("children") or 0,
        infants=kwargs.get("infants") or 0,
        requested_at=kwargs.get("requested_at") or now,
        created_at=kwargs.get("created_at") or now,
        updated_at=kwargs.get("updated_at") or now,
        checked_in_at=kwargs.get("checked_in_at"),
        checked_out_at=kwargs.get("checked_out_at"),
        unit=unit,
    )


def _make_listing(unit_id: str = "unit-1") -> UnitListing:
    return UnitListing(
        id=str(uuid.uuid4()),
        unit_id=unit_id,
        title_ar="شقة",
        title_en="Test Apartment",
        description_ar="وصف",
        description_en="Desc",
        amenities=["WIFI"],
        cultural_tags=[],
        house_rules="No smoking.",
        check_in_instructions="Lockbox code: 4821.",
        base_price_egp=1000,
        cancellation_policy="FLEXIBLE",
        min_nights=1,
        max_nights=30,
    )


def _make_payment(
    booking: Booking,
    status: PaymentStatus = PaymentStatus.VERIFIED,
    amount_egp: int = 3000,
) -> Payment:
    return Payment(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        guest_id=booking.guest_id,
        host_id=booking.unit.host_id,
        unit_id=booking.unit_id,
        status=str(status),
        amount_egp=amount_egp,
        nights=3,
        reference_number="STY-TEST01",
        instructions="",
    )


def _stub_user_lookup(fake_session: AsyncMock, user: User | None) -> None:
    """Make `session.execute(select(User)...)` resolve to `user`.

    Mirrors the pattern used in tests/test_payments.py for the same
    services-layer `select(User).where(...)` lookup.
    """
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    fake_session.execute = AsyncMock(return_value=mock_result)


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def bookings_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


async def _apply_booking_update(_session: object, booking: Booking, **kwargs: object) -> Booking:
    for key, value in kwargs.items():
        setattr(booking, key, value)
    return booking


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


@pytest.mark.asyncio
async def test_create_booking_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        bookings_repository,
        "list_overlapping_bookings",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        bookings_repository,
        "create_booking",
        AsyncMock(return_value=booking),
    )

    # The messaging repository path queries for an existing conversation;
    # configure a realistic async result so the lookup returns a conversation
    # and avoids the unconfigured AsyncMock `scalar_one_or_none()` path.
    conversation_result = MagicMock()
    conversation_result.scalar_one_or_none.return_value = MagicMock()
    fake_session.execute = AsyncMock(return_value=conversation_result)

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_3,
        check_out=_FUTURE_4,
        adults=2,
        children=0,
        infants=0,
    )
    response = await booking_services.create_booking(fake_session, guest, request)
    assert response.guest_id == guest.id
    assert response.status == BookingStatus.REQUESTED
    assert response.host_id == host.id


@pytest.mark.asyncio
async def test_create_booking_rejects_non_guest(fake_session: AsyncMock) -> None:
    host = _make_user(role=UserRole.HOST)
    request = BookingCreate(
        unit_id="unit-1",
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
    )
    with pytest.raises(AuthorizationError):
        await booking_services.create_booking(fake_session, host, request)


@pytest.mark.asyncio
async def test_create_booking_rejects_unverified_kyc(fake_session: AsyncMock) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.UNVERIFIED)
    request = BookingCreate(
        unit_id="unit-1",
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
    )
    with pytest.raises(ValidationError, match="KYC verification required"):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_rejects_pending_kyc(fake_session: AsyncMock) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.PENDING)
    request = BookingCreate(
        unit_id="unit-1",
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
    )
    with pytest.raises(ValidationError, match="KYC verification required"):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_past_check_in(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    request = BookingCreate(
        unit_id=unit.id,
        check_in=date(2020, 8, 1),
        check_out=date(2020, 8, 5),
    )
    with pytest.raises(ValidationError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_unit_not_listed(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit(status=UnitStatus.PENDING_VERIFICATION)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
    )
    with pytest.raises(ValidationError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_exceeds_capacity(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit(max_guests=2)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
        adults=3,
    )
    with pytest.raises(ValidationError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_conflict(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    existing_guest = _make_user(user_id="other-guest")
    existing_booking = _make_booking(unit, existing_guest)

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        bookings_repository,
        "list_overlapping_bookings",
        AsyncMock(return_value=[existing_booking]),
    )

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_3,
        check_out=_FUTURE_4,
    )
    with pytest.raises(ConflictError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_get_booking_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    response = await booking_services.get_booking(fake_session, guest, booking.id)
    assert response.id == booking.id


@pytest.mark.asyncio
async def test_get_booking_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other = _make_user(user_id="other-guest")
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    with pytest.raises(AuthorizationError):
        await booking_services.get_booking(fake_session, other, booking.id)


@pytest.mark.asyncio
async def test_update_booking_accept(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        bookings_repository,
        "update_booking",
        _apply_booking_update,
    )
    monkeypatch.setattr(
        "app.payments.services.create_payment_for_booking",
        AsyncMock(return_value=None),
    )

    request = BookingUpdate(status=BookingStatus.ACCEPTED)
    response = await booking_services.update_booking(
        fake_session, host, booking.id, request
    )
    assert response.status == BookingStatus.ACCEPTED


@pytest.mark.asyncio
async def test_update_booking_reject(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        bookings_repository,
        "update_booking",
        _apply_booking_update,
    )

    request = BookingUpdate(status=BookingStatus.REJECTED, reject_reason="Not available")
    response = await booking_services.update_booking(
        fake_session, host, booking.id, request
    )
    assert response.status == BookingStatus.REJECTED


@pytest.mark.asyncio
async def test_update_booking_cancel_by_guest(fake_session: AsyncMock, monkeypatch) -> None:
    # PATCH with status=cancelled must delegate to the real cancellation
    # service (refund calculation, payment settlement, event) rather than
    # doing a bare status update.
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REQUESTED)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        bookings_repository,
        "update_booking",
        _apply_booking_update,
    )
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=None)
    )
    monkeypatch.setattr("app.bookings.services.write_event", AsyncMock())
    _stub_user_lookup(fake_session, guest)

    request = BookingUpdate(status=BookingStatus.CANCELLED, cancel_reason="Change of plans")
    response = await booking_services.update_booking(
        fake_session, guest, booking.id, request
    )
    assert response.status == BookingStatus.CANCELLED
    assert response.cancelled_by == guest.id


# ---------------------------------------------------------------------------
# cancel_booking / preview_booking_cancellation — real lifecycle behavior
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cancel_booking_no_payment_yet_has_no_refund(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REQUESTED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=None)
    )
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id, "changed my mind")

    assert result.status == BookingStatus.CANCELLED
    assert result.cancelled_by == guest.id
    assert result.cancel_reason == "changed my mind"
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 0
    assert payload["refund_policy_applied"] == "NO_PAYMENT_COLLECTED"


@pytest.mark.asyncio
async def test_cancel_booking_guest_grace_period_full_refund(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    # Cancelled minutes after requesting, even though check-in is close
    # enough that it would normally be a partial/no refund.
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=2),
        check_out=_TODAY + timedelta(days=5),
        requested_at=datetime.now(UTC),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3000)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )
    update_payment_mock = AsyncMock(side_effect=lambda _s, p, **kw: _apply_kwargs(p, kw))
    monkeypatch.setattr(payments_repository, "update_payment", update_payment_mock)
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    assert payment.status == PaymentStatus.REFUND_PENDING
    assert payment.refund_amount_egp == 3000
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 3000
    assert payload["refund_policy_applied"] == "FULL_REFUND"
    assert payload["refund_days"] == settings.REFUND_PROCESSING_DAYS


@pytest.mark.asyncio
async def test_cancel_booking_guest_late_cancellation_forfeits_payment(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,  # check-in today: well past both refund windows
        check_out=_TODAY + timedelta(days=3),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3000)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )
    update_payment_mock = AsyncMock(side_effect=lambda _s, p, **kw: _apply_kwargs(p, kw))
    monkeypatch.setattr(payments_repository, "update_payment", update_payment_mock)
    monkeypatch.setattr("app.bookings.services.write_event", AsyncMock())
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    # No silent financial mutation: nothing was refunded, so the payment
    # must not be relabeled REFUND_PENDING/REFUNDED.
    assert payment.status == PaymentStatus.VERIFIED
    assert not update_payment_mock.called


@pytest.mark.asyncio
async def test_cancel_booking_host_initiated_always_fully_refunds_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    # Same "should be zero refund" window as the test above, but this time
    # the HOST cancels — the guest must never be charged for a cancellation
    # they didn't choose.
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
        check_out=_TODAY + timedelta(days=3),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3000)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )
    update_payment_mock = AsyncMock(side_effect=lambda _s, p, **kw: _apply_kwargs(p, kw))
    monkeypatch.setattr(payments_repository, "update_payment", update_payment_mock)
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.cancel_booking(fake_session, host, booking.id, "double booked")

    assert result.status == BookingStatus.CANCELLED
    assert result.cancelled_by == host.id
    assert payment.status == PaymentStatus.REFUND_PENDING
    assert payment.refund_amount_egp == 3000
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["cancelled_by"] == "host"
    assert payload["refund_amount_egp"] == 3000


@pytest.mark.asyncio
async def test_cancel_booking_unverified_payment_is_cancelled_not_refunded(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A pending/unverified payment never collected real money."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.ACCEPTED)
    payment = _make_payment(booking, status=PaymentStatus.PENDING, amount_egp=3000)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )
    update_payment_mock = AsyncMock(side_effect=lambda _s, p, **kw: _apply_kwargs(p, kw))
    monkeypatch.setattr(payments_repository, "update_payment", update_payment_mock)
    monkeypatch.setattr("app.bookings.services.write_event", AsyncMock())
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    assert payment.status == PaymentStatus.CANCELLED


@pytest.mark.asyncio
async def test_cancel_booking_rejects_already_cancelled(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CANCELLED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.cancel_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_cancel_booking_rejects_unrelated_user(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other_guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REQUESTED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(AuthorizationError):
        await booking_services.cancel_booking(fake_session, other_guest, booking.id)


@pytest.mark.asyncio
async def test_preview_booking_cancellation_matches_actual_cancel(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=2),
        check_out=_TODAY + timedelta(days=5),
        requested_at=datetime.now(UTC),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3000)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )

    preview = await booking_services.preview_booking_cancellation(fake_session, guest, booking.id)

    assert preview.cancellable is True
    assert preview.cancelled_by == "guest"
    assert preview.total_paid_egp == 3000
    assert preview.refund_amount_egp == 3000
    assert preview.refund_policy_applied == "FULL_REFUND"
    # The preview must not mutate anything.
    assert booking.status == str(BookingStatus.CONFIRMED)
    assert payment.status == PaymentStatus.VERIFIED


def _apply_kwargs(obj: object, kwargs: dict) -> object:
    for key, value in kwargs.items():
        setattr(obj, key, value)
    return obj


@pytest.mark.asyncio
async def test_update_booking_guest_cannot_accept(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    request = BookingUpdate(status=BookingStatus.ACCEPTED)
    with pytest.raises(AuthorizationError):
        await booking_services.update_booking(
            fake_session, guest, booking.id, request
        )


@pytest.mark.asyncio
async def test_update_booking_invalid_transition(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REJECTED)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    request = BookingUpdate(status=BookingStatus.ACCEPTED)
    with pytest.raises(ValidationError):
        await booking_services.update_booking(
            fake_session, host, booking.id, request
        )


def _make_booking_response(status: str = "requested") -> BookingResponse:
    now = datetime.now(UTC)
    return BookingResponse(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        host_id="host-1",
        status=status,
        stay_phase="upcoming",
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        accepted_at=None,
        rejected_at=None,
        cancelled_at=None,
        reject_reason=None,
        cancel_reason=None,
        created_at=now,
        updated_at=now,
    )


def test_create_booking_route(bookings_client: TestClient, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_booking_response()
    monkeypatch.setattr(
        "app.bookings.router.create_booking",
        AsyncMock(return_value=response_model),
    )

    token = _token_for(guest)
    response = bookings_client.post(
        "/api/v1/bookings",
        json={
            "unit_id": "unit-1",
            "check_in": "2026-08-01",
            "check_out": "2026-08-05",
            "adults": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == response_model.id


def test_get_booking_route(bookings_client: TestClient, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_booking_response()
    monkeypatch.setattr(
        "app.bookings.router.get_booking",
        AsyncMock(return_value=response_model),
    )

    token = _token_for(guest)
    response = bookings_client.get(
        f"/api/v1/bookings/{response_model.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_update_booking_route(bookings_client: TestClient, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_booking_response(status="accepted")
    monkeypatch.setattr(
        "app.bookings.router.update_booking",
        AsyncMock(return_value=response_model),
    )

    token = _token_for(guest)
    response = bookings_client.patch(
        f"/api/v1/bookings/{response_model.id}",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_create_booking_route_rejects_unauthenticated(bookings_client: TestClient) -> None:
    response = bookings_client.post(
        "/api/v1/bookings",
        json={
            "unit_id": "unit-1",
            "check_in": "2026-08-01",
            "check_out": "2026-08-05",
            "adults": 2,
        },
    )
    assert response.status_code == 401


def test_get_booking_route_rejects_unauthenticated(bookings_client: TestClient) -> None:
    response = bookings_client.get("/api/v1/bookings/123")
    assert response.status_code == 401


def test_update_booking_route_rejects_unauthenticated(bookings_client: TestClient) -> None:
    response = bookings_client.patch(
        "/api/v1/bookings/123", json={"status": "accepted"}
    )
    assert response.status_code == 401


def test_list_host_bookings_route_allows_admin(bookings_client: TestClient, monkeypatch) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, admin)
    response_model = _make_booking_response()
    monkeypatch.setattr(
        "app.bookings.router.list_host_bookings",
        AsyncMock(return_value=[response_model]),
    )

    token = _token_for(admin)
    response = bookings_client.get(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_list_host_bookings_route_rejects_guest(bookings_client: TestClient, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)

    token = _token_for(guest)
    response = bookings_client.get(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# stay_phase / check-in / check-out / stay info
# ---------------------------------------------------------------------------


def test_compute_stay_phase_upcoming_before_check_in() -> None:
    unit = _make_unit()
    guest = _make_user(role=UserRole.GUEST)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=5)
    )
    assert booking_services._compute_stay_phase(booking) == "upcoming"


def test_compute_stay_phase_check_in_ready_on_arrival_day() -> None:
    unit = _make_unit()
    guest = _make_user(role=UserRole.GUEST)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY, check_out=_TODAY + timedelta(days=3)
    )
    assert booking_services._compute_stay_phase(booking) == "check_in_ready"


def test_compute_stay_phase_checked_in_then_checkout_ready() -> None:
    unit = _make_unit()
    guest = _make_user(role=UserRole.GUEST)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=1),
        check_out=_TODAY + timedelta(days=2),
        checked_in_at=datetime.now(UTC),
    )
    assert booking_services._compute_stay_phase(booking) == "checked_in"

    booking.check_out = _TODAY
    assert booking_services._compute_stay_phase(booking) == "checkout_ready"


def test_compute_stay_phase_cancelled_rejected_completed() -> None:
    unit = _make_unit()
    guest = _make_user(role=UserRole.GUEST)
    for status, expected in [
        (BookingStatus.CANCELLED, "cancelled"),
        (BookingStatus.REJECTED, "rejected"),
        (BookingStatus.COMPLETED, "completed"),
    ]:
        booking = _make_booking(unit, guest, status=status)
        assert booking_services._compute_stay_phase(booking) == expected


@pytest.mark.asyncio
async def test_check_in_booking_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)

    result = await booking_services.check_in_booking(fake_session, guest, booking.id)

    assert result.stay_phase == "checked_in"
    assert result.checked_in_at is not None
    write_event_mock.assert_awaited_once()
    assert write_event_mock.call_args.kwargs["event_type"] == "booking.checked_in"


@pytest.mark.asyncio
async def test_check_in_booking_too_early(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=3)
    )
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.check_in_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_check_in_booking_duplicate(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
        checked_in_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.check_in_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_check_in_booking_wrong_status(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REQUESTED, check_in=_TODAY)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.check_in_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_check_in_booking_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other_guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(AuthorizationError):
        await booking_services.check_in_booking(fake_session, other_guest, booking.id)


@pytest.mark.asyncio
async def test_check_out_booking_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=1),
        checked_in_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)

    result = await booking_services.check_out_booking(fake_session, guest, booking.id)

    assert result.stay_phase == "checked_out"
    assert result.checked_out_at is not None
    assert write_event_mock.call_args.kwargs["event_type"] == "booking.checked_out"


@pytest.mark.asyncio
async def test_check_out_booking_before_check_in(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.check_out_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_check_out_booking_duplicate(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=1),
        checked_in_at=datetime.now(UTC),
        checked_out_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.check_out_booking(fake_session, guest, booking.id)


def _mock_stay_info_session(fake_session: AsyncMock, host_user: User) -> None:
    coord_result = MagicMock()
    coord_result.one.return_value = MagicMock(lat=30.0, lng=31.0)
    host_result = MagicMock()
    host_result.scalar_one_or_none.return_value = host_user
    fake_session.execute = AsyncMock(side_effect=[coord_result, host_result])


@pytest.mark.asyncio
async def test_get_stay_info_arrival_gated_before_release_window(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=10)
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    _mock_stay_info_session(fake_session, host)

    result = await booking_services.get_stay_info(fake_session, guest, booking.id)

    assert result.arrival.eligible is False
    assert result.arrival.check_in_instructions is None
    assert result.host.phone is None
    # Non-sensitive info is available regardless of arrival gating.
    assert result.property.house_rules == "No smoking."


@pytest.mark.asyncio
async def test_get_stay_info_arrival_released_within_window(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=1)
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    _mock_stay_info_session(fake_session, host)

    result = await booking_services.get_stay_info(fake_session, guest, booking.id)

    assert result.arrival.eligible is True
    assert result.arrival.check_in_instructions == "Lockbox code: 4821."
    assert result.host.phone == host.phone_number


@pytest.mark.asyncio
async def test_get_stay_info_review_eligible_after_self_reported_checkout(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=3),
        checked_in_at=datetime.now(UTC),
        checked_out_at=datetime.now(UTC),
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        "app.reviews.repository.get_guest_review_by_booking", AsyncMock(return_value=None)
    )
    _mock_stay_info_session(fake_session, host)

    result = await booking_services.get_stay_info(fake_session, guest, booking.id)

    assert result.review_eligible is True


@pytest.mark.asyncio
async def test_get_stay_info_unauthorized_cross_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    other_guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CONFIRMED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(AuthorizationError):
        await booking_services.get_stay_info(fake_session, other_guest, booking.id)


# ---------------------------------------------------------------------------
# V1 cancellation tiers, service-fee retention, system cancel, no-show
# ---------------------------------------------------------------------------


def _listing_for_policy(unit: Unit, policy: str) -> UnitListing:
    listing = _make_listing(unit_id=unit.id)
    listing.cancellation_policy = policy
    listing.check_in_time = "15:00"
    return listing


def _patch_listing_lookup(monkeypatch, listing: UnitListing | None) -> None:
    fake_unit = MagicMock()
    fake_unit.listing = listing
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=fake_unit),
    )


def _patch_cancel_infra(
    fake_session: AsyncMock, monkeypatch, booking: Booking, payment: Payment | None, guest: User
) -> AsyncMock:
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )
    monkeypatch.setattr(
        payments_repository,
        "update_payment",
        AsyncMock(side_effect=lambda _s, p, **kw: _apply_kwargs(p, kw)),
    )
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)
    _stub_user_lookup(fake_session, guest)
    return write_event_mock


@pytest.mark.asyncio
async def test_cancel_booking_guest_flexible_tier_refunds_accommodation_retains_fee(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """FLEXIBLE + ≥24h before check-in: full accommodation refund, but the
    guest service fee is non-refundable (V1 policy §3)."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=10),
        check_out=_TODAY + timedelta(days=13),
        requested_at=datetime.now(UTC) - timedelta(days=5),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "FLEXIBLE"))
    write_event_mock = _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    assert payment.status == PaymentStatus.REFUND_PENDING
    assert payment.refund_amount_egp == 3000
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 3000
    assert payload["service_fee_retained_egp"] == 120
    assert payload["cancellation_policy"] == "FLEXIBLE"
    assert payload["refund_policy_applied"] == "PARTIAL_REFUND"


@pytest.mark.asyncio
async def test_cancel_booking_guest_flexible_tier_within_24h_no_refund(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """FLEXIBLE + <24h before check-in: no accommodation refund (V1 §3)."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
        check_out=_TODAY + timedelta(days=3),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "FLEXIBLE"))
    write_event_mock = _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    assert payment.status == PaymentStatus.VERIFIED
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 0
    assert payload["service_fee_retained_egp"] == 120
    assert payload["refund_policy_applied"] == "NO_REFUND"


@pytest.mark.asyncio
async def test_cancel_booking_guest_moderate_tier_boundary(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """MODERATE: full accommodation refund only at ≥5 days before check-in."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=6),
        check_out=_TODAY + timedelta(days=9),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "MODERATE"))
    _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    await booking_services.cancel_booking(fake_session, guest, booking.id)
    assert payment.refund_amount_egp == 3000

    # Same tier, inside the window → nothing refunded.
    unit2 = _make_unit(unit_id="unit-2", host_id=host.id)
    booking2 = _make_booking(
        unit2,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=3),
        check_out=_TODAY + timedelta(days=6),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment2 = _make_payment(booking2, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment2.accommodation_amount_egp = 3000
    payment2.guest_service_fee_egp = 120
    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit2, "MODERATE"))
    _patch_cancel_infra(fake_session, monkeypatch, booking2, payment2, guest)

    await booking_services.cancel_booking(fake_session, guest, booking2.id)
    assert payment2.status == PaymentStatus.VERIFIED
    assert payment2.refund_amount_egp is None


@pytest.mark.asyncio
async def test_cancel_booking_guest_strict_tier_half_refund(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """STRICT: 50% accommodation refund at ≥7 days before check-in."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=10),
        check_out=_TODAY + timedelta(days=13),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "STRICT"))
    write_event_mock = _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    result = await booking_services.cancel_booking(fake_session, guest, booking.id)

    assert result.status == BookingStatus.CANCELLED
    assert payment.status == PaymentStatus.REFUND_PENDING
    assert payment.refund_amount_egp == 1500
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 1500
    assert payload["service_fee_retained_egp"] == 120


@pytest.mark.asyncio
async def test_cancel_booking_host_cancellation_refunds_service_fee(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Host-initiated cancellation refunds 100% including the service fee
    (V1 policy §4 exception to §3)."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
        check_out=_TODAY + timedelta(days=3),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "STRICT"))
    write_event_mock = _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    await booking_services.cancel_booking(fake_session, host, booking.id, "double booked")

    assert payment.status == PaymentStatus.REFUND_PENDING
    assert payment.refund_amount_egp == 3120
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["refund_amount_egp"] == 3120
    assert payload["service_fee_retained_egp"] == 0


@pytest.mark.asyncio
async def test_cancel_booking_system_cancel_marks_system_actor(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """System cancellations (deadline expiry, proof exhaustion) record no
    user id but report cancelled_by="system" in the event payload."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.ACCEPTED)
    payment = _make_payment(booking, status=PaymentStatus.PENDING, amount_egp=3000)

    _patch_listing_lookup(monkeypatch, None)
    write_event_mock = _patch_cancel_infra(fake_session, monkeypatch, booking, payment, guest)

    updated = await booking_services.cancel_booking_system(
        fake_session, booking.id, reason="payment_deadline_expired"
    )

    assert updated.status == str(BookingStatus.CANCELLED)
    assert updated.cancelled_by is None
    assert payment.status == PaymentStatus.CANCELLED
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["cancelled_by"] == "system"
    assert payload["cancellation_reason"] == "payment_deadline_expired"


@pytest.mark.asyncio
async def test_cancel_booking_system_rejects_terminal_state(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CANCELLED)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.cancel_booking_system(
            fake_session, booking.id, reason="payment_deadline_expired"
        )


# --- mark_guest_no_show (V1 policy §7.1) ------------------------------------


def _confirmed_past_checkin_booking(unit: Unit, guest: User) -> Booking:
    return _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=1),
        check_out=_TODAY + timedelta(days=2),
        requested_at=datetime.now(UTC) - timedelta(days=10),
    )


@pytest.mark.asyncio
async def test_mark_guest_no_show_admin_success(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _confirmed_past_checkin_booking(unit, guest)
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    update_payment_mock = AsyncMock()
    monkeypatch.setattr(payments_repository, "update_payment", update_payment_mock)
    write_event_mock = AsyncMock()
    monkeypatch.setattr("app.bookings.services.write_event", write_event_mock)
    _stub_user_lookup(fake_session, guest)

    result = await booking_services.mark_guest_no_show(fake_session, admin, booking.id)

    assert result.status == BookingStatus.NO_SHOW
    # No refund: the verified payment is left untouched.
    assert payment.status == PaymentStatus.VERIFIED
    assert not update_payment_mock.called
    assert write_event_mock.call_args.kwargs["event_type"] == "booking.no_show"
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["confirmed_by"] == admin.id


@pytest.mark.asyncio
async def test_mark_guest_no_show_non_admin_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit(host_id=host.id)
    booking = _confirmed_past_checkin_booking(unit, guest)

    with pytest.raises(AuthorizationError):
        await booking_services.mark_guest_no_show(fake_session, host, booking.id)
    with pytest.raises(AuthorizationError):
        await booking_services.mark_guest_no_show(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_mark_guest_no_show_requires_confirmed_status(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.ACCEPTED)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.mark_guest_no_show(fake_session, admin, booking.id)


@pytest.mark.asyncio
async def test_mark_guest_no_show_before_checkin_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=2)
    )
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.mark_guest_no_show(fake_session, admin, booking.id)


@pytest.mark.asyncio
async def test_mark_guest_no_show_checked_in_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _confirmed_past_checkin_booking(unit, guest)
    booking.checked_in_at = datetime.now(UTC)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.mark_guest_no_show(fake_session, admin, booking.id)


@pytest.mark.asyncio
async def test_preview_exposes_policy_and_retained_fee(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY + timedelta(days=10),
        check_out=_TODAY + timedelta(days=13),
        requested_at=datetime.now(UTC) - timedelta(days=5),
    )
    payment = _make_payment(booking, status=PaymentStatus.VERIFIED, amount_egp=3120)
    payment.accommodation_amount_egp = 3000
    payment.guest_service_fee_egp = 120

    _patch_listing_lookup(monkeypatch, _listing_for_policy(unit, "FLEXIBLE"))
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=payment)
    )

    preview = await booking_services.preview_booking_cancellation(
        fake_session, guest, booking.id
    )

    assert preview.cancellation_policy == "FLEXIBLE"
    assert preview.refund_amount_egp == 3000
    assert preview.service_fee_retained_egp == 120


# --- Alpha-1 booking-aware availability / calendar integrity tests -----------


@pytest.mark.asyncio
async def test_create_booking_rejects_blocked_calendar_rule(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Host BLOCKED rules must stop a booking at the API/service layer."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    blocked_rule = CalendarRule(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        date_from=_FUTURE_1,
        date_to=_FUTURE_2,
        status=CalendarStatus.BLOCKED,
        block_type="manual",
    )

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        bookings_repository,
        "list_overlapping_bookings",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        listings_repository,
        "get_calendar_rules_in_range",
        AsyncMock(return_value=[blocked_rule]),
    )

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
        adults=2,
    )
    with pytest.raises(ConflictError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_rejects_min_nights(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Backend must enforce listing min_nights."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing.min_nights = 5

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_1 + timedelta(days=3),
        adults=2,
    )
    with pytest.raises(ValidationError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_rejects_max_nights(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Backend must enforce listing max_nights."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    unit.listing.max_nights = 5

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_1 + timedelta(days=7),
        adults=2,
    )
    with pytest.raises(ValidationError):
        await booking_services.create_booking(fake_session, guest, request)


@pytest.mark.asyncio
async def test_create_booking_locks_unit_and_rejects_conflicting_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Concurrency protection is invoked before the conflict check."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    other = _make_user(user_id="other-guest")
    existing = _make_booking(unit, other, check_in=_FUTURE_1, check_out=_FUTURE_2)

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        bookings_repository,
        "list_overlapping_bookings",
        AsyncMock(return_value=[existing]),
    )
    lock_mock = AsyncMock()
    monkeypatch.setattr(
        listings_repository,
        "lock_unit_for_booking",
        lock_mock,
    )

    request = BookingCreate(
        unit_id=unit.id,
        check_in=_FUTURE_1,
        check_out=_FUTURE_2,
        adults=2,
    )
    with pytest.raises(ConflictError):
        await booking_services.create_booking(fake_session, guest, request)

    lock_mock.assert_awaited_once_with(fake_session, unit.id)


# --- complete_booking (Alpha-3) ---------------------------------------------


@pytest.mark.asyncio
async def test_complete_booking_admin_success(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=2),
        check_out=_TODAY - timedelta(days=1),
        checked_in_at=datetime.now(UTC) - timedelta(days=2),
        checked_out_at=datetime.now(UTC) - timedelta(days=1),
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(bookings_repository, "update_booking", _apply_booking_update)
    monkeypatch.setattr(
        payments_repository, "get_payment_by_booking", AsyncMock(return_value=None)
    )

    result = await booking_services.complete_booking(fake_session, admin, booking.id)

    assert result.status == BookingStatus.COMPLETED
    assert booking.status == str(BookingStatus.COMPLETED)


@pytest.mark.asyncio
async def test_complete_booking_non_admin_rejected(fake_session: AsyncMock) -> None:
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.CONFIRMED)

    with pytest.raises(AuthorizationError):
        await booking_services.complete_booking(fake_session, guest, booking.id)
    with pytest.raises(AuthorizationError):
        await booking_services.complete_booking(fake_session, host, booking.id)


@pytest.mark.asyncio
async def test_complete_booking_invalid_transition_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest, status=BookingStatus.REQUESTED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.complete_booking(fake_session, admin, booking.id)


@pytest.mark.asyncio
async def test_complete_booking_duplicate_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.COMPLETED
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.complete_booking(fake_session, admin, booking.id)


@pytest.mark.asyncio
async def test_complete_booking_before_checkout_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(
        unit,
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY - timedelta(days=2),
        check_out=_TODAY - timedelta(days=1),
        checked_in_at=datetime.now(UTC) - timedelta(days=2),
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await booking_services.complete_booking(fake_session, admin, booking.id)


def test_complete_booking_route_admin(bookings_client: TestClient, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, admin)
    response_model = _make_booking_response(status="completed")
    monkeypatch.setattr(
        "app.bookings.router.complete_booking",
        AsyncMock(return_value=response_model),
    )

    token = _token_for(admin)
    response = bookings_client.post(
        f"/api/v1/bookings/{response_model.id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_complete_booking_route_rejects_non_admin(bookings_client: TestClient, monkeypatch) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    _patch_auth_user(monkeypatch, host)
    response_model = _make_booking_response(status="completed")
    monkeypatch.setattr(
        "app.bookings.router.complete_booking",
        AsyncMock(return_value=response_model),
    )

    token = _token_for(host)
    response = bookings_client.post(
        f"/api/v1/bookings/{response_model.id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_complete_booking_route_rejects_unauthenticated(bookings_client: TestClient) -> None:
    response = bookings_client.post("/api/v1/bookings/test-id/complete")
    assert response.status_code == 401


def test_paginated_host_bookings_route_accepts_filters(
    bookings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    _patch_auth_user(monkeypatch, host)
    response_model = _make_booking_response()
    paginated = {
        "items": [response_model.model_dump(by_alias=True)],
        "total": 1,
        "page": 1,
        "page_size": 10,
        "total_pages": 1,
    }
    monkeypatch.setattr(
        "app.host.services.list_paginated_host_bookings",
        AsyncMock(return_value=paginated),
    )

    token = _token_for(host)
    response = bookings_client.get(
        "/api/v1/host/bookings?status=requested&unit_id=unit-1&search=ahmed&limit=5&offset=0",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == response_model.id


def test_paginated_host_bookings_route_rejects_guest(
    bookings_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, guest)

    token = _token_for(guest)
    response = bookings_client.get(
        "/api/v1/host/bookings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Trust / Identity — booking-context guest trust fields
# These verify that guest trust data (KYC status, member-since, review
# count) is only exposed to authorized hosts, never to the guest
# themselves or unrelated users.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_booking_host_receives_guest_trust_fields(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Authorized host viewing a booking gets guest trust context."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        "app.bookings.services.host_permissions.get_unit_permission_scope",
        AsyncMock(return_value="owner"),
    )
    # Stub the guest User lookup (session.execute → User)
    _stub_user_lookup(fake_session, guest)
    # Stub the review count
    monkeypatch.setattr(
        "app.reviews.repository.count_reviews_by_guest",
        AsyncMock(return_value=3),
    )

    response = await booking_services.get_booking(fake_session, host, booking.id)

    assert response.guest_name == "Test User"
    assert response.guest_kyc_status == "verified"
    assert response.guest_member_since is not None
    assert response.guest_reviews_count == 3
    assert response.permission_scope == "owner"


@pytest.mark.asyncio
async def test_get_booking_guest_does_not_receive_own_trust_fields(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Guest viewing their own booking does NOT get trust fields populated."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    response = await booking_services.get_booking(fake_session, guest, booking.id)

    # Guest viewing their own booking — trust fields must be null.
    assert response.guest_kyc_status is None
    assert response.guest_member_since is None
    assert response.guest_reviews_count is None
    assert response.permission_scope is None


@pytest.mark.asyncio
async def test_get_booking_unauthorized_no_trust_fields(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Unrelated user cannot access booking — trust fields never leaked."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    other = _make_user(user_id="other-guest", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    with pytest.raises(AuthorizationError):
        await booking_services.get_booking(fake_session, other, booking.id)


@pytest.mark.asyncio
async def test_get_stay_info_includes_host_kyc_status(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Guest viewing trip detail sees host's identity verification status."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=10)
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    _mock_stay_info_session(fake_session, host)

    result = await booking_services.get_stay_info(fake_session, guest, booking.id)

    assert result.host.kyc_status == "verified"
    assert result.host.name == "Test User"


@pytest.mark.asyncio
async def test_get_stay_info_host_kyc_null_when_unverified(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Host kyc_status is surfaced as-is — 'unverified' is a valid value."""
    guest = _make_user(role=UserRole.GUEST)
    host = _make_user(
        user_id="host-1", role=UserRole.HOST, kyc_status=KycStatus.UNVERIFIED
    )
    unit = _make_unit(host_id=host.id)
    unit.listing = _make_listing(unit.id)
    booking = _make_booking(
        unit, guest, status=BookingStatus.CONFIRMED, check_in=_TODAY + timedelta(days=10)
    )

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    _mock_stay_info_session(fake_session, host)

    result = await booking_services.get_stay_info(fake_session, guest, booking.id)

    assert result.host.kyc_status == "unverified"
