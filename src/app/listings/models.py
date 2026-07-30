from datetime import date, datetime
from typing import Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import CalendarStatus, UnitStatus


class Unit(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "units"
    __table_args__ = (
        CheckConstraint("max_guests BETWEEN 1 AND 50", name="chk_unit_max_guests"),
        CheckConstraint("bedrooms >= 0", name="chk_unit_bedrooms"),
        CheckConstraint("bathrooms >= 1", name="chk_unit_bathrooms"),
        {"schema": "pms"},
    )

    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    property_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=UnitStatus.PENDING_VERIFICATION
    )
    coordinates: Mapped[Any] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=True), nullable=False
    )
    governorate: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    google_place_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    max_guests: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bedrooms: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bathrooms: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    listing: Mapped["UnitListing"] = relationship(
        "UnitListing", back_populates="unit", uselist=False
    )
    calendar_rules: Mapped[list["CalendarRule"]] = relationship(
        "CalendarRule", back_populates="unit"
    )
    photos: Mapped[list["UnitPhoto"]] = relationship(
        "UnitPhoto", back_populates="unit", order_by="UnitPhoto.display_order"
    )


class UnitListing(UUIDMixin, Base):
    __tablename__ = "unit_listings"
    __table_args__ = (
        Index("idx_unit_listings_unit_id", "unit_id"),
        Index("idx_unit_listings_base_price", "base_price_egp"),
        Index("idx_unit_listings_search", "search_vector", postgresql_using="gin"),
        Index("idx_unit_listings_amenities", "amenities", postgresql_using="gin"),
        Index("idx_unit_listings_cultural_tags", "cultural_tags", postgresql_using="gin"),
        CheckConstraint("base_price_egp >= 100", name="chk_listing_base_price"),
        {"schema": "pms"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pms.units.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    title_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description_ar: Mapped[str] = mapped_column(Text, nullable=False)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    amenities: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    cultural_tags: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    house_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
    check_in_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    policies: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_price_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    weekend_mult: Mapped[float] = mapped_column(
        Numeric(4, 2), nullable=False, default=1.0
    )
    peak_mult: Mapped[float] = mapped_column(
        Numeric(4, 2), nullable=False, default=1.0
    )
    min_nights: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1
    )
    max_nights: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=30
    )
    country: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Egypt"
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="EGP"
    )
    cover_photo_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pms.unit_photos.id"), nullable=True
    )
    cover_photo: Mapped["UnitPhoto | None"] = relationship(
        "UnitPhoto", foreign_keys=[cover_photo_id]
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    search_vector: Mapped[Any] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', coalesce(title_ar, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(description_ar, '') || ' ' || coalesce(description_en, ''))",
            persisted=True,
        ),
        nullable=False,
    )

    unit: Mapped["Unit"] = relationship("Unit", back_populates="listing")


class CalendarRule(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "calendar_rules"
    __table_args__ = (
        Index("idx_calendar_unit_id", "unit_id", "date_from", "date_to"),
        CheckConstraint("date_to > date_from", name="chk_date_range"),
        {"schema": "pms"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pms.units.id", ondelete="CASCADE"),
        nullable=False,
    )
    date_from: Mapped[date] = mapped_column(Date, nullable=False)
    date_to: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=CalendarStatus.AVAILABLE
    )
    block_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    price_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reservation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    unit: Mapped["Unit"] = relationship("Unit", back_populates="calendar_rules")


class UnitPhoto(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "unit_photos"
    __table_args__ = (
        Index("idx_unit_photos_unit_id", "unit_id"),
        CheckConstraint("display_order >= 0", name="chk_photo_display_order"),
        {"schema": "pms"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pms.units.id", ondelete="CASCADE"),
        nullable=False,
    )
    s3_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    caption_ar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    caption_en: Mapped[str | None] = mapped_column(String(500), nullable=True)

    unit: Mapped["Unit"] = relationship("Unit", back_populates="photos")
