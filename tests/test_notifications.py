import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from app.listings import repository as listings_repository
from app.notifications import constants as notification_constants
from app.notifications import consumers, providers, repository, services, templates
from app.notifications import tasks as notification_tasks
from app.notifications.models import Notification, NotificationTemplate
from app.shared.models import OutboxEvent


def test_render_template_arabic_reservation_created() -> None:
    subject, body = templates.render_template(
        "reservation.created",
        "email",
        "ar",
        {"reservation_id": "res-1", "guest_name": "أحمد"},
    )
    assert subject is not None
    assert "res-1" in body
    assert "أحمد" in body


def test_render_template_fallback_to_english() -> None:
    subject, body = templates.render_template(
        "reservation.created",
        "email",
        "fr",
        {"reservation_id": "res-2", "guest_name": "John"},
    )
    assert "res-2" in body
    assert "John" in body


def test_render_template_booking_cancelled_populates_refund_days() -> None:
    """refund_days = 5 (decided value) must actually reach the guest-facing
    cancellation message, not render as an unfilled {{refund_days}} — the bug
    tracked in docs/legal/LEGAL_GAP_REGISTER.md P0-4."""
    _, body_en = templates.render_template(
        "booking.cancelled",
        "email",
        "en",
        {"reservation_id": "res-3", "refund_days": 5},
    )
    assert "{{refund_days}}" not in body_en
    assert "within 5 business days" in body_en

    _, body_ar = templates.render_template(
        "booking.cancelled",
        "email",
        "ar",
        {"reservation_id": "res-3", "refund_days": 5},
    )
    assert "{{refund_days}}" not in body_ar
    assert "خلال 5 أيام عمل" in body_ar


def test_render_template_booking_cancelled_blank_when_refund_days_missing() -> None:
    """Documents the pre-fix failure mode: render_template silently substitutes an
    empty string for an absent template variable rather than leaving the literal
    placeholder — this is why the payload must always include refund_days, not why
    the template itself needed to change."""
    _, body = templates.render_template(
        "booking.cancelled", "email", "en", {"reservation_id": "res-4"}
    )
    assert "{{refund_days}}" not in body
    assert "within  business days" in body


@pytest.mark.asyncio
async def test_send_whatsapp_test_environment() -> None:
    result = await providers.send_whatsapp(
        "+201012345678", "test body", locale="ar", subject=None
    )
    assert result["status"] == "sent"
    assert result["channel"] == "whatsapp"


@pytest.mark.asyncio
async def test_send_email_test_environment() -> None:
    result = await providers.send_email(
        "user@example.com", "subject", "body", _locale="ar"
    )
    assert result["status"] == "sent"
    assert result["channel"] == "email"


@pytest.mark.asyncio
async def test_send_sms_test_environment() -> None:
    result = await providers.send_sms("+201012345678", "body", _locale="ar")
    assert result["status"] == "sent"
    assert result["channel"] == "sms"


@pytest.mark.asyncio
async def test_resolve_recipient_from_payload() -> None:
    session = AsyncMock()
    contact = await services.resolve_recipient(
        session,
        "reservation.created",
        {
            "guest_phone": "+201012345678",
            "guest_email": "guest@example.com",
            "guest_name": "Guest",
            "locale": "en",
        },
    )
    assert contact["phone_number"] == "+201012345678"
    assert contact["email"] == "guest@example.com"
    assert contact["locale"] == "en"


@pytest.mark.asyncio
async def test_create_notifications_for_event(monkeypatch) -> None:
    async def _mock_create_notification(**kwargs) -> Notification:
        return Notification(
            id=str(uuid.uuid4()),
            event_id=kwargs["event_id"],
            event_type=kwargs["event_type"],
            channel=kwargs["channel"],
            recipient=kwargs["recipient"],
            locale=kwargs["locale"],
            status=notification_constants.NotificationStatus.PENDING,
            subject=kwargs.get("subject"),
            body=kwargs["body"],
        )

    monkeypatch.setattr(repository, "create_notification", _mock_create_notification)

    session = AsyncMock()
    notifications = await services.create_notifications_for_event(
        session,
        "evt-1",
        "reservation.created",
        {
            "guest_phone": "+201012345678",
            "guest_email": "guest@example.com",
            "guest_name": "Guest",
            "locale": "en",
            "reservation_id": "res-1",
        },
    )
    assert notifications
    channels = {n.channel for n in notifications}
    assert notification_constants.NotificationChannel.EMAIL in channels
    assert notification_constants.NotificationStatus.PENDING in {n.status for n in notifications}


