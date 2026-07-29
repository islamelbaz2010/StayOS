from enum import StrEnum


class ReservationStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    COMPLETED = "completed"


class PaymentProvider(StrEnum):
    PAYMOB = "paymob"
    STRIPE = "stripe"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(StrEnum):
    FAWRY = "fawry"
    MEEZA = "meeza"
    VODAFONE_CASH = "vodafone_cash"
    CARD = "card"


class CancellationReason(StrEnum):
    CHANGE_OF_PLANS = "change_of_plans"
    EMERGENCY = "emergency"
    HOST_REQUEST = "host_request"
    ADMIN_REQUEST = "admin_request"
    PAYMENT_FAILURE = "payment_failure"
    FRAUD = "fraud"
    OTHER = "other"
