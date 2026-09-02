import logging

from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.shared import redis as redis_state

from . import services as messages_services

logger = logging.getLogger(__name__)

_SCHEDULE_LOCK_KEY = "messages:scheduled_messages_lock"
_SCHEDULE_LOCK_TTL_SECONDS = 3600


@celery_app.task  # type: ignore[untyped-decorator]
def process_scheduled_messages() -> int:
    """Daily Celery task that sends lifecycle automated messages.

    Uses a Redis lock so multiple workers do not double-send.
    """
    import asyncio

    return asyncio.run(_run_process_scheduled_messages())


async def _run_process_scheduled_messages() -> int:
    if redis_state.redis_client is not None:
        acquired = await redis_state.redis_client.set(
            _SCHEDULE_LOCK_KEY, "1", nx=True, ex=_SCHEDULE_LOCK_TTL_SECONDS
        )
        if not acquired:
            logger.info("Scheduled messages already running; skipping")
            return 0

    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                return await messages_services.process_scheduled_messages(session)
    except Exception:
        logger.exception("process_scheduled_messages failed")
        raise
    finally:
        if redis_state.redis_client is not None:
            await redis_state.redis_client.delete(_SCHEDULE_LOCK_KEY)
