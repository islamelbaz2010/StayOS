from enum import StrEnum


class BookingStatus(StrEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
