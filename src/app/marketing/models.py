from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import LeadStatus


class HostLead(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "host_leads"
    __table_args__ = (
        CheckConstraint("units_count > 0", name="chk_host_leads_units"),
        UniqueConstraint("phone_normalized", name="uq_host_leads_phone"),
        Index("ix_host_leads_status", "status"),
        Index("ix_host_leads_city", "city"),
        {"schema": "marketing"},
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    phone_normalized: Mapped[str] = mapped_column(String(40), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    property_type: Mapped[str] = mapped_column(String(40), nullable=False)
    units_count: Mapped[int] = mapped_column(Integer, nullable=False)
    property_readiness: Mapped[str | None] = mapped_column(String(40), nullable=True)
    preferred_contact: Mapped[str | None] = mapped_column(String(20), nullable=True)
    management_company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=LeadStatus.NEW)
    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lang: Mapped[str | None] = mapped_column(String(5), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class GuestLead(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "guest_leads"
    __table_args__ = (
        UniqueConstraint("contact_key", name="uq_guest_leads_contact"),
        Index("ix_guest_leads_status", "status"),
        {"schema": "marketing"},
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    contact_key: Mapped[str] = mapped_column(String(340), nullable=False)
    preferred_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    accommodation_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=LeadStatus.NEW)
    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lang: Mapped[str | None] = mapped_column(String(5), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class LeadEvent(UUIDMixin, Base):
    __tablename__ = "lead_events"
    __table_args__ = (
        Index("ix_lead_events_event", "event"),
        {"schema": "marketing"},
    )

    event: Mapped[str] = mapped_column(String(60), nullable=False)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    lang: Mapped[str | None] = mapped_column(String(5), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LeadNote(UUIDMixin, Base):
    __tablename__ = "lead_notes"
    __table_args__ = (
        Index("ix_lead_notes_lead", "lead_kind", "lead_id"),
        {"schema": "marketing"},
    )

    lead_kind: Mapped[str] = mapped_column(String(10), nullable=False)
    lead_id: Mapped[str] = mapped_column(String(36), nullable=False)
    author_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
