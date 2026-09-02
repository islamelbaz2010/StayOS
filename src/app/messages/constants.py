from enum import StrEnum


class ConversationType(StrEnum):
    RESERVATION = "reservation"
    SUPPORT = "support"


class ConversationStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


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
