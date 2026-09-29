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
    """Newest first — callers rely on ``documents[0]`` being the latest
    attempt when rendering user-facing KYC state."""
    result = await session.execute(
        select(KycDocument)
        .where(KycDocument.user_id == user_id)
        .order_by(KycDocument.created_at.desc())
    )
    return list(result.scalars().all())


async def get_pending_kyc_documents(
    session: AsyncSession, limit: int = 50, offset: int = 0
) -> list[KycDocument]:
    """Admin exception queue: manual upload submissions (``pending``) plus
    provider escalations (``manual_review``). Automated in-flight
    provider verifications (``pending`` with a provider) are excluded —
    they resolve via webhook, not by admin action."""
    from sqlalchemy import or_

    result = await session.execute(
        select(KycDocument)
        .where(
            or_(
                KycDocument.provider.is_(None) & KycDocument.status.in_(("pending",)),
                KycDocument.status == "manual_review",
            )
        )
        .order_by(KycDocument.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_provider_inflight_kyc_documents(
    session: AsyncSession, limit: int = 50, offset: int = 0
) -> list[KycDocument]:
    """Read-only provider activity for the admin KYC screen: automated
    verifications still owned by the provider (in-flight ``pending`` or
    awaiting user ``retry_required``). Terminal provider decisions are
    never listed — they are not admin work."""
    result = await session.execute(
        select(KycDocument)
        .where(
            KycDocument.provider.is_not(None),
            KycDocument.status.in_(("pending", "retry_required")),
        )
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
