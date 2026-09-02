"""Create messaging domain and listing-specific stay configuration

Revision ID: 026_create_messaging_and_listing_stay_config
Revises: 025_add_booking_checkin_checkout_fields
Create Date: 2026-09-02 00:00:00.000000

Adds the schema and tables required for reservation-linked conversations
and messages, plus per-listing overrides for check-in/checkout times and
the pre-arrival information release window.

All changes are additive and backward-compatible; no existing data is
modified or dropped.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "026_create_messaging_and_listing_stay_config"
down_revision: str | None = "025_add_booking_checkin_checkout_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS messaging")

    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("booking.bookings.id"), nullable=True),
        sa.Column("unit_id", sa.String(36), sa.ForeignKey("pms.units.id"), nullable=True),
        sa.Column("type", sa.String(50), nullable=False, server_default="reservation"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
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
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("booking_id", name="uq_conversations_booking_id"),
        sa.Index("idx_conversations_booking_id", "booking_id"),
        sa.Index("idx_conversations_unit_id", "unit_id"),
        schema="messaging",
    )

    op.create_table(
        "conversation_participants",
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("messaging.conversations.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("role", sa.String(50), nullable=False, server_default="guest"),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Index("idx_conversation_participants_user_id", "user_id"),
        schema="messaging",
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("messaging.conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sender_id", sa.String(36), sa.ForeignKey("auth.users.id"), nullable=True),
        sa.Column("sender_role", sa.String(50), nullable=False, server_default="guest"),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="sent"),
        sa.Column("automation_type", sa.String(50), nullable=True),
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
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.Index("idx_messages_conversation_id", "conversation_id"),
        sa.Index("idx_messages_sender_id", "sender_id"),
        sa.Index("idx_messages_created_at", "created_at"),
        # Partial unique index: only one automated message of each type per
        # conversation. Regular (non-automated) messages are excluded because
        # automation_type is NULL for them. This is the DB-level backstop for
        # the application-level duplicate guard in send_automated_message().
        sa.Index(
            "uq_messages_conversation_automation",
            "conversation_id",
            "automation_type",
            unique=True,
            postgresql_where=sa.text("automation_type IS NOT NULL"),
        ),
        schema="messaging",
    )

    op.create_table(
        "message_templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column(
            "variables",
            postgresql.ARRAY(sa.String),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("locale", sa.String(10), nullable=False, server_default="ar"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
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
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("key", "locale", name="uq_message_templates_key_locale"),
        sa.Index("idx_message_templates_category", "category"),
        schema="messaging",
    )

    op.add_column(
        "unit_listings",
        sa.Column("check_in_time", sa.String(5), nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column("check_out_time", sa.String(5), nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column("pre_arrival_info_release_hours", sa.Integer, nullable=True),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("unit_listings", "pre_arrival_info_release_hours", schema="pms")
    op.drop_column("unit_listings", "check_out_time", schema="pms")
    op.drop_column("unit_listings", "check_in_time", schema="pms")

    op.drop_table("message_templates", schema="messaging")
    op.drop_table("messages", schema="messaging")
    op.drop_table("conversation_participants", schema="messaging")
    op.drop_table("conversations", schema="messaging")

    op.execute("DROP SCHEMA IF EXISTS messaging")
