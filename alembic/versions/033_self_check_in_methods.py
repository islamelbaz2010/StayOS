"""Add self_check_in_methods column for structured access-method metadata

Revision ID: 033_self_check_in_methods
Revises: 032_listing_discovery_attrs
Create Date: 2026-09-13 00:00:00.000000

Implements DEC-019 self check-in method depth. Adds a structured
``self_check_in_methods`` text[] column to ``pms.unit_listings`` so
hosts can declare which Airbnb-documented access methods (lockbox,
smart lock, keypad, building staff) their self check-in supports.

Non-null with a safe empty-array default, so existing rows remain
valid without a data backfill.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "033_self_check_in_methods"
down_revision: str | None = "032_listing_discovery_attrs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column(
            "self_check_in_methods",
            sa.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("unit_listings", "self_check_in_methods", schema="pms")
