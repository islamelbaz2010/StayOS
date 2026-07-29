from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def mock_redis(monkeypatch) -> AsyncMock:
    client = AsyncMock()
    client.set = AsyncMock(return_value=True)
    monkeypatch.setattr("app.operations.consumers.redis_state.redis_client", client)
    return client


@pytest.mark.asyncio
async def test_process_checkout_event(mock_redis, monkeypatch) -> None:
    from app.operations import consumers, services

    event = MagicMock()
    event.id = "evt-1"
    event.aggregate_id = "res-1"
    event.event_type = "booking.checked_out"
    event.payload = {
        "reservation_id": "res-1",
        "unit_id": "unit-1",
        "checked_out_at": "2026-08-07T11:00:00+00:00",
        "next_check_in": "2026-08-08T15:00:00+00:00",
    }
    event.processed_at = None

    monkeypatch.setattr(
        services, "handle_checkout_event", AsyncMock(return_value=MagicMock())
    )

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_checkout_event.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_process_checkin_event(mock_redis, monkeypatch) -> None:
    from app.operations import consumers, services

    event = MagicMock()
    event.id = "evt-2"
    event.aggregate_id = "res-1"
    event.event_type = "booking.checked_in"
    event.payload = {"reservation_id": "res-1", "unit_id": "unit-1"}
    event.processed_at = None

    monkeypatch.setattr(services, "handle_checkin_event", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_checkin_event.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_process_cancel_event(mock_redis, monkeypatch) -> None:
    from app.operations import consumers, services

    event = MagicMock()
    event.id = "evt-3"
    event.aggregate_id = "res-1"
    event.event_type = "booking.cancelled"
    event.payload = {"reservation_id": "res-1"}
    event.processed_at = None

    monkeypatch.setattr(services, "handle_cancel_event", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_cancel_event.assert_awaited_once()
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_idempotency_skips_duplicate(mock_redis, monkeypatch) -> None:
    from app.operations import consumers, services

    mock_redis.set.return_value = False
    event = MagicMock()
    event.id = "evt-1"
    event.event_type = "booking.checked_out"
    event.payload = {}
    event.processed_at = None

    monkeypatch.setattr(services, "handle_checkout_event", AsyncMock())

    session = AsyncMock()
    await consumers.process_outbox_event(session, event)

    services.handle_checkout_event.assert_not_awaited()


@pytest.mark.asyncio
async def test_poll_and_process_outbox(monkeypatch) -> None:
    from app.operations import consumers

    event = MagicMock()
    event.id = "evt-1"
    event.event_type = "booking.checked_out"
    event.payload = {}
    event.processed_at = None

    async def _fake_session():
        pass

    with patch("app.operations.consumers.AsyncSessionLocal") as session_local:
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
