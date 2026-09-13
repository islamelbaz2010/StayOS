"""Add review subratings, publication window, and host responses

Revision ID: 036_review_parity
Revises: 035_accessibility_photos
Create Date: 2026-09-16 00:00:00.000000

Brings StayOS reviews closer to Airbnb's review behavior by adding
three deterministic, benchmark-grounded capabilities:

1. **Subratings** — Airbnb collects 6 fixed category ratings alongside
   the overall rating: Cleanliness, Accuracy, Check-in, Communication,
   Location, Value. Stored as a JSONB column (nullable) on guest reviews
   only. Host-to-guest reviews do not use subratings in Airbnb's model.

2. **Simultaneous publication** — Airbnb hides a submitted review until
   the other party also submits their review OR a 14-day window expires.
   We add a ``published_at`` column (nullable). When NULL, the review is
   not yet visible to the other party. Publication is computed on read:
   a review is published when both reviews for the booking exist, or
   when 14 days have elapsed since the review's ``created_at``. This
   avoids requiring a background sweep job.

3. **Host public response** — Airbnb allows a host to write one public
   response to a guest review. We add ``host_response`` (text) and
   ``host_response_at`` (timestamp) columns to the review row. Only
   guest reviews (``reviewer_role='guest'``) can receive a host
   response.

Review moderation (admin remove/flag) and review reporting are NOT
included — they require an abuse/moderation policy that cannot be
derived deterministically from the Airbnb benchmark and remain a
genuine product decision.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "036_review_parity"
down_revision: str | None = "035_accessibility_photos"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Subratings — JSONB, nullable (only guest reviews use subratings)
    op.add_column(
        "reviews",
        sa.Column("subratings", sa.JSON(), nullable=True),
        schema="pms",
    )

    # 2. Simultaneous publication — nullable timestamp; NULL = not yet
    #    published. Existing reviews are backfilled to "published now"
    #    so they remain visible (they predate the publication window).
    op.add_column(
        "reviews",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        schema="pms",
    )
    op.execute(
        "UPDATE pms.reviews SET published_at = NOW() WHERE published_at IS NULL"
    )

    # 3. Host public response to guest reviews
    op.add_column(
        "reviews",
        sa.Column("host_response", sa.Text(), nullable=True),
        schema="pms",
    )
    op.add_column(
        "reviews",
        sa.Column("host_response_at", sa.DateTime(timezone=True), nullable=True),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("reviews", "host_response_at", schema="pms")
    op.drop_column("reviews", "host_response", schema="pms")
    op.drop_column("reviews", "published_at", schema="pms")
    op.drop_column("reviews", "subratings", schema="pms")
