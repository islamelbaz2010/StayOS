"""Add cleaning_fee_egp to pms.payments

Revision ID: 030_payment_cleaning_fee
Revises: 029_unit_rejection_reason
Create Date: 2026-09-10 00:00:00.000000

Adds ``pms.payments.cleaning_fee_egp`` so the host booking detail and
guest checkout can show the cleaning fee component of the total without
reverse-engineering it. Nullable and backward-compatible — existing
payments simply have no recorded cleaning fee.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "030_payment_cleaning_fee"
down_revision: str | None = "029_unit_rejection_reason"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("cleaning_fee_egp", sa.Integer(), nullable=True),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("payments", "cleaning_fee_egp", schema="pms")
