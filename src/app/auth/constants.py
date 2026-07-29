from enum import StrEnum


class UserRole(StrEnum):
    GUEST = "guest"
    HOST = "host"
    FIELD_STAFF = "field_staff"
    ADMIN = "admin"


class KycStatus(StrEnum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class KycDocumentType(StrEnum):
    PASSPORT = "passport"
    NATIONAL_ID = "national_id"
    DRIVING_LICENSE = "driving_license"
