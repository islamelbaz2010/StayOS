import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.listings.constants import CalendarStatus
from app.listings.models import CalendarRule
from app.reservations.constants import PaymentStatus, ReservationStatus
from app.reservations.models import PaymentIntent, PromoCode, Reservation
from app.reservations.repository import (
    acquire_calendar_lock,
    confirm_calendar_booking,
    count_user_reservations,
    create_payment_intent,
    create_promo_application,
    get_payment_intent_by_ref,
    get_promo_code_by_code,
    get_reservation_with_relations,
    list_user_reservations,
    release_calendar_lock,
    write_booking_event,
)


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.scalar = AsyncMock(return_value=1)
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
async def test_get_reservation_with_relations(fake_session: AsyncMock) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=1000,
        host_amount_egp=800,
        platform_fee_egp=100,
        guest_fee_egp=100,
        payment_method="fawry",
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=reservation)
    fake_session.execute = AsyncMock(return_value=result_mock)
    result = await get_reservation_with_relations(fake_session, "res-1")
    assert result == reservation


@pytest.mark.asyncio
async def test_acquire_calendar_lock(fake_session: AsyncMock) -> None:
    unit_result = MagicMock()
    unit_result.scalar_one_or_none = MagicMock(
        return_value=MagicMock(id="unit-1", host_id="host-1")
    )
    conflict_result = MagicMock()
    conflict_result.scalar_one_or_none = MagicMock(return_value=None)

    def _execute_side_effect(*args, **kwargs):
        # First call locks unit; second call checks conflicts.
        if unit_result.scalar_one_or_none.called:
            return conflict_result
        return unit_result

    fake_session.execute = AsyncMock(side_effect=_execute_side_effect)
    await acquire_calendar_lock(
        fake_session, "unit-1", "res-1", date(2026, 8, 1), date(2026, 8, 4)
    )
    fake_session.add.assert_called()


@pytest.mark.asyncio
async def test_confirm_calendar_booking(fake_session: AsyncMock) -> None:
    rule = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 4),
        status=CalendarStatus.HOLD,
        reservation_id="res-1",
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=rule)
    fake_session.execute = AsyncMock(return_value=result_mock)
    await confirm_calendar_booking(fake_session, "res-1")
    assert rule.status == CalendarStatus.BOOKED


@pytest.mark.asyncio
async def test_release_calendar_lock(fake_session: AsyncMock) -> None:
    rule = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 4),
        status=CalendarStatus.BOOKED,
        reservation_id="res-1",
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=rule)
    fake_session.execute = AsyncMock(return_value=result_mock)
    fake_session.delete = AsyncMock()
    await release_calendar_lock(fake_session, "res-1")
    fake_session.delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_payment_intent(fake_session: AsyncMock) -> None:
    result = await create_payment_intent(
        fake_session, "res-1", "paymob", "ref-1", 1000
    )
    assert result.reservation_id == "res-1"
    assert result.provider == "paymob"


@pytest.mark.asyncio
async def test_get_payment_intent_by_ref(fake_session: AsyncMock) -> None:
    intent = PaymentIntent(
        id="pi-1",
        reservation_id="res-1",
        provider="paymob",
        provider_ref="ref-1",
        amount_egp=1000,
        status=PaymentStatus.PENDING,
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=intent)
    fake_session.execute = AsyncMock(return_value=result_mock)
    result = await get_payment_intent_by_ref(fake_session, "res-1", "ref-1")
    assert result == intent


@pytest.mark.asyncio
async def test_count_user_reservations(fake_session: AsyncMock) -> None:
    fake_session.scalar = AsyncMock(return_value=5)
    result = await count_user_reservations(fake_session, ["unit-1"], None, None)
    assert result == 5


@pytest.mark.asyncio
async def test_list_user_reservations(fake_session: AsyncMock) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=1000,
        host_amount_egp=800,
        platform_fee_egp=100,
        guest_fee_egp=100,
        payment_method="fawry",
    )
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[reservation])
    result_mock = MagicMock()
    result_mock.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=result_mock)
    result = await list_user_reservations(
        fake_session, ["unit-1"], None, None, 0, 20
    )
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_promo_code_by_code(fake_session: AsyncMock) -> None:
    promo = PromoCode(
        id="promo-1",
        code="SUMMER20",
        discount_pct=20,
        is_active=True,
        max_uses=None,
        uses=0,
    )
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=promo)
    fake_session.execute = AsyncMock(return_value=result_mock)
    result = await get_promo_code_by_code(fake_session, "SUMMER20")
    assert result == promo


@pytest.mark.asyncio
async def test_create_promo_application(fake_session: AsyncMock) -> None:
    promo = PromoCode(
        id="promo-1",
        code="SUMMER20",
        discount_pct=20,
        is_active=True,
        max_uses=None,
        uses=0,
    )
    result = await create_promo_application(fake_session, "res-1", promo, 200)
    assert result.discount_amount_egp == 200
    assert promo.uses == 1


@pytest.mark.asyncio
async def test_write_booking_event(fake_session: AsyncMock) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=1000,
        host_amount_egp=800,
        platform_fee_egp=100,
        guest_fee_egp=100,
        payment_method="fawry",
    )
    fake_session.execute = AsyncMock()
    await write_booking_event(fake_session, "booking.initiated", reservation)
    fake_session.execute.assert_awaited()
