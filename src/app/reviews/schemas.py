from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


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
    limit: int
    offset: int


class RatingAggregate(BaseModel):
    average_rating: float | None
    review_count: int
