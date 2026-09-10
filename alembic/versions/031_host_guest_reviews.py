"""Add reviewer_role and reviewer_id to reviews for host-to-guest reviews

Revision ID: 031_host_guest_reviews
Revises: 030_payment_cleaning_fee
Create Date: 2026-09-11 00:00:00.000000

Adds ``reviewer_role`` and ``reviewer_id`` columns to ``pms.reviews`` so
hosts can review guests after a stay, mirroring Airbnb's bidirectional
review system. The unique constraint is changed from ``uq_review_booking``
(one review per booking) to ``uq_review_booking_role`` (one review per
booking per reviewer role — a guest and a host can each leave one review).

Existing guest reviews are backfilled with ``reviewer_role='guest'`` and
``reviewer_id = guest_id``.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "031_host_guest_reviews"
down_revision: str | None = "030_payment_cleaning_fee"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "reviews",
        sa.Column("reviewer_id", sa.String(36), nullable=True),
        schema="pms",
    )
    op.add_column(
        "reviews",
        sa.Column("reviewer_role", sa.String(20), nullable=True),
        schema="pms",
    )

    # Backfill existing guest reviews
    op.execute(
        "UPDATE pms.reviews SET reviewer_id = guest_id, reviewer_role = 'guest' "
        "WHERE reviewer_id IS NULL"
    )

    op.alter_column(
        "reviews",
        "reviewer_id",
        existing_type=sa.String(36),
        nullable=False,
        schema="pms",
    )
    op.alter_column(
        "reviews",
        "reviewer_role",
        existing_type=sa.String(20),
        nullable=False,
        schema="pms",
    )

    op.drop_constraint("uq_review_booking", "reviews", schema="pms")
    op.create_unique_constraint(
        "uq_review_booking_role",
        "reviews",
        ["booking_id", "reviewer_role"],
        schema="pms",
    )
    op.create_index(
        "idx_reviews_reviewer_id",
        "reviews",
        ["reviewer_id"],
        schema="pms",
    )


def downgrade() -> None:
    op.drop_index("idx_reviews_reviewer_id", table_name="reviews", schema="pms")
    op.drop_constraint("uq_review_booking_role", "reviews", schema="pms")
    op.create_unique_constraint(
        "uq_review_booking",
        "reviews",
        ["booking_id"],
        schema="pms",
    )
    op.drop_column("reviews", "reviewer_role", schema="pms")
    op.drop_column("reviews", "reviewer_id", schema="pms")
