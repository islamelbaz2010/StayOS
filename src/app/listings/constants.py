from enum import StrEnum


class PropertyType(StrEnum):
    APARTMENT = "APARTMENT"
    VILLA = "VILLA"
    CHALET = "CHALET"
    HOTEL_ROOM = "HOTEL_ROOM"
    RESORT_UNIT = "RESORT_UNIT"
    STUDIO = "STUDIO"


class UnitStatus(StrEnum):
    DRAFT = "DRAFT"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNLISTED = "UNLISTED"
    LISTED = "LISTED"
    SUSPENDED = "SUSPENDED"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"


class ListingCategory(StrEnum):
    ENTIRE_PLACE = "ENTIRE_PLACE"
    PRIVATE_ROOM = "PRIVATE_ROOM"
    SHARED_ROOM = "SHARED_ROOM"


class CancellationPolicy(StrEnum):
    FLEXIBLE = "FLEXIBLE"
    MODERATE = "MODERATE"
    STRICT = "STRICT"


class CalendarStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    BLOCKED = "BLOCKED"
    BOOKED = "BOOKED"
    HOLD = "HOLD"


class CalendarBlockType(StrEnum):
    MANUAL = "MANUAL"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"


class CulturalTag(StrEnum):
    FAMILY_ONLY = "FAMILY_ONLY"
    HALAL_CERTIFIED = "HALAL_CERTIFIED"
    MIXED = "MIXED"
    COUPLES_WELCOME = "COUPLES_WELCOME"


class AccessibilityFeature(StrEnum):
    """Structured accessibility features (DEC-019).

    Deliberately small vocabulary covering the entrance/bedroom/bathroom
    access dimensions. ``ELEVATOR`` is intentionally absent — it already
    exists in the ``amenities`` vocabulary, and duplicating it across two
    fields would make filtering ambiguous.
    """

    STEP_FREE_ENTRANCE = "STEP_FREE_ENTRANCE"
    WIDE_ENTRANCE = "WIDE_ENTRANCE"
    STEP_FREE_BEDROOM = "STEP_FREE_BEDROOM"
    ACCESSIBLE_BATHROOM = "ACCESSIBLE_BATHROOM"
    SHOWER_GRAB_BAR = "SHOWER_GRAB_BAR"
