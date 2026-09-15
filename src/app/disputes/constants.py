from enum import StrEnum


class DisputeCategory(StrEnum):
    BOOKING = "booking"
    PAYMENT = "payment"
    PROPERTY = "property"
    HOST = "host"
    GUEST = "guest"
    OTHER = "other"


class DisputeStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    CLOSED = "closed"


_ALLOWED_TRANSITIONS = {
    DisputeStatus.OPEN: {DisputeStatus.IN_REVIEW, DisputeStatus.RESOLVED, DisputeStatus.CLOSED},
    DisputeStatus.IN_REVIEW: {DisputeStatus.RESOLVED, DisputeStatus.CLOSED},
    DisputeStatus.RESOLVED: set(),
    DisputeStatus.CLOSED: set(),
}


def can_transition(current: str, target: str) -> bool:
    try:
        return DisputeStatus(target) in _ALLOWED_TRANSITIONS.get(
            DisputeStatus(current), set()
        )
    except ValueError:
        return False
