import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.shared import redis as redis_state
from app.shared.models import OutboxEvent

from . import services as finance_services

logger = logging.getLogger(__name__)

CONSUMER_NAME = "finance"


async def _acquire_idempotency(event_id: str) -> bool:
    client = redis_state.redis_client
    if client is None:
        return True
    result = await client.set(
        f"event:{CONSUMER_NAME}:{event_id}", "1", nx=True, ex=86400
    )
    return bool(result)


async def _release_idempotency(event_id: str) -> None:
    """Undo the pre-processing idempotency claim when the handler fails.

    The key is acquired BEFORE the handler runs so a crashing handler would
    otherwise leave the event permanently skipped-but-unprocessed until the
    24h TTL lapses — releasing it lets the next poll retry the event."""
    client = redis_state.redis_client
    if client is None:
        return
    try:
        await client.delete(f"event:{CONSUMER_NAME}:{event_id}")
    except Exception:
        logger.exception(
            "Failed to release idempotency key for outbox event %s", event_id
        )


async def process_outbox_event(session: AsyncSession, event: OutboxEvent) -> None:
    if not await _acquire_idempotency(str(event.id)):
        return

    payload = dict(event.payload)
    payload.setdefault("aggregate_id", event.aggregate_id)

    if event.event_type == "booking.payment_confirmed":
        await finance_services.handle_payment_confirmed(session, payload)
    elif event.event_type == "reservation.confirmed":
        await finance_services.handle_payment_confirmed(session, payload)
    elif event.event_type == "booking.checked_in":
        await finance_services.handle_checkin_event(session, payload)
    elif event.event_type == "booking.cancelled":
        await finance_services.handle_cancel_event(session, payload)

    processed_by = list(event.processed_by or [])
    if CONSUMER_NAME not in processed_by:
        processed_by.append(CONSUMER_NAME)
    event.processed_by = processed_by
    event.processed_at = datetime.now(UTC)


async def poll_and_process_outbox(batch_size: int = 100) -> int:
    event_types = (
        "booking.payment_confirmed",
        "reservation.confirmed",
        "booking.checked_in",
        "booking.cancelled",
    )
    async with AsyncSessionLocal() as session:
        async with session.begin():
            result = await session.execute(
                select(OutboxEvent)
                .where(
                    ~OutboxEvent.processed_by.contains([CONSUMER_NAME]),
                    OutboxEvent.event_type.in_(event_types),
                )
                .limit(batch_size)
                .with_for_update(skip_locked=True)
            )
            events = result.scalars().all()
            processed = 0
            for event in events:
                try:
                    async with session.begin_nested():
                        await process_outbox_event(session, event)
                    processed += 1
                except Exception:
                    logger.exception(
                        "Outbox event %s (%s) failed for consumer %s",
                        event.id,
                        event.event_type,
                        CONSUMER_NAME,
                    )
                    await _release_idempotency(str(event.id))
            return processed


async def consume_single_event(event_id: str) -> bool:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            result = await session.execute(
                select(OutboxEvent).where(OutboxEvent.id == event_id)
            )
            event = result.scalar_one_or_none()
            if event is None:
                return False
            try:
                await process_outbox_event(session, event)
            except Exception:
                await _release_idempotency(str(event.id))
                raise
            return True
