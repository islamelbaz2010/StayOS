"""add operations tables

Revision ID: 007
Revises: 006
Create Date: 2026-07-21 11:00:00.000000+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007"
down_revision: str | None = "006"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS operations")

    op.create_table(
        "field_staff",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
        schema="operations",
    )

    op.create_table(
        "operation_tasks",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("unit_id", sa.String(36), nullable=False),
        sa.Column("reservation_id", sa.String(36), nullable=True),
        sa.Column("parent_task_id", sa.String(36), nullable=True),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING"),
        sa.Column("priority", sa.String(50), nullable=False, server_default="NORMAL"),
        sa.Column("field_staff_id", sa.String(36), nullable=True),
        sa.Column("due_by", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by_staff_id", sa.String(36), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("checklist", sa.JSON(), nullable=True),
        sa.Column("attachments", sa.JSON(), nullable=True),
        sa.Column("created_by_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["pms.units.id"]),
        sa.ForeignKeyConstraint(["parent_task_id"], ["operations.operation_tasks.id"]),
        sa.ForeignKeyConstraint(["field_staff_id"], ["operations.field_staff.id"]),
        sa.ForeignKeyConstraint(["verified_by_staff_id"], ["operations.field_staff.id"]),
        schema="operations",
    )
    op.create_index("idx_operation_tasks_unit_id", "operation_tasks", ["unit_id"], schema="operations")
    op.create_index("idx_operation_tasks_reservation_id", "operation_tasks", ["reservation_id"], schema="operations")
    op.create_index("idx_operation_tasks_status", "operation_tasks", ["status"], schema="operations")
    op.create_index("idx_operation_tasks_due_by", "operation_tasks", ["due_by"], schema="operations")

    op.create_table(
        "task_events",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("task_id", sa.String(36), nullable=False),
        sa.Column("actor_id", sa.String(36), nullable=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["task_id"], ["operations.operation_tasks.id"], ondelete="CASCADE"),
        schema="operations",
    )
    op.create_index("idx_task_events_task_id", "task_events", ["task_id"], schema="operations")

    op.create_table(
        "maintenance_requests",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("unit_id", sa.String(36), nullable=False),
        sa.Column("reporter_id", sa.String(36), nullable=True),
        sa.Column("issue_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="OPEN"),
        sa.Column("related_task_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["pms.units.id"]),
        sa.ForeignKeyConstraint(["related_task_id"], ["operations.operation_tasks.id"]),
        schema="operations",
    )
    op.create_index("idx_maintenance_requests_unit_id", "maintenance_requests", ["unit_id"], schema="operations")
    op.create_index("idx_maintenance_requests_status", "maintenance_requests", ["status"], schema="operations")

    op.create_table(
        "property_readiness",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("unit_id", sa.String(36), nullable=False),
        sa.Column("reservation_id", sa.String(36), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="NOT_READY"),
        sa.Column("blocked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["pms.units.id"]),
        schema="operations",
    )
    op.create_index("idx_property_readiness_unit_id", "property_readiness", ["unit_id"], schema="operations")

    op.create_table(
        "recurring_maintenance",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("unit_id", sa.String(36), nullable=False),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("frequency", sa.String(50), nullable=False),
        sa.Column("interval_days", sa.Integer(), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["pms.units.id"]),
        schema="operations",
    )
    op.create_index("idx_recurring_maintenance_unit_id", "recurring_maintenance", ["unit_id"], schema="operations")


def downgrade() -> None:
    op.drop_table("recurring_maintenance", schema="operations")
    op.drop_table("property_readiness", schema="operations")
    op.drop_table("maintenance_requests", schema="operations")
    op.drop_table("task_events", schema="operations")
    op.drop_table("operation_tasks", schema="operations")
    op.drop_table("field_staff", schema="operations")
    op.execute("DROP SCHEMA IF EXISTS operations CASCADE")
