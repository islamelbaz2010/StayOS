import uuid
from unittest.mock import AsyncMock

import pytest

from app.notifications import constants as notification_constants
from app.notifications import providers, repository, services, templates
from app.notifications.models import Notification


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
