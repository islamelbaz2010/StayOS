from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from app.auth.constants import UserRole
from app.auth.models import User
from app.cms import repository, services
from app.cms.constants import PageStatus
from app.cms.models import CmsBlock, CmsPage, CmsRevision
from app.cms.schemas import (
    BlockCreateRequest,
    BlockUpdateRequest,
    MediaCreateRequest,
    PageCreateRequest,
    PageUpdateRequest,
)
from app.shared.exceptions import (
    ConflictError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)


@pytest.fixture
def fake_session() -> AsyncMock:
    session = AsyncMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.delete = AsyncMock()
    session.refresh = AsyncMock()
    return session


def _user() -> User:
    return User(
        id="staff-1",
        role=UserRole.STAFF,
        display_name="Marketing",
        is_active=True,
    )


def _page(**kw) -> CmsPage:
    page = CmsPage(
        id=kw.get("id", "page-1"),
        slug=kw.get("slug", "home"),
        status=kw.get("status", PageStatus.DRAFT.value),
        title_en=kw.get("title_en", "Welcome"),
        title_ar=kw.get("title_ar", "أهلاً"),
        seo=kw.get("seo", {"en": {"title": "Welcome"}, "robots": "index"}),
        version=kw.get("version", 1),
        published_at=None,
        published_by=None,
        updated_by=None,
    )
    page.blocks = kw.get("blocks", [])
    page.created_at = datetime.now(UTC)
    page.updated_at = datetime.now(UTC)
    return page


def _block(**kw) -> CmsBlock:
    block = CmsBlock(
        id=kw.get("id", "blk-1"),
        page_id=kw.get("page_id", "page-1"),
        block_type=kw.get("block_type", "hero"),
        sort_order=kw.get("sort_order", 0),
        enabled=kw.get("enabled", True),
        content=kw.get(
            "content",
            {"en": {"heading": "Hello"}, "ar": {"heading": "مرحبا"}},
        ),
        updated_by=None,
    )
    block.created_at = datetime.now(UTC)
    block.updated_at = datetime.now(UTC)
    return block


# --- slug / validation --------------------------------------------------


@pytest.mark.asyncio
async def test_create_page_rejects_bad_slug(fake_session, monkeypatch):
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=None)
    )
    with pytest.raises(ValidationError):
        await services.create_page(
            fake_session,
            _user(),
            PageCreateRequest(slug="Bad Slug!"),
        )


@pytest.mark.asyncio
async def test_create_page_conflict_on_duplicate_slug(
    fake_session, monkeypatch
):
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=_page())
    )
    with pytest.raises(ConflictError):
        await services.create_page(
            fake_session, _user(), PageCreateRequest(slug="home")
        )


@pytest.mark.asyncio
async def test_create_page_success(fake_session, monkeypatch):
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=None)
    )
    page = await services.create_page(
        fake_session,
        _user(),
        PageCreateRequest(slug="about", title_en="About"),
    )
    assert page.slug == "about"
    assert page.status == "draft"
    fake_session.add.assert_called()


# --- blocks -------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_block_rejects_unknown_type(fake_session, monkeypatch):
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=_page())
    )
    with pytest.raises(ValidationError):
        await services.create_block(
            fake_session,
            _user(),
            "page-1",
            BlockCreateRequest(block_type="not_a_type"),
        )


@pytest.mark.asyncio
async def test_create_block_rejects_non_locale_keys(
    fake_session, monkeypatch
):
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=_page())
    )
    with pytest.raises(ValidationError):
        await services.create_block(
            fake_session,
            _user(),
            "page-1",
            BlockCreateRequest(
                block_type="hero", content={"fr": {"heading": "x"}}
            ),
        )


@pytest.mark.asyncio
async def test_update_block_content_replaced_with_new_dict(
    fake_session, monkeypatch
):
    block = _block()
    monkeypatch.setattr(
        repository, "get_block", AsyncMock(return_value=block)
    )
    out = await services.update_block(
        fake_session,
        _user(),
        "blk-1",
        BlockUpdateRequest(content={"en": {"heading": "New"}}),
    )
    assert out.content == {"en": {"heading": "New"}}
    assert block.content == {"en": {"heading": "New"}}


# --- publish ------------------------------------------------------------


@pytest.mark.asyncio
async def test_publish_requires_title(fake_session, monkeypatch):
    page = _page(title_en="", title_ar=None)
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    with pytest.raises(ValidationError):
        await services.publish_page(fake_session, _user(), "page-1")


@pytest.mark.asyncio
async def test_publish_rejects_empty_enabled_block(
    fake_session, monkeypatch
):
    page = _page(blocks=[_block(content={})])
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    with pytest.raises(ValidationError):
        await services.publish_page(fake_session, _user(), "page-1")


@pytest.mark.asyncio
async def test_publish_creates_revision_and_bumps_version(
    fake_session, monkeypatch
):
    page = _page(blocks=[_block()])
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    out = await services.publish_page(
        fake_session, _user(), "page-1", note="v1"
    )
    assert out.status == "published"
    assert out.version == 2
    assert out.published_at is not None
    revision = next(
        c.args[0] for c in fake_session.add.call_args_list
        if isinstance(c.args[0], CmsRevision)
    )
    assert revision.version == 2
    assert revision.snapshot["blocks"][0]["block_type"] == "hero"


@pytest.mark.asyncio
async def test_unpublish_requires_published(fake_session, monkeypatch):
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=_page())
    )
    with pytest.raises(ValidationError):
        await services.unpublish_page(fake_session, _user(), "page-1")


