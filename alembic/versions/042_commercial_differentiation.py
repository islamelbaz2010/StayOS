"""Founder decision closure — commercial model + differentiation schema.

Revision ID: 042_commercial_differentiation
Revises: 041_user_password_hash
Create Date: 2026-09-21

Changes:
- pms.unit_listings: host promotion fields — listing_discount_pct,
  weekly_discount_pct, monthly_discount_pct (FD-08/FD-20). Exactly one
  applies per booking.
- booking.bookings: custom_total_egp + offer_id for host custom offers
  created from inquiry conversations (FD-07).
- booking.booking_offers: new table — host-proposed all-inclusive stay
  offers the guest can accept or decline.
- auth.users.guest_preferences: JSON list of Local Fit preference keys
  (FD-24, rule-based explainable matching).
- auth.accounts: host payout preference fields (FD-26) — collection only;
  actual payout execution remains gated on provider/legal prerequisites.
- pms.reviews.is_hidden + support.review_reports: FD-04 review report →
  admin moderation queue (hide review / dismiss report).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "042_commercial_differentiation"
down_revision: str | None = "041_user_password_hash"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column(
            "listing_discount_pct",
            sa.SmallInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "weekly_discount_pct",
            sa.SmallInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "monthly_discount_pct",
            sa.SmallInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        schema="pms",
    )
    op.create_check_constraint(
        "chk_listing_discounts_range",
        "unit_listings",
        "listing_discount_pct BETWEEN 0 AND 90 "
        "AND weekly_discount_pct BETWEEN 0 AND 90 "
        "AND monthly_discount_pct BETWEEN 0 AND 90",
        schema="pms",
    )

    op.add_column(
        "bookings",
        sa.Column("custom_total_egp", sa.Integer(), nullable=True),
        schema="booking",
    )
    op.add_column(
        "bookings",
        sa.Column("offer_id", sa.String(length=36), nullable=True),
        schema="booking",
    )

    op.create_table(
        "booking_offers",
        sa.Column("id", sa.String(length=36), primary_key=True),
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
            "conversation_id",
            sa.String(length=36),
            sa.ForeignKey(
                "messaging.conversations.id", ondelete="CASCADE"
            ),
            nullable=False,
        ),
        sa.Column(
            "unit_id",
            sa.String(length=36),
            sa.ForeignKey("pms.units.id"),
            nullable=False,
        ),
        sa.Column(
            "host_id",
            sa.String(length=36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column(
            "guest_id",
            sa.String(length=36),
            sa.ForeignKey("auth.users.id"),
            nullable=False,
        ),
        sa.Column("check_in", sa.Date(), nullable=False),
        sa.Column("check_out", sa.Date(), nullable=False),
        sa.Column("total_price_egp", sa.Integer(), nullable=False),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="pending"
        ),
        sa.Column("booking_id", sa.String(length=36), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "check_out > check_in", name="chk_offer_date_range"
        ),
        sa.CheckConstraint(
            "total_price_egp > 0", name="chk_offer_price_positive"
        ),
        schema="booking",
    )
    op.create_index(
        "idx_booking_offers_conversation",
        "booking_offers",
        ["conversation_id"],
        schema="booking",
    )

    op.add_column(
        "users",
        sa.Column("guest_preferences", sa.JSON(), nullable=True),
        schema="auth",
    )

    for column in (
        sa.Column("payout_method", sa.String(length=30), nullable=True),
        sa.Column("payout_bank_name", sa.String(length=100), nullable=True),
        sa.Column("payout_account_number", sa.String(length=100), nullable=True),
        sa.Column("payout_wallet_msisdn", sa.String(length=30), nullable=True),
        sa.Column("payout_holder_name", sa.String(length=255), nullable=True),
    ):
        op.add_column("accounts", column, schema="auth")

    op.add_column(
        "reviews",
        sa.Column(
            "is_hidden",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        schema="pms",
    )
    op.create_table(
        "review_reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
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
            "review_id",
            sa.String(length=36),
            sa.ForeignKey("pms.reviews.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "reporter_id",
            sa.String(length=36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reason", sa.String(length=50), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(length=30), nullable=False, server_default="open"
        ),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("resolved_by", sa.String(length=36), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "review_id", "reporter_id", name="uq_review_report_reporter"
        ),
        schema="support",
    )
    op.create_index(
        "idx_review_reports_review",
        "review_reports",
        ["review_id"],
        schema="support",
    )
    op.create_index(
        "idx_review_reports_status",
        "review_reports",
        ["status"],
        schema="support",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_review_reports_status",
        table_name="review_reports",
        schema="support",
    )
    op.drop_index(
        "idx_review_reports_review",
        table_name="review_reports",
        schema="support",
    )
    op.drop_table("review_reports", schema="support")
    op.drop_column("reviews", "is_hidden", schema="pms")
    for column in (
        "payout_holder_name",
        "payout_wallet_msisdn",
        "payout_account_number",
        "payout_bank_name",
        "payout_method",
    ):
        op.drop_column("accounts", column, schema="auth")
    op.drop_column("users", "guest_preferences", schema="auth")
    op.drop_index(
        "idx_booking_offers_conversation",
        table_name="booking_offers",
        schema="booking",
    )
    op.drop_table("booking_offers", schema="booking")
    op.drop_column("bookings", "offer_id", schema="booking")
    op.drop_column("bookings", "custom_total_egp", schema="booking")
    op.drop_constraint(
        "chk_listing_discounts_range", "unit_listings", schema="pms"
    )
    op.drop_column("unit_listings", "monthly_discount_pct", schema="pms")
    op.drop_column("unit_listings", "weekly_discount_pct", schema="pms")
    op.drop_column("unit_listings", "listing_discount_pct", schema="pms")
