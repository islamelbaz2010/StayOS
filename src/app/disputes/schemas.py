from datetime import datetime

from pydantic import BaseModel, Field

from .constants import DisputeCategory, DisputeStatus


class DisputeCreate(BaseModel):
    booking_id: str
    category: DisputeCategory
    description: str = Field(..., min_length=10, max_length=5000)


class DisputeResponse(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str | None = None
    reporter_role: str | None = None
    booking_id: str
    category: str
    description: str
    status: str
    admin_notes: str | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DisputeAdminUpdate(BaseModel):
    status: DisputeStatus | None = None
    admin_notes: str | None = Field(None, max_length=5000)


class DisputeListResponse(BaseModel):
    data: list[DisputeResponse]
    total: int
