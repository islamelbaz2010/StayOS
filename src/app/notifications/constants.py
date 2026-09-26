class NotificationChannel:
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


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
    BOOKING_NO_SHOW = "booking.no_show"
    MESSAGE_RECEIVED = "message.received"
    OWNER_OUTREACH = "owner.outreach"


class NotificationCategory:
    """User-facing preference categories (R1 account settings).

    Locked categories are transactional/security-critical — the product
    contract requires them, so they are not stored per-user and cannot be
    disabled. Toggleable categories gate every channel of their events.
    """

    ACCOUNT_POLICIES = "account_policies"
    RESERVATIONS = "reservations"
    REMINDERS = "reminders"
    MESSAGES = "messages"
    HOST_ACTIVITY = "host_activity"
    OFFERS = "offers"


LOCKED_NOTIFICATION_CATEGORIES = frozenset(
    {
        NotificationCategory.ACCOUNT_POLICIES,
        NotificationCategory.RESERVATIONS,
        NotificationCategory.REMINDERS,
    }
)

TOGGLEABLE_NOTIFICATION_CATEGORIES = frozenset(
    {
        NotificationCategory.MESSAGES,
        NotificationCategory.HOST_ACTIVITY,
        NotificationCategory.OFFERS,
    }
)

_EVENT_CATEGORY: dict[str, str] = {
    NotificationEvent.MESSAGE_RECEIVED: NotificationCategory.MESSAGES,
    NotificationEvent.OWNER_OUTREACH: NotificationCategory.OFFERS,
    NotificationEvent.PAYMENT_REQUIRED: NotificationCategory.REMINDERS,
    "listing.approved": NotificationCategory.HOST_ACTIVITY,
    "listing.rejected": NotificationCategory.HOST_ACTIVITY,
    "listing.edit_approved": NotificationCategory.HOST_ACTIVITY,
    "listing.edit_rejected": NotificationCategory.HOST_ACTIVITY,
    NotificationEvent.RESERVATION_CREATED: NotificationCategory.RESERVATIONS,
    NotificationEvent.RESERVATION_CONFIRMED: NotificationCategory.RESERVATIONS,
    NotificationEvent.PAYMENT_FAILED: NotificationCategory.RESERVATIONS,
    NotificationEvent.PAYMENT_CAPTURED: NotificationCategory.RESERVATIONS,
    NotificationEvent.PAYMENT_PROOF_UPLOADED: NotificationCategory.RESERVATIONS,
    NotificationEvent.PAYMENT_VERIFIED: NotificationCategory.RESERVATIONS,
    NotificationEvent.PAYMENT_REJECTED: NotificationCategory.RESERVATIONS,
    NotificationEvent.BOOKING_CHECKED_IN: NotificationCategory.RESERVATIONS,
    NotificationEvent.BOOKING_CHECKED_OUT: NotificationCategory.RESERVATIONS,
    NotificationEvent.BOOKING_CANCELLED: NotificationCategory.RESERVATIONS,
    NotificationEvent.BOOKING_NO_SHOW: NotificationCategory.RESERVATIONS,
}

_ACCOUNT_PREFIXES = (
    "account.",
    "kyc.",
    "staff.",
    "security.",
    "password.",
    "policy.",
)


def category_for_event(event_type: str) -> str:
    """Return the preference category for an event type.

    Known optional events map to their toggleable/locked categories;
    everything else defaults to ``account_policies`` (locked) — an
    unrecognized event is always delivered rather than silently dropped.
    """
    category = _EVENT_CATEGORY.get(event_type)
    if category:
        return category
    if event_type.startswith(_ACCOUNT_PREFIXES):
        return NotificationCategory.ACCOUNT_POLICIES
    return NotificationCategory.ACCOUNT_POLICIES
