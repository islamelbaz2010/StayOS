"""Tests for the Host Operating System domain.

Covers authorization, co-host permissions, listing readiness, host today,
reservation listing, and earnings — all using mocked sessions to match
the existing test patterns in the codebase.
"""

import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.host import constants as host_constants
from app.host import permissions as host_permissions
from app.host import repository as host_repository
from app.host import schemas as host_schemas
from app.host import services as host_services
from app.listings.constants import UnitStatus
from app.shared.exceptions import AuthorizationError, ValidationError


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.HOST,
    display_name: str = "Host User",
    kyc_status: str = "verified",
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+201000000000",
        email="host@example.com",
        firebase_uid=None,
        display_name=display_name,
        locale="ar",
        role=str(role),
        kyc_status=kyc_status,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_unit(
    host_id: str,
    unit_id: str | None = None,
    status: str = UnitStatus.LISTED,
) -> MagicMock:
    unit = MagicMock()
    unit.id = unit_id or str(uuid.uuid4())
    unit.host_id = host_id
    unit.status = status
    unit.property_type = "APARTMENT"
    unit.governorate = "Cairo"
    unit.city = "Cairo"
    unit.address = "Test Address"
    unit.max_guests = 4
    unit.bedrooms = 2
    unit.beds = 2
    unit.bathrooms = 1
    unit.photos = []
    return unit


def _make_listing(unit_id: str) -> MagicMock:
    listing = MagicMock()
    listing.unit_id = unit_id
    listing.title_ar = "Test Listing"
    listing.title_en = "Test Listing EN"
    listing.description_ar = "A nice place"
    listing.base_price_egp = 500
    listing.address = "Test Address"
    listing.check_in_instructions = "Door code: 1234"
    listing.house_rules = "No smoking"
    listing.amenities = ["WIFI"]
    listing.cultural_tags = []
    listing.weekend_mult = 1.0
    return listing


def _make_booking(
    guest_id: str,
    unit_id: str,
    status: str = BookingStatus.CONFIRMED,
    check_in: date | None = None,
    check_out: date | None = None,
) -> MagicMock:
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.guest_id = guest_id
    booking.unit_id = unit_id
    booking.status = status
    booking.check_in = check_in or date.today()
    booking.check_out = check_out or date.today() + timedelta(days=2)
    booking.adults = 2
    booking.children = 0
    booking.infants = 0
    booking.requested_at = datetime.now(UTC)
    booking.accepted_at = None
    booking.rejected_at = None
    booking.cancelled_at = None
    booking.cancelled_by = None
    booking.checked_in_at = None
    booking.checked_out_at = None
    booking.reject_reason = None
    booking.cancel_reason = None
    return booking


# ============================================================
# AUTHORIZATION — Co-host permissions
# ============================================================

@pytest.mark.asyncio
async def test_owner_can_access_unit(fake_session: AsyncMock) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1")

    scope = await host_permissions.get_unit_permission_scope(fake_session, host, unit)
    assert scope == "owner"


@pytest.mark.asyncio
async def test_admin_can_access_any_unit(fake_session: AsyncMock, monkeypatch) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    unit = _make_unit(host_id="other-host")

    scope = await host_permissions.get_unit_permission_scope(fake_session, admin, unit)
    assert scope == "admin"


