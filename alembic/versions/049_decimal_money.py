"""Decimal money columns for the all-inclusive commercial model.

Revision ID: 049_decimal_money
Revises: 048_in_app_notifications
Create Date: 2026-10-05

The new Founder pricing model produces fractional EGP amounts (VAT on the
all-inclusive taxable amount, e.g. 3,560 × 14% = 498.40). All persisted
money columns move from Integer to Numeric(12, 2). Existing integer values
cast losslessly — no data transformation required. Host-entered listing
prices (base_price_egp, cleaning_fee_egp, price overrides) stay Integer:
they remain whole-EGP inputs.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "049_decimal_money"
down_revision: str | None = "048_in_app_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_MONEY = sa.Numeric(12, 2)

# (schema, table, columns)
_COLUMNS = [
    ("payment", "payments", [
        "amount_egp", "accommodation_amount_egp", "guest_service_fee_egp",
        "cleaning_fee_egp", "vat_egp", "refund_amount_egp",
    ]),
    ("booking", "bookings", ["custom_total_egp"]),
    ("booking", "booking_offers", ["total_price_egp"]),
    ("reservation", "reservations", [
        "total_amount_egp", "host_amount_egp", "platform_fee_egp",
        "guest_fee_egp", "refund_amount_egp",
    ]),
    ("reservation", "payment_intents", ["amount_egp"]),
    ("reservation", "promo_applications", ["discount_amount_egp"]),
    ("finance", "wallets", ["balance_egp", "available_balance_egp"]),
    ("finance", "escrow_accounts", ["amount_egp"]),
    ("finance", "financial_transactions", ["amount_egp"]),
    ("finance", "ledger_entries", ["amount_egp", "balance_after"]),
    ("finance", "payout_requests", ["amount_egp"]),
]


def upgrade() -> None:
    for schema, table, columns in _COLUMNS:
        for column in columns:
            op.alter_column(
                table,
                column,
                schema=schema,
                type_=_MONEY,
                existing_type=sa.Integer(),
            )


def downgrade() -> None:
    for schema, table, columns in _COLUMNS:
        for column in columns:
            op.alter_column(
                table,
                column,
                schema=schema,
                type_=sa.Integer(),
                existing_type=_MONEY,
                postgresql_using=f"round({column})",
            )
