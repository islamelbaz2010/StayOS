"""Add listing creation fields: beds, address, category, cleaning_fee, cancellation_policy

Revision ID: 018_add_listing_creation_fields
Revises: 017_add_listing_configuration
Create Date: 2026-08-03 00:00:00.000000

Adds beds and address to pms.units; category, cleaning_fee_egp, and
cancellation_policy to pms.unit_listings to support the host listing
creation flow.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "018_add_listing_creation_fields"
down_revision: str | None = "017_add_listing_configuration"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "units",
        sa.Column("beds", sa.SmallInteger, nullable=False, server_default="1"),
        schema="pms",
    )
    op.add_column(
        "units",
        sa.Column("address", sa.Text, nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "category",
            sa.String(50),
            nullable=False,
            server_default="ENTIRE_PLACE",
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "cleaning_fee_egp",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "cancellation_policy",
            sa.String(50),
            nullable=False,
            server_default="FLEXIBLE",
        ),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_column("unit_listings", "cancellation_policy", schema="pms")
    op.drop_column("unit_listings", "cleaning_fee_egp", schema="pms")
    op.drop_column("unit_listings", "category", schema="pms")
    op.drop_column("units", "address", schema="pms")
    op.drop_column("units", "beds", schema="pms")
