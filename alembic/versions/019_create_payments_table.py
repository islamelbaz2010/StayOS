"""Create payments table for manual payment proof flow

Revision ID: 019_create_payments_table
Revises: 018_add_listing_creation_fields
Create Date: 2026-08-10 00:00:00.000000

Creates the ``payment`` schema and ``payment.payments`` table that the
payment service module requires.  This table stores the manual payment
proof lifecycle: PENDING -> PROOF_UPLOADED -> VERIFIED / REJECTED.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "019_create_payments_table"
down_revision: str | None = "018_add_listing_creation_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS payment")

    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "booking_id",
            sa.String(36),
            sa.ForeignKey("booking.bookings.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "guest_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column(
            "host_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("method", sa.String(50), nullable=False, server_default="manual"),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column("nights", sa.Integer, nullable=False, server_default="1"),
        sa.Column("reference_number", sa.String(36), nullable=False),
        sa.Column("proof_s3_key", sa.String(512), nullable=True),
        sa.Column("proof_url", sa.String(1024), nullable=True),
        sa.Column("proof_uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "verified_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "rejected_by",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=True,
        ),
        sa.Column("reject_reason", sa.Text, nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("instructions", sa.Text, nullable=False, server_default=""),
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
        sa.Index("idx_payments_booking_id", "booking_id"),
        sa.Index("idx_payments_status", "status"),
        sa.Index("idx_payments_guest_id", "guest_id"),
        schema="payment",
    )


def downgrade() -> None:
    op.drop_table("payments", schema="payment")
    op.execute("DROP SCHEMA IF EXISTS payment CASCADE")
