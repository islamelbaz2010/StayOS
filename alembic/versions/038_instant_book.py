"""Add instant_book column to unit_listings.

Revision ID: 038_instant_book
Revises: 037_host_bio
Create Date: 2026-09-14

Airbnb benchmark: hosts can opt a listing into Instant Book so guests are
auto-accepted without a manual host-approval step. This column is the
per-listing toggle; the booking service reads it to decide whether a new
booking is created as REQUESTED (request-to-book) or ACCEPTED (instant
book). Payment still follows the existing manual-proof contract, so no
new payment policy is introduced.
"""

from alembic import op
import sqlalchemy as sa

revision: str = "038_instant_book"
down_revision: str | None = "037_host_bio"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column(
            "instant_book",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("unit_listings", "instant_book", schema="pms")
