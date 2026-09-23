"""CMS-Lite: marketing content pages, blocks, revisions, media.

Revision ID: 044_cms_lite
Revises: 043_outbox_processed_by
Create Date: 2026-09-24

Adds the ``cms`` schema backing the internal marketing content
management feature: structured pages made of ordered localized blocks,
an immutable publish-time revision history, and media asset references.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "044_cms_lite"
down_revision: str | None = "043_outbox_processed_by"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS cms")

    op.create_table(
        "pages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="draft"
        ),
        sa.Column("title_en", sa.String(300), nullable=True),
        sa.Column("title_ar", sa.String(300), nullable=True),
        sa.Column(
            "seo", postgresql.JSONB, nullable=False, server_default="{}"
        ),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "published_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "updated_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema="cms",
    )
    op.create_index(
        "idx_cms_pages_status", "pages", ["status"], schema="cms"
    )

    op.create_table(
        "blocks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "page_id",
            sa.String(36),
            sa.ForeignKey("cms.pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("block_type", sa.String(40), nullable=False),
        sa.Column(
            "sort_order", sa.Integer, nullable=False, server_default="0"
        ),
        sa.Column(
            "enabled", sa.Boolean, nullable=False, server_default="true"
        ),
        sa.Column(
            "content", postgresql.JSONB, nullable=False, server_default="{}"
        ),
        sa.Column(
            "updated_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema="cms",
    )
    op.create_index(
        "idx_cms_blocks_page",
        "blocks",
        ["page_id", "sort_order"],
        schema="cms",
    )

    op.create_table(
        "revisions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "page_id",
            sa.String(36),
            sa.ForeignKey("cms.pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("snapshot", postgresql.JSONB, nullable=False),
        sa.Column("note", sa.String(300), nullable=True),
        sa.Column(
            "created_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "page_id", "version", name="uq_cms_revision_page_version"
        ),
        schema="cms",
    )

    op.create_table(
        "media",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("s3_key", sa.String(500), nullable=True),
        sa.Column("url", sa.Text, nullable=True),
        sa.Column("content_type", sa.String(100), nullable=True),
        sa.Column("alt_en", sa.String(300), nullable=True),
        sa.Column("alt_ar", sa.String(300), nullable=True),
        sa.Column(
            "uploaded_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema="cms",
    )


def downgrade() -> None:
    op.drop_table("media", schema="cms")
    op.drop_table("revisions", schema="cms")
    op.drop_index("idx_cms_blocks_page", table_name="blocks", schema="cms")
    op.drop_table("blocks", schema="cms")
    op.drop_index("idx_cms_pages_status", table_name="pages", schema="cms")
    op.drop_table("pages", schema="cms")
    op.execute("DROP SCHEMA IF EXISTS cms")
