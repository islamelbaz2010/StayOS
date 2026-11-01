from datetime import datetime

import re

from pydantic import BaseModel, Field, field_validator, model_validator

_EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,255}\.[a-zA-Z]{2,}$")


def _check_email(v: str | None) -> str | None:
    if v is not None and not _EMAIL_RE.match(v):
        raise ValueError("invalid email")
    return v

from .constants import ALLOWED_EVENTS, PROPERTY_READINESS, PROPERTY_TYPES, LeadStatus


class UtmMixin(BaseModel):
    utm_source: str | None = Field(None, max_length=100)
    utm_medium: str | None = Field(None, max_length=100)
    utm_campaign: str | None = Field(None, max_length=100)
    utm_content: str | None = Field(None, max_length=100)
    lang: str | None = Field(None, max_length=5)
    # honeypot — must stay empty; bots that fill it are silently accepted
    website: str | None = Field(None, max_length=200)


class HostLeadCreate(UtmMixin):
    full_name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=7, max_length=40)
    city: str = Field(..., min_length=2, max_length=100)
    property_type: str
    units_count: int = Field(..., ge=1, le=10000)
    consent: bool
    email: str | None = None
    property_readiness: str | None = None
    preferred_contact: str | None = Field(None, max_length=20)
    management_company: str | None = Field(None, max_length=200)
    message: str | None = Field(None, max_length=2000)

    @field_validator("property_type")
    @classmethod
    def _ptype(cls, v: str) -> str:
        if v not in PROPERTY_TYPES:
            raise ValueError("invalid property_type")
        return v

    @field_validator("property_readiness")
    @classmethod
    def _pready(cls, v: str | None) -> str | None:
        if v is not None and v not in PROPERTY_READINESS:
            raise ValueError("invalid property_readiness")
        return v

    @field_validator("preferred_contact")
    @classmethod
    def _pcontact(cls, v: str | None) -> str | None:
        if v is not None and v not in ("phone", "whatsapp", "email"):
            raise ValueError("invalid preferred_contact")
        return v

    @field_validator("consent")
    @classmethod
    def _consent(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("consent is required")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        return _check_email(v)

    @field_validator("phone")
    @classmethod
    def _phone_chars(cls, v: str) -> str:
        if not all(c.isdigit() or c in "+-() " for c in v):
            raise ValueError("invalid phone")
        return v


class GuestLeadCreate(UtmMixin):
    name: str = Field(..., min_length=2, max_length=200)
    email: str | None = None
    phone: str | None = Field(None, min_length=7, max_length=40)
    preferred_city: str | None = Field(None, max_length=100)
    accommodation_type: str | None = Field(None, max_length=40)
    consent: bool

    @field_validator("consent")
    @classmethod
    def _consent(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("consent is required")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        return _check_email(v)

    @model_validator(mode="after")
    def _contact_required(self):
        if not self.contact_key():
            raise ValueError("email or phone is required")
        return self

    def contact_key(self) -> str | None:
        return self.email or self.phone


class EventCreate(UtmMixin):
    event: str = Field(..., max_length=60)
    session_id: str | None = Field(None, max_length=64)

    @field_validator("event")
    @classmethod
    def _event(cls, v: str) -> str:
        if v not in ALLOWED_EVENTS:
            raise ValueError("invalid event")
        return v


class LeadOut(BaseModel):
    id: str
    status: str


class AdminLeadListItem(BaseModel):
    id: str
    kind: str
    name: str
    phone: str | None
    email: str | None
    city: str | None
    detail: str | None
    status: str
    consent_at: datetime | None
    utm_source: str | None
    utm_campaign: str | None
    created_at: datetime | None


class LeadStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in LeadStatus.ALL:
            raise ValueError("invalid status")
        return v


class LeadNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=4000)


class MarketingSummary(BaseModel):
    page_views: int
    host_form_starts: int
    host_submissions: int
    guest_submissions: int
    host_conversion_rate: float
    top_source: str | None
    top_campaign: str | None
    top_cities: list[dict]
    leads_by_status: dict
