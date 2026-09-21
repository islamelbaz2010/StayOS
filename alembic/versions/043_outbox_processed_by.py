"""Per-consumer outbox processing state.

Revision ID: 043_outbox_processed_by
Revises: 042_commercial_differentiation
Create Date: 2026-09-21

``outbox.outbox_events.processed_at`` is shared by every consumer group
(finance, operations, notifications). Event types overlap between groups
(e.g. booking.checked_in is consumed by both finance and operations), so
whichever consumer polls first marks the event processed and the others
silently skip it — escrow HOLD transitions and refund handling were racy.

Adds ``processed_by`` (JSONB list of consumer names) so each consumer
tracks its own processing state. ``processed_at`` remains as a
diagnostic last-processed timestamp. Rows already processed under the
old scheme are backfilled as processed by every consumer so they are
never replayed.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "043_outbox_processed_by"
down_revision: str | None = "042_commercial_differentiation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ALL_CONSUMERS_JSONB = (
    '\'["finance", "operations", "notifications"]\'::jsonb'
)


def upgrade() -> None:
    op.add_column(
        "outbox_events",
        sa.Column(
            "processed_by",
            postgresql.JSONB,
            server_default="[]",
            nullable=False,
        ),
        schema="outbox",
    )
    op.execute(
        "UPDATE outbox.outbox_events SET processed_by = "
        f"{_ALL_CONSUMERS_JSONB} WHERE processed_at IS NOT NULL"
    )


def downgrade() -> None:
    op.drop_column("outbox_events", "processed_by", schema="outbox")