@pytest.mark.asyncio
async def test_co_host_can_access_unit(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")

    # Mock the co-host query to return a scope
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    scope = await host_permissions.get_unit_permission_scope(fake_session, co_host, unit)
    assert scope == host_constants.CoHostPermissionScope.CALENDAR_ONLY


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_access_unit(fake_session: AsyncMock, monkeypatch) -> None:
    random_user = _make_user(user_id="random-1", role=UserRole.GUEST)
    unit = _make_unit(host_id="host-1")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    fake_session.execute = AsyncMock(return_value=mock_result)

    scope = await host_permissions.get_unit_permission_scope(fake_session, random_user, unit)
    assert scope is None

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_access_unit(fake_session, random_user, unit)


@pytest.mark.asyncio
async def test_co_host_calendar_only_cannot_edit_listing(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_edit_listing(fake_session, co_host, unit)


@pytest.mark.asyncio
async def test_co_host_full_access_can_edit_listing(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.FULL_ACCESS
    fake_session.execute = AsyncMock(return_value=mock_result)

    # Should not raise
    await host_permissions.assert_can_edit_listing(fake_session, co_host, unit)


@pytest.mark.asyncio
async def test_co_host_calendar_only_cannot_message(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_message(fake_session, co_host, unit)


@pytest.mark.asyncio
async def test_non_owner_non_admin_cannot_invite_co_host(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_owner_or_admin(co_host, unit)


# ============================================================
# HOST TODAY
# ============================================================

@pytest.mark.asyncio
async def test_host_today_no_units_returns_empty(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    monkeypatch.setattr(
        host_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=[]),
    )

    result = await host_services.get_host_today(fake_session, host)
    assert result.items == []
    assert result.summary == {}


@pytest.mark.asyncio
async def test_host_today_guest_role_forbidden(fake_session: AsyncMock) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await host_services.get_host_today(fake_session, guest)


@pytest.mark.asyncio
async def test_host_today_with_pending_request(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    booking = _make_booking(
        guest_id="guest-1",
        unit_id="unit-1",
        status=BookingStatus.REQUESTED,
        check_in=date.today() + timedelta(days=7),
        check_out=date.today() + timedelta(days=9),
    )
    booking.unit = unit
    booking.unit.listing = _make_listing("unit-1")

    guest = _make_user(user_id="guest-1", role=UserRole.GUEST, display_name="Test Guest")

    monkeypatch.setattr(
        host_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-1"]),
    )

    # Mock _compute_stay_phase to avoid MagicMock issues
    monkeypatch.setattr(
        host_services,
        "_compute_stay_phase",
        MagicMock(return_value="upcoming"),
    )

    # Mock _resolve_guest
    async def mock_resolve_guest(session, guest_id):
        return guest
    monkeypatch.setattr(host_services, "_resolve_guest", mock_resolve_guest)

    # Mock the bookings query — return our booking
    booking_result = MagicMock()
    booking_result.scalars.return_value.all.return_value = [booking]

    # Mock guest resolution query
    guest_result = MagicMock()
    guest_result.scalars.return_value.all.return_value = [guest]

    # Mock incomplete listings query (returns empty)
    incomplete_result = MagicMock()
    incomplete_result.all.return_value = []

    fake_session.execute = AsyncMock(side_effect=[booking_result, guest_result, incomplete_result])

    # Mock unread messages count
    monkeypatch.setattr(
        host_repository,
        "get_host_unread_conversations_count",
        AsyncMock(return_value=0),
    )

    # Mock compute_listing_readiness (not called since incomplete list is empty)
    monkeypatch.setattr(
        host_services,
        "compute_listing_readiness",
        AsyncMock(return_value=MagicMock(
            status=host_constants.ListingReadinessStatus.READY,
            missing_items=[],
        )),
    )

    result = await host_services.get_host_today(fake_session, host)
    assert len(result.items) >= 1
    pending = [i for i in result.items if i.item_type == host_constants.HostTodayItemType.PENDING_REQUEST]
    assert len(pending) == 1
    assert "Test Guest" in pending[0].title


# ============================================================
# HOST RESERVATIONS
# ============================================================

@pytest.mark.asyncio
async def test_list_host_reservations_no_units(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    monkeypatch.setattr(
        host_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=[]),
    )

    result = await host_services.list_host_reservations(fake_session, host)
    assert result == []


@pytest.mark.asyncio
async def test_list_host_reservations_guest_forbidden(fake_session: AsyncMock) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await host_services.list_host_reservations(fake_session, guest)


# ============================================================
# HOST EARNINGS
# ============================================================

@pytest.mark.asyncio
async def test_host_earnings_guest_forbidden(fake_session: AsyncMock) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await host_services.get_host_earnings(fake_session, guest)


@pytest.mark.asyncio
async def test_host_earnings_no_units_returns_zeros(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    monkeypatch.setattr(
        host_repository,
        "get_host_earnings",
        AsyncMock(return_value={
            "total_bookings": 0,
            "confirmed_bookings": 0,
            "completed_stays": 0,
            "total_revenue_egp": 0,
            "pending_verification_egp": 0,
            "refund_pending_egp": 0,
            "net_earnings_egp": 0,
            "per_unit": [],
        }),
    )

    result = await host_services.get_host_earnings(fake_session, host)
    assert result.total_bookings == 0
    assert result.net_earnings_egp == 0


# ============================================================
# LISTING READINESS
# ============================================================

@pytest.mark.asyncio
async def test_listing_readiness_complete(fake_session: AsyncMock) -> None:
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    listing = _make_listing("unit-1")

    # Mock photo count query
    photo_result = MagicMock()
    photo_result.scalar.return_value = 3  # 3 photos
    fake_session.execute = AsyncMock(return_value=photo_result)

    # Mock upsert (no-op)
    AsyncMock(host_repository.upsert_readiness_check)

    result = await host_services.compute_listing_readiness(fake_session, unit, listing)
    assert result.status == host_constants.ListingReadinessStatus.READY
    assert result.missing_items == []


@pytest.mark.asyncio
async def test_listing_readiness_missing_photos(fake_session: AsyncMock) -> None:
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    listing = _make_listing("unit-1")

    # Mock photo count query — 0 photos
    photo_result = MagicMock()
    photo_result.scalar.return_value = 0
    fake_session.execute = AsyncMock(return_value=photo_result)

    result = await host_services.compute_listing_readiness(fake_session, unit, listing)
    assert result.status == host_constants.ListingReadinessStatus.ACTION_REQUIRED
    assert "photos" in result.missing_items


@pytest.mark.asyncio
async def test_listing_readiness_missing_check_in_instructions(fake_session: AsyncMock) -> None:
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    listing = _make_listing("unit-1")
    listing.check_in_instructions = None  # Missing

    # Mock photo count query — has photos
    photo_result = MagicMock()
    photo_result.scalar.return_value = 2
    fake_session.execute = AsyncMock(return_value=photo_result)

    result = await host_services.compute_listing_readiness(fake_session, unit, listing)
    assert result.status == host_constants.ListingReadinessStatus.ACTION_REQUIRED
    assert "check_in_instructions" in result.missing_items


@pytest.mark.asyncio
async def test_listing_readiness_no_listing(fake_session: AsyncMock) -> None:
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    listing = None

    result = await host_services.compute_listing_readiness(fake_session, unit, listing)
    assert result.status == host_constants.ListingReadinessStatus.ACTION_REQUIRED
    assert "listing_details" in result.missing_items


# ============================================================
# CO-HOST MANAGEMENT
# ============================================================

@pytest.mark.asyncio
async def test_invite_co_host_owner_success(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")
    co_host_user = _make_user(user_id="cohost-1", display_name="Co Host")

    # Mock get_unit_with_listing
    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    # Mock co-host user lookup
    async def mock_resolve_host(session, user_id):
        if user_id == "cohost-1":
            return co_host_user
        return None
    monkeypatch.setattr(host_services, "_resolve_host", mock_resolve_host)

    # Mock existing co-host check
    monkeypatch.setattr(
        host_repository,
        "get_co_host",
        AsyncMock(return_value=None),
    )

    # Mock create
    created = MagicMock()
    created.id = str(uuid.uuid4())
    created.unit_id = "unit-1"
    created.co_host_user_id = "cohost-1"
    created.permission_scope = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    created.is_active = True
    created.created_at = datetime.now(UTC)
    created.updated_at = datetime.now(UTC)
    monkeypatch.setattr(
        host_repository,
        "create_co_host",
        AsyncMock(return_value=created),
    )

    request = host_schemas.CoHostInvite(
        co_host_user_id="cohost-1",
        permission_scope=host_constants.CoHostPermissionScope.CALENDAR_ONLY,
    )
    result = await host_services.invite_co_host(fake_session, host, "unit-1", request)
    assert result.co_host_user_id == "cohost-1"
    assert result.permission_scope == host_constants.CoHostPermissionScope.CALENDAR_ONLY


@pytest.mark.asyncio
async def test_invite_co_host_cannot_invite_self(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")

    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = host_schemas.CoHostInvite(
        co_host_user_id="host-1",  # Same as host
        permission_scope=host_constants.CoHostPermissionScope.CALENDAR_ONLY,
    )
    with pytest.raises(ValidationError):
        await host_services.invite_co_host(fake_session, host, "unit-1", request)


@pytest.mark.asyncio
async def test_invite_co_host_cannot_invite_owner(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")

    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = host_schemas.CoHostInvite(
        co_host_user_id="host-1",  # Same as unit owner
        permission_scope=host_constants.CoHostPermissionScope.CALENDAR_ONLY,
    )
    with pytest.raises(ValidationError):
        await host_services.invite_co_host(fake_session, host, "unit-1", request)


@pytest.mark.asyncio
async def test_invite_co_host_invalid_scope(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")

    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = host_schemas.CoHostInvite(
        co_host_user_id="cohost-1",
        permission_scope="invalid_scope",
    )
    with pytest.raises(ValidationError):
        await host_services.invite_co_host(fake_session, host, "unit-1", request)


@pytest.mark.asyncio
async def test_invite_co_host_non_owner_forbidden(fake_session: AsyncMock, monkeypatch) -> None:
    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1", unit_id="unit-1")

    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    request = host_schemas.CoHostInvite(
        co_host_user_id="cohost-2",
        permission_scope=host_constants.CoHostPermissionScope.CALENDAR_ONLY,
    )
    with pytest.raises(AuthorizationError):
        await host_services.invite_co_host(fake_session, co_host, "unit-1", request)


# ============================================================
# HOST PROFILE
# ============================================================

@pytest.mark.asyncio
async def test_get_host_profile_guest_forbidden(fake_session: AsyncMock) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await host_services.get_host_profile(fake_session, guest)


@pytest.mark.asyncio
async def test_get_host_profile_success(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)

    # Mock listing counts
    fake_session.scalar = AsyncMock(side_effect=[5, 3])  # total, listed

    # Mock co-host count
    monkeypatch.setattr(
        host_repository,
        "count_co_hosted_units",
        AsyncMock(return_value=2),
    )

    result = await host_services.get_host_profile(fake_session, host)
    assert result.id == "host-1"
    assert result.total_listings == 5
    assert result.listed_listings == 3
    assert result.co_host_units == 2


@pytest.mark.asyncio
async def test_update_host_profile_invalid_locale(fake_session: AsyncMock) -> None:
    host = _make_user(user_id="host-1")
    request = host_schemas.HostProfileUpdate(locale="fr")
    with pytest.raises(ValidationError):
        await host_services.update_host_profile(fake_session, host, request)


# ============================================================
# HOST CALENDAR
# ============================================================

@pytest.mark.asyncio
async def test_host_calendar_invalid_date_range(fake_session: AsyncMock) -> None:
    host = _make_user(user_id="host-1")
    with pytest.raises(ValidationError):
        await host_services.get_host_calendar(
            fake_session, host, None, date.today(), date.today()
        )


@pytest.mark.asyncio
async def test_host_calendar_range_too_long(fake_session: AsyncMock) -> None:
    host = _make_user(user_id="host-1")
    with pytest.raises(ValidationError):
        await host_services.get_host_calendar(
            fake_session, host, None, date.today(), date.today() + timedelta(days=400)
        )


@pytest.mark.asyncio
async def test_host_calendar_no_managed_units(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    monkeypatch.setattr(
        host_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=[]),
    )

    result = await host_services.get_host_calendar(
        fake_session, host, None, date.today(), date.today() + timedelta(days=7)
    )
    assert result.days == []


@pytest.mark.asyncio
async def test_host_calendar_unauthorized_unit(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1")
    monkeypatch.setattr(
        host_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-1"]),
    )

    with pytest.raises(AuthorizationError):
        await host_services.get_host_calendar(
            fake_session, host, "unit-other", date.today(), date.today() + timedelta(days=7)
        )


# ============================================================
# CO-HOST PERMISSIONS ON LISTING OPERATIONS
# ============================================================

@pytest.mark.asyncio
async def test_listing_service_co_host_calendar_only_cannot_edit(fake_session: AsyncMock, monkeypatch) -> None:
    """A calendar_only co-host cannot edit listing details via the service."""
    from app.listings import services as listings_services
    from app.listings.schemas import ListingUpdate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return calendar_only
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    with pytest.raises(AuthorizationError):
        await listings_services.update_listing(
            fake_session, co_host, unit.id, ListingUpdate(base_price_egp=1000)
        )


@pytest.mark.asyncio
async def test_listing_service_co_host_full_access_can_edit(fake_session: AsyncMock, monkeypatch) -> None:
    """A full_access co-host can edit listing details via the service."""
    from app.listings import services as listings_services
    from app.listings.schemas import ListingUpdate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    listing = _make_listing(unit.id)
    unit.listing = listing

    # Mock permission scope to return full_access
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.FULL_ACCESS
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import configuration as listing_config
    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings_repo,
        "update_unit_listing",
        AsyncMock(return_value=listing),
    )
    monkeypatch.setattr(
        listing_config,
        "validate_listing_configuration",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        listings_services,
        "_fetch_coordinates",
        AsyncMock(return_value=(30.0, 31.0)),
    )
    # Mock the response builder to avoid Pydantic validation on MagicMock
    mock_response = MagicMock()
    monkeypatch.setattr(
        listings_services, "_to_listing_response", MagicMock(return_value=mock_response)
    )

    result = await listings_services.update_listing(
        fake_session, co_host, unit.id, ListingUpdate(base_price_egp=1000)
    )
    assert result is mock_response


@pytest.mark.asyncio
async def test_listing_service_co_host_calendar_only_can_manage_calendar(fake_session: AsyncMock, monkeypatch) -> None:
    """A calendar_only co-host can manage calendar rules."""
    from app.listings import services as listings_services
    from app.listings.constants import CalendarStatus
    from app.listings.schemas import CalendarRuleCreate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return calendar_only
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    rule = MagicMock()
    rule.id = "rule-1"
    rule.unit_id = unit.id
    rule.date_from = date.today()
    rule.date_to = date.today() + timedelta(days=3)
    rule.status = CalendarStatus.BLOCKED
    rule.block_type = "manual"
    rule.price_override = None
    monkeypatch.setattr(
        listings_repo, "create_calendar_rule", AsyncMock(return_value=rule)
    )

    result = await listings_services.create_host_calendar_rule(
        fake_session,
        co_host,
        unit.id,
        CalendarRuleCreate(
            date_from=date.today(),
            date_to=date.today() + timedelta(days=3),
            status=CalendarStatus.BLOCKED,
        ),
    )
    assert result.status == CalendarStatus.BLOCKED


@pytest.mark.asyncio
async def test_co_host_cannot_publish_listing(fake_session: AsyncMock, monkeypatch) -> None:
    """A co-host (even full_access) cannot publish — owner/admin only."""
    from app.listings import services as listings_services

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1", status=UnitStatus.UNLISTED)
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return full_access
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.FULL_ACCESS
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    with pytest.raises(AuthorizationError):
        await listings_services.publish_listing(fake_session, co_host, unit.id)


@pytest.mark.asyncio
async def test_owner_can_publish_listing(fake_session: AsyncMock, monkeypatch) -> None:
    """The owner can publish a listing."""
    from app.listings import services as listings_services

    owner = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1", status=UnitStatus.UNLISTED)
    listing = _make_listing(unit.id)
    unit.listing = listing

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings_repo,
        "set_unit_status",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services,
        "_fetch_coordinates",
        AsyncMock(return_value=(30.0, 31.0)),
    )
    # Mock the response builder to avoid Pydantic validation on MagicMock
    mock_response = MagicMock()
    monkeypatch.setattr(
        listings_services, "_to_listing_response", MagicMock(return_value=mock_response)
    )

    result = await listings_services.publish_listing(fake_session, owner, unit.id)
    assert result is mock_response


@pytest.mark.asyncio
async def test_co_host_cannot_archive_listing(fake_session: AsyncMock, monkeypatch) -> None:
    """A co-host cannot archive — owner/admin only."""
    from app.listings import services as listings_services

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1", status=UnitStatus.LISTED)
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return full_access
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.FULL_ACCESS
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    with pytest.raises(AuthorizationError):
        await listings_services.archive_listing(fake_session, co_host, unit.id)


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_view_host_listing_detail(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A user with no access cannot view the host listing detail."""
    from app.listings import repository as listings_repo

    random_user = _make_user(user_id="random-1", role=UserRole.GUEST)
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return None (no access)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    fake_session.execute = AsyncMock(return_value=mock_result)

    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    with pytest.raises(AuthorizationError):
        await host_services.get_host_listing_detail(fake_session, random_user, unit.id)


@pytest.mark.asyncio
async def test_host_listing_detail_returns_full_data(fake_session: AsyncMock, monkeypatch) -> None:
    """The host listing detail endpoint returns listing + photos + readiness."""
    owner = _make_user(user_id="host-1")
    unit = _make_unit(host_id="host-1")
    listing = _make_listing(unit.id)
    listing.title_en = "Test EN"
    listing.description_en = "Desc EN"
    listing.country = "Egypt"
    listing.currency = "EGP"
    listing.category = "entire_place"
    listing.cleaning_fee_egp = 50
    listing.cancellation_policy = "flexible"
    listing.peak_mult = 1.2
    listing.min_nights = 1
    listing.max_nights = 30
    listing.check_in_time = "14:00"
    listing.check_out_time = "12:00"
    listing.pre_arrival_info_release_hours = 24
    listing.policies = None
    listing.house_rules = "No smoking"
    listing.check_in_instructions = "Door code: 1234"
    listing.cover_photo_id = None
    unit.listing = listing
    unit.district = "Maadi"
    unit.beds = 2

    from app.listings import repository as listings_repo

    # Mock: get_unit_with_listing returns the unit
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    # Mock: get_photos_by_unit returns empty list
    monkeypatch.setattr(
        listings_repo, "get_photos_by_unit", AsyncMock(return_value=[])
    )

    # Mock: compute_listing_readiness returns ready
    ready_response = host_schemas.ListingReadinessResponse(
        unit_id=unit.id,
        status="ready",
        missing_items=[],
        computed_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        host_services, "compute_listing_readiness", AsyncMock(return_value=ready_response)
    )

    # Mock: upsert_readiness_check
    monkeypatch.setattr(
        host_repository, "upsert_readiness_check", AsyncMock(return_value=MagicMock())
    )

    # Mock: coordinates query
    coord_result = MagicMock()
    coord_row = MagicMock()
    coord_row.lat = 30.0
    coord_row.lng = 31.0
    coord_result.one.return_value = coord_row
    fake_session.execute = AsyncMock(return_value=coord_result)

    result = await host_services.get_host_listing_detail(fake_session, owner, unit.id)

    assert result.id == unit.id
    assert result.host_id == "host-1"
    assert result.title_ar == "Test Listing"
    assert result.permission_scope == "owner"
    assert result.readiness is not None
    assert result.readiness.status == "ready"
    assert result.photos == []


@pytest.mark.asyncio
async def test_co_host_calendar_messaging_can_manage_calendar(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A calendar_messaging co-host can manage calendar rules."""
    from app.listings import services as listings_services
    from app.listings.constants import CalendarStatus
    from app.listings.schemas import CalendarRuleCreate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return calendar_messaging
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_MESSAGING
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    rule = MagicMock()
    rule.id = "rule-1"
    rule.unit_id = unit.id
    rule.date_from = date.today()
    rule.date_to = date.today() + timedelta(days=3)
    rule.status = CalendarStatus.BLOCKED
    rule.block_type = "manual"
    rule.price_override = None
    monkeypatch.setattr(
        listings_repo, "create_calendar_rule", AsyncMock(return_value=rule)
    )

    result = await listings_services.create_host_calendar_rule(
        fake_session,
        co_host,
        unit.id,
        CalendarRuleCreate(
            date_from=date.today(),
            date_to=date.today() + timedelta(days=3),
            status=CalendarStatus.BLOCKED,
        ),
    )
    assert result.status == CalendarStatus.BLOCKED


@pytest.mark.asyncio
async def test_co_host_full_access_can_upload_photo(fake_session: AsyncMock, monkeypatch) -> None:
    """A full_access co-host can upload photos (edit-level access)."""
    from app.listings import services as listings_services
    from app.listings.schemas import PhotoCreate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return full_access
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.FULL_ACCESS
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    photo = MagicMock()
    photo.id = "photo-1"
    photo.unit_id = unit.id
    photo.s3_key = "test/key"
    photo.url = "https://example.com/photo.jpg"
    photo.display_order = 0
    photo.is_cover = True
    photo.caption_ar = None
    monkeypatch.setattr(
        listings_repo, "get_photos_by_unit", AsyncMock(return_value=[photo])
    )
    monkeypatch.setattr(
        listings_repo, "create_photo", AsyncMock(return_value=photo)
    )

    result = await listings_services.create_photo(
        fake_session,
        co_host,
        unit.id,
        PhotoCreate(s3_key="test/key", url="https://example.com/photo.jpg"),
    )
    assert result.id == "photo-1"


@pytest.mark.asyncio
async def test_co_host_calendar_only_cannot_upload_photo(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A calendar_only co-host cannot upload photos (edit-level access required)."""
    from app.listings import services as listings_services
    from app.listings.schemas import PhotoCreate

    co_host = _make_user(user_id="cohost-1")
    unit = _make_unit(host_id="host-1")
    unit.listing = _make_listing(unit.id)

    # Mock permission scope to return calendar_only
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = host_constants.CoHostPermissionScope.CALENDAR_ONLY
    fake_session.execute = AsyncMock(return_value=mock_result)

    from app.listings import repository as listings_repo
    monkeypatch.setattr(
        listings_repo, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    with pytest.raises(AuthorizationError):
        await listings_services.create_photo(
            fake_session,
            co_host,
            unit.id,
            PhotoCreate(s3_key="test/key", url="https://example.com/photo.jpg"),
        )
