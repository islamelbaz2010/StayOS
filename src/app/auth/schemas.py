from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.auth.constants import KycStatus, UserRole


class UserCreate(BaseModel):
    phone_number: str | None = None
    email: str | None = None
    firebase_uid: str | None = None
    display_name: str | None = None
    locale: str = "ar"
    role: UserRole = UserRole.GUEST


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone_number: str | None
    email: str | None
    firebase_uid: str | None
    display_name: str | None
    locale: str
    role: UserRole
    kyc_status: KycStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AccountUpdate(BaseModel):
    legal_name: str | None = None
    national_id: str | None = None
    date_of_birth: date | None = None
    tax_id: str | None = None
    address: dict[str, Any] | None = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    legal_name: str | None
    national_id: str | None
    date_of_birth: date | None
    tax_id: str | None
    address: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class OtpSendRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")


class OtpSendResponse(BaseModel):
    phone_number: str
    status: str


class OtpVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")
    code: str = Field(..., min_length=6, max_length=6)


class FirebaseAuthRequest(BaseModel):
    id_token: str


class DeviceTokenRegisterRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=512)
    platform: str = Field(..., pattern=r"^(ios|android|web)$")
    app_version: str | None = Field(default=None, max_length=50)


class DeviceTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    platform: str
    app_version: str | None
    is_active: bool
    created_at: datetime
