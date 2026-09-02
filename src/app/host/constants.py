from enum import StrEnum


class CoHostPermissionScope(StrEnum):
    """Scope of operational access granted to a co-host.

    ``FULL_ACCESS`` — can do everything the owner can except transfer
    ownership or delete the listing.
    ``CALENDAR_MESSAGING`` — can manage calendar/availability/pricing and
    communicate with guests, but cannot edit listing details or publish.
    ``CALENDAR_ONLY`` — can only manage calendar/availability/pricing.
    """

    FULL_ACCESS = "full_access"
    CALENDAR_MESSAGING = "calendar_messaging"
    CALENDAR_ONLY = "calendar_only"


class ListingReadinessStatus(StrEnum):
    READY = "ready"
    ACTION_REQUIRED = "action_required"


class HostTodayItemType(StrEnum):
    """Types of items that can appear on the host's "today" screen."""

    CHECK_IN_TODAY = "check_in_today"
    CHECK_OUT_TODAY = "check_out_today"
    CURRENT_STAY = "current_stay"
    PENDING_REQUEST = "pending_request"
    UPCOMING_ARRIVAL = "upcoming_arrival"
    UPCOMING_DEPARTURE = "upcoming_departure"
    UNREAD_MESSAGE = "unread_message"
    INCOMPLETE_LISTING = "incomplete_listing"
