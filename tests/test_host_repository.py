from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.listings.constants import CalendarBlockType, CalendarStatus, UnitStatus
from app.listings.repository import (
    bulk_replace_calendar_rules,
    create_calendar_rule,
    delete_calendar_rule,
    get_calendar_rule_by_id,
    get_host_dashboard_stats,
    get_host_reservation_calendar,
    get_host_unit_ids,
    set_unit_status,
    update_calendar_rule,
)


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.scalar = AsyncMock(return_value=0)
    execute_result = MagicMock()
    execute_result.all = MagicMock(return_value=[])
    execute_result.scalar_one_or_none = MagicMock(return_value=None)
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[])
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    session.execute = AsyncMock(return_value=execute_result)
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_set_unit_status(fake_session: AsyncMock) -> None:
    unit = MagicMock()
    result = await set_unit_status(fake_session, unit, UnitStatus.LISTED)
    assert result is unit
    fake_session.add.assert_called_once_with(unit)
    fake_session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_get_calendar_rule_by_id(fake_session: AsyncMock) -> None:
    rule = MagicMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=rule)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_calendar_rule_by_id(fake_session, "unit-1", "rule-1")
    assert result == rule


@pytest.mark.asyncio
async def test_create_calendar_rule(fake_session: AsyncMock) -> None:
    result = await create_calendar_rule(
        fake_session,
        "unit-1",
        date(2026, 8, 1),
        date(2026, 8, 3),
        CalendarStatus.BLOCKED,
        CalendarBlockType.MAINTENANCE,
        None,
    )
    assert result.unit_id == "unit-1"
    fake_session.add.assert_called()
    fake_session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_update_calendar_rule(fake_session: AsyncMock) -> None:
    rule = MagicMock()
    result = await update_calendar_rule(
        fake_session,
        rule,
        date(2026, 8, 1),
        date(2026, 8, 5),
        CalendarStatus.BLOCKED,
        CalendarBlockType.CLEANING,
        None,
    )
    assert result is rule
    assert rule.date_from == date(2026, 8, 1)
    assert rule.date_to == date(2026, 8, 5)
    assert rule.block_type == CalendarBlockType.CLEANING


@pytest.mark.asyncio
async def test_delete_calendar_rule(fake_session: AsyncMock) -> None:
    rule = MagicMock()
    await delete_calendar_rule(fake_session, rule)
    fake_session.delete.assert_awaited_once_with(rule)


@pytest.mark.asyncio
async def test_bulk_replace_calendar_rules(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.rowcount = 0
    fake_session.execute = AsyncMock(return_value=result_mock)

    rules = [
        (
            date(2026, 8, 1),
            date(2026, 8, 3),
            CalendarStatus.BLOCKED,
            CalendarBlockType.MANUAL,
            None,
        )
    ]
    created = await bulk_replace_calendar_rules(fake_session, "unit-1", rules)
    assert len(created) == 1
    fake_session.add.assert_called()


@pytest.mark.asyncio
async def test_get_host_dashboard_stats_no_units(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[])
    fake_session.execute = AsyncMock(return_value=result_mock)

    stats = await get_host_dashboard_stats(fake_session, "host-1")
    assert stats["total_listings"] == 0
    assert stats["occupancy_rate_pct"] == 0.0


@pytest.mark.asyncio
async def test_get_host_dashboard_stats_with_units(fake_session: AsyncMock) -> None:
    def _scalar_side_effect(stmt):
        # Order of scalars: unit_ids count, total_listings, listed_listings,
        # total_reservations, upcoming_reservations, revenue, total_nights, listed_units_count
        return 1

    fake_session.scalar = AsyncMock(side_effect=_scalar_side_effect)
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[("unit-1",)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    stats = await get_host_dashboard_stats(fake_session, "host-1")
    assert stats["total_listings"] == 1
    assert stats["listed_listings"] == 1


@pytest.mark.asyncio
async def test_get_host_reservation_calendar(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[])
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_host_reservation_calendar(
        fake_session, "host-1", "unit-1", date(2026, 8, 1), date(2026, 8, 10)
    )
    assert result == []


@pytest.mark.asyncio
async def test_get_host_unit_ids(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[("unit-1",), ("unit-2",)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_host_unit_ids(fake_session, "host-1")
    assert result == ["unit-1", "unit-2"]
