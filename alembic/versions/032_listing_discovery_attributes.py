"""Add structured discovery attributes: pets, self check-in, accessibility, host languages

Revision ID: 032_listing_discovery_attrs
Revises: 031_host_guest_reviews
Create Date: 2026-09-13 00:00:00.000000

Implements DEC-019. Adds four structured discovery attributes that were
previously unrepresentable:

- ``pms.unit_listings.allows_pets`` (bool, default false)
- ``pms.unit_listings.self_check_in`` (bool, default false)
- ``pms.unit_listings.accessibility_features`` (text[], default '{}')
- ``auth.users.languages`` (text[], default '{}')

All four are non-null with safe defaults, so existing rows are valid
without a data backfill: existing listings simply declare no pets, no
self check-in, and no accessibility features, and existing users declare
no spoken languages. A GIN index is added on ``accessibility_features``
to match the existing ``amenities``/``cultural_tags`` overlap-filter
pattern.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "032_listing_discovery_attrs"
down_revision: str | None = "031_host_guest_reviews"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "unit_listings",
        sa.Column(
            "allows_pets",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "self_check_in",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        schema="pms",
    )
    op.add_column(
        "unit_listings",
        sa.Column(
            "accessibility_features",
            sa.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        schema="pms",
    )
    op.create_index(
        "idx_unit_listings_accessibility",
        "unit_listings",
        ["accessibility_features"],
        unique=False,
        schema="pms",
        postgresql_using="gin",
    )
    op.add_column(
        "users",
        sa.Column(
            "languages",
            sa.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_column("users", "languages", schema="auth")
    op.drop_index(
        "idx_unit_listings_accessibility",
        table_name="unit_listings",
        schema="pms",
    )
    op.drop_column("unit_listings", "accessibility_features", schema="pms")
    op.drop_column("unit_listings", "self_check_in", schema="pms")
    op.drop_column("unit_listings", "allows_pets", schema="pms")
