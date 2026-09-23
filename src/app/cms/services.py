import re
import uuid
from datetime import UTC, datetime
from typing import Any

import boto3
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.config import settings
from app.shared.exceptions import (
    ConflictError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)

from . import repository
from .constants import DEFAULT_LOCALE, LOCALES, BlockType, PageStatus
from .models import CmsBlock, CmsMedia, CmsPage, CmsRevision
from .schemas import (
    BlockCreateRequest,
    BlockResponse,
    BlockUpdateRequest,
    MediaCreateRequest,
    MediaPresignResponse,
    MediaResponse,
    PageCreateRequest,
    PageDetailResponse,
    PageListItem,
    PageUpdateRequest,
    PublicBlock,
    PublicPageListItem,
    PublicPageResponse,
    RevisionResponse,
)

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{0,119}$")
_MEDIA_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MEDIA_UPLOAD_TTL_SECONDS = 900


def _validate_slug(slug: str) -> str:
    slug = slug.strip().lower()
    if not _SLUG_RE.match(slug):
        raise ValidationError(
            "Slug must be lowercase letters, numbers and hyphens only"
        )
    return slug


def _validate_seo(seo: dict[str, Any]) -> dict[str, Any]:
    """Normalize the SEO payload; reject non-dict or non-scalar junk."""
    if not isinstance(seo, dict):
        raise ValidationError("SEO payload must be an object")
    cleaned: dict[str, Any] = {}
    for key, value in seo.items():
        if key in LOCALES:
            if not isinstance(value, dict):
                raise ValidationError(f"SEO locale '{key}' must be an object")
            cleaned[key] = {
                str(k): v for k, v in value.items()
                if isinstance(v, str | int | float | bool) or v is None
            }
        elif key in ("canonical", "robots", "og_image_key"):
            cleaned[key] = value
    return cleaned


