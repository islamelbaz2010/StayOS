import base64
import json
from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator


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
    base_price_egp: int = Field(..., ge=100)
    cleaning_fee_egp: int = Field(default=0, ge=0)
    cancellation_policy: str = Field(default="FLEXIBLE", min_length=1, max_length=50)
    weekend_mult: float = Field(default=1.0, ge=0.0)
    peak_mult: float = Field(default=1.0, ge=0.0)
    min_nights: int = Field(default=1, ge=1)
    max_nights: int = Field(default=30, ge=1)
    house_rules: str | None = None
    check_in_instructions: str | None = None
    policies: str | None = None
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

    @field_validator("property_type", "cultural_tags", "category", "cancellation_policy", mode="before")
    @classmethod
    def uppercase_strings(cls, v: str | list[str]) -> str | list[str]:
        if isinstance(v, str):
            return v.upper()
        if isinstance(v, list):
            return [item.upper() for item in v]
        return v

    @model_validator(mode="after")
    def validate_nights(self) -> "ListingCreate":
        if self.min_nights > self.max_nights:
            raise ValueError("min_nights cannot be greater than max_nights")
        return self


class ListingUpdate(BaseModel):
    title_ar: str | None = Field(None, min_length=1, max_length=255)
    title_en: str | None = Field(None, max_length=255)
    description_ar: str | None = Field(None, min_length=1)
    description_en: str | None = None
    amenities: list[str] | None = None
    cultural_tags: list[str] | None = None
    base_price_egp: int | None = Field(None, ge=100)
    cleaning_fee_egp: int | None = Field(None, ge=0)
    cancellation_policy: str | None = Field(None, min_length=1, max_length=50)
    category: str | None = Field(None, min_length=1, max_length=50)
    address: str | None = Field(None, max_length=500)
    beds: int | None = Field(None, ge=0)
    weekend_mult: float | None = Field(None, ge=0.0)
    peak_mult: float | None = Field(None, ge=0.0)
    min_nights: int | None = Field(None, ge=1)
    max_nights: int | None = Field(None, ge=1)
    house_rules: str | None = None
    check_in_instructions: str | None = None
    policies: str | None = None
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

    @field_validator("amenities", "cultural_tags", mode="before")
    @classmethod
    def uppercase_lists(cls, v: list[str] | None) -> list[str] | None:
        if isinstance(v, list):
            return [item.upper() for item in v]
        return v

    @field_validator("category", "cancellation_policy", mode="before")
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
    policies: str | None
    cover_image: str | None = None
    average_rating: float | None = None
    review_count: int = 0


class ListingSearchResult(BaseModel):
    id: str
    title_ar: str
    title_en: str | None
    title: str
    description: str
    property_type: str
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
    bathrooms: int
    amenities: list[str]
    cultural_tags: list[str]
    house_rules: str | None
    host_kyc_status: str | None = None
    cover_image: str | None = None
    average_rating: float | None = None
    review_count: int = 0


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
    property_type: list[str] | None = None
    cultural_tags: list[str] | None = None
    amenities: list[str] | None = None
    guests: int | None = Field(None, ge=1)
    cursor: str | None = None
    offset: int | None = Field(default=None, ge=0)
    limit: int = Field(default=20, ge=1, le=100)

    @field_validator("property_type", "cultural_tags", "amenities", mode="before")
    @classmethod
    def split_comma_separated(cls, v: str | list[str] | None) -> list[str] | None:
        if v is None:
            return None
        if isinstance(v, str):
            return [item.strip().upper() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return [item.upper() for item in v]
        return v

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


class PhotoResponse(BaseModel):
    id: str
    unit_id: str
    s3_key: str
    url: str
    display_order: int
    is_cover: bool
    caption: str | None
