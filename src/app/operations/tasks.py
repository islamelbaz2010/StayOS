import asyncio
from typing import Any

from app.celery_app import celery_app

from .consumers import consume_single_event, poll_and_process_outbox


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
