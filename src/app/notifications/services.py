import logging
from collections.abc import Awaitable, Callable
from typing import Any, cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.listings import repository as listings_repository

from . import providers, repository, templates
from .constants import NotificationChannel, NotificationStatus
from .models import Notification

logger = logging.getLogger(__name__)

MAX_RETRIES = 3

_CHANNEL_DISPATCHERS: dict[str, str] = {
    NotificationChannel.WHATSAPP: "send_whatsapp",
    NotificationChannel.EMAIL: "send_email",
    NotificationChannel.SMS: "send_sms",
}


async def resolve_recipient(
    session: AsyncSession, event_type: str, payload: dict[str, Any]
) -> dict[str, Any]:
    """Resolve recipient contact details for an outbox event payload."""
    result: dict[str, Any] = {
        "phone_number": payload.get("guest_phone") or payload.get("host_phone"),
        "email": payload.get("guest_email") or payload.get("host_email"),
        "locale": payload.get("locale") or "ar",
        "name": payload.get("guest_name") or payload.get("host_name") or "Guest",
    }

    # Try to enrich from user/unit data if not present in payload.
    if not result["phone_number"] or not result["email"]:
        unit_id = payload.get("unit_id")
        if unit_id:
            unit = await listings_repository.get_unit_with_listing(session, unit_id)
            if unit:
                # In a real system host contact details would be loaded from the user table.
                result.setdefault("host_name", getattr(unit, "host_id", "Host"))

    return result


def channels_for_event(event_type: str) -> list[str]:
    """Determine default channels per event type."""
    mapping: dict[str, list[str]] = {
        "reservation.created": [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "reservation.confirmed": [NotificationChannel.EMAIL, NotificationChannel.SMS],
        "payment.failed": [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "payment.captured": [NotificationChannel.SMS],
        "booking.checked_in": [NotificationChannel.SMS],
        "booking.checked_out": [NotificationChannel.SMS],
        "booking.cancelled": [NotificationChannel.EMAIL, NotificationChannel.SMS],
    }
    return mapping.get(event_type, [NotificationChannel.EMAIL])


async def create_notifications_for_event(
    session: AsyncSession,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> list[Notification]:
    contact = await resolve_recipient(session, event_type, payload)
    locale = contact.get("locale") or "ar"
    notifications: list[Notification] = []

    for channel in channels_for_event(event_type):
        recipient = contact.get("phone_number") if channel in (
            NotificationChannel.WHATSAPP,
            NotificationChannel.SMS,
        ) else contact.get("email")
        if not recipient:
            logger.warning("No %s recipient for event %s", channel, event_id)
            continue

        subject, body = templates.render_template(
            event_type, channel, locale, {**payload, "guest_name": contact.get("name", "Guest")}
        )

        notification = await repository.create_notification(
            session=session,
            event_id=event_id,
            event_type=event_type,
            channel=channel,
            recipient=recipient,
            locale=locale,
            subject=subject,
            body=body,
        )
        notifications.append(notification)

    return notifications


async def dispatch_notification(
    session: AsyncSession, notification: Notification
) -> None:
    dispatcher_name = _CHANNEL_DISPATCHERS.get(notification.channel)
    if dispatcher_name is None:
        await repository.update_notification_status(
            session, notification, NotificationStatus.DEAD_LETTER, error="Unknown channel"
        )
        return

    await repository.update_notification_status(
        session, notification, NotificationStatus.SENDING
    )

    try:
        dispatcher = cast(
            Callable[..., Awaitable[dict[str, Any]]], getattr(providers, dispatcher_name)
        )
        await dispatcher(
            notification.recipient,
            notification.body,
            notification.locale,
            subject=notification.subject,
        )
        logger.info(
            "Notification sent: %s to %s via %s",
            notification.id,
            notification.recipient,
            notification.channel,
        )
        await repository.update_notification_status(
            session, notification, NotificationStatus.SENT
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send notification %s", notification.id)
        await repository.increment_retry(session, notification)
        if notification.retry_count >= MAX_RETRIES:
            await repository.update_notification_status(
                session,
                notification,
                NotificationStatus.DEAD_LETTER,
                error=str(exc)[:500],
            )
        else:
            await repository.update_notification_status(
                session,
                notification,
                NotificationStatus.PENDING,
                error=str(exc)[:500],
            )


async def process_pending_notifications(session: AsyncSession) -> int:
    notifications = await repository.get_pending_notifications(session)
    for notification in notifications:
        await dispatch_notification(session, notification)
    return len(notifications)
