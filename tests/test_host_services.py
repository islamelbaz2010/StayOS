import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.listings.constants import CalendarBlockType, CalendarStatus, UnitStatus
from app.listings.models import CalendarRule
from app.listings.schemas import (
    BulkAvailabilityRequest,
    BulkPricingRequest,
    CalendarRuleCreate,
    CalendarRuleUpdate,
)
from app.listings.services import (
    archive_listing,
    bulk_update_availability,
    bulk_update_pricing,
    create_host_calendar_rule,
    delete_host_calendar_rule,
    get_host_dashboard,
    get_host_reservation_calendar,
    publish_listing,
    unpublish_listing,
    update_host_calendar_rule,
)
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError

from tests.test_listings_services import _make_unit


def _make_user(
    user_id: str = "host-1",
    role: UserRole = UserRole.HOST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+1234567890",
        email="host@example.com",
        firebase_uid=None,
        display_name="Host",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_session() -> AsyncMock:
    session = AsyncMock()
    row = MagicMock(lat=30.0, lng=31.0)
    execute_result = MagicMock()
    execute_result.one = MagicMock(return_value=row)
    session.execute = AsyncMock(return_value=execute_result)
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_publish_listing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit(status=UnitStatus.UNLISTED)
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "set_unit_status", AsyncMock(return_value=unit)
    )

    result = await publish_listing(fake_session, _make_user(), "unit-1")
    assert result.id == "unit-1"
    assert result.status == UnitStatus.UNLISTED


@pytest.mark.asyncio
async def test_publish_listing_rejects_unverified_kyc(
    fake_session: AsyncMock,
) -> None:
    host = _make_user(kyc_status=KycStatus.UNVERIFIED)
    with pytest.raises(AuthorizationError):
        await publish_listing(fake_session, host, "unit-1")


@pytest.mark.asyncio
async def test_unpublish_listing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "set_unit_status", AsyncMock(return_value=unit)
    )

    result = await unpublish_listing(fake_session, _make_user(), "unit-1")
    assert result.id == "unit-1"


@pytest.mark.asyncio
async def test_archive_listing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "set_unit_status", AsyncMock(return_value=unit)
    )

    result = await archive_listing(fake_session, _make_user(), "unit-1")
    assert result.id == "unit-1"


@pytest.mark.asyncio
async def test_publish_listing_rejects_non_host(
    fake_session: AsyncMock,
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await publish_listing(fake_session, guest, "unit-1")


@pytest.mark.asyncio
async def test_publish_listing_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=None)
    )
    with pytest.raises(NotFoundError):
        await publish_listing(fake_session, _make_user(), "unit-1")


@pytest.mark.asyncio
async def test_create_host_calendar_rule(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rule = CalendarRule(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
        block_type=CalendarBlockType.MAINTENANCE,
        price_override=None,
    )
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "create_calendar_rule", AsyncMock(return_value=rule)
    )

    request = CalendarRuleCreate(
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
        block_type=CalendarBlockType.MAINTENANCE,
    )
    result = await create_host_calendar_rule(fake_session, _make_user(), "unit-1", request)
    assert result.status == CalendarStatus.BLOCKED
    assert result.block_type == CalendarBlockType.MAINTENANCE


@pytest.mark.asyncio
async def test_create_host_calendar_rule_defaults_block_type(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings

    unit = _make_unit()
    rule = CalendarRule(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
        block_type=CalendarBlockType.MANUAL,
        price_override=None,
    )
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "create_calendar_rule", AsyncMock(return_value=rule)
    )

    request = CalendarRuleCreate(
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
    )
    result = await create_host_calendar_rule(fake_session, _make_user(), "unit-1", request)
    assert result.block_type == CalendarBlockType.MANUAL


