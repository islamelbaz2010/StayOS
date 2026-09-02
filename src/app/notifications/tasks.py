import logging

from app.celery_app import celery_app
from app.database import AsyncSessionLocal

from . import consumers, services

logger = logging.getLogger(__name__)


@celery_app.task  # type: ignore[untyped-decorator]
def process_outbox_events() -> int:
    """Celery task that polls the outbox for notification events."""
    import asyncio

    return asyncio.run(consumers.poll_and_process_outbox())


@celery_app.task(  # type: ignore[untyped-decorator]
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def process_pending_notifications(self) -> int:  # type: ignore[no-untyped-def]
    """Celery task that retries pending notifications."""
    import asyncio

    async def _run() -> int:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                return await services.process_pending_notifications(session)

    try:
        return asyncio.run(_run())
    except Exception as exc:
        logger.exception("process_pending_notifications failed")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
