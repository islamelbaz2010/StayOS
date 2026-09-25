from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

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
    staff_permissions: list[str] = []
    # True when a password is set (email+password login enabled). Derived in
    # the route — the ORM exposes password_hash, never serialized here.
    has_password: bool = False
    # StayOS Local Fit (FD-24): the guest's stay preferences, a list of
    # supported rule keys. Empty/null means matching is not shown.
    guest_preferences: list[str] | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime


class AvatarPresignRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., min_length=3, max_length=100)


class AvatarPresignResponse(BaseModel):
    upload_url: str
    s3_key: str


class AvatarConfirmRequest(BaseModel):
    s3_key: str = Field(..., min_length=1, max_length=512)


class AccountUpdate(BaseModel):
    legal_name: str | None = None
    national_id: str | None = None
    date_of_birth: date | None = None
    tax_id: str | None = None
    address: dict[str, Any] | None = None
    # Host payout preferences (FD-26) — collection only. Payout execution
    # stays gated on provider/legal prerequisites; these fields are the
    # host's declared destination, not a live disbursement mandate.
    payout_method: str | None = Field(default=None, max_length=30)
    payout_bank_name: str | None = Field(default=None, max_length=100)
    payout_account_number: str | None = Field(default=None, max_length=100)
    payout_wallet_msisdn: str | None = Field(default=None, max_length=30)
    payout_holder_name: str | None = Field(default=None, max_length=255)

    @field_validator("payout_method")
    @classmethod
    def _valid_payout_method(cls, v: str | None) -> str | None:
        # FD-26 supported channels: bank account / IBAN, Egyptian mobile
        # wallet, Paymob payout channel. Execution stays provider-gated.
        allowed = {"bank", "iban", "wallet", "paymob"}
        if v is not None and v not in allowed:
            raise ValueError(f"payout_method must be one of {sorted(allowed)}")
        return v


class UserProfileUpdate(BaseModel):
    """Self-service user profile fields — display name only. Email and
    phone are sign-in/recovery identities and legal identity fields live
    on the account record; none of those change through this endpoint."""

    display_name: str | None = Field(default=None, max_length=255)


class GuestPreferencesUpdate(BaseModel):
    guest_preferences: list[str] = Field(default_factory=list)


def _mask_payout(value: str | None) -> str | None:
    """Never serialize full payout destination details — last four only."""
    if not value:
        return value
    tail = value[-4:] if len(value) > 4 else value
    return f"••••{tail}"


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    legal_name: str | None
    national_id: str | None
    date_of_birth: date | None
    tax_id: str | None
    address: dict[str, Any] | None
    payout_method: str | None = None
    payout_bank_name: str | None = None
    payout_account_number: str | None = None
    payout_wallet_msisdn: str | None = None
    payout_holder_name: str | None = None
    created_at: datetime
    updated_at: datetime

    @field_serializer("payout_account_number", "payout_wallet_msisdn")
    def _serialize_payout(self, value: str | None) -> str | None:
        return _mask_payout(value)


class UserExportResponse(BaseModel):
    export: dict[str, Any]


class UserDeleteResponse(BaseModel):
    status: str = "deleted"
    deleted_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PowSolution(BaseModel):
    """Client-solved Akedly PoW proof, from @akedly/shield's solvePow() against a
    challenge fetched via GET /auth/otp/challenge."""

    challenge_token: str
    nonce: int


class OtpSendRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")
    # Both fields are optional and backward-compatible: a caller that omits them
    # gets the server-side PoW fallback (see auth/services.py:send_otp). The
    # mobile app supplies pow_solution after calling GET /auth/otp/challenge and
    # solving it client-side with @akedly/shield.
    pow_solution: PowSolution | None = Field(
        default=None,
        description="Client-solved PoW proof from @akedly/shield's solvePow(); omit to let the backend solve it server-side",
    )
    turnstile_token: str | None = Field(
        default=None,
        description="Cloudflare Turnstile token, required only if Akedly's pipeline challenge demands one",
    )


class OtpSendResponse(BaseModel):
    phone_number: str
    status: str


class OtpChallengeResponse(BaseModel):
    """Proxies Akedly's V1.2 /transactions/challenge response to the client.
    Never includes APIKey/pipelineID — those stay backend-only."""

    challenge: str
    difficulty: int
    challenge_token: str
    challenge_required: bool
    turnstile_required: bool
    turnstile_site_key: str | None = None


class OtpVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")
    code: str = Field(..., min_length=6, max_length=6)


class FirebaseAuthRequest(BaseModel):
    id_token: str


class EmailRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=255)
    locale: str = Field(default="ar", pattern=r"^(en|ar)$")


class EmailLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class PasswordSetRequest(BaseModel):
    """Set or change the account password. ``current_password`` is required
    only when the account already has one — OTP/Firebase-only accounts can
    set their first password while authenticated."""

    new_password: str = Field(..., min_length=8, max_length=128)
    current_password: str | None = Field(default=None, max_length=128)


class PasswordForgotRequest(BaseModel):
    """Password recovery via the account's verified phone number (OTP).

    ``identifier`` accepts the account email or phone number; the recovery
    code always goes to the phone on file — never to an arbitrary address.
    """

    identifier: str = Field(..., min_length=3, max_length=255)


class PasswordResetRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


class DeviceTokenRegisterRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=512)
    platform: str = Field(..., pattern=r"^(ios|android|web)$")
    app_version: str | None = Field(default=None, max_length=50)


class RoleUpgradeRequest(BaseModel):
    role: UserRole = UserRole.HOST


class RoleUpgradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone_number: str | None
    email: str | None
    display_name: str | None
    locale: str
    role: UserRole
    kyc_status: KycStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DeviceTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    platform: str
    app_version: str | None
    is_active: bool
    created_at: datetime


class DevTokenRequest(BaseModel):
    user_id: str = Field(..., description="ID of the user to issue tokens for (dev only)")
