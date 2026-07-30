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


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    guest_id: str
    host_id: str | None = None
    status: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    requested_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    cancelled_at: datetime | None
    reject_reason: str | None
    cancel_reason: str | None
    created_at: datetime
    updated_at: datetime
