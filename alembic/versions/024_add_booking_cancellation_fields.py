"""Add cancellation/refund audit fields to bookings and payments

Revision ID: 024_add_booking_cancel_fields
Revises: 023_add_reviews
Create Date: 2026-09-02 00:00:00.000000

The live booking-cancellation flow previously did a bare status update
with no record of who cancelled and no refund tracking on the payment.
This adds:

- ``booking.bookings.cancelled_by``: the user who cancelled (guest, host,
  or admin), for audit purposes. Nullable/additive, existing rows unaffected.
- ``payment.payments.refund_amount_egp``: amount determined owed back to
  the guest by the cancellation policy (0 if none). Nullable/additive.
- ``payment.payments.refunded_at``: when finance actually completed the
  manual refund (set once reconciled; null while REFUND_PENDING).
  Nullable/additive.

All changes are additive and backward-compatible; no data is modified or
dropped.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "024_add_booking_cancel_fields"
down_revision: str | None = "023_add_reviews"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column(
            "cancelled_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        schema="booking",
    )
    op.add_column(
        "payments",
        sa.Column("refund_amount_egp", sa.Integer, nullable=True),
        schema="payment",
    )
    op.add_column(
        "payments",
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
        schema="payment",
    )


def downgrade() -> None:
    op.drop_column("payments", "refunded_at", schema="payment")
    op.drop_column("payments", "refund_amount_egp", schema="payment")
    op.drop_column("bookings", "cancelled_by", schema="booking")
