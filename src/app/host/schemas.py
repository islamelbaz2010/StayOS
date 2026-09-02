from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CoHostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    co_host_user_id: str
    co_host_display_name: str | None = None
    co_host_phone: str | None = None
    permission_scope: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CoHostInvite(BaseModel):
    co_host_user_id: str
    permission_scope: str = Field(default="calendar_only", max_length=30)


class CoHostUpdate(BaseModel):
    permission_scope: str | None = Field(None, max_length=30)
    is_active: bool | None = None


class ListingReadinessResponse(BaseModel):
    unit_id: str
    status: str  # "ready" | "action_required"
    missing_items: list[str]
    computed_at: datetime
    # Human-readable labels for each missing item, keyed by item key
    missing_item_labels: dict[str, str] = Field(default_factory=dict)


class HostTodayItem(BaseModel):
    """A single actionable item on the host's today screen."""

    item_type: str
    booking_id: str | None = None
    unit_id: str | None = None
    guest_name: str | None = None
    guest_id: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    status: str | None = None
    stay_phase: str | None = None
    title: str
    subtitle: str | None = None
    action_url: str | None = None
    priority: int = 0  # higher = more urgent


class HostTodayResponse(BaseModel):
    """The host's operational dashboard — "what do I need to do today?"."""

    items: list[HostTodayItem]
    summary: dict[str, int] = Field(default_factory=dict)


class HostReservationSummary(BaseModel):
    """A reservation as seen from the host's perspective."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    unit_title: str | None = None
    guest_id: str
    guest_name: str | None = None
    guest_phone: str | None = None
    status: str
    stay_phase: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    requested_at: datetime
    accepted_at: datetime | None = None
    cancelled_at: datetime | None = None
    checked_in_at: datetime | None = None
    checked_out_at: datetime | None = None
    cancel_reason: str | None = None


class HostReservationDetail(BaseModel):
    """Full reservation detail with payment and property context."""

    booking: HostReservationSummary
    property: dict[str, Any]
    payment: dict[str, Any] | None
    cancellation_preview: dict[str, Any] | None


class HostEarningsSummary(BaseModel):
    """Host-facing financial visibility — read-only, no payout claims."""

    total_bookings: int
    confirmed_bookings: int
    completed_stays: int
    total_revenue_egp: int  # sum of verified payment amounts
    pending_verification_egp: int  # payments awaiting admin verification
    refund_pending_egp: int  # refunds flagged for manual processing
    net_earnings_egp: int  # revenue - refunds
    # Per-listing breakdown
    per_unit: list[dict[str, Any]] = Field(default_factory=list)


class HostCalendarDay(BaseModel):
    """A single day in the host calendar view."""

    date: date
    status: str  # AVAILABLE | BLOCKED | BOOKED | HOLD
    block_type: str | None = None
    price_egp: int
    reservation_id: str | None = None
    reservation_status: str | None = None
    guest_name: str | None = None


class HostCalendarResponse(BaseModel):
    unit_id: str | None
    check_in: date
    check_out: date
    days: list[HostCalendarDay]


class HostProfileResponse(BaseModel):
    """Host's own profile — what they see about themselves."""

    id: str
    display_name: str | None
    phone_number: str | None
    email: str | None
    kyc_status: str
    locale: str
    is_active: bool
    total_listings: int
    listed_listings: int
    co_host_units: int
    created_at: datetime


class HostProfileUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=255)
    email: str | None = Field(None, max_length=255)
    locale: str | None = Field(None, max_length=10)


class HostListingPhoto(BaseModel):
    """Photo as seen in the host listing management view."""

    id: str
    url: str
    display_order: int
    is_cover: bool
    caption: str | None = None


class HostListingDetail(BaseModel):
    """Full listing detail for the host management view.

    Combines the listing response with readiness, photos, and
    permission scope so the mobile editor has everything it needs
    in one round-trip.
    """

    id: str
    host_id: str
    property_type: str
    status: str
    lat: float
    lng: float
    governorate: str
    city: str
    country: str
    district: str | None = None
    address: str | None = None
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    category: str
    title_ar: str
    title_en: str | None = None
    description_ar: str
    description_en: str | None = None
    amenities: list[str] = Field(default_factory=list)
    cultural_tags: list[str] = Field(default_factory=list)
    house_rules: str | None = None
    check_in_instructions: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    pre_arrival_info_release_hours: int | None = None
    policies: str | None = None
    base_price_egp: int
    cleaning_fee_egp: int
    cancellation_policy: str
    currency: str
    weekend_mult: float
    peak_mult: float
    min_nights: int
    max_nights: int
    cover_image: str | None = None
    photos: list[HostListingPhoto] = Field(default_factory=list)
    readiness: ListingReadinessResponse | None = None
    permission_scope: str = "owner"
