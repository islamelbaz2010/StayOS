from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import CMS_SCHEMA


class CmsPage(UUIDMixin, TimestampMixin, Base):
    """A marketing/informational page addressable by slug.

    Content lives on the page metadata plus ordered ``CmsBlock`` rows.
    ``seo`` holds the localized SEO/OG payload
    ``{"en": {...}, "ar": {...}, "canonical": str, "robots": str,
    "og_image_key": str}``.
    """

    __tablename__ = "pages"
    __table_args__ = (
        Index("idx_cms_pages_status", "status"),
        {"schema": CMS_SCHEMA},
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    title_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    title_ar: Mapped[str | None] = mapped_column(String(300), nullable=True)
    seo: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    published_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="SET NULL"), nullable=True
    )

    blocks: Mapped[list["CmsBlock"]] = relationship(
        "CmsBlock",
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="CmsBlock.sort_order",
    )


class CmsBlock(UUIDMixin, TimestampMixin, Base):
    """An ordered, localized content block attached to a page."""

    __tablename__ = "blocks"
    __table_args__ = (
        Index("idx_cms_blocks_page", "page_id", "sort_order"),
        {"schema": CMS_SCHEMA},
    )

    page_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(f"{CMS_SCHEMA}.pages.id", ondelete="CASCADE"),
        nullable=False,
    )
    block_type: Mapped[str] = mapped_column(String(40), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    updated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="SET NULL"), nullable=True
    )

    page: Mapped[CmsPage] = relationship("CmsPage", back_populates="blocks")


class CmsRevision(UUIDMixin, Base):
    """Immutable snapshot of a page (metadata + blocks) at publish time.

    One row per published version; restoring a revision writes its
    snapshot back onto the draft state without deleting history.
    """

    __tablename__ = "revisions"
    __table_args__ = (
        UniqueConstraint("page_id", "version", name="uq_cms_revision_page_version"),
        {"schema": CMS_SCHEMA},
    )

    page_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(f"{CMS_SCHEMA}.pages.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    note: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class CmsMedia(UUIDMixin, TimestampMixin, Base):
    """A reusable marketing media asset reference.

    Only metadata is stored here — binaries live in S3 via the existing
    presigned-upload flow. ``url`` is the canonical delivery URL recorded
    after upload; when object storage is not configured the row may hold
    an external reference URL supplied by an editor instead.
    """

    __tablename__ = "media"
    __table_args__ = {"schema": CMS_SCHEMA}

    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    alt_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    alt_ar: Mapped[str | None] = mapped_column(String(300), nullable=True)
    uploaded_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="SET NULL"), nullable=True
    )
