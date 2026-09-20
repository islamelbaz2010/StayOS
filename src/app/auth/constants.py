from enum import StrEnum


class UserRole(StrEnum):
    GUEST = "guest"
    HOST = "host"
    FIELD_STAFF = "field_staff"
    STAFF = "staff"
    ADMIN = "admin"


class StaffPermission(StrEnum):
    """Scoped operational permissions grantable to internal staff.

    Admin holds all of them implicitly. Staff users only receive the
    areas explicitly granted through staff management — they can never
    grant permissions themselves (staff management is admin-only).
    """

    LISTINGS = "listings"
    KYC = "kyc"
    PAYMENTS = "payments"
    OPERATIONS = "operations"
    DISPUTES = "disputes"
    DISCOVERY = "discovery"


# FD-18: Job Role / Role Group → Permission Set → Staff User.
# A role group is a named permission-set template applied at staff
# creation; granular per-user overrides remain available afterwards and
# the underlying permission model is unchanged.
STAFF_ROLE_GROUPS: dict[str, dict[str, object]] = {
    "operations_manager": {
        "label_en": "Operations Manager",
        "label_ar": "مدير العمليات",
        "permissions": ["operations", "disputes", "listings"],
    },
    "kyc_officer": {
        "label_en": "KYC Officer",
        "label_ar": "مسؤول التحقق",
        "permissions": ["kyc"],
    },
    "finance_officer": {
        "label_en": "Finance Officer",
        "label_ar": "مسؤول مالي",
        "permissions": ["payments", "disputes"],
    },
    "listings_manager": {
        "label_en": "Listings Manager",
        "label_ar": "مدير الإعلانات",
        "permissions": ["listings", "discovery"],
    },
    "admin": {
        "label_en": "Admin",
        "label_ar": "مدير النظام",
        "permissions": [p.value for p in StaffPermission],
    },
}


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

    Matches the Airbnb host-language filter vocabulary. Codes follow
    ISO 639-1 where applicable; ``sign`` represents sign language.
    """

    AR = "ar"
    EN = "en"
    FR = "fr"
    DE = "de"
    RU = "ru"
    IT = "it"
    ES = "es"
    TR = "tr"
    ZH = "zh"
    JA = "ja"
    KO = "ko"
    PT = "pt"
    NL = "nl"
    FI = "fi"
    EL = "el"
    HE = "he"
    HI = "hi"
    HU = "hu"
    ID = "id"
    MS = "ms"
    SV = "sv"
    TH = "th"
    BE = "be"
    BG = "bg"
    GU = "gu"
    HT = "ht"
    FA = "fa"
    PA = "pa"
    TL = "tl"
    UK = "uk"
    UR = "ur"
    VI = "vi"
    SIGN = "sign"