@pytest.mark.asyncio
async def test_dispatch_notification_success(monkeypatch) -> None:
    async def _mock_update_status(session, notification, status, error=None):
        notification.status = status
        notification.error = error
        return notification

    async def _mock_increment(session, notification):
        notification.retry_count += 1
        return notification

    monkeypatch.setattr(repository, "update_notification_status", _mock_update_status)
    monkeypatch.setattr(repository, "increment_retry", _mock_increment)

    notification = Notification(
        id=str(uuid.uuid4()),
        event_id="evt-1",
        event_type="reservation.confirmed",
        channel="sms",
        recipient="+201012345678",
        locale="ar",
        body="confirmed",
        retry_count=0,
    )
    session = AsyncMock()
    await services.dispatch_notification(session, notification)
    assert notification.status == notification_constants.NotificationStatus.SENT


@pytest.mark.asyncio
async def test_dispatch_notification_retries_then_dead_letter(monkeypatch) -> None:
    async def _always_fail(*args, **kwargs) -> dict[str, str]:
        raise RuntimeError("provider down")

    async def _mock_update_status(session, notification, status, error=None):
        notification.status = status
        notification.error = error
        return notification

    async def _mock_increment(session, notification):
        notification.retry_count += 1
        return notification

    monkeypatch.setattr(providers, "send_sms", _always_fail)
    monkeypatch.setattr(repository, "update_notification_status", _mock_update_status)
    monkeypatch.setattr(repository, "increment_retry", _mock_increment)

    notification = Notification(
        id=str(uuid.uuid4()),
        event_id="evt-1",
        event_type="reservation.confirmed",
        channel="sms",
        recipient="+201012345678",
        locale="ar",
        body="confirmed",
        retry_count=3,
    )
    session = AsyncMock()
    await services.dispatch_notification(session, notification)
    assert notification.status == notification_constants.NotificationStatus.DEAD_LETTER


# ============================================================
# REPOSITORY COVERAGE
# ============================================================

def _make_notification(**kwargs) -> Notification:
    now = datetime.now(UTC)
    return Notification(
        id=kwargs.get("id", str(uuid.uuid4())),
        event_id=kwargs.get("event_id", "evt-1"),
        event_type=kwargs.get("event_type", "reservation.created"),
        channel=kwargs.get("channel", "email"),
        recipient=kwargs.get("recipient", "guest@example.com"),
        locale=kwargs.get("locale", "en"),
        status=kwargs.get("status", notification_constants.NotificationStatus.PENDING),
        subject=kwargs.get("subject"),
        body=kwargs.get("body", "Hello"),
        retry_count=kwargs.get("retry_count", 0),
        created_at=kwargs.get("created_at", now),
        updated_at=kwargs.get("updated_at", now),
    )