@pytest.mark.asyncio
async def test_unpublish_published_page(fake_session, monkeypatch):
    page = _page(status=PageStatus.PUBLISHED.value)
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    out = await services.unpublish_page(fake_session, _user(), "page-1")
    assert out.status == "draft"


# --- restore ------------------------------------------------------------


@pytest.mark.asyncio
async def test_restore_revision_rewrites_draft(fake_session, monkeypatch):
    page = _page(
        status=PageStatus.PUBLISHED.value,
        blocks=[_block(id="old-blk")],
    )
    revision = CmsRevision(
        id="rev-1",
        page_id="page-1",
        version=1,
        snapshot={
            "slug": "home",
            "title_en": "Old title",
            "title_ar": "قديم",
            "seo": {"en": {"title": "Old"}},
            "blocks": [
                {
                    "block_type": "cta",
                    "sort_order": 0,
                    "enabled": True,
                    "content": {"en": {"label": "Go"}},
                }
            ],
        },
        created_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    monkeypatch.setattr(
        repository, "get_revision", AsyncMock(return_value=revision)
    )
    await services.restore_revision(
        fake_session, _user(), "page-1", 1
    )
    assert page.title_en == "Old title"
    assert page.seo == {"en": {"title": "Old"}}
    fake_session.delete.assert_awaited()  # old blocks removed
    assert any(
        isinstance(c.args[0], CmsBlock)
        for c in fake_session.add.call_args_list
    )


# --- public: draft leakage prevention -----------------------------------


@pytest.mark.asyncio
async def test_public_page_serves_revision_not_draft(
    fake_session, monkeypatch
):
    """Live row edited after publish must NOT leak to the public API —
    public content comes from the latest published revision snapshot."""
    page = _page(
        status=PageStatus.PUBLISHED.value,
        title_en="DRAFT EDIT — must not leak",
    )
    revision = CmsRevision(
        id="rev-2",
        page_id="page-1",
        version=2,
        snapshot={
            "title_en": "Published title",
            "title_ar": "منشور",
            "seo": {"en": {"title": "SEO title"}, "robots": "index"},
            "blocks": [
                {
                    "block_type": "hero",
                    "sort_order": 0,
                    "enabled": True,
                    "content": {
                        "en": {"heading": "Live"},
                        "ar": {"heading": "مباشر"},
                    },
                },
                {
                    "block_type": "banner",
                    "sort_order": 1,
                    "enabled": False,
                    "content": {"en": {"text": "hidden"}},
                },
            ],
        },
        created_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=page)
    )
    monkeypatch.setattr(
        repository, "list_revisions", AsyncMock(return_value=[revision])
    )
    out = await services.get_public_page(fake_session, "home", "en")
    assert out.title == "Published title"
    assert len(out.blocks) == 1  # disabled block filtered
    assert out.blocks[0].content == {"heading": "Live"}
    assert out.seo["robots"] == "index"


@pytest.mark.asyncio
async def test_public_page_arabic_fallback(fake_session, monkeypatch):
    page = _page(status=PageStatus.PUBLISHED.value)
    revision = CmsRevision(
        id="rev-1",
        page_id="page-1",
        version=1,
        snapshot={
            "title_ar": "مرحبا",
            "blocks": [
                {
                    "block_type": "rich_text",
                    "sort_order": 0,
                    "enabled": True,
                    "content": {"en": {"body": "English only"}},
                }
            ],
        },
        created_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=page)
    )
    monkeypatch.setattr(
        repository, "list_revisions", AsyncMock(return_value=[revision])
    )
    out = await services.get_public_page(fake_session, "home", "ar")
    assert out.title == "مرحبا"
    # Block has no ar locale → falls back to en
    assert out.blocks[0].content == {"body": "English only"}


@pytest.mark.asyncio
async def test_public_page_404_for_draft(fake_session, monkeypatch):
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=None)
    )
    with pytest.raises(NotFoundError):
        await services.get_public_page(fake_session, "draft-only", "en")


@pytest.mark.asyncio
async def test_preview_shows_draft(fake_session, monkeypatch):
    page = _page(blocks=[_block()])
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    out = await services.get_preview_page(fake_session, "page-1", "ar")
    assert out.title == "أهلاً"
    assert out.blocks[0].content == {"heading": "مرحبا"}


# --- media --------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_media_requires_reference(fake_session):
    with pytest.raises(ValidationError):
        await services.register_media(
            fake_session, _user(), MediaCreateRequest()
        )


@pytest.mark.asyncio
async def test_presign_fails_closed_without_storage(monkeypatch):
    monkeypatch.setattr(services.settings, "S3_LISTINGS_BUCKET", "")
    with pytest.raises(ServiceUnavailableError):
        await services.presign_media_upload("x.jpg", "image/jpeg")


@pytest.mark.asyncio
async def test_presign_rejects_bad_content_type():
    with pytest.raises(ValidationError):
        await services.presign_media_upload("x.exe", "application/x-msdownload")


# --- page update ---------------------------------------------------------


@pytest.mark.asyncio
async def test_update_page_slug_conflict(fake_session, monkeypatch):
    page = _page(id="page-1")
    other = _page(id="page-2", slug="about")
    monkeypatch.setattr(
        repository, "get_page", AsyncMock(return_value=page)
    )
    monkeypatch.setattr(
        repository, "get_page_by_slug", AsyncMock(return_value=other)
    )
    with pytest.raises(ConflictError):
        await services.update_page(
            fake_session,
            _user(),
            "page-1",
            PageUpdateRequest(slug="about"),
        )
