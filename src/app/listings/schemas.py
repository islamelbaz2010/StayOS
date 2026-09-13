import base64
import json
from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator

from .constants import AccessibilityFeature, BedType, SelfCheckInMethod


def _validate_accessibility_features(values: list[str]) -> list[str]:
    """Reject unknown accessibility codes (DEC-019).

    The vocabulary is fixed, so an unrecognised code would silently never
    match a search filter. Failing loudly at the contract boundary is the
    only way the host learns their input was wrong.
    """
    allowed = {str(feature) for feature in AccessibilityFeature}
    unknown = [value for value in values if value not in allowed]
    if unknown:
        raise ValueError(
            f"Unknown accessibility features: {', '.join(sorted(unknown))}. "
            f"Allowed: {', '.join(sorted(allowed))}"
        )
    # Preserve host ordering but drop duplicates.
    return list(dict.fromkeys(values))


def _validate_self_check_in_methods(values: list[str]) -> list[str]:
    """Reject unknown self check-in method codes (DEC-019)."""
    allowed = {str(method) for method in SelfCheckInMethod}
    unknown = [value for value in values if value not in allowed]
    if unknown:
        raise ValueError(
            f"Unknown self check-in methods: {', '.join(sorted(unknown))}. "
            f"Allowed: {', '.join(sorted(allowed))}"
        )
    return list(dict.fromkeys(values))


def _validate_sleeping_arrangements(
    value: list[dict] | None,
) -> list[dict] | None:
    """Validate per-bedroom bed configuration (DEC-019 sleeping arrangements).

    Each entry must have a ``beds`` list of ``{type, count}`` objects where
    ``type`` is a known :class:`BedType` and ``count`` is a positive integer.
    Returns ``None`` for empty/absent input so the listing falls back to
    aggregate ``beds`` / ``bedrooms`` display.
    """
    if not value:
        return None
    allowed_types = {str(bed_type) for bed_type in BedType}
    result: list[dict] = []
    for idx, room in enumerate(value):
        if not isinstance(room, dict):
            raise ValueError(
                f"sleeping_arrangements[{idx}] must be an object"
            )
        beds = room.get("beds")
        if not isinstance(beds, list):
            raise ValueError(
                f"sleeping_arrangements[{idx}].beds must be a list"
            )
        validated_beds: list[dict] = []
        for bed in beds:
            if not isinstance(bed, dict):
                raise ValueError(
                    f"sleeping_arrangements[{idx}].beds entries must be objects"
                )
            bed_type = str(bed.get("type", "")).upper()
            if bed_type not in allowed_types:
                raise ValueError(
                    f"Unknown bed type '{bed.get('type')}'. "
                    f"Allowed: {', '.join(sorted(allowed_types))}"
                )
            count = bed.get("count", 0)
            if not isinstance(count, int) or count < 1:
                raise ValueError(
                    f"sleeping_arrangements[{idx}] bed count must be >= 1"
                )
            validated_beds.append({"type": bed_type, "count": count})
        result.append({"beds": validated_beds})
    return result


