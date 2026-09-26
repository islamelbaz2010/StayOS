import logging
from collections.abc import Awaitable, Callable
from typing import Any, cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.listings import repository as listings_repository

from . import providers, repository, templates
from .constants import (
    LOCKED_NOTIFICATION_CATEGORIES,
    NotificationChannel,
    NotificationStatus,
    category_for_event,
)
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
        "reservation.created": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "reservation.confirmed": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        "payment.required": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "payment.proof_uploaded": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "payment.verified": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        "payment.rejected": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "payment.failed": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
        "payment.captured": [NotificationChannel.IN_APP, NotificationChannel.SMS],
        "booking.checked_in": [NotificationChannel.IN_APP, NotificationChannel.SMS],
        "booking.checked_out": [NotificationChannel.IN_APP, NotificationChannel.SMS],
        "booking.cancelled": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        "booking.no_show": [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        "message.received": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "listing.approved": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "listing.rejected": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "listing.edit_approved": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "listing.edit_rejected": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    }
    return mapping.get(event_type, [NotificationChannel.IN_APP, NotificationChannel.EMAIL])


_IN_APP_HOST_EVENTS = {
    "listing.approved",
    "listing.rejected",
    "listing.edit_approved",
    "listing.edit_rejected",
}


def _in_app_user_id(
    event_type: str, payload: dict[str, Any], contact: dict[str, Any]
) -> str | None:
    """Resolve the in-app recipient user id for an event.

    Contact-level ``user_id`` (multi-recipient payloads) wins; otherwise the
    payload party matching the event semantics is used.
    """
    if contact.get("user_id"):
        return str(contact["user_id"])
    if event_type in _IN_APP_HOST_EVENTS:
        value = payload.get("host_id")
        return str(value) if value else None
    if event_type == "booking.cancelled":
        cancelled_by = payload.get("cancelled_by")
        if cancelled_by in ("host", "admin", "system"):
            value = payload.get("guest_id")
        else:
            value = payload.get("host_id")
        return str(value) if value else None
    value = payload.get("guest_id") or payload.get("host_id")
    return str(value) if value else None


async def create_notifications_for_event(
    session: AsyncSession,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> list[Notification]:
    notifications: list[Notification] = []

    # Some events (e.g. new in-app messages) may have multiple recipients.
    recipients = payload.get("recipients")
    if isinstance(recipients, list) and recipients:
        for recipient in recipients:
            notifications.extend(
                await _create_notifications_for_contact(
                    session,
                    event_id,
                    event_type,
                    payload,
                    contact=recipient,
                )
            )
        return notifications

    contact = await resolve_recipient(session, event_type, payload)
    return await _create_notifications_for_contact(
        session,
        event_id,
        event_type,
        payload,
        contact=contact,
    )


async def _user_allows_notification(
    session: AsyncSession, user_id: str | None, event_type: str
) -> bool:
    """Enforce per-category notification preferences (R1).

    Locked categories always deliver. Toggleable categories read the
    user's stored opt-out map; when the recipient cannot be resolved to a
    user the contact-level delivery stands (e.g. a guest without an
    account).
    """
    if category_for_event(event_type) in LOCKED_NOTIFICATION_CATEGORIES:
        return True
    if not user_id:
        return True
    recipient_user = await auth_repository.get_user_by_id(session, user_id)
    if recipient_user is None:
        return True
    prefs = recipient_user.notification_preferences or {}
    return bool(prefs.get(category_for_event(event_type), True))


async def _create_notifications_for_contact(
    session: AsyncSession,
    event_id: str,
    event_type: str,
    payload: dict[str, Any],
    contact: dict[str, Any],
) -> list[Notification]:
    locale = contact.get("locale") or "ar"
    notifications: list[Notification] = []

    user_id = _in_app_user_id(event_type, payload, contact)
    if not await _user_allows_notification(session, user_id, event_type):
        return notifications

    for channel in channels_for_event(event_type):
        if channel == NotificationChannel.IN_APP:
            if not user_id:
                logger.warning("No in-app user for event %s", event_id)
                continue
            recipient = user_id
            template_channel = NotificationChannel.EMAIL
        else:
            recipient = contact.get("phone_number") if channel in (
                NotificationChannel.WHATSAPP,
                NotificationChannel.SMS,
            ) else contact.get("email")
            template_channel = channel
        if not recipient:
            logger.warning("No %s recipient for event %s", channel, event_id)
            continue

        try:
            subject, body = templates.render_template(
                event_type, template_channel, locale, {**payload, "guest_name": contact.get("name", "Guest")}
            )
        except ValueError:
            if channel == NotificationChannel.IN_APP:
                logger.warning("No template for in-app event %s", event_id)
                continue
            raise

        notification = await repository.create_notification(
            session=session,
            event_id=event_id,
            event_type=event_type,
            channel=channel,
            recipient=recipient,
            user_id=user_id,
            locale=locale,
            subject=subject,
            body=body,
        )
        notifications.append(notification)

    return notifications


async def dispatch_notification(
    session: AsyncSession, notification: Notification
) -> None:
    if notification.channel == NotificationChannel.IN_APP:
        await repository.update_notification_status(
            session, notification, NotificationStatus.SENT
        )
        return
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
