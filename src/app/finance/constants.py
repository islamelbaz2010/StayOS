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
    ADJUSTMENT = "adjustment"


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


class AdjustmentType(StrEnum):
    """Which side an adjustment moves money toward.

    ``*_credit`` pays the party (platform funds it, reducing recognized
    revenue); ``*_debit`` reclaims from the party back to the platform.
    """

    HOST_CREDIT = "host_credit"
    HOST_DEBIT = "host_debit"
    GUEST_CREDIT = "guest_credit"
    GUEST_DEBIT = "guest_debit"


class AdjustmentCategory(StrEnum):
    ADJUSTMENT = "adjustment"
    COMPENSATION = "compensation"
    PROMOTION = "promotion"
    FEE_WAIVER = "fee_waiver"


class AdjustmentStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLIED = "applied"
    CANCELLED = "cancelled"


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
    GUEST_REFUND_PAYABLE = "guest_refund_payable"
    # VAT owed to the tax authority on the taxable booking amount —
    # posted independently at recognition time; never inside
    # PLATFORM_REVENUE (see finance/commercial).
    VAT_PAYABLE = "vat_payable"
