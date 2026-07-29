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
    BOOKING_CHECKED_IN = "booking.checked_in"
    BOOKING_CHECKED_OUT = "booking.checked_out"
    BOOKING_CANCELLED = "booking.cancelled"
