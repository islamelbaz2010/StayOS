from enum import StrEnum


class WalletType(StrEnum):
    HOST = "host"
    PLATFORM = "platform"


class EscrowStatus(StrEnum):
    CREATED = "created"
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class TransactionType(StrEnum):
    PAYMENT_CAPTURE = "payment_capture"
    ESCROW_CREATE = "escrow_create"
    ESCROW_RELEASE = "escrow_release"
    ESCROW_REFUND = "escrow_refund"
    PAYOUT = "payout"
    PAYOUT_FEE = "payout_fee"
    REFUND = "refund"
    DISPUTE_HOLD = "dispute_hold"


class TransactionStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class PayoutStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class LedgerEntryType(StrEnum):
    DEBIT = "debit"
    CREDIT = "credit"


class AccountType(StrEnum):
    ASSET = "asset"
    LIABILITY = "liability"
    REVENUE = "revenue"
    EXPENSE = "expense"


class PaymentProvider(StrEnum):
    PAYMOB = "paymob"
    STRIPE = "stripe"
    INTERNAL = "internal"


class LedgerAccount(StrEnum):
    PLATFORM_CASH = "platform_cash"
    HOST_PAYABLE = "host_payable"
    ESCROW = "escrow"
    PLATFORM_REVENUE = "platform_revenue"
    PAYOUT_FEE_EXPENSE = "payout_fee_expense"
