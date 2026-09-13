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

    Matches the Airbnb accessibility filter vocabulary grouped by area:
    guest entrance/parking, bedroom, bathroom, and adaptive equipment.
    ``ELEVATOR`` is intentionally absent — it already exists in the
    ``amenities`` vocabulary, and duplicating it across two fields would
    make filtering ambiguous.
    """

    # Guest entrance and parking
    STEP_FREE_ENTRANCE = "STEP_FREE_ENTRANCE"
    WIDE_ENTRANCE = "WIDE_ENTRANCE"
    ACCESSIBLE_PARKING = "ACCESSIBLE_PARKING"
    STEP_FREE_PATH = "STEP_FREE_PATH"
    # Bedroom
    STEP_FREE_BEDROOM = "STEP_FREE_BEDROOM"
    WIDE_BEDROOM = "WIDE_BEDROOM"
    # Bathroom
    ACCESSIBLE_BATHROOM = "ACCESSIBLE_BATHROOM"
    WIDE_BATHROOM = "WIDE_BATHROOM"
    SHOWER_GRAB_BAR = "SHOWER_GRAB_BAR"
    TOILET_GRAB_BAR = "TOILET_GRAB_BAR"
    STEP_FREE_SHOWER = "STEP_FREE_SHOWER"
    SHOWER_CHAIR = "SHOWER_CHAIR"
    # Adaptive equipment
    CEILING_HOIST = "CEILING_HOIST"


class SelfCheckInMethod(StrEnum):
    """Self check-in access methods (DEC-019).

    Matches the four Airbnb-documented self check-in access options.
    Stored as a structured array so guests can see how they will access
    the property without requiring a new access-control workflow.
    """

    LOCKBOX = "LOCKBOX"
    SMART_LOCK = "SMART_LOCK"
    KEYPAD = "KEYPAD"
    BUILDING_STAFF = "BUILDING_STAFF"


class BedType(StrEnum):
    """Standard hospitality bed-type vocabulary for sleeping arrangements.

    Matches the Airbnb bed-type taxonomy used in the sleeping-arrangements
    UI. Stored as ``type`` in each ``{type, count}`` entry of the
    ``sleeping_arrangements`` JSONB column.
    """

    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    QUEEN = "QUEEN"
    KING = "KING"
    SOFA_BED = "SOFA_BED"
    BUNK_BED = "BUNK_BED"
    AIR_MATTRESS = "AIR_MATTRESS"
    CRIB = "CRIB"
    FLOOR_MATTRESS = "FLOOR_MATTRESS"
    TODDLER_BED = "TODDLER_BED"
    WATER_BED = "WATER_BED"
    HAMMOCK = "HAMMOCK"
