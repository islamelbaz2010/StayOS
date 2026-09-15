"""Discovery candidate governorate column + geo backfill.

Revision ID: 040_candidate_governorate
Revises: 039_moderation_disputes_staff
Create Date: 2026-09-16

Changes:
- discovery.candidates.governorate: normalized governorate so discovery
  filters can group by a structured value. Backfilled for existing rows
  from the nearest pms.location_aliases entry within ~40 km.
- discovery.candidates.city / zone: also backfilled from the nearest
  alias when currently NULL or holding a non-canonical raw_location value.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "040_candidate_governorate"
down_revision: str | None = "039_moderation_disputes_staff"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# ~40 km in degrees — generous enough to attribute OSM points to their
# governorate while still refusing to guess for far-away points.
_MAX_DIST_DEG = 0.36


def upgrade() -> None:
    op.add_column(
        "discovery_candidates",
        sa.Column("governorate", sa.String(100), nullable=True),
        schema="discovery",
    )

    # Backfill governorate/city/zone from the nearest canonical alias.
    # Uses squared euclidean distance — adequate for governorate
    # attribution at Egyptian latitudes.
    op.execute(
        f"""
        UPDATE discovery.discovery_candidates c
        SET
            governorate = nearest.governorate,
            city = CASE
                WHEN c.city IS NULL OR c.city NOT IN (
                    SELECT DISTINCT city FROM pms.location_aliases
                )
                THEN nearest.city
                ELSE c.city
            END,
            zone = COALESCE(c.zone, nearest.canonical_name_en)
        FROM (
            SELECT DISTINCT ON (cand.id)
                cand.id AS candidate_id,
                a.governorate AS governorate,
                a.city AS city,
                a.canonical_name_en AS canonical_name_en
            FROM discovery.discovery_candidates cand
            JOIN pms.location_aliases a
              ON a.lat IS NOT NULL AND a.lng IS NOT NULL
            WHERE cand.latitude IS NOT NULL AND cand.longitude IS NOT NULL
            ORDER BY
                cand.id,
                (a.lat - cand.latitude) * (a.lat - cand.latitude)
              + (a.lng - cand.longitude) * (a.lng - cand.longitude)
        ) nearest
        WHERE c.id = nearest.candidate_id
          AND (
                (SELECT (a2.lat - c.latitude) * (a2.lat - c.latitude)
                       + (a2.lng - c.longitude) * (a2.lng - c.longitude)
                   FROM pms.location_aliases a2
                  WHERE a2.lat IS NOT NULL AND a2.lng IS NOT NULL
                  ORDER BY (a2.lat - c.latitude) * (a2.lat - c.latitude)
                         + (a2.lng - c.longitude) * (a2.lng - c.longitude)
                  LIMIT 1)
          ) < {_MAX_DIST_DEG * _MAX_DIST_DEG}
        """
    )


def downgrade() -> None:
    op.drop_column("discovery_candidates", "governorate", schema="discovery")
