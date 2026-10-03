"""User-initiated support conversations: subject + workflow status.

Revision ID: 053_support_conversations
Revises: 052_kyc_provider_fields
Create Date: 2026-10-03

Additive only — both columns are nullable; existing reservation/inquiry
conversations keep subject = NULL and support_status = NULL.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "053_support_conversations"
down_revision: str | None = "052_kyc_provider_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("subject", sa.String(200), nullable=True),
        schema="messaging",
    )
    op.add_column(
        "conversations",
        sa.Column("support_status", sa.String(30), nullable=True),
        schema="messaging",
    )
    op.create_index(
        "ix_conversations_support_queue",
        "conversations",
        ["type", "support_status"],
        schema="messaging",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_conversations_support_queue",
        table_name="conversations",
        schema="messaging",
    )
    op.drop_column("conversations", "support_status", schema="messaging")
    op.drop_column("conversations", "subject", schema="messaging")
