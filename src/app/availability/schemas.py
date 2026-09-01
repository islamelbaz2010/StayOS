from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .constants import AvailabilityStatus


class AvailabilityDay(BaseModel):
    date: date
    status: str
    block_type: str | None = None
    price_egp: int | None = None


class AvailabilityResponse(BaseModel):
    unit_id: str
    check_in: date
    check_out: date
    days: list[AvailabilityDay]


class AvailabilityRule(BaseModel):
    date_from: date
    date_to: date
    status: AvailabilityStatus

    @model_validator(mode="after")
    def validate_date_range(self) -> "AvailabilityRule":
        if self.date_to <= self.date_from:
            raise ValueError("date_to must be after date_from")
        return self


class AvailabilityUpdateRequest(BaseModel):
    rules: list[AvailabilityRule] = Field(..., min_length=1)


class CalendarRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    date_from: date
    date_to: date
    status: str
    block_type: str | None
    reservation_id: str | None
    price_override: int | None


class AvailabilityUpdateResponse(BaseModel):
    rules: list[CalendarRuleResponse]