class ListingCreate(BaseModel):
    property_type: str = Field(..., min_length=1, max_length=50)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    governorate: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    district: str | None = Field(None, max_length=100)
    google_place_id: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    max_guests: int = Field(..., ge=1, le=50)
    bedrooms: int = Field(..., ge=0)
    beds: int = Field(default=1, ge=0)
    bathrooms: int = Field(..., ge=1)
    category: str = Field(default="ENTIRE_PLACE", min_length=1, max_length=50)
    title_ar: str = Field(..., min_length=1, max_length=255)
    title_en: str | None = Field(None, max_length=255)
    description_ar: str = Field(..., min_length=1)
    description_en: str | None = None
    amenities: list[str] = Field(default_factory=list)
    cultural_tags: list[str] = Field(default_factory=list)
    allows_pets: bool = False
    self_check_in: bool = False
    self_check_in_methods: list[str] = Field(default_factory=list)
    accessibility_features: list[str] = Field(default_factory=list)
    base_price_egp: int = Field(..., ge=100)
    cleaning_fee_egp: int = Field(default=0, ge=0)
    cancellation_policy: str = Field(default="FLEXIBLE", min_length=1, max_length=50)
    weekend_mult: float = Field(default=1.0, ge=0.0)
    peak_mult: float = Field(default=1.0, ge=0.0)
    min_nights: int = Field(default=1, ge=1)
    max_nights: int = Field(default=30, ge=1)
    house_rules: str | None = None
    check_in_instructions: str | None = None
    check_in_time: str | None = Field(None, max_length=5)
    check_out_time: str | None = Field(None, max_length=5)
    pre_arrival_info_release_hours: int | None = Field(None, ge=0)
    policies: str | None = None
    sleeping_arrangements: list[dict] | None = None
    country: str = Field(default="Egypt", min_length=1, max_length=100)
    currency: str = Field(default="EGP", min_length=3, max_length=3)
    cover_photo_id: str | None = None
    is_draft: bool = False

    @field_validator("currency", "country", mode="before")
    @classmethod
    def normalize_strings(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def uppercase_currency(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator(
        "property_type",
        "cultural_tags",
        "category",
        "cancellation_policy",
        "accessibility_features",
        "self_check_in_methods",
        mode="before",
    )
    @classmethod
    def uppercase_strings(cls, v: str | list[str]) -> str | list[str]:
        if isinstance(v, str):
            return v.upper()
        if isinstance(v, list):
            return [item.upper() for item in v]
        return v

    @field_validator("accessibility_features")
    @classmethod
    def validate_accessibility_features(cls, v: list[str]) -> list[str]:
        return _validate_accessibility_features(v)

    @field_validator("self_check_in_methods")
    @classmethod
    def validate_self_check_in_methods(cls, v: list[str]) -> list[str]:
        return _validate_self_check_in_methods(v)

    @field_validator("sleeping_arrangements")
    @classmethod
    def validate_sleeping_arrangements(cls, v: list[dict] | None) -> list[dict] | None:
        return _validate_sleeping_arrangements(v)

    @model_validator(mode="after")
    def validate_nights(self) -> "ListingCreate":
        if self.min_nights > self.max_nights:
            raise ValueError("min_nights cannot be greater than max_nights")
        return self


class ListingUpdate(BaseModel):
    property_type: str | None = Field(None, min_length=1, max_length=50)
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    governorate: str | None = Field(None, min_length=1, max_length=100)
    city: str | None = Field(None, min_length=1, max_length=100)
    district: str | None = Field(None, max_length=100)
    google_place_id: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    max_guests: int | None = Field(None, ge=1, le=50)
    bedrooms: int | None = Field(None, ge=0)
    beds: int | None = Field(None, ge=0)
    bathrooms: int | None = Field(None, ge=1)
    title_ar: str | None = Field(None, min_length=1, max_length=255)
    title_en: str | None = Field(None, max_length=255)
    description_ar: str | None = Field(None, min_length=1)
    description_en: str | None = None
    amenities: list[str] | None = None
    cultural_tags: list[str] | None = None
    allows_pets: bool | None = None
    self_check_in: bool | None = None
    self_check_in_methods: list[str] | None = None
    accessibility_features: list[str] | None = None
    base_price_egp: int | None = Field(None, ge=100)
    cleaning_fee_egp: int | None = Field(None, ge=0)
    cancellation_policy: str | None = Field(None, min_length=1, max_length=50)
    category: str | None = Field(None, min_length=1, max_length=50)
    weekend_mult: float | None = Field(None, ge=0.0)
    peak_mult: float | None = Field(None, ge=0.0)
    min_nights: int | None = Field(None, ge=1)
    max_nights: int | None = Field(None, ge=1)
    house_rules: str | None = None
    check_in_instructions: str | None = None
    check_in_time: str | None = Field(None, max_length=5)
    check_out_time: str | None = Field(None, max_length=5)
    pre_arrival_info_release_hours: int | None = Field(None, ge=0)
    policies: str | None = None
    sleeping_arrangements: list[dict] | None = None
    country: str | None = Field(None, min_length=1, max_length=100)
    currency: str | None = Field(None, min_length=3, max_length=3)
    cover_photo_id: str | None = None

    @field_validator("currency", "country", mode="before")
    @classmethod
    def normalize_update_strings(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def uppercase_update_currency(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator(
        "amenities", "cultural_tags", "accessibility_features",
        "self_check_in_methods",
        mode="before",
    )
    @classmethod
    def uppercase_lists(cls, v: list[str] | None) -> list[str] | None:
        if isinstance(v, list):
            return [item.upper() for item in v]
        return v

    @field_validator("accessibility_features")
    @classmethod
    def validate_update_accessibility_features(
        cls, v: list[str] | None
    ) -> list[str] | None:
        if v is None:
            return v
        return _validate_accessibility_features(v)

    @field_validator("self_check_in_methods")
    @classmethod
    def validate_update_self_check_in_methods(
        cls, v: list[str] | None
    ) -> list[str] | None:
        if v is None:
            return v
        return _validate_self_check_in_methods(v)

    @field_validator("sleeping_arrangements")
    @classmethod
    def validate_update_sleeping_arrangements(
        cls, v: list[dict] | None
    ) -> list[dict] | None:
        return _validate_sleeping_arrangements(v)

    @field_validator("property_type", "category", "cancellation_policy", mode="before")
    @classmethod
    def uppercase_update_strings(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.upper()
        return v

    @model_validator(mode="after")
    def validate_nights(self) -> "ListingUpdate":
        if (
            self.min_nights is not None
            and self.max_nights is not None
            and self.min_nights > self.max_nights
        ):
            raise ValueError("min_nights cannot be greater than max_nights")
        return self


class ListingResponse(BaseModel):
    id: str
    host_id: str
    host_display_name: str | None = None
    host_kyc_status: str | None = None
    host_joined_at: str | None = None
    host_languages: list[str] = Field(default_factory=list)
    property_type: str
    status: str
    lat: float
    lng: float
    governorate: str
    city: str
    country: str
    district: str | None
    address: str | None
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    category: str
    title_ar: str
    title_en: str | None
    title: str
    description_ar: str
    description_en: str | None
    description: str
    amenities: list[str]
    cultural_tags: list[str]
    allows_pets: bool = False
    self_check_in: bool = False
    self_check_in_methods: list[str] = Field(default_factory=list)
    accessibility_features: list[str] = Field(default_factory=list)
    base_price_egp: int
    cleaning_fee_egp: int
    cancellation_policy: str
    price: int
    currency: str
    weekend_mult: float
    peak_mult: float
    min_nights: int
    max_nights: int
    house_rules: str | None
    check_in_instructions: str | None
    check_in_time: str | None = None
    check_out_time: str | None = None
    pre_arrival_info_release_hours: int | None = None
    policies: str | None
    sleeping_arrangements: list[dict] | None = None
    # Accessibility features that have at least one evidence photo uploaded
    # by the host (DEC-019). Displayed as a "Photo provided" badge on the
    # listing detail page. The full verification workflow is a separate
    # business decision; this field only signals photo evidence exists.
    accessibility_photo_features: list[str] = Field(default_factory=list)
    cover_image: str | None = None
    average_rating: float | None = None
    review_count: int = 0
    # Host-facing context — populated only when the caller is a host/admin
    # viewing their own managed inventory.
    permission_scope: str | None = None
    rejection_reason: str | None = None


class ListingSearchResult(BaseModel):
    id: str
    title_ar: str
    title_en: str | None
    title: str
    description: str
    property_type: str
    category: str = "ENTIRE_PLACE"
    city: str
    governorate: str
    country: str
    base_price_egp: int
    price: int
    currency: str
    lat: float
    lng: float
    max_guests: int
    bedrooms: int
    beds: int = 0
    bathrooms: int
    amenities: list[str]
    cultural_tags: list[str]
    house_rules: str | None
    host_kyc_status: str | None = None
    cover_image: str | None = None
    average_rating: float | None = None
    review_count: int = 0
    available_for_dates: bool | None = None
    # Computed selected-stay totals; only set when the search includes dates.
    nights: int | None = None
    total_egp: int | None = None


class ListingRejectRequest(BaseModel):
    reason: str | None = Field(None, max_length=500)


class PaginationInfo(BaseModel):
    next_cursor: str | None
    has_more: bool
    total_count: int


class ListingSearchResponse(BaseModel):
    data: list[ListingSearchResult]
    pagination: PaginationInfo


class HostProfileResponse(BaseModel):
    id: str
    display_name: str | None
    kyc_status: str | None
    joined_at: str | None
    languages: list[str] = Field(default_factory=list)
    # Response metrics derived from messaging + booking action timestamps
    # over the last 30 days, matching Airbnb's documented behavior.
    # ``response_rate`` is the percentage of inquiries and booking requests
    # the host responded to within 24 hours. ``response_time_hours`` is the
    # median time-to-first-response in hours. Both are ``None`` when the
    # host has received no inquiries or requests in the window.
    response_rate: int | None = None
    response_time_hours: float | None = None
    listings: list[ListingSearchResult]


class CalendarDay(BaseModel):
    date: date
    status: str
    block_type: str | None = None
    price_egp: int


class AvailabilityResponse(BaseModel):
    unit_id: str
    check_in: date
    check_out: date
    days: list[CalendarDay]

    @model_validator(mode="after")
    def validate_range(self) -> "AvailabilityResponse":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        if (self.check_out - self.check_in).days > 90:
            raise ValueError("date range cannot exceed 90 days")
        return self


class ListingSearchFilters(BaseModel):
    q: str | None = None
    city: str | None = None
    governorate: str | None = None
    host_id: str | None = None
    sw_lat: float | None = Field(None, ge=-90, le=90)
    sw_lng: float | None = Field(None, ge=-180, le=180)
    ne_lat: float | None = Field(None, ge=-90, le=90)
    ne_lng: float | None = Field(None, ge=-180, le=180)
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    radius_km: float | None = Field(None, gt=0)
    check_in: date | None = None
    check_out: date | None = None
    min_price: int | None = Field(None, ge=0)
    max_price: int | None = Field(None, ge=0)
    bedrooms: int | None = Field(None, ge=0)
    beds: int | None = Field(None, ge=0)
    bathrooms: int | None = Field(None, ge=0)
    property_type: str | None = None
    category: str | None = None
    cultural_tags: str | None = None
    amenities: str | None = None
    free_cancellation: bool | None = None
    # Structured discovery filters (DEC-019). Booleans are opt-in only: a
    # false/absent value must not exclude listings, matching how Airbnb's
    # filters narrow results rather than invert them.
    pets: bool | None = None
    self_check_in: bool | None = None
    accessibility: str | None = None
    host_language: str | None = None
    guests: int | None = Field(None, ge=1)
    sort: str | None = None
    cursor: str | None = None
    offset: int | None = Field(default=None, ge=0)
    limit: int = Field(default=20, ge=1, le=100)

    def get_offset(self) -> int:
        if self.offset is not None:
            return max(0, self.offset)
        if not self.cursor:
            return 0
        try:
            payload = json.loads(base64.b64decode(self.cursor).decode("utf-8"))
            return max(0, int(payload.get("offset", 0)))
        except Exception:
            return 0

    @staticmethod
    def encode_cursor(offset: int) -> str:
        payload = json.dumps({"offset": offset})
        return base64.b64encode(payload.encode("utf-8")).decode("utf-8")


class CalendarRuleCreate(BaseModel):
    date_from: date
    date_to: date
    status: str
    block_type: str | None = None
    price_override: int | None = Field(None, ge=0)

    @model_validator(mode="after")
    def validate_dates(self) -> "CalendarRuleCreate":
        if self.date_to <= self.date_from:
            raise ValueError("date_to must be after date_from")
        return self

    @model_validator(mode="after")
    def validate_block(self) -> "CalendarRuleCreate":
        from app.listings.constants import CalendarBlockType, CalendarStatus

        if self.status == CalendarStatus.BLOCKED and not self.block_type:
            self.block_type = CalendarBlockType.MANUAL
        if self.block_type and self.status != CalendarStatus.BLOCKED:
            raise ValueError("block_type is only valid for BLOCKED status")
        return self


class CalendarRuleUpdate(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    status: str | None = None
    block_type: str | None = None
    price_override: int | None = Field(None, ge=0)

    @model_validator(mode="after")
    def validate_block(self) -> "CalendarRuleUpdate":
        from app.listings.constants import CalendarStatus

        if self.block_type and self.status != CalendarStatus.BLOCKED:
            raise ValueError("block_type is only valid for BLOCKED status")
        return self


class CalendarRuleResponse(BaseModel):
    id: str
    unit_id: str
    date_from: date
    date_to: date
    status: str
    block_type: str | None
    price_override: int | None


class BulkCalendarItem(BaseModel):
    date_from: date
    date_to: date
    status: str
    block_type: str | None = None


class BulkAvailabilityRequest(BaseModel):
    rules: list[BulkCalendarItem]


class BulkPricingItem(BaseModel):
    date_from: date
    date_to: date
    price_override: int = Field(..., ge=0)


class BulkPricingRequest(BaseModel):
    rules: list[BulkPricingItem]


class HostDashboardStats(BaseModel):
    total_listings: int
    listed_listings: int
    total_reservations: int
    upcoming_reservations: int
    total_revenue_egp: int
    occupancy_rate_pct: float


class HostReservationCalendarItem(BaseModel):
    reservation_id: str
    unit_id: str
    guest_id: str
    status: str
    check_in: date
    check_out: date
    total_amount_egp: int


class HostReservationCalendarResponse(BaseModel):
    unit_id: str
    check_in: date
    check_out: date
    reservations: list[HostReservationCalendarItem]


class PhotoPresignRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., min_length=1, max_length=100)


class PhotoPresignResponse(BaseModel):
    upload_url: str
    photo_key: str


class PhotoCreate(BaseModel):
    s3_key: str = Field(..., min_length=1, max_length=1024)
    url: str = Field(..., min_length=1, max_length=2048)
    caption: str | None = Field(None, max_length=500)
    is_cover: bool = False
    display_order: int = Field(default=0, ge=0)
    accessibility_feature: str | None = Field(None, max_length=50)

    @field_validator("accessibility_feature", mode="before")
    @classmethod
    def normalize_accessibility_feature(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.upper() or None
        return v

    @field_validator("accessibility_feature")
    @classmethod
    def validate_accessibility_feature(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {str(feature) for feature in AccessibilityFeature}
        if v not in allowed:
            raise ValueError(
                f"Unknown accessibility feature: {v}. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )
        return v


class PhotoResponse(BaseModel):
    id: str
    unit_id: str
    s3_key: str
    url: str
    display_order: int
    is_cover: bool
    caption: str | None
    accessibility_feature: str | None = None


class PhotoOrderItem(BaseModel):
    photo_id: str = Field(..., min_length=1, max_length=64)
    display_order: int = Field(..., ge=0)


class PhotoReorderRequest(BaseModel):
    photo_orders: list[PhotoOrderItem] = Field(..., min_length=1, max_length=50)
