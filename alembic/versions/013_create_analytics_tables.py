"""Create analytics schema and event tables

Revision ID: 013_create_analytics_tables
Revises: 012_create_device_tokens
Create Date: 2026-07-30 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "013_create_analytics_tables"
down_revision: str | None = "012_create_device_tokens"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS analytics")

    op.create_table(
        "listing_views",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("unit_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("session_id", sa.String(128), nullable=True),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("referrer", sa.String(2048), nullable=True),
        sa.Column(
            "viewed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        schema="analytics",
    )

    op.create_index(
        "idx_listing_views_unit_id",
        "listing_views",
        ["unit_id"],
        schema="analytics",
    )
    op.create_index(
        "idx_listing_views_viewed_at",
        "listing_views",
        ["viewed_at"],
        schema="analytics",
    )
    op.create_index(
        "idx_listing_views_user_id",
        "listing_views",
        ["user_id"],
        schema="analytics",
    )

    op.create_table(
        "user_searches",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("session_id", sa.String(128), nullable=True),
        sa.Column("query", sa.String(500), nullable=True),
        sa.Column("governorate", sa.String(100), nullable=True),
        sa.Column("check_in", sa.Date(), nullable=True),
        sa.Column("check_out", sa.Date(), nullable=True),
        sa.Column("guests", sa.SmallInteger(), nullable=True),
        sa.Column("result_count", sa.Integer(), nullable=True),
        sa.Column(
            "searched_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        schema="analytics",
    )

    op.create_index(
        "idx_user_searches_user_id",
        "user_searches",
        ["user_id"],
        schema="analytics",
    )
    op.create_index(
        "idx_user_searches_searched_at",
        "user_searches",
        ["searched_at"],
        schema="analytics",
    )

    op.create_table(
        "booking_funnel_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("session_id", sa.String(128), nullable=True),
        sa.Column("unit_id", sa.String(36), nullable=True),
        sa.Column("reservation_id", sa.String(36), nullable=True),
        sa.Column("step", sa.String(100), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        schema="analytics",
    )

    op.create_index(
        "idx_funnel_user_id",
        "booking_funnel_events",
        ["user_id"],
        schema="analytics",
    )
    op.create_index(
        "idx_funnel_unit_id",
        "booking_funnel_events",
        ["unit_id"],
        schema="analytics",
    )
    op.create_index(
        "idx_funnel_occurred_at",
        "booking_funnel_events",
        ["occurred_at"],
        schema="analytics",
    )


def downgrade() -> None:
    op.drop_index("idx_funnel_occurred_at", table_name="booking_funnel_events", schema="analytics")
    op.drop_index("idx_funnel_unit_id", table_name="booking_funnel_events", schema="analytics")
    op.drop_index("idx_funnel_user_id", table_name="booking_funnel_events", schema="analytics")
    op.drop_table("booking_funnel_events", schema="analytics")

    op.drop_index("idx_user_searches_searched_at", table_name="user_searches", schema="analytics")
    op.drop_index("idx_user_searches_user_id", table_name="user_searches", schema="analytics")
    op.drop_table("user_searches", schema="analytics")

    op.drop_index("idx_listing_views_user_id", table_name="listing_views", schema="analytics")
    op.drop_index("idx_listing_views_viewed_at", table_name="listing_views", schema="analytics")
    op.drop_index("idx_listing_views_unit_id", table_name="listing_views", schema="analytics")
    op.drop_table("listing_views", schema="analytics")

    op.execute("DROP SCHEMA IF EXISTS analytics")
