from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import (
    AdjustmentStatus,
    EscrowStatus,
    PayoutStatus,
    TransactionStatus,
)


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
    balance_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    available_balance_egp: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
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
    amount_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
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
    amount_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
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
    amount_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EGP")
    balance_after: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
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


class CommercialAdjustment(UUIDMixin, TimestampMixin, Base):
    """Explicit, audited admin-initiated commercial adjustment.

    Records exceptional commercial treatment — compensation, fee waivers,
    goodwill credits — as a first-class append-only record. Applying an
    approved adjustment posts a distinct ``financial_transactions`` row
    (type ``adjustment``) plus its double-entry ledger pair; the booking's
    original stored amounts are never rewritten. VAT is untouched —
    adjustments move money between platform/host/guest after the fact and
    do not alter the booking's taxable base.
    """

    __tablename__ = "commercial_adjustments"
    __table_args__ = ({"schema": "finance"},)

    booking_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("booking.bookings.id"), nullable=True
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    listing_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=True
    )
    adjustment_type: Mapped[str] = mapped_column(String(30), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    amount_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AdjustmentStatus.PENDING
    )
    requested_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    created_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    decided_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    financial_transaction_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True
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
    amount_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
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
