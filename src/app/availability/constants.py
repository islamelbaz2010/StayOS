from enum import StrEnum


class AvailabilityStatus(StrEnum):
    AVAILABLE = "available"
    BLOCKED = "blocked"
    BOOKED = "booked"
    HOLD = "hold"
