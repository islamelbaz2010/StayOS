class NotificationChannel:
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"


class NotificationStatus:
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


class NotificationEvent:
    RESERVATION_CREATED = "reservation.created"
    RESERVATION_CONFIRMED = "reservation.confirmed"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_CAPTURED = "payment.captured"
    PAYMENT_REQUIRED = "payment.required"
    PAYMENT_PROOF_UPLOADED = "payment.proof_uploaded"
    PAYMENT_VERIFIED = "payment.verified"
    PAYMENT_REJECTED = "payment.rejected"
    BOOKING_CHECKED_IN = "booking.checked_in"
    BOOKING_CHECKED_OUT = "booking.checked_out"
    BOOKING_CANCELLED = "booking.cancelled"
