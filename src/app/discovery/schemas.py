"""Schemas for the supply discovery API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DiscoveryConfigCreate(BaseModel):
    name: str = Field(..., max_length=100)
    enabled: bool = True
    country: str = "Egypt"
    city: str | None = None
    zone: str | None = None
    property_type: str | None = None
    min_price: int | None = None
    max_price: int | None = None
    min_bedrooms: int | None = None
    min_guest_capacity: int | None = None
    keywords: list[str] = Field(default_factory=list)
    source: str
    frequency_hours: int = 24
    max_candidates_per_run: int = 50


class DiscoveryConfigResponse(DiscoveryConfigCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DiscoveryRunResponse(BaseModel):
    id: str
    config_id: str | None = None
    source: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    pages_scanned: int
    candidates_found: int
    new_candidates: int
    duplicates: int
    qualified: int
    rejected: int
    errors: list[str] = Field(default_factory=list)
    run_metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DiscoveryCandidateResponse(BaseModel):
    id: str
    source: str
    source_url: str
    external_listing_id: str | None = None
    discovered_at: datetime
    candidate_type: str = "PLACE"

    # Raw
    raw_title: str | None = None
    raw_description: str | None = None
    raw_price: str | None = None
    raw_location: str | None = None
    raw_images: list[str] = Field(default_factory=list)
    raw_amenities: list[str] = Field(default_factory=list)

    # Normalized
    title: str | None = None
    description: str | None = None
    country: str | None = None
    city: str | None = None
    zone: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    guest_capacity: int | None = None
    nightly_price: int | None = None
    currency: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)

    # Quality
    source_confidence: float
    data_completeness_score: float
    qualification_score: float

    # Contact
    contact_status: str
    contact_type: str | None = None
    contact_value: str | None = None
    contact_confidence: float

    # Duplicate
    duplicate_status: str
    duplicate_confidence: float
    duplicate_of_id: str | None = None

    # Workflow
    status: str
    notes: str | None = None
    imported_unit_id: str | None = None
    run_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CandidateListResponse(BaseModel):
    data: list[DiscoveryCandidateResponse]
    pagination: dict[str, Any]


class CandidateStatusUpdate(BaseModel):
    status: str
    notes: str | None = None


class CandidateImportRequest(BaseModel):
    """Request to promote a candidate into the existing import pipeline."""
    host_name: str | None = None
    host_phone: str | None = None
    host_email: str | None = None
    overrides: dict[str, Any] = Field(default_factory=dict)


class DiscoveryRunTriggerRequest(BaseModel):
    config_id: str | None = None
    source: str | None = None


class DiscoveryStatsResponse(BaseModel):
    total_candidates: int = 0
    unique_candidates: int = 0
    qualified_candidates: int = 0
    prospects: int = 0
    contacted: int = 0
    owner_responses: int = 0
    owners_interested: int = 0
    ready_for_import: int = 0
    imported: int = 0
    duplicate_rate: float = 0.0
    by_source: dict[str, int] = Field(default_factory=dict)
    by_candidate_type: dict[str, int] = Field(default_factory=dict)
    contactable_candidates: int = 0
