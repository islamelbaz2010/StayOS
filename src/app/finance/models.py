from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import EscrowStatus, PayoutStatus, TransactionStatus


class Wallet(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "wallets"
    __table_args__ = (
        UniqueConstraint(
            "owner_id", "wallet_type", name="uq_wallets_owner_type"
        ),
        {"schema": "finance"},
    )

    owner_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    wallet_type: Mapped[str] = mapped_column(String(50), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    balance_egp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_balance_egp: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry",
        back_populates="wallet",
        foreign_keys="LedgerEntry.wallet_id",
    )


class EscrowAccount(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "escrow_accounts"
    __table_args__ = (
        UniqueConstraint("reservation_id", name="uq_escrow_reservation"),
        {"schema": "finance"},
    )

    reservation_id: Mapped[str] = mapped_column(String(36), nullable=False)
    host_id: Mapped[str] = mapped_column(String(36), nullable=False)
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=EscrowStatus.CREATED
    )
    hold_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    released_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    refunded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry",
        back_populates="escrow",
        foreign_keys="LedgerEntry.escrow_id",
    )


class FinancialTransaction(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "financial_transactions"
    __table_args__ = ({"schema": "finance"},)

    reservation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=TransactionStatus.PENDING
    )
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provider_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    provider_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, name="provider_metadata", nullable=True
    )

    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry",
        back_populates="transaction",
        foreign_keys="LedgerEntry.transaction_id",
    )


class LedgerEntry(UUIDMixin, Base):
    __tablename__ = "ledger_entries"
    __table_args__ = (
        {"schema": "finance"},
    )

    transaction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("finance.financial_transactions.id", ondelete="CASCADE"),
        nullable=False,
    )
    wallet_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("finance.wallets.id"),
        nullable=True,
    )
    escrow_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("finance.escrow_accounts.id"),
        nullable=True,
    )
    ledger_account: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entry_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    transaction: Mapped["FinancialTransaction"] = relationship(
        "FinancialTransaction",
        back_populates="ledger_entries",
        foreign_keys="LedgerEntry.transaction_id",
    )
    wallet: Mapped["Wallet | None"] = relationship(
        "Wallet",
        back_populates="ledger_entries",
        foreign_keys="LedgerEntry.wallet_id",
    )
    escrow: Mapped["EscrowAccount | None"] = relationship(
        "EscrowAccount",
        back_populates="ledger_entries",
        foreign_keys="LedgerEntry.escrow_id",
    )


class PayoutRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payout_requests"
    __table_args__ = ({"schema": "finance"},)

    wallet_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("finance.wallets.id"),
        nullable=False,
    )
    host_id: Mapped[str] = mapped_column(String(36), nullable=False)
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=PayoutStatus.PENDING
    )
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provider_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_account_info: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
