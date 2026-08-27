"""SQLAlchemy models for the supply discovery pipeline."""

from datetime import datetime
from typing import Any

from sqlalchemy import (
    ARRAY,
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import CandidateStatus, CandidateType, ContactStatus, DuplicateStatus, RunStatus


class DiscoveryConfig(UUIDMixin, TimestampMixin, Base):
    """Configurable search profile for the discovery engine."""

    __tablename__ = "discovery_configs"
    __table_args__ = (
        CheckConstraint("min_price >= 0 OR min_price IS NULL", name="chk_disc_cfg_min_price"),
        {"schema": "discovery"},
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="Egypt")
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    zone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    min_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_guest_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    max_candidates_per_run: Mapped[int] = mapped_column(Integer, nullable=False, default=50)


class DiscoveryRun(UUIDMixin, TimestampMixin, Base):
    """Record of a single discovery execution."""

    __tablename__ = "discovery_runs"
    __table_args__ = (
        Index("idx_disc_runs_config", "config_id"),
        Index("idx_disc_runs_status", "status"),
        {"schema": "discovery"},
    )

    config_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("discovery.discovery_configs.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=RunStatus.RUNNING)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pages_scanned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    candidates_found: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    new_candidates: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duplicates: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    qualified: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rejected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    run_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)


class DiscoveryCandidate(UUIDMixin, TimestampMixin, Base):
    """A property discovered from an external source — NOT a StayOS listing."""

    __tablename__ = "discovery_candidates"
    __table_args__ = (
        Index("idx_disc_cand_source", "source", "external_listing_id"),
        Index("idx_disc_cand_status", "status"),
        Index("idx_disc_cand_qualification", "qualification_score"),
        Index("idx_disc_cand_city", "city"),
        Index("idx_disc_cand_duplicate", "duplicate_status"),
        {"schema": "discovery"},
    )

    # Source tracking
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    external_listing_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now())

    # Candidate classification: PLACE (building exists) vs SUPPLY_LEAD (contactable, actionable)
    candidate_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=CandidateType.PLACE
    )

    # Raw source data (preserved as-is)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    raw_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_price: Mapped[str | None] = mapped_column(String(100), nullable=True)
    raw_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    raw_location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_images: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    raw_amenities: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    raw_contact: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    # Normalized data
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    zone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    guest_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nightly_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    image_urls: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    amenities: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    # Quality scoring
    source_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    data_completeness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    qualification_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Contact info
    contact_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ContactStatus.NOT_AVAILABLE
    )
    contact_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contact_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Duplicate detection
    duplicate_status: Mapped[str] = mapped_column(
        String(25), nullable=False, default=DuplicateStatus.UNIQUE
    )
    duplicate_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    duplicate_of_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("discovery.discovery_candidates.id", ondelete="SET NULL"), nullable=True
    )

    # Workflow
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=CandidateStatus.DISCOVERED
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Link to imported StayOS unit (when promoted)
    imported_unit_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # Run that discovered this candidate
    run_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("discovery.discovery_runs.id", ondelete="SET NULL"), nullable=True
    )

    duplicate_of: Mapped["DiscoveryCandidate | None"] = relationship(
        "DiscoveryCandidate",
        remote_side="DiscoveryCandidate.id",
        foreign_keys=[duplicate_of_id],
    )
