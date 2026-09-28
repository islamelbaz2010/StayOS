from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.models import KycDocument


async def get_kyc_document_by_id(
    session: AsyncSession, document_id: str
) -> KycDocument | None:
    return await session.get(KycDocument, document_id)


async def get_kyc_documents_by_user_id(
    session: AsyncSession, user_id: str
) -> list[KycDocument]:
    result = await session.execute(
        select(KycDocument).where(KycDocument.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_pending_kyc_documents(
    session: AsyncSession, limit: int = 50, offset: int = 0
) -> list[KycDocument]:
    """Admin exception queue: manual upload submissions (``pending``) plus
    provider escalations (``manual_review``). Automated in-flight
    verifications are excluded — they resolve via webhook."""
    result = await session.execute(
        select(KycDocument)
        .where(KycDocument.status.in_(("pending", "manual_review")))
        .order_by(KycDocument.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_kyc_document_by_applicant(
    session: AsyncSession, provider_applicant_id: str
) -> KycDocument | None:
    result = await session.execute(
        select(KycDocument).where(
            KycDocument.provider_applicant_id == provider_applicant_id
        )
    )
    return result.scalar_one_or_none()


async def create_kyc_document(
    session: AsyncSession, **kwargs: object
) -> KycDocument:
    document = KycDocument(**kwargs)
    session.add(document)
    await session.flush()
    await session.refresh(document)
    return document


async def update_kyc_document(
    session: AsyncSession, document: KycDocument, **kwargs: object
) -> KycDocument:
    for key, value in kwargs.items():
        setattr(document, key, value)
    session.add(document)
    await session.flush()
    await session.refresh(document)
    return document
