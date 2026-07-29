"""Add UNIQUE(unit_id, reservation_id) to operations.property_readiness

Revision ID: 014_add_property_readiness_unique
Revises: 013_create_analytics_tables
Create Date: 2026-07-30 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "014_add_property_readiness_unique"
down_revision: str | None = "013_create_analytics_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_property_readiness_unit_reservation",
        "property_readiness",
        ["unit_id", "reservation_id"],
        schema="operations",
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_property_readiness_unit_reservation",
        "property_readiness",
        schema="operations",
        type_="unique",
    )
