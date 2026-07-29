"""ADR-015: add currency column to financial and reservation tables

Revision ID: 015_adr015_add_currency_columns
Revises: 014_add_property_readiness_unique
Create Date: 2026-07-30 00:00:00.000000

All monetary amounts are stored as INTEGER (minor units / piasters), which
is ADR-015-compliant. However, most tables were missing an explicit currency
column, making multi-region expansion impossible without schema changes.

This migration adds currency CHAR(3) DEFAULT 'EGP' to all affected tables.
Column naming (_egp suffix) is acknowledged technical debt and will be
addressed in a future rename migration once multi-currency service code is
in place.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "015_adr015_add_currency_columns"
down_revision: str | None = "014_add_property_readiness_unique"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CURRENCY_COL = sa.Column(
    "currency",
    sa.CHAR(3),
    nullable=False,
    server_default="EGP",
)


def upgrade() -> None:
    for schema, table in [
        ("finance", "escrow_accounts"),
        ("finance", "financial_transactions"),
        ("finance", "ledger_entries"),
        ("finance", "payout_requests"),
        ("reservation", "reservations"),
        ("reservation", "payment_intents"),
        ("reservation", "promo_applications"),
    ]:
        op.add_column(table, sa.Column("currency", sa.CHAR(3), nullable=False, server_default="EGP"), schema=schema)


def downgrade() -> None:
    for schema, table in [
        ("finance", "escrow_accounts"),
        ("finance", "financial_transactions"),
        ("finance", "ledger_entries"),
        ("finance", "payout_requests"),
        ("reservation", "reservations"),
        ("reservation", "payment_intents"),
        ("reservation", "promo_applications"),
    ]:
        op.drop_column(table, "currency", schema=schema)
