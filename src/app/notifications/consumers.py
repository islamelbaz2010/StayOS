import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.shared import redis as redis_state
from app.shared.models import OutboxEvent

from . import services as notification_services

logger = logging.getLogger(__name__)

_RELEVANT_EVENT_TYPES = (
    "reservation.created",
    "reservation.confirmed",
    "payment.required",
    "payment.proof_uploaded",
    "payment.verified",
    "payment.rejected",
    "payment.failed",
    "payment.captured",
    "booking.checked_in",
    "booking.checked_out",
    "booking.cancelled",
)


async def _acquire_idempotency(event_id: str) -> bool:
    if not redis_state.redis_client:
        return True
    key = f"notification:{event_id}"
    result = await redis_state.redis_client.set(key, "1", nx=True, ex=3600)
    return result is not None


async def process_outbox_event(session: AsyncSession, event: OutboxEvent) -> None:
    if not await _acquire_idempotency(str(event.id)):
        logger.info("Duplicate notification event skipped: %s", event.id)
        return

    payload = dict(event.payload)
    payload.setdefault("reservation_id", event.aggregate_id)

    await notification_services.create_notifications_for_event(
        session, str(event.id), event.event_type, payload
    )
    event.processed_at = datetime.now(UTC)


async def poll_and_process_outbox(batch_size: int = 100) -> int:
    count = 0
    async with AsyncSessionLocal() as session:
        async with session.begin():
            result = await session.execute(
                select(OutboxEvent)
                .where(
                    OutboxEvent.processed_at.is_(None),
                    OutboxEvent.event_type.in_(_RELEVANT_EVENT_TYPES),
                )
                .order_by(OutboxEvent.created_at)
                .limit(batch_size)
            )
            events = result.scalars().all()
            for event in events:
                await process_outbox_event(session, event)
                count += 1
    return count
