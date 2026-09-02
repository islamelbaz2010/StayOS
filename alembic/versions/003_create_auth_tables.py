"""Create auth tables

Revision ID: 003_create_auth_tables
Revises: 002_create_outbox_events
Create Date: 2026-07-21 07:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_create_auth_tables"
down_revision: str | None = "002_create_outbox_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("phone_number", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("firebase_uid", sa.String(128), nullable=True),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("locale", sa.String(10), nullable=False, server_default="ar"),
        sa.Column("role", sa.String(20), nullable=False, server_default="guest"),
        sa.Column("kyc_status", sa.String(20), nullable=False, server_default="unverified"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
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
        sa.UniqueConstraint("phone_number"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("firebase_uid"),
        sa.Index("ix_users_phone_number", "phone_number"),
        sa.Index("ix_users_email", "email"),
        sa.Index("ix_users_firebase_uid", "firebase_uid"),
        schema="auth",
    )

    op.create_table(
        "accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("legal_name", sa.String(255), nullable=True),
        sa.Column("national_id", sa.String(50), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("tax_id", sa.String(50), nullable=True),
        sa.Column("address", sa.JSON(), nullable=True),
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
        schema="auth",
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.Index("ix_refresh_tokens_user_id", "user_id"),
        sa.Index("ix_refresh_tokens_token_hash", "token_hash"),
        schema="auth",
    )

    op.create_table(
        "kyc_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "account_id",
            sa.String(36),
            sa.ForeignKey("auth.accounts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("document_type", sa.String(20), nullable=False),
        sa.Column("document_number", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="unverified"),
        sa.Column("legal_name", sa.String(255), nullable=True),
        sa.Column("front_image_key", sa.String(512), nullable=True),
        sa.Column("back_image_key", sa.String(512), nullable=True),
        sa.Column("selfie_image_key", sa.String(512), nullable=True),
        sa.Column("verification_payload", sa.JSON(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.String(500), nullable=True),
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
        sa.Index("ix_kyc_documents_user_id", "user_id"),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_table("kyc_documents", schema="auth")
    op.drop_table("refresh_tokens", schema="auth")
    op.drop_table("accounts", schema="auth")
    op.drop_table("users", schema="auth")
