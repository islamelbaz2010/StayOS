"""Add listing configuration fields for country, currency, and cover photo

Revision ID: 017_add_listing_configuration
Revises: 016_create_bookings_table
Create Date: 2026-07-30 00:00:00.000000

Adds database-backed country, currency, and cover photo selection to
pms.unit_listings so listing presentation is no longer hardcoded.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "017_add_listing_configuration"
down_revision: str | None = "016_create_bookings_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add country and currency columns with defaults to backfill existing rows.
    op.add_column(
        "unit_listings",
        sa.Column("country", sa.String(100), nullable=False, server_default="Egypt"),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column("currency", sa.String(3), nullable=False, server_default="EGP"),
        schema="pms",
    )

    # Add nullable cover photo selection column.
    op.add_column(
        "unit_listings",
        sa.Column(
            "cover_photo_id",
            sa.String(36),
            sa.ForeignKey("pms.unit_photos.id"),
            nullable=True,
        ),
        schema="pms",
    )

    # Ensure existing rows carry the new defaults explicitly.
    op.execute("UPDATE pms.unit_listings SET country = 'Egypt' WHERE country IS NULL")
    op.execute("UPDATE pms.unit_listings SET currency = 'EGP' WHERE currency IS NULL")

    # Add an index for the cover photo foreign key.
    op.create_index(
        "idx_unit_listings_cover_photo_id",
        "unit_listings",
        ["cover_photo_id"],
        schema="pms",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_unit_listings_cover_photo_id",
        table_name="unit_listings",
        schema="pms",
    )
    op.drop_column("unit_listings", "cover_photo_id", schema="pms")
    op.drop_column("unit_listings", "currency", schema="pms")
    op.drop_column("unit_listings", "country", schema="pms")
