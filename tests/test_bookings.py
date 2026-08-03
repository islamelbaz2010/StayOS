import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock

import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings import services as booking_services
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.schemas import BookingCreate, BookingResponse, BookingUpdate
from app.database import get_session
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.main import app
from app.shared.exceptions import AuthorizationError, ConflictError, ValidationError
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement


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
    return Unit(
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
        check_in=kwargs.get("check_in") or date(2026, 8, 1),
        check_out=kwargs.get("check_out") or date(2026, 8, 5),
        adults=kwargs.get("adults") or 2,
        children=kwargs.get("children") or 0,
        infants=kwargs.get("infants") or 0,
        requested_at=kwargs.get("requested_at") or now,
        created_at=kwargs.get("created_at") or now,
        updated_at=kwargs.get("updated_at") or now,
        unit=unit,
    )


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

    request = BookingCreate(
        unit_id=unit.id,
        check_in=date(2026, 8, 10),
        check_out=date(2026, 8, 14),
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
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
    )
    with pytest.raises(AuthorizationError):
        await booking_services.create_booking(fake_session, host, request)


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
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
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
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
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
        check_in=date(2026, 8, 10),
        check_out=date(2026, 8, 14),
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

    request = BookingUpdate(status=BookingStatus.CANCELLED, cancel_reason="Change of plans")
    response = await booking_services.update_booking(
        fake_session, guest, booking.id, request
    )
    assert response.status == BookingStatus.CANCELLED


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
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
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
