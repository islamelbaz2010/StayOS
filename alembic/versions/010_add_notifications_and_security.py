"""Add notifications and security audit tables

Revision ID: 010_notifications_and_security
Revises: 009_add_calendar_exclusion
Create Date: 2026-07-22 14:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010_notifications_and_security"
down_revision: str | None = "009_add_calendar_exclusion"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS security")

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("recipient", sa.String(255), nullable=False),
        sa.Column("locale", sa.String(10), nullable=False, server_default="ar"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("subject", sa.Text, nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.Index("idx_notifications_status_created_at", "status", "created_at"),
        sa.Index("idx_notifications_event_id", "event_id"),
        schema="notify",
    )

    op.create_table(
        "notification_templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("locale", sa.String(10), nullable=False),
        sa.Column("subject", sa.Text, nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column(
            "placeholders",
            postgresql.ARRAY(sa.String),
            nullable=False,
            server_default="{}",
        ),
        sa.UniqueConstraint(
            "event_type",
            "channel",
            "locale",
            name="uq_notification_templates_event_channel_locale",
        ),
        schema="notify",
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("role", sa.String(50), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("request_id", sa.String(36), nullable=True),
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("path", sa.String(2048), nullable=False),
        sa.Column("status_code", sa.Integer, nullable=True),
        sa.Column("resource_type", sa.String(100), nullable=True),
        sa.Column("resource_id", sa.String(36), nullable=True),
        sa.Column("action", sa.String(100), nullable=True),
        sa.Column("payload", sa.Text, nullable=True),
        sa.Index("idx_audit_logs_user_id", "user_id"),
        sa.Index("idx_audit_logs_resource", "resource_type", "resource_id"),
        schema="security",
    )


def downgrade() -> None:
    op.drop_table("audit_logs", schema="security")
    op.drop_table("notification_templates", schema="notify")
    op.drop_table("notifications", schema="notify")
    op.execute("DROP SCHEMA IF EXISTS security CASCADE")
