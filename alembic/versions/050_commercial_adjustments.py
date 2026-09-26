"""Commercial adjustments — explicit, audited admin-initiated financial
adjustments.

Revision ID: 050_commercial_adjustments
Revises: 049_decimal_money
Create Date: 2026-10-12

Replaces the removed automatic launch waiver (ALPHA_HOST_FREE_BOOKINGS)
with a canonical admin mechanism: every exceptional commercial treatment
is an explicit CommercialAdjustment record carrying reason, actor, target
and status. Applying one posts a distinct financial_transactions row
(type=adjustment) plus a double-entry ledger pair — original booking and
payment amounts are never rewritten.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "050_commercial_adjustments"
down_revision: str | None = "049_decimal_money"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "commercial_adjustments",
        sa.Column("id", sa.String(36), primary_key=True),
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
            nullable=False,
        ),
        sa.Column(
            "booking_id",
            sa.String(36),
            sa.ForeignKey("booking.bookings.id"),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        sa.Column(
            "listing_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id"),
            nullable=True,
        ),
        sa.Column("adjustment_type", sa.String(30), nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("amount_egp", sa.Numeric(12, 2), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("internal_note", sa.Text(), nullable=True),
        sa.Column("customer_note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column(
            "requested_by_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        sa.Column(
            "created_by_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column(
            "decided_by_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("financial_transaction_id", sa.String(36), nullable=True),
        schema="finance",
    )
    op.create_index(
        "idx_adjustments_status",
        "commercial_adjustments",
        ["status"],
        schema="finance",
    )
    op.create_index(
        "idx_adjustments_booking_id",
        "commercial_adjustments",
        ["booking_id"],
        schema="finance",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_adjustments_booking_id",
        table_name="commercial_adjustments",
        schema="finance",
    )
    op.drop_index(
        "idx_adjustments_status",
        table_name="commercial_adjustments",
        schema="finance",
    )
    op.drop_table("commercial_adjustments", schema="finance")
