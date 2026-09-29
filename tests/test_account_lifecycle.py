"""Focused regression for the account role lifecycle batch:
booking eligibility for all roles, host opt-out, and admin account controls."""

import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement

from app.admin import services as admin_services
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings import services as booking_services
from app.bookings.constants import BookingStatus
from app.bookings.schemas import BookingCreate
from app.database import get_session
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.main import app
from app.shared.exceptions import ConflictError, ValidationError


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
    is_active: bool = True,
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
        is_active=is_active,
        created_at=now,
        updated_at=now,
    )


def _make_listing(unit_id: str = "unit-1") -> UnitListing:
    return UnitListing(
        id=str(uuid.uuid4()),
        unit_id=unit_id,
        title_ar="شقة",
        title_en="Test Apartment",
        description_ar="وصف",
        description_en="Desc",
        amenities=[],
        cultural_tags=[],
        house_rules=None,
        check_in_instructions=None,
        base_price_egp=1000,
        cancellation_policy="FLEXIBLE",
        min_nights=1,
        max_nights=30,
    )


def _make_unit(
    unit_id: str = "unit-1",
    host_id: str = "host-1",
    status: UnitStatus = UnitStatus.LISTED,
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
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
    )
    unit.listing = _make_listing(unit_id=unit_id)
    return unit


def _make_booking(unit: Unit, guest: User, status=BookingStatus.REQUESTED):
    from app.bookings.models import Booking

    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status=str(status),
        check_in=date.today() + timedelta(days=30),
        check_out=date.today() + timedelta(days=33),
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        created_at=now,
        updated_at=now,
        unit=unit,
    )


# ---------------------------------------------------------------------------
# Booking eligibility — every authenticated role can create bookings
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role", [UserRole.GUEST, UserRole.HOST, UserRole.STAFF, UserRole.ADMIN]
)
async def test_any_role_can_book(
    role: UserRole, fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user(role=role)
    unit = _make_unit(host_id="someone-else")
    booking = _make_booking(unit, user)

    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        bookings_repository, "list_overlapping_bookings", AsyncMock(return_value=[])
    )
    monkeypatch.setattr(
        bookings_repository, "create_booking", AsyncMock(return_value=booking)
    )
    conv = MagicMock()
    conv.scalar_one_or_none.return_value = MagicMock()
    fake_session.execute = AsyncMock(return_value=conv)

    request = BookingCreate(
        unit_id=unit.id,
        check_in=date.today() + timedelta(days=30),
        check_out=date.today() + timedelta(days=33),
        adults=2,
        children=0,
        infants=0,
    )
    response = await booking_services.create_booking(fake_session, user, request)
    assert response.guest_id == user.id


