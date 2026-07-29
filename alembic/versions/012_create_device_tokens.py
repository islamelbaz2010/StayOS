"""Create auth.device_tokens table

Revision ID: 012_create_device_tokens
Revises: 011_create_unit_photos
Create Date: 2026-07-30 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "012_create_device_tokens"
down_revision: str | None = "011_create_unit_photos"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "device_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token", sa.String(512), nullable=False, unique=True),
        sa.Column("platform", sa.String(20), nullable=False),
        sa.Column("app_version", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        schema="auth",
    )

    op.create_index(
        "idx_device_tokens_user_id",
        "device_tokens",
        ["user_id"],
        schema="auth",
    )
    op.create_index(
        "idx_device_tokens_token",
        "device_tokens",
        ["token"],
        unique=True,
        schema="auth",
    )


def downgrade() -> None:
    op.drop_index("idx_device_tokens_token", table_name="device_tokens", schema="auth")
    op.drop_index("idx_device_tokens_user_id", table_name="device_tokens", schema="auth")
    op.drop_table("device_tokens", schema="auth")
