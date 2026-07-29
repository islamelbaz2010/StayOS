from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def mock_redis(monkeypatch) -> AsyncMock:
    client = AsyncMock()
    client.set = AsyncMock(return_value=True)
    monkeypatch.setattr("app.finance.consumers.redis_state.redis_client", client)
    return client


def _make_event(event_type: str, payload: dict | None = None) -> MagicMock:
    event = MagicMock()
    event.id = "evt-1"
    event.aggregate_id = "res-1"
    event.event_type = event_type
    event.payload = payload or {}
    event.processed_at = None
    return event


@pytest.mark.asyncio
async def test_process_reservation_confirmed(mock_redis, monkeypatch) -> None:
    from app.finance import consumers, services

    event = _make_event("reservation.confirmed", {"reservation_id": "res-1"})
    monkeypatch.setattr(
        services, "handle_payment_confirmed", AsyncMock(return_value=MagicMock())
    )

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_payment_confirmed.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_process_checkin(mock_redis, monkeypatch) -> None:
    from app.finance import consumers, services

    event = _make_event("booking.checked_in", {"reservation_id": "res-1"})
    monkeypatch.setattr(services, "handle_checkin_event", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_checkin_event.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_process_cancel(mock_redis, monkeypatch) -> None:
    from app.finance import consumers, services

    event = _make_event("booking.cancelled", {"reservation_id": "res-1"})
    monkeypatch.setattr(services, "handle_cancel_event", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_cancel_event.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_idempotency_skips_duplicate(mock_redis, monkeypatch) -> None:
    from app.finance import consumers, services

    mock_redis.set.return_value = False
    event = _make_event("booking.payment_confirmed")
    monkeypatch.setattr(services, "handle_payment_confirmed", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_payment_confirmed.assert_not_awaited()


@pytest.mark.asyncio
async def test_poll_and_process_outbox(monkeypatch) -> None:
    from app.finance import consumers

    event = _make_event("booking.payment_confirmed")

    async def _fake_session():
        pass

    with patch("app.finance.consumers.AsyncSessionLocal") as session_local:
        session = AsyncMock()
        session.begin = MagicMock(return_value=AsyncMock())
        result = MagicMock()
        result.scalars.return_value.all.return_value = [event]
        session.execute = AsyncMock(return_value=result)
        session_local.return_value.__aenter__ = AsyncMock(return_value=session)
        session_local.return_value.__aexit__ = AsyncMock(return_value=False)

        with patch.object(consumers, "process_outbox_event", new=AsyncMock()):
            count = await consumers.poll_and_process_outbox(10)

    assert count == 1


@pytest.mark.asyncio
async def test_consume_single_event(monkeypatch) -> None:
    from app.finance import consumers

    event = _make_event("booking.checked_in")

    with patch("app.finance.consumers.AsyncSessionLocal") as session_local:
        session = AsyncMock()
        session.begin = MagicMock(return_value=AsyncMock())
        result = MagicMock()
        result.scalar_one_or_none.return_value = event
        session.execute = AsyncMock(return_value=result)
        session_local.return_value.__aenter__ = AsyncMock(return_value=session)
        session_local.return_value.__aexit__ = AsyncMock(return_value=False)

        with patch.object(consumers, "process_outbox_event", new=AsyncMock()):
            ok = await consumers.consume_single_event("evt-1")

    assert ok is True


@pytest.mark.asyncio
async def test_consume_single_event_not_found(monkeypatch) -> None:
    from app.finance import consumers

    with patch("app.finance.consumers.AsyncSessionLocal") as session_local:
        session = AsyncMock()
        session.begin = MagicMock(return_value=AsyncMock())
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)
        session_local.return_value.__aenter__ = AsyncMock(return_value=session)
        session_local.return_value.__aexit__ = AsyncMock(return_value=False)

        ok = await consumers.consume_single_event("evt-1")

    assert ok is False
