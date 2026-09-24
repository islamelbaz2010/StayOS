"""Persisted VAT component on booking payments + instant-book default.

Revision ID: 046_payment_vat
Revises: 045_booking_paymob_avatar
Create Date: 2026-10-02

Adds ``payment.payments.vat_egp`` so the VAT component computed by the
canonical commercial engine (carved out of the VAT-inclusive platform
share) is persisted on the payment row instead of being re-derived at
display time. Historical rows keep ``NULL`` — they are not rewritten;
their ledger postings already exist.

Also flips the ``pms.unit_listings.instant_book`` server default to TRUE
so newly created listings default to Instant Book (direct checkout for
available inventory). Existing rows keep their explicit flag — hosts who
chose request-to-book are untouched.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "046_payment_vat"
down_revision: str | None = "045_booking_paymob_avatar"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("vat_egp", sa.Integer(), nullable=True),
        schema="payment",
    )
    op.alter_column(
        "unit_listings",
        "instant_book",
        server_default=sa.text("true"),
        schema="pms",
    )


def downgrade() -> None:
    op.alter_column(
        "unit_listings",
        "instant_book",
        server_default=sa.text("false"),
        schema="pms",
    )
    op.drop_column("payments", "vat_egp", schema="payment")
