"""Create reservation tables

Revision ID: 005_create_reservation_tables
Revises: 004_create_pms_tables
Create Date: 2026-07-21 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "005_create_reservation_tables"
down_revision: Union[str, None] = "004_create_pms_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reservations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id", sa.String(36), sa.ForeignKey("pms.units.id"), nullable=False
        ),
        sa.Column(
            "guest_id", sa.String(36), sa.ForeignKey("auth.users.id"), nullable=False
        ),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="PENDING_PAYMENT",
        ),
        sa.Column("check_in", sa.Date, nullable=False),
        sa.Column("check_out", sa.Date, nullable=False),
        sa.Column("adults", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("children", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("infants", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("total_amount_egp", sa.Integer, nullable=False),
        sa.Column("host_amount_egp", sa.Integer, nullable=False),
        sa.Column("platform_fee_egp", sa.Integer, nullable=False),
        sa.Column("guest_fee_egp", sa.Integer, nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checked_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_reason", sa.Text, nullable=True),
        sa.Column("refund_amount_egp", sa.Integer, nullable=True),
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
        sa.CheckConstraint("check_out > check_in", name="chk_reservation_date_range"),
        sa.Index("idx_reservations_unit_id", "unit_id"),
        sa.Index("idx_reservations_guest_id", "guest_id"),
        sa.Index("idx_reservations_status", "status"),
        sa.Index("idx_reservations_checkin", "check_in"),
        schema="reservation",
    )

    op.create_table(
        "payment_intents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "reservation_id",
            sa.String(36),
            sa.ForeignKey("reservation.reservations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("provider_ref", sa.String(255), nullable=False),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.Index("idx_payment_intents_reservation_id", "reservation_id"),
        sa.Index(
            "idx_payment_intents_provider_ref",
            "provider",
            "provider_ref",
            unique=True,
        ),
        schema="reservation",
    )

    op.create_table(
        "promo_codes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("discount_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("max_uses", sa.Integer, nullable=True),
        sa.Column("uses", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
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
        sa.Index("idx_promo_codes_code", "code"),
        schema="reservation",
    )

    op.create_table(
        "promo_applications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "reservation_id",
            sa.String(36),
            sa.ForeignKey("reservation.reservations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "promo_code_id",
            sa.String(36),
            sa.ForeignKey("reservation.promo_codes.id"),
            nullable=False,
        ),
        sa.Column("discount_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("discount_amount_egp", sa.Integer, nullable=False),
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
        sa.Index("idx_promo_applications_reservation_id", "reservation_id"),
        schema="reservation",
    )


def downgrade() -> None:
    op.drop_table("promo_applications", schema="reservation")
    op.drop_table("promo_codes", schema="reservation")
    op.drop_table("payment_intents", schema="reservation")
    op.drop_table("reservations", schema="reservation")
