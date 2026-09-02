"""add host operations columns

Revision ID: 006
Revises: 005
Create Date: 2026-07-21 10:15:00.000000+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: str | None = "005_create_reservation_tables"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column("house_rules", sa.Text(), nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column("check_in_instructions", sa.Text(), nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column("policies", sa.Text(), nullable=True),
        schema="pms",
    )
    op.add_column(
        "calendar_rules",
        sa.Column("block_type", sa.String(50), nullable=True),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("calendar_rules", "block_type", schema="pms")
    op.drop_column("unit_listings", "policies", schema="pms")
    op.drop_column("unit_listings", "check_in_instructions", schema="pms")
    op.drop_column("unit_listings", "house_rules", schema="pms")
