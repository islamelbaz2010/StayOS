import asyncio
from typing import Any

from sqlalchemy import select

from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.finance.models import PayoutRequest
from app.shared.exceptions import StayOSError

from . import consumers as finance_consumers
from . import services as finance_services


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.finance.tasks.release_escrow",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
    retry_jitter=True,
)
def release_escrow(self: Any, escrow_id: str) -> None:
    async def _release() -> None:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                await finance_services.release_escrow(session, escrow_id)

    asyncio.run(_release())


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.finance.tasks.process_payout",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_jitter=True,
)
def process_payout(self: Any, payout_id: str, provider: str | None = None) -> None:
    async def _process() -> None:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                await finance_services.process_payout(session, payout_id, provider)

    asyncio.run(_process())


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.finance.tasks.process_pending_payouts",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_jitter=True,
)
def process_pending_payouts(self: Any, batch_size: int = 50) -> int:
    async def _process_batch() -> int:
        processed = 0
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(PayoutRequest)
                .where(PayoutRequest.status == "pending")
                .limit(batch_size)
            )
            payouts = result.scalars().all()
            for payout in payouts:
                try:
                    await finance_services.process_payout(session, payout.id)
                    processed += 1
                except StayOSError:
                    continue
        return processed

    return asyncio.run(_process_batch())


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.finance.tasks.process_outbox_events",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
    retry_jitter=True,
)
def process_outbox_events(self: Any, batch_size: int = 100) -> int:
    return asyncio.run(finance_consumers.poll_and_process_outbox(batch_size))


@celery_app.task(  # type: ignore[misc]
    bind=True,
    name="app.finance.tasks.process_single_outbox_event",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
    retry_jitter=True,
)
def process_single_outbox_event(self: Any, event_id: str) -> bool:
    return asyncio.run(finance_consumers.consume_single_event(event_id))
