from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.repository import (
    create_booking,
    get_booking,
    get_booking_or_raise,
    list_overlapping_bookings,
    update_booking,
)
from app.shared.exceptions import NotFoundError


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return session


def _make_booking(**kwargs: object) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=kwargs.get("id") or str(uuid4()),
        unit_id=kwargs.get("unit_id") or "unit-1",
        guest_id=kwargs.get("guest_id") or "guest-1",
        status=kwargs.get("status") or BookingStatus.REQUESTED,
        check_in=kwargs.get("check_in") or date(2026, 8, 1),
        check_out=kwargs.get("check_out") or date(2026, 8, 5),
        adults=kwargs.get("adults") or 2,
        children=kwargs.get("children") or 0,
        infants=kwargs.get("infants") or 0,
        requested_at=kwargs.get("requested_at") or now,
        created_at=kwargs.get("created_at") or now,
        updated_at=kwargs.get("updated_at") or now,
    )


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_create_booking(fake_session: AsyncMock) -> None:
    booking = await create_booking(
        fake_session,
        unit_id="unit-1",
        guest_id="guest-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
        adults=2,
        children=0,
        infants=0,
    )
    assert booking.unit_id == "unit-1"
    assert booking.guest_id == "guest-1"
    assert booking.status == BookingStatus.REQUESTED
    fake_session.add.assert_called_once()
    fake_session.flush.assert_awaited()
    fake_session.refresh.assert_awaited()


@pytest.mark.asyncio
async def test_get_booking(fake_session: AsyncMock) -> None:
    booking = _make_booking(id="booking-1")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=booking)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_booking(fake_session, "booking-1")
    assert result == booking


@pytest.mark.asyncio
async def test_get_booking_or_raise_found(fake_session: AsyncMock) -> None:
    booking = _make_booking(id="booking-1")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=booking)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_booking_or_raise(fake_session, "booking-1")
    assert result == booking


@pytest.mark.asyncio
async def test_get_booking_or_raise_not_found(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=None)
    fake_session.execute = AsyncMock(return_value=result_mock)

    with pytest.raises(NotFoundError):
        await get_booking_or_raise(fake_session, "booking-1")


@pytest.mark.asyncio
async def test_list_overlapping_bookings(fake_session: AsyncMock) -> None:
    booking = _make_booking(id="booking-1")
    result_mock = MagicMock()
    result_mock.scalars = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[booking])))
    fake_session.execute = AsyncMock(return_value=result_mock)

    results = await list_overlapping_bookings(
        fake_session,
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 5),
    )
    assert len(results) == 1
    assert results[0].id == "booking-1"


@pytest.mark.asyncio
async def test_update_booking(fake_session: AsyncMock) -> None:
    booking = _make_booking(id="booking-1")
    updated = await update_booking(
        fake_session, booking, status=BookingStatus.ACCEPTED, accepted_at=datetime.now(UTC)
    )
    assert updated.status == BookingStatus.ACCEPTED
    fake_session.add.assert_called_once()
    fake_session.flush.assert_awaited()
    fake_session.refresh.assert_awaited()
