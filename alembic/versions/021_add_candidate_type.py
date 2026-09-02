"""Add candidate_type column to discovery_candidates.

Distinguishes PLACE discovery (building exists, no rental signal) from
SUPPLY_LEAD discovery (contactable, actionable for owner outreach).

Revision ID: 021
Revises: 020
"""

import sqlalchemy as sa

from alembic import op

revision = "021_add_candidate_type"
down_revision = "020_create_discovery_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "discovery_candidates",
        sa.Column(
            "candidate_type",
            sa.String(20),
            nullable=False,
            server_default="PLACE",
        ),
        schema="discovery",
    )

    # Backfill: candidates with AVAILABLE contact status become SUPPLY_LEAD
    op.execute(
        "UPDATE discovery.discovery_candidates "
        "SET candidate_type = 'SUPPLY_LEAD' "
        "WHERE contact_status = 'AVAILABLE'"
    )

    op.create_index(
        "idx_disc_cand_type",
        "discovery_candidates",
        ["candidate_type"],
        schema="discovery",
    )


def downgrade() -> None:
    op.drop_index("idx_disc_cand_type", table_name="discovery_candidates", schema="discovery")
    op.drop_column("discovery_candidates", "candidate_type", schema="discovery")
