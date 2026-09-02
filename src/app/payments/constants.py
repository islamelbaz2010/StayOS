from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PROOF_UPLOADED = "proof_uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    # A verified (collected) payment where the booking was cancelled and a
    # refund is owed. This platform only collects payment manually (bank
    # transfer / Vodafone Cash) — there is no provider refund API to call
    # automatically, so the money must be wired back by finance and this
    # status reconciled to REFUNDED by hand. Never skip straight to
    # REFUNDED — that would claim money moved when it didn't.
    REFUND_PENDING = "refund_pending"
    REFUNDED = "refunded"


class PaymentMethod(StrEnum):
    MANUAL = "manual"
