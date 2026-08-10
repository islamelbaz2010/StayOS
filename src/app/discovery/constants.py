"""Constants for the supply discovery module."""

from enum import StrEnum


class CandidateStatus(StrEnum):
    DISCOVERED = "DISCOVERED"
    QUALIFIED = "QUALIFIED"
    DUPLICATE = "DUPLICATE"
    REJECTED = "REJECTED"
    PROSPECT = "PROSPECT"
    CONTACTED = "CONTACTED"
    OWNER_INTERESTED = "OWNER_INTERESTED"
    DATA_REQUIRED = "DATA_REQUIRED"
    KYC_REQUIRED = "KYC_REQUIRED"
    PROPERTY_VERIFICATION_REQUIRED = "PROPERTY_VERIFICATION_REQUIRED"
    READY_FOR_IMPORT = "READY_FOR_IMPORT"
    IMPORTED = "IMPORTED"


class DuplicateStatus(StrEnum):
    UNIQUE = "UNIQUE"
    POSSIBLE_DUPLICATE = "POSSIBLE_DUPLICATE"
    CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE"


class ContactStatus(StrEnum):
    NOT_AVAILABLE = "NOT_AVAILABLE"
    AVAILABLE = "AVAILABLE"
    CONTACTED = "CONTACTED"
    RESPONDED = "RESPONDED"
    DECLINED = "DECLINED"


class RunStatus(StrEnum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"


class SourceStatus(StrEnum):
    ENABLED = "ENABLED"
    DISABLED = "DISABLED"
    UNAVAILABLE = "UNAVAILABLE"
    MANUAL_SOURCE = "MANUAL_SOURCE"
    REQUIRES_CREDENTIALS = "REQUIRES_CREDENTIALS"


class CandidateType(StrEnum):
    """Distinguishes place discovery from supply lead discovery."""
    PLACE = "PLACE"              # A building/business exists here, but no rental signal
    SUPPLY_LEAD = "SUPPLY_LEAD"  # Has contact info or rental signal — actionable for owner outreach


# Qualification score bands
HIGH_PRIORITY_MIN = 80
REVIEW_MIN = 60
LOW_PRIORITY_MIN = 40

# Default scoring weights (sum to 100)
DEFAULT_WEIGHTS = {
    "geography": 20,
    "property_type": 15,
    "price": 15,
    "completeness": 20,
    "contact": 15,
    "source_quality": 15,
}
