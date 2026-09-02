from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .constants import BookingStatus


class BookingCreate(BaseModel):
    unit_id: str
    check_in: date
    check_out: date
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0)

    @field_validator("check_out")
    @classmethod
    def check_out_after_check_in(cls, v: date, info: Any) -> date:
        check_in = info.data.get("check_in")
        if check_in is not None and v <= check_in:
            raise ValueError("check_out must be after check_in")
        return v


class BookingUpdate(BaseModel):
    status: BookingStatus
    reject_reason: str | None = None
    cancel_reason: str | None = None


class BookingCancelRequest(BaseModel):
    reason: str | None = None


class BookingCancellationPreview(BaseModel):
    """Financial consequence of cancelling a booking, computed but not applied.

    Lets the UI show the guest/host what cancelling will actually cost before
    they confirm — the refund amount here is exactly what `cancel_booking`
    will apply if called immediately after.
    """

    booking_id: str
    cancellable: bool
    cancelled_by: str  # "guest" | "host" | "admin" — perspective of the requester
    total_paid_egp: int
    refund_amount_egp: int
    refund_policy_applied: str


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    guest_id: str
    host_id: str | None = None
    status: str
    # Derived from status + dates + checked_in_at/checked_out_at — see
    # services._compute_stay_phase. One of: upcoming, check_in_ready,
    # checked_in, checkout_ready, checked_out, completed, cancelled, rejected.
    stay_phase: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    requested_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    cancelled_at: datetime | None
    cancelled_by: str | None = None
    checked_in_at: datetime | None = None
    checked_out_at: datetime | None = None
    reject_reason: str | None
    cancel_reason: str | None
    created_at: datetime
    updated_at: datetime


class StayHostInfo(BaseModel):
    name: str | None
    # Contact detail — only populated once pre-arrival info is eligible for
    # release (see services._arrival_info_eligible); null before that.
    phone: str | None = None


class StayArrivalInfo(BaseModel):
    """Time-gated arrival/access information.

    `eligible` tells the client whether this booking has crossed the
    pre-arrival release threshold. When false, `check_in_instructions` is
    always null — the field is never populated early regardless of what the
    client requests.
    """

    eligible: bool
    check_in_instructions: str | None = None
    default_check_in_time: str
    default_check_out_time: str


class StayPropertyInfo(BaseModel):
    unit_id: str
    title: str | None
    address: str | None
    lat: float | None
    lng: float | None
    house_rules: str | None
    cancellation_policy: str | None


class StayInfoResponse(BaseModel):
    """Aggregated Trip/Stay detail for a single booking — the backing data
    for the Mobile Trip detail screen. Not a duplicate of BookingResponse:
    this adds property/host/arrival information and review eligibility that
    the plain booking record doesn't carry.
    """

    booking: BookingResponse
    property: StayPropertyInfo
    host: StayHostInfo
    arrival: StayArrivalInfo
    review_eligible: bool
