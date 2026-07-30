"""Create bookings table

Revision ID: 016_create_bookings_table
Revises: 015_adr015_add_currency_columns
Create Date: 2026-07-30 11:30:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "016_create_bookings_table"
down_revision: Union[str, None] = "015_adr015_add_currency_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS booking")

    op.create_table(
        "bookings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id"),
            nullable=False,
        ),
        sa.Column(
            "guest_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="requested",
        ),
        sa.Column("check_in", sa.Date, nullable=False),
        sa.Column("check_out", sa.Date, nullable=False),
        sa.Column("adults", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("children", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("infants", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column(
            "requested_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reject_reason", sa.Text, nullable=True),
        sa.Column("cancel_reason", sa.Text, nullable=True),
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
        sa.CheckConstraint("check_out > check_in", name="chk_booking_date_range"),
        sa.CheckConstraint("adults >= 1", name="chk_booking_adults"),
        sa.CheckConstraint("children >= 0", name="chk_booking_children"),
        sa.CheckConstraint("infants >= 0", name="chk_booking_infants"),
        sa.Index("idx_bookings_unit_id", "unit_id"),
        sa.Index("idx_bookings_guest_id", "guest_id"),
        sa.Index("idx_bookings_status", "status"),
        sa.Index("idx_bookings_check_in", "check_in"),
        sa.Index("idx_bookings_check_out", "check_out"),
        schema="booking",
    )


def downgrade() -> None:
    op.drop_table("bookings", schema="booking")
    op.execute("DROP SCHEMA IF EXISTS booking CASCADE")
