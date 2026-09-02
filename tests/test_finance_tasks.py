from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.finance.models import PayoutRequest


class _FakeBeginCM:
    async def __aenter__(self) -> None:
        return None

    async def __aexit__(self, *args: object) -> bool:
        return False


def _fake_session_cm_factory(session: AsyncMock):
    class _FakeSessionCM:
        async def __aenter__(self) -> AsyncMock:
            return session

        async def __aexit__(self, *args: object) -> bool:
            return False

    return _FakeSessionCM


@pytest.fixture
def fake_session() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def patch_session(monkeypatch, fake_session: AsyncMock) -> AsyncMock:
    from app.finance import tasks as finance_tasks

    fake_session.begin = MagicMock(return_value=_FakeBeginCM())
    monkeypatch.setattr(
        finance_tasks, "AsyncSessionLocal", _fake_session_cm_factory(fake_session)
    )
    return fake_session


def test_release_escrow_task(patch_session: AsyncMock, monkeypatch) -> None:
    from app.finance import services as finance_services
    from app.finance import tasks as finance_tasks

    monkeypatch.setattr(
        finance_services, "release_escrow", AsyncMock(return_value=MagicMock())
    )

    finance_tasks.release_escrow.run("escrow-123")
    finance_services.release_escrow.assert_awaited_once_with(patch_session, "escrow-123")


def test_process_payout_task(patch_session: AsyncMock, monkeypatch) -> None:
    from app.finance import services as finance_services
    from app.finance import tasks as finance_tasks

    monkeypatch.setattr(
        finance_services, "process_payout", AsyncMock(return_value=MagicMock())
    )

    finance_tasks.process_payout.run("payout-123", "paymob")
    finance_services.process_payout.assert_awaited_once_with(
        patch_session, "payout-123", "paymob"
    )


def test_process_outbox_events_task(monkeypatch) -> None:
    from app.finance import consumers as finance_consumers
    from app.finance import tasks as finance_tasks

    monkeypatch.setattr(
        finance_consumers, "poll_and_process_outbox", AsyncMock(return_value=3)
    )

    result = finance_tasks.process_outbox_events.run(10)
    assert result == 3
    finance_consumers.poll_and_process_outbox.assert_awaited_once_with(10)


def test_process_single_outbox_event_task(monkeypatch) -> None:
    from app.finance import consumers as finance_consumers
    from app.finance import tasks as finance_tasks

    monkeypatch.setattr(
        finance_consumers, "consume_single_event", AsyncMock(return_value=True)
    )

    result = finance_tasks.process_single_outbox_event.run("evt-1")
    assert result is True
    finance_consumers.consume_single_event.assert_awaited_once_with("evt-1")


def test_process_pending_payouts_task(patch_session: AsyncMock, monkeypatch) -> None:
    from app.finance import services as finance_services
    from app.finance import tasks as finance_tasks

    payout = PayoutRequest(
        id="payout-1",
        wallet_id="wallet-1",
        host_id="host-1",
        amount_egp=1000,
        status="pending",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [payout]
    patch_session.execute = AsyncMock(return_value=result_mock)
    monkeypatch.setattr(
        finance_services, "process_payout", AsyncMock(return_value=MagicMock())
    )

    count = finance_tasks.process_pending_payouts.run(10)
    assert count == 1
    finance_services.process_payout.assert_awaited_once_with(patch_session, "payout-1")
