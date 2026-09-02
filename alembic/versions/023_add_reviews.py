"""Add reviews table

Revision ID: 023_add_reviews
Revises: 022_add_favorites_and_locations
Create Date: 2026-09-02 00:00:00.000000

Creates:
- pms.reviews: one guest review per completed booking, backing listing
  average rating / review count display.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "023_add_reviews"
down_revision: str | None = "022_add_favorites_and_locations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "booking_id",
            sa.String(36),
            sa.ForeignKey("booking.bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "guest_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.SmallInteger, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
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
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        sa.UniqueConstraint("booking_id", name="uq_review_booking"),
        sa.Index("idx_reviews_unit_id", "unit_id"),
        sa.Index("idx_reviews_guest_id", "guest_id"),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_table("reviews", schema="pms")
