from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import CmsBlock, CmsMedia, CmsPage, CmsRevision


async def list_pages(session: AsyncSession) -> list[CmsPage]:
    result = await session.execute(
        select(CmsPage).order_by(CmsPage.slug)
    )
    return list(result.scalars().all())


async def list_published_pages(session: AsyncSession) -> list[CmsPage]:
    result = await session.execute(
        select(CmsPage)
        .where(CmsPage.status == "published")
        .order_by(CmsPage.slug)
    )
    return list(result.scalars().all())


async def get_page(session: AsyncSession, page_id: str) -> CmsPage | None:
    result = await session.execute(
        select(CmsPage)
        .where(CmsPage.id == page_id)
        .options(selectinload(CmsPage.blocks))
    )
    return result.scalar_one_or_none()


async def get_page_by_slug(
    session: AsyncSession, slug: str, *, published_only: bool = False
) -> CmsPage | None:
    stmt = (
        select(CmsPage)
        .where(CmsPage.slug == slug)
        .options(selectinload(CmsPage.blocks))
    )
    if published_only:
        stmt = stmt.where(CmsPage.status == "published")
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_block(session: AsyncSession, block_id: str) -> CmsBlock | None:
    result = await session.execute(
        select(CmsBlock).where(CmsBlock.id == block_id)
    )
    return result.scalar_one_or_none()


async def list_revisions(
    session: AsyncSession, page_id: str
) -> list[CmsRevision]:
    result = await session.execute(
        select(CmsRevision)
        .where(CmsRevision.page_id == page_id)
        .order_by(CmsRevision.version.desc())
    )
    return list(result.scalars().all())


async def get_revision(
    session: AsyncSession, page_id: str, version: int
) -> CmsRevision | None:
    result = await session.execute(
        select(CmsRevision).where(
            CmsRevision.page_id == page_id,
            CmsRevision.version == version,
        )
    )
    return result.scalar_one_or_none()


async def next_sort_order(session: AsyncSession, page_id: str) -> int:
    result = await session.execute(
        select(func.coalesce(func.max(CmsBlock.sort_order), -1)).where(
            CmsBlock.page_id == page_id
        )
    )
    return int(result.scalar_one()) + 1


async def list_media(session: AsyncSession) -> list[CmsMedia]:
    result = await session.execute(
        select(CmsMedia).order_by(CmsMedia.created_at.desc())
    )
    return list(result.scalars().all())


async def get_media(session: AsyncSession, media_id: str) -> CmsMedia | None:
    result = await session.execute(
        select(CmsMedia).where(CmsMedia.id == media_id)
    )
    return result.scalar_one_or_none()
