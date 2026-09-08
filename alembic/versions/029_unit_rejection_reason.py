"""Add listing rejection reason to pms.units

Revision ID: 029_unit_rejection_reason
Revises: 028_payment_lifecycle_fields
Create Date: 2026-09-08 00:00:00.000000

Adds ``pms.units.rejection_reason`` so admin rejection feedback is
persisted and can be surfaced to hosts instead of a bare REJECTED badge.
Nullable and backward-compatible.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "029_unit_rejection_reason"
down_revision: str | None = "028_payment_lifecycle_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "units",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("units", "rejection_reason", schema="pms")
