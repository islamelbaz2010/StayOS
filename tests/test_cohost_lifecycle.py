"""Co-host operational lifecycle tests.

Covers governed co-host authorization across booking actions, listing
retrieval, availability/calendar, listing readiness enforcement at the
submit transition, host earnings scoping, and photo reorder.
"""

import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.availability import services as availability_services
from app.bookings import repository as bookings_repository
from app.bookings import services as booking_services
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.schemas import BookingUpdate
from app.host import permissions as host_permissions
from app.host.constants import CoHostPermissionScope, ListingReadinessStatus
from app.listings import repository as listings_repository
from app.listings import services as listings_services
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.listings.schemas import PhotoReorderRequest
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError

_TODAY = date.today()
_FUTURE_1 = _TODAY + timedelta(days=10)
_FUTURE_2 = _FUTURE_1 + timedelta(days=3)


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
        max_guests=4,
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
        check_in=kwargs.get("check_in") or _FUTURE_1,
        check_out=kwargs.get("check_out") or _FUTURE_2,
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        created_at=now,
        updated_at=now,
        checked_in_at=kwargs.get("checked_in_at"),
        checked_out_at=kwargs.get("checked_out_at"),
        unit=unit,
    )


def _stub_session_scalar(session: AsyncMock, value: object) -> None:
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = value
    session.execute = AsyncMock(return_value=mock_result)


# ============================================================
# PERMISSIONS — booking management scope
# ============================================================


@pytest.mark.asyncio
async def test_owner_can_manage_bookings(fake_session: AsyncMock) -> None:
    owner = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    await host_permissions.assert_can_manage_bookings(fake_session, owner, unit)


@pytest.mark.asyncio
async def test_admin_can_manage_bookings(fake_session: AsyncMock) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    unit = _make_unit(host_id="host-1")
    await host_permissions.assert_can_manage_bookings(fake_session, admin, unit)


@pytest.mark.asyncio
async def test_full_access_cohost_can_manage_bookings(
    fake_session: AsyncMock,
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    _stub_session_scalar(fake_session, CoHostPermissionScope.FULL_ACCESS)
    await host_permissions.assert_can_manage_bookings(fake_session, cohost, unit)


@pytest.mark.asyncio
async def test_calendar_messaging_cohost_cannot_manage_bookings(
    fake_session: AsyncMock,
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    _stub_session_scalar(fake_session, CoHostPermissionScope.CALENDAR_MESSAGING)
    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_manage_bookings(
            fake_session, cohost, unit
        )


@pytest.mark.asyncio
async def test_calendar_only_cohost_cannot_manage_bookings(
    fake_session: AsyncMock,
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    _stub_session_scalar(fake_session, CoHostPermissionScope.CALENDAR_ONLY)
    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_manage_bookings(
            fake_session, cohost, unit
        )


@pytest.mark.asyncio
async def test_unrelated_user_cannot_manage_bookings(
    fake_session: AsyncMock,
) -> None:
    stranger = _make_user(user_id="stranger", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    _stub_session_scalar(fake_session, None)
    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_manage_bookings(
            fake_session, stranger, unit
        )


# ============================================================
# BOOKINGS — cancellation actor and status updates
# ============================================================


@pytest.mark.asyncio
async def test_cancellation_actor_guest(fake_session: AsyncMock) -> None:
    guest = _make_user(user_id="guest-1")
    booking = _make_booking(_make_unit(), guest)
    assert (
        await booking_services._cancellation_actor(fake_session, booking, guest)
        == "guest"
    )


@pytest.mark.asyncio
async def test_cancellation_actor_owner(fake_session: AsyncMock) -> None:
    owner = _make_user(user_id="host-1", role=UserRole.HOST)
    booking = _make_booking(_make_unit(host_id="host-1"), _make_user())
    assert (
        await booking_services._cancellation_actor(fake_session, booking, owner)
        == "host"
    )


@pytest.mark.asyncio
async def test_cancellation_actor_admin(fake_session: AsyncMock) -> None:
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    booking = _make_booking(_make_unit(), _make_user())
    _stub_session_scalar(fake_session, None)
    assert (
        await booking_services._cancellation_actor(fake_session, booking, admin)
        == "admin"
    )


@pytest.mark.asyncio
async def test_cancellation_actor_full_access_cohost(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(_make_unit(host_id="host-1"), _make_user())
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.FULL_ACCESS),
    )
    assert (
        await booking_services._cancellation_actor(fake_session, booking, cohost)
        == "host"
    )


@pytest.mark.asyncio
async def test_cancellation_actor_calendar_only_cohost_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(_make_unit(host_id="host-1"), _make_user())
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_ONLY),
    )
    with pytest.raises(AuthorizationError):
        await booking_services._cancellation_actor(fake_session, booking, cohost)


@pytest.mark.asyncio
async def test_update_booking_accept_by_full_access_cohost(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(
        _make_unit(host_id="host-1"), guest, status=BookingStatus.REQUESTED
    )

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.FULL_ACCESS),
    )
    update = AsyncMock(side_effect=lambda s, b, **kw: b)
    monkeypatch.setattr(bookings_repository, "update_booking", update)
    from app.payments import services as payment_services

    create_payment = AsyncMock()
    monkeypatch.setattr(
        payment_services, "create_payment_for_booking", create_payment
    )

    await booking_services.update_booking(
        fake_session, cohost, booking.id, BookingUpdate(status=BookingStatus.ACCEPTED)
    )
    _, kwargs = update.call_args
    assert kwargs["status"] == str(BookingStatus.ACCEPTED)
    create_payment.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_booking_reject_by_calendar_only_cohost_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(
        _make_unit(host_id="host-1"), guest, status=BookingStatus.REQUESTED
    )

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_ONLY),
    )

    with pytest.raises(AuthorizationError):
        await booking_services.update_booking(
            fake_session,
            cohost,
            booking.id,
            BookingUpdate(status=BookingStatus.REJECTED),
        )


