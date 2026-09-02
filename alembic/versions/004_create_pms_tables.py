"""Create pms tables

Revision ID: 004_create_pms_tables
Revises: 003_create_auth_tables
Create Date: 2026-07-21 09:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_create_pms_tables"
down_revision: str | None = "003_create_auth_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "units",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("host_id", sa.String(36), sa.ForeignKey("auth.users.id"), nullable=False),
        sa.Column("property_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING_VERIFICATION"),
        sa.Column("coordinates", Geometry("POINT", srid=4326, spatial_index=True), nullable=False),
        sa.Column("governorate", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("google_place_id", sa.String(255), nullable=True),
        sa.Column("max_guests", sa.SmallInteger, nullable=False),
        sa.Column("bedrooms", sa.SmallInteger, nullable=False),
        sa.Column("bathrooms", sa.SmallInteger, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("max_guests BETWEEN 1 AND 50", name="chk_unit_max_guests"),
        sa.CheckConstraint("bedrooms >= 0", name="chk_unit_bedrooms"),
        sa.CheckConstraint("bathrooms >= 1", name="chk_unit_bathrooms"),
        sa.Index("idx_units_host_id", "host_id"),
        sa.Index("idx_units_status", "status"),
        schema="pms",
    )

    op.create_table(
        "unit_listings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("title_ar", sa.String(255), nullable=False),
        sa.Column("title_en", sa.String(255), nullable=True),
        sa.Column("description_ar", sa.Text, nullable=False),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column(
            "amenities",
            postgresql.ARRAY(sa.String),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "cultural_tags",
            postgresql.ARRAY(sa.String),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("base_price_egp", sa.Integer, nullable=False),
        sa.Column("weekend_mult", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("peak_mult", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("min_nights", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("max_nights", sa.SmallInteger, nullable=False, server_default="30"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "search_vector",
            postgresql.TSVECTOR,
            sa.Computed(
                "to_tsvector('simple', coalesce(title_ar, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(description_ar, '') || ' ' || coalesce(description_en, ''))",
                persisted=True,
            ),
            nullable=False,
        ),
        sa.CheckConstraint("base_price_egp >= 100", name="chk_listing_base_price"),
        sa.Index("idx_unit_listings_unit_id", "unit_id"),
        sa.Index("idx_unit_listings_base_price", "base_price_egp"),
        sa.Index(
            "idx_unit_listings_search",
            "search_vector",
            postgresql_using="gin",
        ),
        sa.Index(
            "idx_unit_listings_amenities",
            "amenities",
            postgresql_using="gin",
        ),
        sa.Index(
            "idx_unit_listings_cultural_tags",
            "cultural_tags",
            postgresql_using="gin",
        ),
        schema="pms",
    )

    op.create_table(
        "calendar_rules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date_from", sa.Date, nullable=False),
        sa.Column("date_to", sa.Date, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="AVAILABLE"),
        sa.Column("price_override", sa.Integer, nullable=True),
        sa.Column("reservation_id", sa.String(36), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("date_to > date_from", name="chk_date_range"),
        sa.Index("idx_calendar_unit_id", "unit_id", "date_from", "date_to"),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_table("calendar_rules", schema="pms")
    op.drop_table("unit_listings", schema="pms")
    op.drop_table("units", schema="pms")
