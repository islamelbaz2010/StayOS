"""Add payment lifecycle fields for the V1 cancellation/refund policy

Revision ID: 028_payment_lifecycle_fields
Revises: 027_create_host_operating_system
Create Date: 2026-09-05 00:00:00.000000

Adds to ``payment.payments``:

1. ``accommodation_amount_egp`` / ``guest_service_fee_egp`` — amount
   breakdown captured at creation so refund computation can enforce the
   non-refundable guest service fee (V1 policy §3) without reverse-
   engineering the total.
2. ``payment_deadline_at`` — the 24-hour proof-submission deadline that
   starts at host acceptance (V1 policy §1.2).
3. ``proof_rejection_count`` / ``first_rejected_at`` — resubmission
   tracking for the 3-attempts-in-48-hours rule (V1 policy §2.2).

All changes are additive and backward-compatible (new columns are nullable
or have defaults).
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "028_payment_lifecycle_fields"
down_revision: str | None = "027_create_host_operating_system"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("accommodation_amount_egp", sa.Integer(), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("guest_service_fee_egp", sa.Integer(), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("payment_deadline_at", sa.DateTime(timezone=True), nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column(
            "proof_rejection_count", sa.Integer(), nullable=False, server_default="0"
        ),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("first_rejected_at", sa.DateTime(timezone=True), nullable=True),
        schema="payment",
    )
    op.create_index(
        "idx_payments_deadline",
        "payments",
        ["payment_deadline_at"],
        schema="payment",
    )


def downgrade() -> None:
    op.drop_index("idx_payments_deadline", table_name="payments", schema="payment")
    op.drop_column("payments", "first_rejected_at", schema="payment")
    op.drop_column("payments", "proof_rejection_count", schema="payment")
    op.drop_column("payments", "payment_deadline_at", schema="payment")
    op.drop_column("payments", "guest_service_fee_egp", schema="payment")
    op.drop_column("payments", "accommodation_amount_egp", schema="payment")
