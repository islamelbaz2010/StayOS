from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import StaffPermission
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from . import services
from .schemas import (
    BlockCreateRequest,
    BlockResponse,
    BlockUpdateRequest,
    MediaCreateRequest,
    MediaPresignRequest,
    MediaPresignResponse,
    MediaResponse,
    PageCreateRequest,
    PageDetailResponse,
    PageListItem,
    PageUpdateRequest,
    PublicPageListItem,
    PublicPageResponse,
    PublishRequest,
    RevisionResponse,
)

admin_router = APIRouter(tags=["admin-cms"])
public_router = APIRouter(tags=["content"])

ContentStaff = Depends(
    auth_dependencies.require_staff_permission(StaffPermission.CONTENT)
)


# --- Admin / staff (content permission) ---------------------------------


@admin_router.get("/admin/cms/pages", response_model=list[PageListItem])
async def list_pages(
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> list[PageListItem]:
    return await services.list_pages(session)


@admin_router.post(
    "/admin/cms/pages", response_model=PageDetailResponse, status_code=201
)
async def create_page(
    request: PageCreateRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        page = await services.create_page(session, user, request)
        await session.commit()
        return page
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.get("/admin/cms/pages/{page_id}", response_model=PageDetailResponse)
async def get_page(
    page_id: str,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        return await services.get_page_detail(session, page_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.patch(
    "/admin/cms/pages/{page_id}", response_model=PageDetailResponse
)
async def update_page(
    page_id: str,
    request: PageUpdateRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        page = await services.update_page(session, user, page_id, request)
        await session.commit()
        return page
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.delete("/admin/cms/pages/{page_id}", status_code=204)
async def delete_page(
    page_id: str,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await services.delete_page(session, page_id)
        await session.commit()
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/pages/{page_id}/blocks",
    response_model=BlockResponse,
    status_code=201,
)
async def create_block(
    page_id: str,
    request: BlockCreateRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> BlockResponse:
    try:
        block = await services.create_block(session, user, page_id, request)
        await session.commit()
        return block
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.patch(
    "/admin/cms/blocks/{block_id}", response_model=BlockResponse
)
async def update_block(
    block_id: str,
    request: BlockUpdateRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> BlockResponse:
    try:
        block = await services.update_block(session, user, block_id, request)
        await session.commit()
        return block
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.delete("/admin/cms/blocks/{block_id}", status_code=204)
async def delete_block(
    block_id: str,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await services.delete_block(session, block_id)
        await session.commit()
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/pages/{page_id}/publish", response_model=PageDetailResponse
)
async def publish_page(
    page_id: str,
    request: PublishRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        page = await services.publish_page(session, user, page_id, request.note)
        await session.commit()
        return page
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/pages/{page_id}/unpublish", response_model=PageDetailResponse
)
async def unpublish_page(
    page_id: str,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        page = await services.unpublish_page(session, user, page_id)
        await session.commit()
        return page
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.get(
    "/admin/cms/pages/{page_id}/revisions",
    response_model=list[RevisionResponse],
)
async def list_revisions(
    page_id: str,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> list[RevisionResponse]:
    try:
        return await services.list_revisions(session, page_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/pages/{page_id}/revisions/{version}/restore",
    response_model=PageDetailResponse,
)
async def restore_revision(
    page_id: str,
    version: int,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PageDetailResponse:
    try:
        page = await services.restore_revision(session, user, page_id, version)
        await session.commit()
        return page
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.get(
    "/admin/cms/pages/{page_id}/preview", response_model=PublicPageResponse
)
async def preview_page(
    page_id: str,
    lang: str | None = Query(default=None),
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> PublicPageResponse:
    try:
        return await services.get_preview_page(session, page_id, lang)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/media/presign", response_model=MediaPresignResponse
)
async def presign_media(
    request: MediaPresignRequest,
    user: User = ContentStaff,
) -> MediaPresignResponse:
    try:
        return await services.presign_media_upload(
            request.filename, request.content_type
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.post(
    "/admin/cms/media", response_model=MediaResponse, status_code=201
)
async def register_media(
    request: MediaCreateRequest,
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> MediaResponse:
    try:
        media = await services.register_media(session, user, request)
        await session.commit()
        return media
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@admin_router.get("/admin/cms/media", response_model=list[MediaResponse])
async def list_media(
    user: User = ContentStaff,
    session: AsyncSession = Depends(get_session),
) -> list[MediaResponse]:
    return await services.list_media(session)


# --- Public (published-only) --------------------------------------------


@public_router.get(
    "/content/pages", response_model=list[PublicPageListItem]
)
async def list_public_pages(
    lang: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> list[PublicPageListItem]:
    return await services.list_public_pages(session, lang)


@public_router.get(
    "/content/pages/{slug}", response_model=PublicPageResponse
)
async def get_public_page(
    slug: str,
    lang: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> PublicPageResponse:
    try:
        return await services.get_public_page(session, slug, lang)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
