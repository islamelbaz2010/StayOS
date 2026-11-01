"""Pre-launch marketing leads: host leads, guest waitlist, events, notes.

Revision ID: 054_marketing_leads
Revises: 053_support_conversations
Create Date: 2026-11-01

Additive only — new `marketing` schema; no existing table touched.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "054_marketing_leads"
down_revision: str = "053_support_conversations"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

LEAD_STATUS = sa.Enum(
    "NEW", "CONTACTED", "QUALIFIED", "INVITED", "ONBOARDED", "NOT_A_FIT",
    name="lead_status",
    schema="marketing",
    native_enum=False,
)
LEAD_KIND = sa.Enum("HOST", "GUEST", name="lead_kind", schema="marketing", native_enum=False)


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS marketing")

    op.create_table(
        "host_leads",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("phone_normalized", sa.String(40), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("property_type", sa.String(40), nullable=False),
        sa.Column("units_count", sa.Integer(), nullable=False),
        sa.Column("property_readiness", sa.String(40), nullable=True),
        sa.Column("preferred_contact", sa.String(20), nullable=True),
        sa.Column("management_company", sa.String(200), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("consent", sa.Boolean(), nullable=False),
        sa.Column("consent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("status", LEAD_STATUS, nullable=False, server_default="NEW"),
        sa.Column("utm_source", sa.String(100), nullable=True),
        sa.Column("utm_medium", sa.String(100), nullable=True),
        sa.Column("utm_campaign", sa.String(100), nullable=True),
        sa.Column("utm_content", sa.String(100), nullable=True),
        sa.Column("lang", sa.String(5), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("units_count > 0", name="chk_host_leads_units"),
        sa.UniqueConstraint("phone_normalized", name="uq_host_leads_phone"),
        schema="marketing",
    )
    op.create_index("ix_host_leads_status", "host_leads", ["status"], schema="marketing")
    op.create_index("ix_host_leads_city", "host_leads", ["city"], schema="marketing")

    op.create_table(
        "guest_leads",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("phone", sa.String(40), nullable=True),
        sa.Column("contact_key", sa.String(340), nullable=False),
        sa.Column("preferred_city", sa.String(100), nullable=True),
        sa.Column("accommodation_type", sa.String(40), nullable=True),
        sa.Column("consent", sa.Boolean(), nullable=False),
        sa.Column("consent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("status", LEAD_STATUS, nullable=False, server_default="NEW"),
        sa.Column("utm_source", sa.String(100), nullable=True),
        sa.Column("utm_medium", sa.String(100), nullable=True),
        sa.Column("utm_campaign", sa.String(100), nullable=True),
        sa.Column("utm_content", sa.String(100), nullable=True),
        sa.Column("lang", sa.String(5), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("contact_key", name="uq_guest_leads_contact"),
        schema="marketing",
    )
    op.create_index("ix_guest_leads_status", "guest_leads", ["status"], schema="marketing")

    op.create_table(
        "lead_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event", sa.String(60), nullable=False),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("lang", sa.String(5), nullable=True),
        sa.Column("utm_source", sa.String(100), nullable=True),
        sa.Column("utm_medium", sa.String(100), nullable=True),
        sa.Column("utm_campaign", sa.String(100), nullable=True),
        sa.Column("utm_content", sa.String(100), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema="marketing",
    )
    op.create_index("ix_lead_events_event", "lead_events", ["event"], schema="marketing")

    op.create_table(
        "lead_notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("lead_kind", LEAD_KIND, nullable=False),
        sa.Column("lead_id", sa.String(36), nullable=False),
        sa.Column("author_id", sa.String(36), nullable=True),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema="marketing",
    )
    op.create_index("ix_lead_notes_lead", "lead_notes", ["lead_kind", "lead_id"], schema="marketing")


def downgrade() -> None:
    op.drop_table("lead_notes", schema="marketing")
    op.drop_table("lead_events", schema="marketing")
    op.drop_table("guest_leads", schema="marketing")
    op.drop_table("host_leads", schema="marketing")
    op.execute("DROP SCHEMA IF EXISTS marketing")
