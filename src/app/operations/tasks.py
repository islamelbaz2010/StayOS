import asyncio
import logging
from typing import Any

from app.celery_app import celery_app

from .consumers import consume_single_event, poll_and_process_outbox

logger = logging.getLogger(__name__)


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.operations.tasks.process_outbox_events",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
    retry_jitter=True,
)
def process_outbox_events(self: Any, batch_size: int = 100) -> int:
    return asyncio.run(poll_and_process_outbox(batch_size))


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.operations.tasks.process_single_outbox_event",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
    retry_jitter=True,
)
def process_single_outbox_event(self: Any, event_id: str) -> bool:
    return asyncio.run(consume_single_event(event_id))


@celery_app.task(  # type: ignore[misc]
    name="app.operations.tasks.spawn_recurring_tasks",
    ignore_result=True,
)
def spawn_recurring_tasks() -> None:
    """Daily fan-out at 06:00 UTC — enqueues tasks that should run once per day."""
    logger.info("spawn_recurring_tasks: enqueueing daily tasks")
    celery_app.send_task("app.finance.tasks.process_pending_payouts")
    logger.info("spawn_recurring_tasks: done")
