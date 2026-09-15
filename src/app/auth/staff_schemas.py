from datetime import datetime

from pydantic import BaseModel, Field


class StaffCreateRequest(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=20)
    display_name: str = Field(..., min_length=1, max_length=255)
    email: str | None = Field(None, max_length=255)
    permissions: list[str] = Field(default_factory=list)


class StaffUpdateRequest(BaseModel):
    is_active: bool | None = None
    display_name: str | None = Field(None, min_length=1, max_length=255)


class StaffPermissionsUpdate(BaseModel):
    permissions: list[str] = Field(default_factory=list)


class StaffResponse(BaseModel):
    id: str
    phone_number: str | None = None
    email: str | None = None
    display_name: str | None = None
    role: str
    is_active: bool
    permissions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
