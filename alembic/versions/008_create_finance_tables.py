"""Create finance tables

Revision ID: 008_create_finance_tables
Revises: 007_add_operations_tables
Create Date: 2026-07-22 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "008_create_finance_tables"
down_revision: Union[str, None] = "007_add_operations_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wallets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_id", sa.String(36), nullable=True),
        sa.Column("wallet_type", sa.String(50), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EGP"),
        sa.Column("balance_egp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("available_balance_egp", sa.Integer, nullable=False, server_default="0"),
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
        sa.UniqueConstraint("owner_id", "wallet_type", name="uq_wallets_owner_type"),
        sa.Index("idx_wallets_owner_id", "owner_id"),
        sa.Index("idx_wallets_wallet_type", "wallet_type"),
        schema="finance",
    )

    op.create_table(
        "escrow_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reservation_id", sa.String(36), nullable=False),
        sa.Column("host_id", sa.String(36), nullable=False),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="created",
        ),
        sa.Column("hold_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("reservation_id", name="uq_escrow_reservation"),
        sa.Index("idx_escrow_reservation_id", "reservation_id"),
        sa.Index("idx_escrow_host_id", "host_id"),
        sa.Index("idx_escrow_status", "status"),
        schema="finance",
    )

    op.create_table(
        "financial_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reservation_id", sa.String(36), nullable=True),
        sa.Column("transaction_type", sa.String(50), nullable=False),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("provider", sa.String(50), nullable=True),
        sa.Column("provider_ref", sa.String(255), nullable=True),
        sa.Column("idempotency_key", sa.String(255), nullable=True, unique=True),
        sa.Column("provider_metadata", postgresql.JSONB, nullable=True),
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
        sa.Index("idx_financial_tx_reservation_id", "reservation_id"),
        sa.Index("idx_financial_tx_idempotency_key", "idempotency_key"),
        sa.Index("idx_financial_tx_provider_ref", "provider_ref"),
        schema="finance",
    )

    op.create_table(
        "ledger_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "transaction_id",
            sa.String(36),
            sa.ForeignKey("finance.financial_transactions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "wallet_id",
            sa.String(36),
            sa.ForeignKey("finance.wallets.id"),
            nullable=True,
        ),
        sa.Column(
            "escrow_id",
            sa.String(36),
            sa.ForeignKey("finance.escrow_accounts.id"),
            nullable=True,
        ),
        sa.Column("ledger_account", sa.String(100), nullable=False),
        sa.Column("account_type", sa.String(50), nullable=False),
        sa.Column("entry_type", sa.String(50), nullable=False),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column("balance_after", sa.Integer, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Index("idx_ledger_entries_transaction_id", "transaction_id"),
        sa.Index("idx_ledger_entries_wallet_id", "wallet_id"),
        sa.Index("idx_ledger_entries_escrow_id", "escrow_id"),
        schema="finance",
    )

    op.create_table(
        "payout_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "wallet_id",
            sa.String(36),
            sa.ForeignKey("finance.wallets.id"),
            nullable=False,
        ),
        sa.Column("host_id", sa.String(36), nullable=False),
        sa.Column("amount_egp", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("provider", sa.String(50), nullable=True),
        sa.Column("provider_ref", sa.String(255), nullable=True),
        sa.Column("bank_account_info", postgresql.JSONB, nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.String(255), nullable=True),
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
        sa.Index("idx_payout_requests_wallet_id", "wallet_id"),
        sa.Index("idx_payout_requests_host_id", "host_id"),
        sa.Index("idx_payout_requests_status", "status"),
        schema="finance",
    )


def downgrade() -> None:
    op.drop_table("payout_requests", schema="finance")
    op.drop_table("ledger_entries", schema="finance")
    op.drop_table("financial_transactions", schema="finance")
    op.drop_table("escrow_accounts", schema="finance")
    op.drop_table("wallets", schema="finance")
