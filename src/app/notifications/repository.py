from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import NotificationChannel, NotificationStatus
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
    user_id: str | None = None,
) -> Notification:
    notification = Notification(
        id=str(uuid4()),
        event_id=event_id,
        event_type=event_type,
        channel=channel,
        recipient=recipient,
        user_id=user_id,
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


async def list_in_app_notifications(
    session: AsyncSession, user_id: str, limit: int = 50
) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(
            Notification.channel == NotificationChannel.IN_APP,
            Notification.user_id == user_id,
        )
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_unread_in_app(session: AsyncSession, user_id: str) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.channel == NotificationChannel.IN_APP,
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
    )
    return int(result.scalar_one())


async def get_in_app_notification(
    session: AsyncSession, notification_id: str, user_id: str
) -> Notification | None:
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.channel == NotificationChannel.IN_APP,
            Notification.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def mark_read(session: AsyncSession, notification: Notification) -> Notification:
    notification.read_at = datetime.now(UTC)
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return notification


async def mark_all_read(session: AsyncSession, user_id: str) -> int:
    result = await session.execute(
        update(Notification)
        .where(
            Notification.channel == NotificationChannel.IN_APP,
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(UTC))
    )
    return int(result.rowcount or 0)


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
