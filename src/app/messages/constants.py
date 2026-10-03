from enum import StrEnum


class ConversationType(StrEnum):
    RESERVATION = "reservation"
    INQUIRY = "inquiry"
    SUPPORT = "support"


class ConversationStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class SupportStatus(StrEnum):
    """Workflow state for SUPPORT conversations only.

    `open` is the moment a user starts a thread; `waiting_*` follows the
    last responder; `resolved` is set by staff (or the user) and a new
    message reopens the thread."""

    OPEN = "open"
    WAITING_FOR_SUPPORT = "waiting_for_support"
    WAITING_FOR_USER = "waiting_for_user"
    RESOLVED = "resolved"


class ParticipantRole(StrEnum):
    GUEST = "guest"
    HOST = "host"
    CO_HOST = "co_host"
    SUPPORT = "support"
    SYSTEM = "system"


class MessageStatus(StrEnum):
    SENT = "sent"
    FAILED = "failed"


class MessageAutomationType(StrEnum):
    BOOKING_CONFIRMED = "booking_confirmed"
    PRE_ARRIVAL = "pre_arrival"
    CHECK_IN_REMINDER = "check_in_reminder"
    CHECKOUT_REMINDER = "checkout_reminder"
    REVIEW_REMINDER = "review_reminder"
