"""Add accessibility_feature column to unit_photos for evidence photos

Revision ID: 035_accessibility_photos
Revises: 034_sleeping_arrangements
Create Date: 2026-09-15 00:00:00.000000

Adds a nullable ``accessibility_feature`` column to ``pms.unit_photos``
so hosts can upload evidence photos linked to a specific accessibility
feature (e.g., STEP_FREE_ENTRANCE, ACCESSIBLE_BATHROOM).

Nullable — existing gallery photos remain unchanged (the column is
NULL for regular photos). When set, the photo is displayed on the
listing detail page next to the corresponding accessibility feature as
a "Photo provided" badge, matching Airbnb's accessibility photo
evidence behavior.

The full verification workflow (admin review, verified status) is a
separate business decision and is not included in this migration.
"""

from alembic import op
import sqlalchemy as sa

revision: str = "035_accessibility_photos"
down_revision: str | None = "034_sleeping_arrangements"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "unit_photos",
        sa.Column(
            "accessibility_feature",
            sa.String(50),
            nullable=True,
        ),
        schema="pms",
    )
    op.create_index(
        "idx_unit_photos_accessibility_feature",
        "unit_photos",
        ["accessibility_feature"],
        schema="pms",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_unit_photos_accessibility_feature",
        table_name="unit_photos",
        schema="pms",
    )
    op.drop_column("unit_photos", "accessibility_feature", schema="pms")
