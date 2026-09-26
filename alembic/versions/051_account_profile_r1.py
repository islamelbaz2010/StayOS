"""R1 account/profile fields: optional profile info, privacy flags,
notification preferences, mailing address and emergency contact.

Revision ID: 051_account_profile_r1
Revises: 050_commercial_adjustments
Create Date: 2026-10-06

Additive only — every new column is nullable except the two privacy flags,
which default true to preserve current behavior (optional profile details
shown on public host profiles; read timestamps shared with counterparties).
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "051_account_profile_r1"
down_revision: str | None = "050_commercial_adjustments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("location", sa.String(255), nullable=True),
        schema="auth",
    )
    op.add_column(
        "users", sa.Column("interests", sa.JSON(), nullable=True),
        schema="auth",
    )
    op.add_column(
        "users",
        sa.Column("notification_preferences", sa.JSON(), nullable=True),
        schema="auth",
    )
    op.add_column(
        "users",
        sa.Column(
            "profile_public",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        schema="auth",
    )
    op.add_column(
        "users",
        sa.Column(
            "read_receipts",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        schema="auth",
    )
    op.add_column(
        "accounts", sa.Column("mailing_address", sa.JSON(), nullable=True),
        schema="auth",
    )
    op.add_column(
        "accounts", sa.Column("emergency_contact", sa.JSON(), nullable=True),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_column("accounts", "emergency_contact", schema="auth")
    op.drop_column("accounts", "mailing_address", schema="auth")
    op.drop_column("users", "read_receipts", schema="auth")
    op.drop_column("users", "profile_public", schema="auth")
    op.drop_column("users", "notification_preferences", schema="auth")
    op.drop_column("users", "interests", schema="auth")
    op.drop_column("users", "location", schema="auth")
