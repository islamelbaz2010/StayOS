"""Add sleeping_arrangements JSON column for per-bedroom bed configuration

Revision ID: 034_sleeping_arrangements
Revises: 033_self_check_in_methods
Create Date: 2026-09-14 00:00:00.000000

Adds a nullable ``sleeping_arrangements`` JSONB column to
``pms.unit_listings`` so hosts can declare per-bedroom bed types and
quantities, matching Airbnb's sleeping-arrangements display.

Nullable with no default — existing listings that don't define
arrangements continue to show the aggregate ``beds`` / ``bedrooms``
counts. When present, the column is a JSON array of bedroom entries,
each containing a ``beds`` array of ``{type, count}`` objects:

    [
      {"beds": [{"type": "queen", "count": 1}]},
      {"beds": [{"type": "single", "count": 2}]}
    ]

Bed-type vocabulary is the standard hospitality set Airbnb documents:
single, double, queen, king, sofa_bed, bunk_bed, air_mattress,
crib, floor_mattress, toddler_bed, water_bed, hammock.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "034_sleeping_arrangements"
down_revision: str | None = "033_self_check_in_methods"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column(
            "sleeping_arrangements",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("unit_listings", "sleeping_arrangements", schema="pms")