def _validate_localized_content(content: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(content, dict):
        raise ValidationError("Block content must be an object")
    for key in content:
        if key not in LOCALES:
            raise ValidationError(
                f"Block content keys must be locales ({'/'.join(LOCALES)})"
            )
    return content


def _localized(value: dict[str, Any] | None, locale: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    return (
        value.get(locale)
        or value.get(DEFAULT_LOCALE)
        or next(iter(value.values()), {})
    ) or {}


def _block_response(block: CmsBlock) -> BlockResponse:
    return BlockResponse(
        id=block.id,
        page_id=block.page_id,
        block_type=block.block_type,
        sort_order=block.sort_order,
        enabled=block.enabled,
        content=block.content or {},
        updated_at=block.updated_at or datetime.now(UTC),
    )


def _page_detail(page: CmsPage) -> PageDetailResponse:
    return PageDetailResponse(
        id=page.id,
        slug=page.slug,
        status=page.status,
        title_en=page.title_en,
        title_ar=page.title_ar,
        seo=page.seo or {},
        version=page.version,
        published_at=page.published_at,
        updated_at=page.updated_at or datetime.now(UTC),
        published_by=page.published_by,
        updated_by=page.updated_by,
        blocks=[_block_response(b) for b in page.blocks],
    )


async def list_pages(session: AsyncSession) -> list[PageListItem]:
    pages = await repository.list_pages(session)
    return [
        PageListItem(
            id=p.id,
            slug=p.slug,
            status=p.status,
            title_en=p.title_en,
            title_ar=p.title_ar,
            version=p.version,
            published_at=p.published_at,
            updated_at=p.updated_at,
        )
        for p in pages
    ]


async def create_page(
    session: AsyncSession, user: User, request: PageCreateRequest
) -> PageDetailResponse:
    slug = _validate_slug(request.slug)
    if await repository.get_page_by_slug(session, slug) is not None:
        raise ConflictError("A page with this slug already exists")
    page = CmsPage(
        id=str(uuid.uuid4()),
        slug=slug,
        status=PageStatus.DRAFT.value,
        title_en=request.title_en,
        title_ar=request.title_ar,
        seo=_validate_seo(request.seo),
        version=1,
        updated_by=user.id,
    )
    page.blocks = []
    session.add(page)
    await session.flush()
    return _page_detail(page)


async def get_page_detail(
    session: AsyncSession, page_id: str
) -> PageDetailResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    return _page_detail(page)


async def update_page(
    session: AsyncSession,
    user: User,
    page_id: str,
    request: PageUpdateRequest,
) -> PageDetailResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    if request.slug is not None:
        slug = _validate_slug(request.slug)
        existing = await repository.get_page_by_slug(session, slug)
        if existing is not None and existing.id != page.id:
            raise ConflictError("A page with this slug already exists")
        page.slug = slug
    if request.title_en is not None:
        page.title_en = request.title_en
    if request.title_ar is not None:
        page.title_ar = request.title_ar
    if request.seo is not None:
        page.seo = _validate_seo(request.seo)
    page.updated_by = user.id
    await session.flush()
    return _page_detail(page)


async def delete_page(session: AsyncSession, page_id: str) -> None:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    if page.status == PageStatus.PUBLISHED:
        raise ValidationError("Unpublish the page before deleting it")
    await session.delete(page)
    await session.flush()


async def create_block(
    session: AsyncSession,
    user: User,
    page_id: str,
    request: BlockCreateRequest,
) -> BlockResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    if request.block_type not in BlockType._value2member_map_:
        raise ValidationError(f"Unknown block type: {request.block_type}")
    content = _validate_localized_content(request.content)
    sort_order = request.sort_order
    if sort_order == 0:
        sort_order = await repository.next_sort_order(session, page_id)
    block = CmsBlock(
        id=str(uuid.uuid4()),
        page_id=page_id,
        block_type=request.block_type,
        sort_order=sort_order,
        enabled=request.enabled,
        content=content,
        updated_by=user.id,
    )
    session.add(block)
    page.updated_by = user.id
    await session.flush()
    return _block_response(block)


async def update_block(
    session: AsyncSession,
    user: User,
    block_id: str,
    request: BlockUpdateRequest,
) -> BlockResponse:
    block = await repository.get_block(session, block_id)
    if block is None:
        raise NotFoundError("Block not found")
    if request.block_type is not None:
        if request.block_type not in BlockType._value2member_map_:
            raise ValidationError(
                f"Unknown block type: {request.block_type}"
            )
        block.block_type = request.block_type
    if request.sort_order is not None:
        block.sort_order = request.sort_order
    if request.enabled is not None:
        block.enabled = request.enabled
    if request.content is not None:
        block.content = _validate_localized_content(request.content)
    block.updated_by = user.id
    await session.flush()
    return _block_response(block)


async def delete_block(session: AsyncSession, block_id: str) -> None:
    block = await repository.get_block(session, block_id)
    if block is None:
        raise NotFoundError("Block not found")
    await session.delete(block)
    await session.flush()


def _validate_for_publish(page: CmsPage) -> None:
    if not (page.title_en or "").strip() and not (page.title_ar or "").strip():
        raise ValidationError(
            "Page needs a title in at least one locale before publishing"
        )
    for block in page.blocks:
        if not block.enabled:
            continue
        localized = block.content or {}
        if not any((localized.get(loc) or {}) for loc in LOCALES):
            raise ValidationError(
                f"Block {block.id} ({block.block_type}) has no content in "
                "any locale"
            )


def _snapshot(page: CmsPage) -> dict[str, Any]:
    return {
        "slug": page.slug,
        "title_en": page.title_en,
        "title_ar": page.title_ar,
        "seo": page.seo or {},
        "blocks": [
            {
                "block_type": b.block_type,
                "sort_order": b.sort_order,
                "enabled": b.enabled,
                "content": b.content or {},
            }
            for b in sorted(page.blocks, key=lambda b: b.sort_order)
        ],
    }


async def publish_page(
    session: AsyncSession,
    user: User,
    page_id: str,
    note: str | None = None,
) -> PageDetailResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    _validate_for_publish(page)

    page.version += 1
    page.status = PageStatus.PUBLISHED.value
    page.published_at = datetime.now(UTC)
    page.published_by = user.id
    page.updated_by = user.id
    session.add(
        CmsRevision(
            id=str(uuid.uuid4()),
            page_id=page.id,
            version=page.version,
            snapshot=_snapshot(page),
            note=note,
            created_by=user.id,
            created_at=datetime.now(UTC),
        )
    )
    await session.flush()
    return _page_detail(page)


async def unpublish_page(
    session: AsyncSession, user: User, page_id: str
) -> PageDetailResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    if page.status != PageStatus.PUBLISHED:
        raise ValidationError("Only published pages can be unpublished")
    page.status = PageStatus.DRAFT.value
    page.updated_by = user.id
    await session.flush()
    return _page_detail(page)


async def list_revisions(
    session: AsyncSession, page_id: str
) -> list[RevisionResponse]:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    revisions = await repository.list_revisions(session, page_id)
    return [
        RevisionResponse(
            id=r.id,
            page_id=r.page_id,
            version=r.version,
            note=r.note,
            created_by=r.created_by,
            created_at=r.created_at,
        )
        for r in revisions
    ]


async def restore_revision(
    session: AsyncSession, user: User, page_id: str, version: int
) -> PageDetailResponse:
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    revision = await repository.get_revision(session, page_id, version)
    if revision is None:
        raise NotFoundError("Revision not found")

    snapshot = revision.snapshot or {}
    page.slug = snapshot.get("slug", page.slug)
    page.title_en = snapshot.get("title_en")
    page.title_ar = snapshot.get("title_ar")
    page.seo = snapshot.get("seo") or {}
    page.updated_by = user.id

    for block in list(page.blocks):
        await session.delete(block)
    await session.flush()
    for block_data in snapshot.get("blocks", []):
        session.add(
            CmsBlock(
                id=str(uuid.uuid4()),
                page_id=page.id,
                block_type=block_data.get("block_type", "rich_text"),
                sort_order=block_data.get("sort_order", 0),
                enabled=bool(block_data.get("enabled", True)),
                content=block_data.get("content") or {},
                updated_by=user.id,
            )
        )
    await session.flush()
    await session.refresh(page, ["blocks"])
    return _page_detail(page)


# --- Public (published-only) --------------------------------------------


def _public_page_from_revision(
    page: CmsPage, revision: CmsRevision, locale: str
) -> PublicPageResponse:
    snapshot = revision.snapshot or {}
    title = (
        snapshot.get(f"title_{locale}")
        or snapshot.get("title_en")
        or snapshot.get("title_ar")
    )
    seo = _localized(snapshot.get("seo"), locale)
    seo_out: dict[str, Any] = dict(seo)
    for key in ("canonical", "robots", "og_image_key"):
        if snapshot.get("seo", {}).get(key):
            seo_out[key] = snapshot["seo"][key]
    blocks = [
        PublicBlock(
            id=f"{revision.id}-{i}",
            block_type=b.get("block_type", "rich_text"),
            sort_order=b.get("sort_order", i),
            content=_localized(b.get("content"), locale),
        )
        for i, b in enumerate(snapshot.get("blocks", []))
        if b.get("enabled", True)
    ]
    return PublicPageResponse(
        slug=page.slug,
        title=title,
        locale=locale,
        seo=seo_out,
        version=revision.version,
        published_at=page.published_at,
        blocks=sorted(blocks, key=lambda b: b.sort_order),
    )


async def get_public_page(
    session: AsyncSession, slug: str, locale: str | None
) -> PublicPageResponse:
    """Serve only the latest published revision — never the live draft."""
    locale = locale if locale in LOCALES else DEFAULT_LOCALE
    page = await repository.get_page_by_slug(session, slug, published_only=True)
    if page is None:
        raise NotFoundError("Page not found")
    revisions = await repository.list_revisions(session, page.id)
    if not revisions:
        raise NotFoundError("Page not found")
    return _public_page_from_revision(page, revisions[0], locale)


async def list_public_pages(
    session: AsyncSession, locale: str | None
) -> list[PublicPageListItem]:
    locale = locale if locale in LOCALES else DEFAULT_LOCALE
    pages = await repository.list_published_pages(session)
    out: list[PublicPageListItem] = []
    for page in pages:
        revisions = await repository.list_revisions(session, page.id)
        if not revisions:
            continue
        snapshot = revisions[0].snapshot or {}
        title = snapshot.get(
            "title_en" if locale == "en" else "title_ar"
        ) or snapshot.get("title_en") or snapshot.get("title_ar")
        out.append(
            PublicPageListItem(
                slug=page.slug, title=title, published_at=page.published_at
            )
        )
    return out


async def get_preview_page(
    session: AsyncSession, page_id: str, locale: str | None
) -> PublicPageResponse:
    """Staff-only preview of the live (draft) working copy."""
    locale = locale if locale in LOCALES else DEFAULT_LOCALE
    page = await repository.get_page(session, page_id)
    if page is None:
        raise NotFoundError("Page not found")
    blocks = [
        PublicBlock(
            id=b.id,
            block_type=b.block_type,
            sort_order=b.sort_order,
            content=_localized(b.content, locale),
        )
        for b in page.blocks
        if b.enabled
    ]
    return PublicPageResponse(
        slug=page.slug,
        title=(page.title_en if locale == "en" else page.title_ar)
        or page.title_en
        or page.title_ar,
        locale=locale,
        seo=_localized(page.seo, locale),
        version=page.version,
        published_at=page.published_at,
        blocks=sorted(blocks, key=lambda b: b.sort_order),
    )


# --- Media ---------------------------------------------------------------


def _require_media_storage() -> None:
    missing = [
        name
        for name in (
            "S3_LISTINGS_BUCKET",
            "AWS_REGION",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
        )
        if not getattr(settings, name)
    ]
    if missing:
        raise ServiceUnavailableError(
            "Media storage is not configured "
            f"(missing: {', '.join(missing)})"
        )


async def presign_media_upload(
    filename: str, content_type: str
) -> MediaPresignResponse:
    if content_type not in _MEDIA_CONTENT_TYPES:
        raise ValidationError("Only JPG, PNG or WebP images are accepted")
    _require_media_storage()
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    media_key = f"cms/media_{uuid.uuid4().hex}.{ext}"
    client = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_LISTINGS_BUCKET,
            "Key": media_key,
            "ContentType": content_type,
        },
        ExpiresIn=_MEDIA_UPLOAD_TTL_SECONDS,
    )
    return MediaPresignResponse(upload_url=upload_url, media_key=media_key)


async def register_media(
    session: AsyncSession, user: User, request: MediaCreateRequest
) -> MediaResponse:
    if not request.s3_key and not request.url:
        raise ValidationError("Media needs an s3_key or an external url")
    media = CmsMedia(
        id=str(uuid.uuid4()),
        s3_key=request.s3_key,
        url=request.url,
        content_type=request.content_type,
        alt_en=request.alt_en,
        alt_ar=request.alt_ar,
        uploaded_by=user.id,
    )
    session.add(media)
    await session.flush()
    return MediaResponse(
        id=media.id,
        s3_key=media.s3_key,
        url=media.url,
        content_type=media.content_type,
        alt_en=media.alt_en,
        alt_ar=media.alt_ar,
        created_at=media.created_at or datetime.now(UTC),
    )


async def list_media(session: AsyncSession) -> list[MediaResponse]:
    return [
        MediaResponse(
            id=m.id,
            s3_key=m.s3_key,
            url=m.url,
            content_type=m.content_type,
            alt_en=m.alt_en,
            alt_ar=m.alt_ar,
            created_at=m.created_at or datetime.now(UTC),
        )
        for m in await repository.list_media(session)
    ]
