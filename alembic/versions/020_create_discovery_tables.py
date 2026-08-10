"""Create discovery schema and tables for supply discovery pipeline

Revision ID: 020_create_discovery_tables
Revises: 019_create_payments_table
Create Date: 2026-08-10 00:00:00.000000

Creates the ``discovery`` schema with three tables:
- discovery_configs: configurable search profiles
- discovery_runs: execution records
- discovery_candidates: externally discovered properties (NOT StayOS listings)

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "020_create_discovery_tables"
down_revision: str | None = "019_create_payments_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS discovery")

    op.create_table(
        "discovery_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("country", sa.String(100), nullable=False, server_default="Egypt"),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("zone", sa.String(100), nullable=True),
        sa.Column("property_type", sa.String(50), nullable=True),
        sa.Column("min_price", sa.Integer, nullable=True),
        sa.Column("max_price", sa.Integer, nullable=True),
        sa.Column("min_bedrooms", sa.Integer, nullable=True),
        sa.Column("min_guest_capacity", sa.Integer, nullable=True),
        sa.Column("keywords", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("frequency_hours", sa.Integer, nullable=False, server_default="24"),
        sa.Column("max_candidates_per_run", sa.Integer, nullable=False, server_default="50"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("min_price >= 0 OR min_price IS NULL", name="chk_disc_cfg_min_price"),
        schema="discovery",
    )

    op.create_table(
        "discovery_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "config_id",
            sa.String(36),
            sa.ForeignKey("discovery.discovery_configs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="RUNNING"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pages_scanned", sa.Integer, nullable=False, server_default="0"),
        sa.Column("candidates_found", sa.Integer, nullable=False, server_default="0"),
        sa.Column("new_candidates", sa.Integer, nullable=False, server_default="0"),
        sa.Column("duplicates", sa.Integer, nullable=False, server_default="0"),
        sa.Column("qualified", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rejected", sa.Integer, nullable=False, server_default="0"),
        sa.Column("errors", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("run_metadata", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema="discovery",
    )
    op.create_index("idx_disc_runs_config", "discovery_runs", ["config_id"], schema="discovery")
    op.create_index("idx_disc_runs_status", "discovery_runs", ["status"], schema="discovery")

    op.create_table(
        "discovery_candidates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("source_url", sa.String(2048), nullable=False),
        sa.Column("external_listing_id", sa.String(255), nullable=True),
        sa.Column("discovered_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("raw_payload", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("raw_title", sa.Text, nullable=True),
        sa.Column("raw_description", sa.Text, nullable=True),
        sa.Column("raw_price", sa.String(100), nullable=True),
        sa.Column("raw_currency", sa.String(10), nullable=True),
        sa.Column("raw_location", sa.String(500), nullable=True),
        sa.Column("raw_images", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("raw_amenities", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("raw_contact", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("zone", sa.String(100), nullable=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("property_type", sa.String(50), nullable=True),
        sa.Column("bedrooms", sa.Integer, nullable=True),
        sa.Column("bathrooms", sa.Integer, nullable=True),
        sa.Column("guest_capacity", sa.Integer, nullable=True),
        sa.Column("nightly_price", sa.Integer, nullable=True),
        sa.Column("currency", sa.String(3), nullable=True),
        sa.Column("image_urls", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("amenities", sa.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("source_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("data_completeness_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("qualification_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("contact_status", sa.String(20), nullable=False, server_default="NOT_AVAILABLE"),
        sa.Column("contact_type", sa.String(50), nullable=True),
        sa.Column("contact_value", sa.String(500), nullable=True),
        sa.Column("contact_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("duplicate_status", sa.String(25), nullable=False, server_default="UNIQUE"),
        sa.Column("duplicate_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column(
            "duplicate_of_id",
            sa.String(36),
            sa.ForeignKey("discovery.discovery_candidates.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="DISCOVERED"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("imported_unit_id", sa.String(36), nullable=True),
        sa.Column(
            "run_id",
            sa.String(36),
            sa.ForeignKey("discovery.discovery_runs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema="discovery",
    )
    op.create_index("idx_disc_cand_source", "discovery_candidates", ["source", "external_listing_id"], schema="discovery")
    op.create_index("idx_disc_cand_status", "discovery_candidates", ["status"], schema="discovery")
    op.create_index("idx_disc_cand_qualification", "discovery_candidates", ["qualification_score"], schema="discovery")
    op.create_index("idx_disc_cand_city", "discovery_candidates", ["city"], schema="discovery")
    op.create_index("idx_disc_cand_duplicate", "discovery_candidates", ["duplicate_status"], schema="discovery")


def downgrade() -> None:
    op.drop_table("discovery_candidates", schema="discovery")
    op.drop_table("discovery_runs", schema="discovery")
    op.drop_table("discovery_configs", schema="discovery")
    op.execute("DROP SCHEMA IF EXISTS discovery CASCADE")
