from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PROOF_UPLOADED = "proof_uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class PaymentMethod(StrEnum):
    MANUAL = "manual"
