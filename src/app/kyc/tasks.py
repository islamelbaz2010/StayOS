import asyncio
from typing import Any

from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.kyc import repository as kyc_repository
from app.kyc.services import process_kyc_document


async def _run_processing(document_id: str) -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            document = await kyc_repository.get_kyc_document_by_id(
                session, document_id
            )
            if document is None or document.status != "pending":
                return
            await process_kyc_document(session, document_id)


@celery_app.task(  # type: ignore[untyped-decorator]
    bind=True,
    name="app.kyc.tasks.process_kyc_document",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_jitter=True,
)
def process_kyc_document_task(self: Any, document_id: str) -> None:
    asyncio.run(_run_processing(document_id))
