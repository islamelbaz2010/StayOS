import base64
import json
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .constants import CancellationReason, PaymentMethod, PaymentProvider, ReservationStatus


class ReservationCreate(BaseModel):
    unit_id: str
    check_in: date
    check_out: date
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0)
    payment_method: PaymentMethod

    @field_validator("check_out")
    @classmethod
    def check_out_after_check_in(cls, v: date, info: Any) -> date:
        check_in = info.data.get("check_in")
        if check_in is not None and v <= check_in:
            raise ValueError("check_out must be after check_in")
        return v


class PromoApplyRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50)


class ReservationCancelRequest(BaseModel):
    reason: CancellationReason


class PaymentConfirmationRequest(BaseModel):
    provider: PaymentProvider
    provider_ref: str = Field(min_length=1, max_length=255)


class PaymentIntentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str
    provider: str
    provider_ref: str
    amount_egp: int
    status: str
    provider_metadata: dict[str, Any] | None = None
    captured_at: datetime | None


class PromoApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str
    promo_code_id: str
    discount_pct: float
    discount_amount_egp: int


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    guest_id: str
    status: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    total_amount_egp: int
    host_amount_egp: int
    platform_fee_egp: int
    guest_fee_egp: int
    payment_method: str
    checked_in_at: datetime | None
    checked_out_at: datetime | None
    cancelled_at: datetime | None
    cancel_reason: str | None
    refund_amount_egp: int | None
    payment_intents: list[PaymentIntentResponse] = []
    promo_applications: list[PromoApplicationResponse] = []
    paymob_iframe_url: str | None = None


class PaginationInfo(BaseModel):
    next_cursor: str | None
    has_more: bool
    total_count: int


class ReservationListResponse(BaseModel):
    data: list[ReservationResponse]
    pagination: PaginationInfo


class ReservationListFilters(BaseModel):
    status: ReservationStatus | None = None
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=100)

    def get_offset(self) -> int:
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
