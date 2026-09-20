from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from .constants import (
    SUBRATING_KEYS,
    ReviewReportReason,
    ReviewReportStatus,
)


def _validate_subratings(
    subratings: dict[str, int] | None,
) -> dict[str, int] | None:
    """Validate Airbnb-style subratings: 6 fixed categories, each 1-5."""
    if subratings is None:
        return None
    unknown = set(subratings.keys()) - SUBRATING_KEYS
    if unknown:
        raise ValueError(f"Unknown subrating categories: {sorted(unknown)}")
    for key, value in subratings.items():
        if not isinstance(value, int) or value < 1 or value > 5:
            raise ValueError(f"Subrating '{key}' must be an integer 1-5")
    return subratings


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)
    # Airbnb-style 6 subrating categories. Optional; when provided each
    # must be 1-5 and keys must be from the fixed vocabulary.
    subratings: dict[str, int] | None = None

    @field_validator("subratings")
    @classmethod
    def _check_subratings(cls, v: dict[str, int] | None) -> dict[str, int] | None:
        return _validate_subratings(v)


class HostReviewCreate(BaseModel):
    """Host reviews a guest — no subratings (Airbnb host reviews are overall only)."""

    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


class HostResponseCreate(BaseModel):
    """Host writes a public response to a guest review (one per review)."""

    response: str = Field(..., min_length=1, max_length=2000)


class ReviewResponse(BaseModel):
    id: str
    unit_id: str
    booking_id: str
    guest_id: str
    reviewer_id: str
    reviewer_role: str
    guest_display_name: str | None = None
    reviewer_display_name: str | None = None
    rating: int
    comment: str | None
    subratings: dict[str, int] | None = None
    published: bool = True
    host_response: str | None = None
    host_response_at: datetime | None = None
    created_at: datetime


class HostReviewResponse(BaseModel):
    id: str
    booking_id: str
    guest_id: str
    reviewer_id: str
    reviewer_display_name: str | None = None
    guest_display_name: str | None = None
    rating: int
    comment: str | None
    published: bool = True
    created_at: datetime


class GuestReviewListResponse(BaseModel):
    data: list[HostReviewResponse]
    average_rating: float | None
    review_count: int
    limit: int
    offset: int


class ReviewListResponse(BaseModel):
    data: list[ReviewResponse]
    average_rating: float | None
    review_count: int
    subrating_averages: dict[str, float] | None = None
    rating_distribution: dict[int, int] | None = None
    limit: int
    offset: int


class RatingAggregate(BaseModel):
    average_rating: float | None
    review_count: int


class ReviewReportCreate(BaseModel):
    """FD-04: flag a review for admin moderation."""

    reason: ReviewReportReason
    details: str | None = Field(None, max_length=2000)


class ReviewReportResponse(BaseModel):
    id: str
    review_id: str
    reporter_id: str
    reason: str
    details: str | None
    status: str
    admin_notes: str | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewReportAdminUpdate(BaseModel):
    status: ReviewReportStatus | None = None
    admin_notes: str | None = Field(None, max_length=5000)
    # Moderation action: hide the reported review from public surfaces.
    hide_review: bool = False


class ReviewReportListResponse(BaseModel):
    data: list[ReviewReportResponse]
    total: int