@pytest.mark.asyncio
async def test_create_notification(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    notification = await repository.create_notification(
        fake_session,
        event_id="evt-1",
        event_type="reservation.created",
        channel="email",
        recipient="guest@example.com",
        locale="en",
        subject="Reservation created",
        body="Hello",
    )
    assert notification.status == notification_constants.NotificationStatus.PENDING
    assert fake_session.add.called
    assert fake_session.flush.await_count == 1


@pytest.mark.asyncio
async def test_get_pending_notifications(fake_session: AsyncMock) -> None:
    notification = _make_notification()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [notification]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await repository.get_pending_notifications(fake_session)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_update_notification_status(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    notification = _make_notification()
    result = await repository.update_notification_status(
        fake_session, notification, notification_constants.NotificationStatus.SENT
    )
    assert result.status == notification_constants.NotificationStatus.SENT
    assert result.sent_at is not None
    assert fake_session.add.called


@pytest.mark.asyncio
async def test_increment_retry(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    notification = _make_notification(retry_count=0)
    result = await repository.increment_retry(fake_session, notification)
    assert result.retry_count == 1
    assert fake_session.add.called


@pytest.mark.asyncio
async def test_get_template(fake_session: AsyncMock) -> None:
    template = NotificationTemplate(
        id=str(uuid.uuid4()),
        event_type="reservation.created",
        channel="email",
        locale="en",
        body="Hello {{name}}",
        subject="Reservation",
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = template
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await repository.get_template(fake_session, "reservation.created", "email", "en")
    assert result == template


@pytest.mark.asyncio
async def test_create_template(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    template = await repository.create_template(
        fake_session,
        event_type="payment.verified",
        channel="email",
        locale="en",
        body="Payment verified",
        subject="Verified",
    )
    assert template.event_type == "payment.verified"
    assert fake_session.add.called


# ============================================================
# PROVIDER COVERAGE
# ============================================================

def _fake_client_with_success_response():
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json = MagicMock(return_value={"id": "msg-1"})

    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        post = AsyncMock(return_value=response)

    return _FakeClient


def _fake_client_with_failure():
    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        post = AsyncMock(side_effect=httpx.ConnectError("network down"))

    return _FakeClient


def _fake_httpx_module(client_class):
    return type("H", (), {
        "AsyncClient": client_class,
        "TimeoutException": httpx.TimeoutException,
        "HTTPError": httpx.HTTPError,
    })()


@pytest.mark.asyncio
async def test_post_with_retry_exhausted_then_raises(monkeypatch) -> None:
    monkeypatch.setattr(providers.asyncio, "sleep", AsyncMock())
    monkeypatch.setattr(
        providers, "httpx", _fake_httpx_module(_fake_client_with_failure())
    )
    with pytest.raises(providers.NotificationError):
        await providers._post_with_retry("http://example.com", {}, {})


@pytest.mark.asyncio
async def test_post_with_retry_timeout_then_raises(monkeypatch) -> None:
    class _TimeoutClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        post = AsyncMock(side_effect=httpx.TimeoutException("timeout"))

    monkeypatch.setattr(providers.asyncio, "sleep", AsyncMock())
    monkeypatch.setattr(providers, "httpx", _fake_httpx_module(_TimeoutClient))
    with pytest.raises(providers.NotificationError):
        await providers._post_with_retry("http://example.com", {}, {})


@pytest.mark.asyncio
async def test_send_whatsapp_non_test_environment(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "META_WHATSAPP_TOKEN", "token")
    monkeypatch.setattr(providers.settings, "META_PHONE_NUMBER_ID", "phone-id")
    monkeypatch.setattr(providers, "httpx", _fake_httpx_module(_fake_client_with_success_response()))
    result = await providers.send_whatsapp("+201012345678", "hello")
    assert result["id"] == "msg-1"


@pytest.mark.asyncio
async def test_send_whatsapp_not_configured(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "META_WHATSAPP_TOKEN", "")
    with pytest.raises(providers.NotificationError):
        await providers.send_whatsapp("+201012345678", "hello")


@pytest.mark.asyncio
async def test_send_email_non_test_environment(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "AWS_ACCESS_KEY_ID", "key")
    monkeypatch.setattr(providers.settings, "AWS_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setattr(providers.settings, "AWS_REGION", "us-east-1")
    monkeypatch.setattr(providers, "httpx", _fake_httpx_module(_fake_client_with_success_response()))
    result = await providers.send_email("user@example.com", "subject", "body")
    assert result["id"] == "msg-1"


@pytest.mark.asyncio
async def test_send_email_not_configured(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "AWS_ACCESS_KEY_ID", "")
    with pytest.raises(providers.NotificationError):
        await providers.send_email("user@example.com", "subject", "body")


@pytest.mark.asyncio
async def test_send_sms_non_test_environment(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "TWILIO_ACCOUNT_SID", "sid")
    monkeypatch.setattr(providers.settings, "TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setattr(providers, "httpx", _fake_httpx_module(_fake_client_with_success_response()))
    result = await providers.send_sms("+201012345678", "hello")
    assert result["id"] == "msg-1"


@pytest.mark.asyncio
async def test_send_sms_not_configured(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "TWILIO_ACCOUNT_SID", "")
    with pytest.raises(providers.NotificationError):
        await providers.send_sms("+201012345678", "hello")


# ============================================================
# NOTIFICATIONS SERVICES & CONSUMERS COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_resolve_recipient_enriches_from_unit(monkeypatch) -> None:
    unit = MagicMock()
    unit.host_id = "host-1"
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    contact = await services.resolve_recipient(
        AsyncMock(),
        "payment.required",
        {"unit_id": "unit-1"},
    )
    assert contact["host_name"] == "host-1"


def test_channels_for_event_unknown_defaults_to_email() -> None:
    assert services.channels_for_event("unknown.event") == ["email"]


@pytest.mark.asyncio
async def test_create_notifications_for_event_with_recipients(monkeypatch) -> None:
    async def _mock_create_notification(**kwargs) -> Notification:
        return _make_notification(
            event_id=kwargs["event_id"],
            event_type=kwargs["event_type"],
            channel=kwargs["channel"],
            recipient=kwargs["recipient"],
            locale=kwargs["locale"],
            subject=kwargs.get("subject"),
            body=kwargs["body"],
        )

    monkeypatch.setattr(repository, "create_notification", _mock_create_notification)
    notifications = await services.create_notifications_for_event(
        AsyncMock(),
        "evt-1",
        "message.received",
        {
            "recipients": [
                {"phone_number": "+201000000001", "email": "a@x.com", "locale": "en", "name": "A"},
                {"phone_number": "+201000000002", "email": "b@x.com", "locale": "ar", "name": "B"},
            ],
            "reservation_id": "res-1",
        },
    )
    assert len(notifications) == 2


@pytest.mark.asyncio
async def test_create_notifications_for_event_skips_missing_recipient(monkeypatch) -> None:
    async def _mock_create_notification(**kwargs) -> Notification:
        return _make_notification(**kwargs)

    monkeypatch.setattr(repository, "create_notification", _mock_create_notification)
    notifications = await services.create_notifications_for_event(
        AsyncMock(),
        "evt-1",
        "payment.required",
        {
            "reservation_id": "res-1",
            "guest_name": "Guest",
        },
    )
    assert notifications == []


@pytest.mark.asyncio
async def test_dispatch_notification_unknown_channel(monkeypatch) -> None:
    async def _mock_update_status(session, notification, status, error=None):
        notification.status = status
        notification.error = error
        return notification

    monkeypatch.setattr(repository, "update_notification_status", _mock_update_status)
    notification = _make_notification(channel="push")
    session = AsyncMock()
    await services.dispatch_notification(session, notification)
    assert notification.status == notification_constants.NotificationStatus.DEAD_LETTER
    assert notification.error == "Unknown channel"


@pytest.mark.asyncio
async def test_dispatch_notification_retries_then_pending(monkeypatch) -> None:
    async def _always_fail(*args, **kwargs) -> dict[str, str]:
        raise RuntimeError("provider down")

    async def _mock_update_status(session, notification, status, error=None):
        notification.status = status
        notification.error = error
        return notification

    async def _mock_increment(session, notification):
        notification.retry_count += 1
        return notification

    monkeypatch.setattr(providers, "send_email", _always_fail)
    monkeypatch.setattr(repository, "update_notification_status", _mock_update_status)
    monkeypatch.setattr(repository, "increment_retry", _mock_increment)
    notification = _make_notification(
        channel=notification_constants.NotificationChannel.EMAIL,
        retry_count=0,
    )
    session = AsyncMock()
    await services.dispatch_notification(session, notification)
    assert notification.status == notification_constants.NotificationStatus.PENDING
    assert notification.retry_count == 1


@pytest.mark.asyncio
async def test_process_pending_notifications(monkeypatch) -> None:
    notification = _make_notification()
    monkeypatch.setattr(
        repository,
        "get_pending_notifications",
        AsyncMock(return_value=[notification]),
    )
    monkeypatch.setattr(
        services,
        "dispatch_notification",
        AsyncMock(),
    )
    count = await services.process_pending_notifications(AsyncMock())
    assert count == 1
    services.dispatch_notification.assert_awaited_once()


@pytest.mark.asyncio
async def test_process_outbox_event_relevant(monkeypatch) -> None:
    event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_id="agg-1",
        event_type="payment.required",
        payload={"guest_phone": "+201000000000"},
        created_at=datetime.now(UTC),
        processed_at=None,
    )
    create_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(services, "create_notifications_for_event", create_mock)
    await consumers.process_outbox_event(AsyncMock(), event)
    assert create_mock.awaited
    assert event.processed_at is not None


@pytest.mark.asyncio
async def test_process_outbox_event_duplicate(monkeypatch) -> None:
    event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_id="agg-1",
        event_type="payment.required",
        payload={},
        created_at=datetime.now(UTC),
        processed_at=None,
    )
    monkeypatch.setattr(consumers, "_acquire_idempotency", AsyncMock(return_value=False))
    create_mock = AsyncMock()
    monkeypatch.setattr(services, "create_notifications_for_event", create_mock)
    await consumers.process_outbox_event(AsyncMock(), event)
    create_mock.assert_not_awaited()
    assert event.processed_at is None


@pytest.mark.asyncio
async def test_poll_and_process_outbox(monkeypatch) -> None:
    event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_id="agg-1",
        event_type="payment.required",
        payload={},
        created_at=datetime.now(UTC),
        processed_at=None,
    )
    mock_session = MagicMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [event]
    mock_session.execute = AsyncMock(return_value=mock_result)
    async_cm = MagicMock()
    async_cm.__aenter__ = AsyncMock(return_value=mock_session)
    async_cm.__aexit__ = AsyncMock(return_value=False)

    class _FakeSessionLocal:
        async def __aenter__(self):
            return mock_session

        async def __aexit__(self, *args):
            return False

    monkeypatch.setattr(
        "app.notifications.consumers.AsyncSessionLocal",
        _FakeSessionLocal,
    )
    process_mock = AsyncMock()
    monkeypatch.setattr(consumers, "process_outbox_event", process_mock)
    count = await consumers.poll_and_process_outbox(10)
    assert count == 1
    process_mock.assert_awaited_once()


def test_process_outbox_events_task_runs(monkeypatch) -> None:
    async def _fake_poll(*args, **kwargs):
        return 3

    monkeypatch.setattr(consumers, "poll_and_process_outbox", _fake_poll)
    result = notification_tasks.process_outbox_events.run()
    assert result == 3


def test_process_pending_notifications_task_retries_on_error(monkeypatch) -> None:
    class _FakeSessionLocal:
        async def __aenter__(self):
            return MagicMock()

        async def __aexit__(self, *args):
            return False

    monkeypatch.setattr(
        notification_tasks, "AsyncSessionLocal", _FakeSessionLocal
    )
    async def _raise(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(
        notification_tasks.services, "process_pending_notifications", _raise
    )
    retry_mock = MagicMock(return_value=RuntimeError("retry"))
    monkeypatch.setattr(notification_tasks.process_pending_notifications, "retry", retry_mock)

    with pytest.raises(RuntimeError, match="retry"):
        notification_tasks.process_pending_notifications.run()


@pytest.mark.asyncio
async def test_post_with_retry_zero_attempts_raises(monkeypatch) -> None:
    monkeypatch.setattr(providers, "_MAX_RETRIES", 0)
    with pytest.raises(providers.NotificationError):
        await providers._post_with_retry("http://example.com", {}, {})


@pytest.mark.asyncio
async def test_acquire_idempotency_with_redis_unavailable(monkeypatch) -> None:
    redis_client = AsyncMock()
    redis_client.set = AsyncMock(return_value=None)
    monkeypatch.setattr("app.shared.redis.redis_client", redis_client)
    acquired = await consumers._acquire_idempotency("evt-1")
    assert acquired is False


@pytest.mark.asyncio
async def test_acquire_idempotency_without_redis(monkeypatch) -> None:
    monkeypatch.setattr("app.shared.redis.redis_client", None)
    acquired = await consumers._acquire_idempotency("evt-1")
    assert acquired is True
