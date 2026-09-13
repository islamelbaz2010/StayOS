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


class SpokenLanguage(StrEnum):
    """ISO 639-1 codes a host can declare (DEC-019).

    Scoped to the languages relevant to Egypt-inbound travel and the
    Egypt-GCC corridor (DEC-002) rather than an open-ended language list.
    """

    AR = "ar"
    EN = "en"
    FR = "fr"
    DE = "de"
    RU = "ru"
    IT = "it"
    ES = "es"
    TR = "tr"