@pytest.mark.asyncio
async def test_check_in_by_full_access_cohost(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(
        _make_unit(host_id="host-1"),
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
    )

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.FULL_ACCESS),
    )
    update = AsyncMock(side_effect=lambda s, b, **kw: b)
    monkeypatch.setattr(bookings_repository, "update_booking", update)
    monkeypatch.setattr(booking_services, "write_event", AsyncMock())

    result = await booking_services.check_in_booking(
        fake_session, cohost, booking.id
    )
    update.assert_awaited_once()
    assert result.id == booking.id


@pytest.mark.asyncio
async def test_check_in_by_calendar_only_cohost_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(
        _make_unit(host_id="host-1"),
        guest,
        status=BookingStatus.CONFIRMED,
        check_in=_TODAY,
    )
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_ONLY),
    )
    with pytest.raises(AuthorizationError):
        await booking_services.check_in_booking(fake_session, cohost, booking.id)


@pytest.mark.asyncio
async def test_get_booking_viewable_by_any_cohost_scope(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(_make_unit(host_id="host-1"), guest)
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_ONLY),
    )
    result = await booking_services.get_booking(fake_session, cohost, booking.id)
    assert result.id == booking.id


@pytest.mark.asyncio
async def test_list_host_bookings_scoped_to_managed_units(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    list_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(
        host_permissions,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-owned", "unit-cohosted"]),
    )
    monkeypatch.setattr(bookings_repository, "list_host_bookings", list_mock)

    result = await booking_services.list_host_bookings(fake_session, cohost)
    assert result == []
    _, kwargs = list_mock.call_args
    assert kwargs["unit_ids"] == ["unit-owned", "unit-cohosted"]


# ============================================================
# LISTINGS — host retrieval scoped to managed units
# ============================================================


@pytest.mark.asyncio
async def test_get_host_listings_includes_cohosted_units(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    get_units = AsyncMock(return_value=[])
    monkeypatch.setattr(
        listings_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-cohosted"]),
    )
    monkeypatch.setattr(
        listings_repository, "get_host_units_with_listings", get_units
    )

    result = await listings_services.get_host_listings(fake_session, cohost)
    assert result == []
    _, kwargs = get_units.call_args
    assert kwargs["unit_ids"] == ["unit-cohosted"]


@pytest.mark.asyncio
async def test_get_host_dashboard_uses_managed_units(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    stats_mock = AsyncMock(
        return_value={
            "total_listings": 1,
            "listed_listings": 1,
            "total_reservations": 2,
            "upcoming_reservations": 1,
            "total_revenue_egp": 0,
            "occupancy_rate_pct": 5.0,
        }
    )
    monkeypatch.setattr(
        listings_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-cohosted"]),
    )
    monkeypatch.setattr(
        listings_repository, "get_host_dashboard_stats", stats_mock
    )

    result = await listings_services.get_host_dashboard(fake_session, cohost)
    assert result.total_listings == 1
    _, kwargs = stats_mock.call_args
    assert kwargs["unit_ids"] == ["unit-cohosted"]


@pytest.mark.asyncio
async def test_get_host_reservation_calendar_uses_managed_units(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    cal_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(
        listings_services,
        "get_managed_unit_ids",
        AsyncMock(return_value=["unit-cohosted"]),
    )
    monkeypatch.setattr(
        listings_repository, "get_host_reservation_calendar", cal_mock
    )

    result = await listings_services.get_host_reservation_calendar(
        fake_session, cohost, None, _FUTURE_1, _FUTURE_2
    )
    assert result.reservations == []
    _, kwargs = cal_mock.call_args
    assert kwargs["unit_ids"] == ["unit-cohosted"]


# ============================================================
# LISTING READINESS — enforced at submit_for_review
# ============================================================


def _submit_ready_unit(status: UnitStatus = UnitStatus.DRAFT) -> Unit:
    unit = _make_unit(status=status)
    unit.address = "12 Nile St"
    listing = MagicMock()
    listing.title_ar = "شقة"
    listing.description_ar = "وصف"
    listing.base_price_egp = 500
    unit.listing = listing
    return unit


@pytest.mark.asyncio
async def test_submit_for_review_rejected_when_not_ready(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _submit_ready_unit()

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_owner_or_admin", AsyncMock()
    )

    from app.host import schemas as host_schemas
    from app.host import services as host_services

    monkeypatch.setattr(
        host_services,
        "compute_listing_readiness",
        AsyncMock(
            return_value=host_schemas.ListingReadinessResponse(
                unit_id=unit.id,
                status=str(ListingReadinessStatus.ACTION_REQUIRED),
                missing_items=["photos"],
                missing_item_labels={"photos": "At least one photo"},
                computed_at=datetime.now(UTC),
            )
        ),
    )

    with pytest.raises(ValidationError, match="not ready"):
        await listings_services.submit_for_review(fake_session, host, unit.id)


@pytest.mark.asyncio
async def test_submit_for_review_succeeds_when_ready(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _submit_ready_unit()

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_owner_or_admin", AsyncMock()
    )

    from app.host import schemas as host_schemas
    from app.host import services as host_services

    monkeypatch.setattr(
        host_services,
        "compute_listing_readiness",
        AsyncMock(
            return_value=host_schemas.ListingReadinessResponse(
                unit_id=unit.id,
                status=str(ListingReadinessStatus.READY),
                missing_items=[],
                missing_item_labels={},
                computed_at=datetime.now(UTC),
            )
        ),
    )
    set_status = AsyncMock(return_value=unit)
    monkeypatch.setattr(listings_repository, "set_unit_status", set_status)
    monkeypatch.setattr(
        listings_services, "_fetch_coordinates", AsyncMock(return_value=(30.0, 31.0))
    )
    monkeypatch.setattr(
        listings_services, "_to_listing_response", MagicMock(return_value=MagicMock())
    )

    await listings_services.submit_for_review(fake_session, host, unit.id)
    set_status.assert_awaited_once()


# ============================================================
# AVAILABILITY — co-host calendar authorization
# ============================================================


@pytest.mark.asyncio
async def test_availability_delegates_to_calendar_permission(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    manage = AsyncMock()
    monkeypatch.setattr(
        availability_services, "assert_can_manage_calendar", manage
    )

    await availability_services._assert_unit_ownership(fake_session, cohost, unit)
    manage.assert_awaited_once_with(fake_session, cohost, unit)


@pytest.mark.asyncio
async def test_availability_rejects_when_permission_denied(
    fake_session: AsyncMock, monkeypatch
) -> None:
    stranger = _make_user(user_id="stranger", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    monkeypatch.setattr(
        availability_services,
        "assert_can_manage_calendar",
        AsyncMock(side_effect=AuthorizationError("denied")),
    )

    with pytest.raises(AuthorizationError):
        await availability_services._assert_unit_ownership(
            fake_session, stranger, unit
        )


# ============================================================
# HOST EARNINGS — owner-scoped financials preserved
# ============================================================


@pytest.mark.asyncio
async def test_host_earnings_stay_scoped_to_caller(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Co-hosts calling earnings get their own (empty) financial view —
    the repository stays keyed on Payment.host_id so co-hosts never see
    the owner's revenue."""
    from app.host import repository as host_repository
    from app.host import services as host_services

    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    earnings = AsyncMock(
        return_value={
            "total_bookings": 0,
            "confirmed_bookings": 0,
            "completed_stays": 0,
            "total_revenue_egp": 0,
            "pending_verification_egp": 0,
            "refund_pending_egp": 0,
            "net_earnings_egp": 0,
            "per_unit": [],
        }
    )
    monkeypatch.setattr(host_repository, "get_host_earnings", earnings)

    result = await host_services.get_host_earnings(fake_session, cohost)
    assert result.total_revenue_egp == 0
    earnings.assert_awaited_once_with(fake_session, "cohost-1")


# ============================================================
# PHOTO REORDER
# ============================================================


def _make_photo(photo_id: str, order: int) -> MagicMock:
    photo = MagicMock()
    photo.id = photo_id
    photo.unit_id = "unit-1"
    photo.s3_key = f"listings/unit-1/{photo_id}.jpg"
    photo.url = f"https://cdn.example.com/{photo_id}.jpg"
    photo.display_order = order
    photo.is_cover = False
    photo.caption_ar = None
    return photo


@pytest.mark.asyncio
async def test_reorder_photos_success(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    p1 = _make_photo("p1", 0)
    p2 = _make_photo("p2", 1)

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_can_edit_listing", AsyncMock()
    )
    monkeypatch.setattr(
        listings_repository,
        "get_photos_by_unit",
        AsyncMock(return_value=[p1, p2]),
    )

    request = PhotoReorderRequest(
        photo_orders=[
            {"photo_id": "p2", "display_order": 0},
            {"photo_id": "p1", "display_order": 1},
        ]
    )
    result = await listings_services.reorder_photos(
        fake_session, host, "unit-1", request
    )
    assert p2.display_order == 0
    assert p1.display_order == 1
    assert [p.id for p in result] == ["p2", "p1"]


@pytest.mark.asyncio
async def test_reorder_photos_rejects_foreign_photo(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_can_edit_listing", AsyncMock()
    )
    monkeypatch.setattr(
        listings_repository,
        "get_photos_by_unit",
        AsyncMock(return_value=[_make_photo("p1", 0)]),
    )

    request = PhotoReorderRequest(
        photo_orders=[{"photo_id": "other-photo", "display_order": 0}]
    )
    with pytest.raises(NotFoundError):
        await listings_services.reorder_photos(
            fake_session, host, "unit-1", request
        )


@pytest.mark.asyncio
async def test_reorder_photos_requires_edit_permission(
    fake_session: AsyncMock, monkeypatch
) -> None:
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")

    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services,
        "assert_can_edit_listing",
        AsyncMock(side_effect=AuthorizationError("no edit")),
    )

    request = PhotoReorderRequest(
        photo_orders=[{"photo_id": "p1", "display_order": 0}]
    )
    with pytest.raises(AuthorizationError):
        await listings_services.reorder_photos(
            fake_session, cohost, "unit-1", request
        )


# ============================================================
# MESSAGING — messaging-scoped co-host joins booking conversation
# ============================================================


@pytest.mark.asyncio
async def test_messaging_cohost_joins_booking_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repo_alias
    from app.messages import repository as messages_repository
    from app.messages import services as messages_services
    from app.messages.models import Conversation

    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)

    conversation = Conversation(
        id="conv-1",
        booking_id=booking.id,
        unit_id=unit.id,
        type="reservation",
        status="active",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    conversation.participants = []

    monkeypatch.setattr(
        bookings_repo_alias,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_MESSAGING),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_participant",
        AsyncMock(return_value=None),
    )

    result = await messages_services.get_conversation_for_booking(
        fake_session, cohost, booking.id
    )
    assert result.id == "conv-1"
    # The co-host was added as a participant row
    added = [c.args[0] for c in fake_session.add.call_args_list]
    assert any(
        getattr(p, "user_id", None) == "cohost-1"
        and getattr(p, "role", None) == "co_host"
        for p in added
    )


@pytest.mark.asyncio
async def test_calendar_only_cohost_cannot_view_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repo_alias
    from app.messages import services as messages_services

    guest = _make_user(user_id="guest-1")
    cohost = _make_user(user_id="cohost-1", role=UserRole.HOST)
    booking = _make_booking(_make_unit(host_id="host-1"), guest)

    monkeypatch.setattr(
        bookings_repo_alias,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=CoHostPermissionScope.CALENDAR_ONLY),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.get_conversation_for_booking(
            fake_session, cohost, booking.id
        )
