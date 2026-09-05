from enum import StrEnum


class BookingStatus(StrEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    # Guest never arrived and never cancelled — declared by the host via the
    # support contact and confirmed by a StayOS admin (V1 Cancellation &
    # Refund Policy §7.1). Terminal state; no refund is owed.
    NO_SHOW = "no_show"
