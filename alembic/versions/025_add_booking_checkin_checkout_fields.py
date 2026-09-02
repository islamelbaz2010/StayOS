"""Add check-in/check-out tracking fields to bookings

Revision ID: 025_add_booking_checkin_checkout_fields
Revises: 024_add_booking_cancellation_fields
Create Date: 2026-09-02 00:00:00.000000

Adds the operational stay-lifecycle timestamps used to derive a booking's
stay phase (upcoming / check-in ready / checked in / checkout ready /
checked out) without touching the existing ``status`` column or any of its
downstream consumers (calendar overlap checks, review eligibility gate,
finance completion trigger, host/admin filters):

- ``booking.bookings.checked_in_at``: set when the guest (or host on the
  guest's behalf) self-reports arrival. Nullable/additive.
- ``booking.bookings.checked_out_at``: set when the guest (or host) self-
  reports departure. Nullable/additive.

These are deliberately separate from the admin-only ``COMPLETED`` status
transition (which triggers the finance ledger / host payout) — self-
reported checkout only unlocks the review eligibility window and Trip UI
state; it does not move money.

All changes are additive and backward-compatible; no data is modified or
dropped.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "025_add_booking_checkin_checkout_fields"
down_revision: str | None = "024_add_booking_cancellation_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        schema="booking",
    )
    op.add_column(
        "bookings",
        sa.Column("checked_out_at", sa.DateTime(timezone=True), nullable=True),
        schema="booking",
    )


def downgrade() -> None:
    op.drop_column("bookings", "checked_out_at", schema="booking")
    op.drop_column("bookings", "checked_in_at", schema="booking")
