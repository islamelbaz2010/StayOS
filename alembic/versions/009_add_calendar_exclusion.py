"""Add calendar exclusion constraint

Revision ID: 009_add_calendar_exclusion
Revises: 008_create_finance_tables
Create Date: 2026-07-22 12:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009_add_calendar_exclusion"
down_revision: str | None = "008_create_finance_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute(
        """
        ALTER TABLE pms.calendar_rules
        ADD CONSTRAINT chk_calendar_no_overlap_hold
        EXCLUDE USING gist (
            unit_id WITH =,
            daterange(date_from, date_to) WITH &&
        ) WHERE (status != 'available')
        """
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE pms.calendar_rules DROP CONSTRAINT IF EXISTS chk_calendar_no_overlap_hold"
    )
