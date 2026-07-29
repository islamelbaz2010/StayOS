from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import NotificationStatus
from .models import Notification, NotificationTemplate


async def create_notification(
    session: AsyncSession,
    event_id: str,
    event_type: str,
    channel: str,
    recipient: str,
    locale: str,
    subject: str | None,
    body: str,
) -> Notification:
    notification = Notification(
        id=str(uuid4()),
        event_id=event_id,
        event_type=event_type,
        channel=channel,
        recipient=recipient,
        locale=locale,
        status=NotificationStatus.PENDING,
        retry_count=0,
        subject=subject,
        body=body,
    )
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return notification


async def get_pending_notifications(
    session: AsyncSession, batch_size: int = 100
) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(Notification.status == NotificationStatus.PENDING)
        .order_by(Notification.created_at)
        .limit(batch_size)
    )
    return list(result.scalars().all())


async def update_notification_status(
    session: AsyncSession,
    notification: Notification,
    status: str,
    error: str | None = None,
) -> Notification:
    notification.status = status
    notification.error = error
    if status == NotificationStatus.SENT:
        notification.sent_at = datetime.now(UTC)
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return notification


async def increment_retry(
    session: AsyncSession, notification: Notification
) -> Notification:
    notification.retry_count += 1
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return notification


async def get_template(
    session: AsyncSession, event_type: str, channel: str, locale: str
) -> NotificationTemplate | None:
    result = await session.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.event_type == event_type,
            NotificationTemplate.channel == channel,
            NotificationTemplate.locale == locale,
        )
    )
    return result.scalar_one_or_none()


async def create_template(
    session: AsyncSession,
    event_type: str,
    channel: str,
    locale: str,
    body: str,
    subject: str | None = None,
    placeholders: list[str] | None = None,
) -> NotificationTemplate:
    template = NotificationTemplate(
        id=str(uuid4()),
        event_type=event_type,
        channel=channel,
        locale=locale,
        body=body,
        subject=subject,
        placeholders=placeholders or [],
    )
    session.add(template)
    await session.flush()
    await session.refresh(template)
    return template
