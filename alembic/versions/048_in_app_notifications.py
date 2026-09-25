"""In-app notification inbox columns.

Revision ID: 048_in_app_notifications
Revises: 047_alias_instant_book
Create Date: 2026-10-04

The ``notify.notifications`` table was a pure delivery log for outbound
channels (email/whatsapp/sms) keyed by a contact string. Adding the
``in_app`` channel surfaces notifications inside the product, which
requires the owning user id and a read timestamp.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "048_in_app_notifications"
down_revision: str | None = "047_alias_instant_book"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("user_id", sa.String(length=36), nullable=True),
        schema="notify",
    )
    op.add_column(
        "notifications",
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        schema="notify",
    )
    op.create_index(
        "idx_notifications_user_read",
        "notifications",
        ["user_id", "read_at"],
        schema="notify",
    )


def downgrade() -> None:
    op.drop_index(
        "idx_notifications_user_read",
        table_name="notifications",
        schema="notify",
    )
    op.drop_column("notifications", "read_at", schema="notify")
    op.drop_column("notifications", "user_id", schema="notify")