@pytest.mark.asyncio
async def test_update_host_calendar_rule(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rule = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
        block_type=CalendarBlockType.CLEANING,
        price_override=None,
    )
    updated = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 4),
        status=CalendarStatus.BLOCKED,
        block_type=CalendarBlockType.CLEANING,
        price_override=None,
    )
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "get_calendar_rule_by_id", AsyncMock(return_value=rule)
    )
    monkeypatch.setattr(
        listings.repository, "update_calendar_rule", AsyncMock(return_value=updated)
    )

    request = CalendarRuleUpdate(date_to=date(2026, 8, 4))
    result = await update_host_calendar_rule(
        fake_session, _make_user(), "unit-1", "rule-1", request
    )
    assert result.date_to == date(2026, 8, 4)


@pytest.mark.asyncio
async def test_delete_host_calendar_rule(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rule = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.BLOCKED,
    )
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "get_calendar_rule_by_id", AsyncMock(return_value=rule)
    )
    monkeypatch.setattr(
        listings.repository, "delete_calendar_rule", AsyncMock()
    )

    await delete_host_calendar_rule(fake_session, _make_user(), "unit-1", "rule-1")


@pytest.mark.asyncio
async def test_bulk_update_availability(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    created = [
        CalendarRule(
            id=str(uuid.uuid4()),
            unit_id="unit-1",
            date_from=date(2026, 8, 1),
            date_to=date(2026, 8, 3),
            status=CalendarStatus.BLOCKED,
            block_type=CalendarBlockType.CLEANING,
        )
    ]
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "bulk_replace_calendar_rules", AsyncMock(return_value=created)
    )

    request = BulkAvailabilityRequest(
        rules=[
            {
                "date_from": date(2026, 8, 1),
                "date_to": date(2026, 8, 3),
                "status": CalendarStatus.BLOCKED,
                "block_type": CalendarBlockType.CLEANING,
            }
        ]
    )
    result = await bulk_update_availability(fake_session, _make_user(), "unit-1", request)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_bulk_update_pricing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    created = [
        CalendarRule(
            id=str(uuid.uuid4()),
            unit_id="unit-1",
            date_from=date(2026, 8, 1),
            date_to=date(2026, 8, 3),
            status=CalendarStatus.AVAILABLE,
            price_override=2500,
        )
    ]
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "bulk_replace_calendar_rules", AsyncMock(return_value=created)
    )

    request = BulkPricingRequest(
        rules=[
            {"date_from": date(2026, 8, 1), "date_to": date(2026, 8, 3), "price_override": 2500}
        ]
    )
    result = await bulk_update_pricing(fake_session, _make_user(), "unit-1", request)
    assert len(result) == 1
    assert result[0].price_override == 2500


@pytest.mark.asyncio
async def test_get_host_dashboard(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    monkeypatch.setattr(
        listings.repository,
        "get_host_dashboard_stats",
        AsyncMock(
            return_value={
                "total_listings": 3,
                "listed_listings": 2,
                "total_reservations": 10,
                "upcoming_reservations": 4,
                "total_revenue_egp": 50000,
                "occupancy_rate_pct": 12.5,
            }
        ),
    )

    result = await get_host_dashboard(fake_session, _make_user())
    assert result.total_listings == 3
    assert result.total_revenue_egp == 50000


@pytest.mark.asyncio
async def test_get_host_reservation_calendar(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    calendar_row = type("Row", (), {
        "id": "res-1",
        "unit_id": "unit-1",
        "guest_id": "guest-1",
        "status": "CONFIRMED",
        "check_in": date(2026, 8, 1),
        "check_out": date(2026, 8, 4),
        "total_amount_egp": 4500,
    })
    monkeypatch.setattr(
        listings.repository,
        "get_host_reservation_calendar",
        AsyncMock(return_value=[calendar_row()]),
    )

    result = await get_host_reservation_calendar(
        fake_session, _make_user(), "unit-1", date(2026, 8, 1), date(2026, 8, 10)
    )
    assert len(result.reservations) == 1
    assert result.reservations[0].reservation_id == "res-1"


@pytest.mark.asyncio
async def test_get_host_reservation_calendar_validation(
    fake_session: AsyncMock,
) -> None:
    with pytest.raises(ValidationError):
        await get_host_reservation_calendar(
            fake_session, _make_user(), None, date(2026, 8, 10), date(2026, 8, 1)
        )
