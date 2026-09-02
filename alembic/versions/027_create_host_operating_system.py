"""Create host operating system foundation: co-hosts and listing readiness

Revision ID: 027_create_host_operating_system
Revises: 026_create_messaging_stay_config
Create Date: 2026-09-03 00:00:00.000000

Adds:
1. ``pms.unit_co_hosts`` — co-host invitations with scoped permissions
   (full_access, calendar_messaging, calendar_only). A co-host row grants
   a non-owner user operational access to a unit. The owner remains the
   authoritative host; co-hosts are additive delegates.
2. ``pms.listing_readiness_checks`` — materialised readiness checklist
   per unit listing, computed by the backend so the UI never guesses.

All changes are additive and backward-compatible.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "027_create_host_operating_system"
down_revision: str | None = "026_create_messaging_stay_config"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "unit_co_hosts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "co_host_user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # permission_scope: "full_access" | "calendar_messaging" | "calendar_only"
        sa.Column(
            "permission_scope",
            sa.String(30),
            nullable=False,
            server_default="calendar_only",
        ),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("invited_by", sa.String(36), sa.ForeignKey("auth.users.id"), nullable=True),
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
        sa.UniqueConstraint(
            "unit_id", "co_host_user_id", name="uq_unit_co_hosts_unit_user"
        ),
        sa.Index("idx_unit_co_hosts_unit_id", "unit_id"),
        sa.Index("idx_unit_co_hosts_user_id", "co_host_user_id"),
        schema="pms",
    )

    op.create_table(
        "listing_readiness_checks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        # Overall readiness: "ready" | "action_required"
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="action_required",
        ),
        # JSON array of missing-item keys, e.g. ["photos", "check_in_instructions"]
        sa.Column(
            "missing_items",
            sa.dialects.postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema="pms",
    )


def downgrade() -> None:
    op.drop_table("listing_readiness_checks", schema="pms")
    op.drop_table("unit_co_hosts", schema="pms")
