"""Booking card payments via Paymob + user avatar key.

Revision ID: 045_booking_paymob_avatar
Revises: 044_cms_lite
Create Date: 2026-09-25

Adds provider linkage columns to ``payment.payments`` so a booking's
pending payment can be settled through the canonical Paymob hosted
checkout (webhook resolves the merchant order id to the booking), and
``auth.users.avatar_s3_key`` for profile photos stored through the
existing S3 presigned-upload mechanism.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "045_booking_paymob_avatar"
down_revision: str | None = "044_cms_lite"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("provider", sa.String(50), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("provider_ref", sa.String(255), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("transaction_ref", sa.String(255), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("checkout_url", sa.String(1024), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("provider_metadata", sa.JSON(), nullable=True),
        schema="payment",
    )
    op.add_column(
        "users",
        sa.Column("avatar_s3_key", sa.String(512), nullable=True),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_s3_key", schema="auth")
    op.drop_column("payments", "provider_metadata", schema="payment")
    op.drop_column("payments", "checkout_url", schema="payment")
    op.drop_column("payments", "transaction_ref", schema="payment")
    op.drop_column("payments", "provider_ref", schema="payment")
    op.drop_column("payments", "provider", schema="payment")