@pytest.mark.asyncio
async def test_own_listing_blocked_for_guest_too(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """The own-listing rule applies to every role, including guests who
    happen to own the unit record."""
    user = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id=user.id)
    monkeypatch.setattr(
        listings_repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    request = BookingCreate(
        unit_id=unit.id,
        check_in=date.today() + timedelta(days=30),
        check_out=date.today() + timedelta(days=33),
        adults=1,
        children=0,
        infants=0,
    )
    with pytest.raises(ValidationError, match="own listing"):
        await booking_services.create_booking(fake_session, user, request)


# ---------------------------------------------------------------------------
# Host → Guest lifecycle (self-service)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_deactivate_hosting_clean(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST)
    # No listed units, no active host bookings.
    count_result = MagicMock()
    count_result.scalar = MagicMock(return_value=0)
    # count() uses session.execute().scalar() -> 0
    scalar_result = MagicMock()
    scalar_result.scalar_one_or_none.return_value = None
    fake_session.execute = AsyncMock(return_value=scalar_result)

    # service uses session.execute(...).scalar() for counts
    exec_result = MagicMock()
    exec_result.scalar.return_value = 0
    fake_session.execute = AsyncMock(return_value=exec_result)

    write_event = AsyncMock()
    monkeypatch.setattr("app.shared.outbox.write_event", write_event)
    monkeypatch.setattr(
        "app.auth.services.write_event", write_event, raising=False
    )

    updated = await auth_services.deactivate_hosting(fake_session, host)
    assert updated.role == str(UserRole.GUEST)


@pytest.mark.asyncio
async def test_deactivate_hosting_blocked_by_listed_unit(
    fake_session: AsyncMock,
) -> None:
    host = _make_user(role=UserRole.HOST)
    exec_result = MagicMock()
    exec_result.scalar.side_effect = [1, 0]  # 1 listed unit, 0 bookings
    fake_session.execute = AsyncMock(return_value=exec_result)

    with pytest.raises(ConflictError):
        await auth_services.deactivate_hosting(fake_session, host)
    assert host.role == str(UserRole.HOST)


@pytest.mark.asyncio
async def test_deactivate_hosting_blocked_by_active_booking(
    fake_session: AsyncMock,
) -> None:
    host = _make_user(role=UserRole.HOST)
    exec_result = MagicMock()
    exec_result.scalar.side_effect = [0, 2]  # 0 units, 2 active bookings
    fake_session.execute = AsyncMock(return_value=exec_result)

    with pytest.raises(ConflictError):
        await auth_services.deactivate_hosting(fake_session, host)
    assert host.role == str(UserRole.HOST)


@pytest.mark.asyncio
async def test_deactivate_hosting_rejects_non_host(
    fake_session: AsyncMock,
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(ValidationError, match="Only hosts"):
        await auth_services.deactivate_hosting(fake_session, guest)


# ---------------------------------------------------------------------------
# Admin account controls
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_suspend_and_reactivate(fake_session: AsyncMock) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    target = _make_user(role=UserRole.GUEST)

    fake_session.get = AsyncMock(return_value=target)
    monkey_write = AsyncMock()
    import app.admin.services as svc

    svc.write_event = monkey_write  # module-level monkeypatch substitute

    suspended = await admin_services.suspend_user(
        fake_session, admin, target.id, "fraud check"
    )
    assert suspended.is_active is False
    assert target.is_active is False

    reactivated = await admin_services.reactivate_user(
        fake_session, admin, target.id, "cleared"
    )
    assert reactivated.is_active is True


@pytest.mark.asyncio
async def test_admin_cannot_suspend_self(fake_session: AsyncMock) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    fake_session.get = AsyncMock(return_value=admin)
    with pytest.raises(ValidationError, match="own account"):
        await admin_services.suspend_user(fake_session, admin, admin.id, None)


@pytest.mark.asyncio
async def test_admin_cannot_suspend_other_admin(fake_session: AsyncMock) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    other_admin = _make_user(user_id=str(uuid.uuid4()), role=UserRole.ADMIN)
    fake_session.get = AsyncMock(return_value=other_admin)
    with pytest.raises(ValidationError, match="Admin accounts"):
        await admin_services.suspend_user(
            fake_session, admin, other_admin.id, None
        )


@pytest.mark.asyncio
async def test_admin_restore_hosting_requires_verified_doc(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    target = _make_user(role=UserRole.GUEST)
    fake_session.get = AsyncMock(return_value=target)

    monkeypatch.setattr(
        "app.admin.services.kyc_repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[]),
    )
    with pytest.raises(ValidationError, match="verified identity"):
        await admin_services.admin_restore_hosting(
            fake_session, admin, target.id, None
        )

    doc = MagicMock()
    doc.status = "verified"
    monkeypatch.setattr(
        "app.admin.services.kyc_repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[doc]),
    )
    restored = await admin_services.admin_restore_hosting(
        fake_session, admin, target.id, None
    )
    assert restored.role == str(UserRole.HOST)


@pytest.mark.asyncio
async def test_admin_deactivate_hosting_uses_lifecycle(
    fake_session: AsyncMock, monkeypatch
) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    target = _make_user(role=UserRole.HOST)
    fake_session.get = AsyncMock(return_value=target)

    deactivate = AsyncMock(return_value=target)
    monkeypatch.setattr(
        "app.admin.services.auth_services.deactivate_hosting", deactivate
    )
    await admin_services.admin_deactivate_hosting(
        fake_session, admin, target.id, "abuse"
    )
    deactivate.assert_awaited_once()
    assert deactivate.await_args.kwargs["actor_id"] == admin.id


# ---------------------------------------------------------------------------
# Router-level authorization: lifecycle endpoints are admin-only
# ---------------------------------------------------------------------------


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def admin_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _patch_auth(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


@pytest.mark.parametrize(
    "action", ["suspend", "reactivate", "deactivate-hosting", "restore-hosting"]
)
def test_admin_actions_forbidden_for_non_admin(
    admin_client: TestClient, monkeypatch, action: str
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    _patch_auth(monkeypatch, guest)
    token = auth_services.create_access_token(guest)
    response = admin_client.post(
        f"/api/v1/admin/users/{uuid.uuid4()}/{action}",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_suspend_endpoint(admin_client: TestClient, monkeypatch) -> None:
    admin = _make_user(role=UserRole.ADMIN)
    _patch_auth(monkeypatch, admin)
    target = _make_user(role=UserRole.GUEST)
    monkeypatch.setattr(
        "app.admin.router.suspend_user",
        AsyncMock(return_value=MagicMock(
            id=target.id,
            display_name=target.display_name,
            email=target.email,
            phone_number=target.phone_number,
            role=target.role,
            kyc_status=target.kyc_status,
            is_active=False,
            created_at=target.created_at,
        )),
    )
    token = auth_services.create_access_token(admin)
    response = admin_client.post(
        f"/api/v1/admin/users/{target.id}/suspend",
        json={"reason": "fraud"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Suspended users: get_current_user already rejects is_active=False
# ---------------------------------------------------------------------------


def test_suspended_user_blocked_from_api(
    admin_client: TestClient, monkeypatch
) -> None:
    suspended = _make_user(role=UserRole.GUEST, is_active=False)
    _patch_auth(monkeypatch, suspended)
    token = auth_services.create_access_token(suspended)
    for endpoint in (
        "/api/v1/bookings/guest",
        "/api/v1/host/today",
        "/api/v1/auth/me",
    ):
        response = admin_client.get(
            endpoint, headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401, endpoint
