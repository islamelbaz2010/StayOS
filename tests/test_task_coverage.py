"""Small targeted tests to exercise Celery task wrappers and notification schemas."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest

from app.kyc import repository as kyc_repository
from app.kyc import tasks as kyc_tasks
from app.notifications import schemas as notification_schemas
from app.operations import tasks as ops_tasks


def test_kyc_process_kyc_document_task(monkeypatch) -> None:
    async def _run_processing(document_id: str) -> None:
        pass

    monkeypatch.setattr(kyc_tasks, "_run_processing", _run_processing)
    kyc_tasks.process_kyc_document_task.run("doc-1")


@pytest.mark.asyncio
async def test_kyc_run_processing_document_not_found(monkeypatch) -> None:
    async def _get_document(*args, **kwargs):
        return None

    monkeypatch.setattr(kyc_repository, "get_kyc_document_by_id", _get_document)
    monkeypatch.setattr(
        "app.kyc.tasks.process_kyc_document", AsyncMock(return_value=None)
    )

    # _run_processing is a coroutine; exercise it directly.
    await kyc_tasks._run_processing("doc-1")


@pytest.mark.asyncio
async def test_kyc_run_processing_already_processed(monkeypatch) -> None:
    class FakeDoc:
        status = "approved"

    async def _get_document(*args, **kwargs):
        return FakeDoc()

    monkeypatch.setattr(kyc_repository, "get_kyc_document_by_id", _get_document)
    await kyc_tasks._run_processing("doc-1")


@pytest.mark.asyncio
async def test_kyc_run_processing_pending_document(monkeypatch) -> None:
    class FakeDoc:
        status = "pending"

    async def _get_document(*args, **kwargs):
        return FakeDoc()

    monkeypatch.setattr(kyc_repository, "get_kyc_document_by_id", _get_document)
    monkeypatch.setattr(
        "app.kyc.tasks.process_kyc_document", AsyncMock(return_value=None)
    )
    await kyc_tasks._run_processing("doc-1")


def test_operations_process_outbox_events_task(monkeypatch) -> None:
    async def _mock_poll(batch_size: int) -> int:
        assert batch_size == 25
        return 7

    monkeypatch.setattr(ops_tasks, "poll_and_process_outbox", _mock_poll)
    result = ops_tasks.process_outbox_events.run(batch_size=25)
    assert result == 7


def test_operations_process_single_outbox_event_task(monkeypatch) -> None:
    async def _mock_consume(event_id: str) -> bool:
        assert event_id == "evt-1"
        return True

    monkeypatch.setattr(ops_tasks, "consume_single_event", _mock_consume)
    result = ops_tasks.process_single_outbox_event.run("evt-1")
    assert result is True


def test_operations_spawn_recurring_tasks(monkeypatch) -> None:
    sent = []

    def _fake_send_task(name: str) -> None:
        sent.append(name)

    monkeypatch.setattr(ops_tasks.celery_app, "send_task", _fake_send_task)
    ops_tasks.spawn_recurring_tasks.run()
    assert sent == ["app.finance.tasks.process_pending_payouts"]


def test_notification_response_schema() -> None:
    data = {
        "id": "notif-1",
        "event_id": "evt-1",
        "event_type": "reservation.created",
        "channel": "email",
        "recipient": "guest@example.com",
        "locale": "ar",
        "status": "pending",
        "retry_count": 0,
        "subject": "Booking",
        "body": "Your reservation is created.",
        "error": None,
        "sent_at": None,
        "created_at": datetime(2026, 1, 1, tzinfo=UTC),
    }
    response = notification_schemas.NotificationResponse(**data)
    assert response.id == "notif-1"
    assert response.channel == "email"
