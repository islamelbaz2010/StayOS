from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth import repository as auth_repository
from app.auth import schemas as auth_schemas
from app.auth import services as auth_services
from app.auth.models import User
from app.database import get_session
from app.security.rate_limit import (
    login_rate_limit,
    otp_challenge_rate_limit,
    otp_send_rate_limit,
    otp_verify_rate_limit,
    refresh_rate_limit,
)
from app.shared.exceptions import StayOSError, to_http_exception

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/otp/challenge", response_model=auth_schemas.OtpChallengeResponse)
async def get_otp_challenge(
    _rate_limit: None = Depends(otp_challenge_rate_limit),
) -> auth_schemas.OtpChallengeResponse:
    """Proxies Akedly's V1.2 challenge so the mobile client can solve PoW (and
    obtain a Turnstile token, when required) before calling /otp/send. Keeps
    AKEDLY_API_KEY and AKEDLY_PIPELINE_ID backend-only."""
    try:
        return await auth_services.get_otp_challenge()
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/otp/send", response_model=auth_schemas.OtpSendResponse)
async def send_otp(
    request: auth_schemas.OtpSendRequest,
    _rate_limit: None = Depends(otp_send_rate_limit),
) -> auth_schemas.OtpSendResponse:
    try:
        status = await auth_services.send_otp(request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return auth_schemas.OtpSendResponse(
        phone_number=request.phone_number, status=status
    )


@router.post("/otp/verify", response_model=auth_schemas.TokenPair)
async def verify_otp(
    request: auth_schemas.OtpVerifyRequest,
    session: AsyncSession = Depends(get_session),
    _rate_limit: None = Depends(otp_verify_rate_limit),
) -> auth_schemas.TokenPair:
    try:
        return await auth_services.authenticate_by_otp(session, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/firebase", response_model=auth_schemas.TokenPair)
async def firebase_auth(
    request: auth_schemas.FirebaseAuthRequest,
    session: AsyncSession = Depends(get_session),
    _rate_limit: None = Depends(login_rate_limit),
) -> auth_schemas.TokenPair:
    try:
        return await auth_services.authenticate_by_firebase(session, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/register", response_model=auth_schemas.TokenPair)
async def register_email(
    request: auth_schemas.EmailRegisterRequest,
    session: AsyncSession = Depends(get_session),
    _rate_limit: None = Depends(login_rate_limit),
) -> auth_schemas.TokenPair:
    """Email+password registration — creates a guest account and returns a
    token pair (auto-login). Phone OTP and Firebase flows are unaffected."""
    try:
        return await auth_services.register_with_email(session, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/login", response_model=auth_schemas.TokenPair)
async def login_email(
    request: auth_schemas.EmailLoginRequest,
    session: AsyncSession = Depends(get_session),
    _rate_limit: None = Depends(login_rate_limit),
) -> auth_schemas.TokenPair:
    """Email+password login. Uniform "invalid credentials" failure for
    unknown accounts and wrong passwords."""
    try:
        return await auth_services.authenticate_by_email(session, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/password", status_code=204)
async def set_password(
    request: auth_schemas.PasswordSetRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Set or change the account password while authenticated. Accounts that
    signed up via OTP/Firebase can set a first password without supplying a
    current one; password-holders must re-authenticate with the current one."""
    try:
        await auth_services.set_password(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/refresh", response_model=auth_schemas.TokenPair)
async def refresh_token(
    request: auth_schemas.TokenRefreshRequest,
    session: AsyncSession = Depends(get_session),
    _rate_limit: None = Depends(refresh_rate_limit),
) -> auth_schemas.TokenPair:
    try:
        return await auth_services.rotate_refresh_token(
            session, request.refresh_token
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/logout")
async def logout(
    request: auth_schemas.TokenRefreshRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    try:
        await auth_services.revoke_refresh_token(session, request.refresh_token)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return {"status": "ok"}


@router.get("/me", response_model=auth_schemas.UserResponse)
async def get_me(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.UserResponse:
    response = auth_schemas.UserResponse.model_validate(user)
    response.has_password = bool(user.password_hash)
    from app.auth.constants import UserRole

    if user.role == UserRole.STAFF:
        from sqlalchemy import select

        from app.auth.models import StaffPermission

        result = await session.execute(
            select(StaffPermission.permission).where(
                StaffPermission.user_id == user.id,
                StaffPermission.is_active.is_(True),
            )
        )
        response.staff_permissions = list(result.scalars().all())
    return response


@router.get("/me/account", response_model=auth_schemas.AccountResponse)
async def get_account(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.AccountResponse:
    account = await auth_services.ensure_account(session, user)
    return auth_schemas.AccountResponse.model_validate(account)


@router.put("/me/preferences", response_model=auth_schemas.UserResponse)
async def update_preferences(
    data: auth_schemas.GuestPreferencesUpdate,
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.UserResponse:
    """Set the guest's Local Fit stay preferences (rule keys only —
    unsupported keys are dropped)."""
    from app.listings.fit import validate_preferences

    user.guest_preferences = validate_preferences(data.guest_preferences)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    response = auth_schemas.UserResponse.model_validate(user)
    response.has_password = bool(user.password_hash)
    return response


@router.get("/me/export", response_model=auth_schemas.UserExportResponse)
async def export_my_data(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.UserExportResponse:
    try:
        return await auth_services.export_user_data(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.delete("/me", response_model=auth_schemas.UserDeleteResponse)
async def delete_my_account(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.UserDeleteResponse:
    try:
        return await auth_services.delete_user_account(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/me/account", response_model=auth_schemas.AccountResponse)
async def update_account(
    data: auth_schemas.AccountUpdate,
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.AccountResponse:
    try:
        account = await auth_services.update_account(session, user, data)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return auth_schemas.AccountResponse.model_validate(account)


@router.patch("/me/role", response_model=auth_schemas.RoleUpgradeResponse)
async def upgrade_role(
    data: auth_schemas.RoleUpgradeRequest,
    user: User = Depends(auth_dependencies.require_kyc_verified),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.RoleUpgradeResponse:
    from app.auth import repository as auth_repository
    from app.auth.constants import UserRole
    from app.shared.exceptions import ValidationError

    if data.role != UserRole.HOST:
        raise ValidationError("Only upgrade to host role is supported")
    if user.role == UserRole.HOST:
        raise ValidationError("User is already a host")
    if user.role in (UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD_STAFF):
        # Internal/operations accounts keep their operational role —
        # they never become marketplace hosts through self-serve upgrade.
        raise ValidationError("Operational accounts cannot become hosts")

    from app.kyc import repository as kyc_repository

    # The verified flag alone is not sufficient — becoming a host requires
    # an identity document that completed the review workflow (submitted
    # and approved via /kyc), so every host transition is backed by a
    # submission admins can review.
    documents = await kyc_repository.get_kyc_documents_by_user_id(session, user.id)
    if not any(d.status == "verified" for d in documents):
        raise ValidationError(
            "Identity verification requires a reviewed document before becoming a host"
        )

    updated = await auth_repository.update_user(session, user, role=UserRole.HOST)
    await session.commit()
    return auth_schemas.RoleUpgradeResponse.model_validate(updated)


@router.post("/device-token", response_model=auth_schemas.DeviceTokenResponse)
async def register_device_token(
    request: auth_schemas.DeviceTokenRegisterRequest,
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.DeviceTokenResponse:
    from app.auth import repository as auth_repository

    device_token = await auth_repository.upsert_device_token(
        session,
        user_id=user.id,
        token=request.token,
        platform=request.platform,
        app_version=request.app_version,
    )
    await session.commit()
    return auth_schemas.DeviceTokenResponse.model_validate(device_token)


@router.get("/.well-known/jwks.json")
async def public_key() -> dict[str, str]:
    return {"public_key": auth_dependencies.get_public_key()}


@router.post("/dev-token", response_model=auth_schemas.TokenPair)
async def dev_token(
    request: auth_schemas.DevTokenRequest,
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.TokenPair:
    """Issue a JWT token pair for a given user ID — development only.

    This endpoint bypasses Firebase/Twilio so the founder can validate UI
    and user journeys locally without external credentials. It is guarded
    by an ENVIRONMENT check and will 404 in any non-development deployment.
    """
    from app.config import settings
    from app.shared.exceptions import AuthenticationError, NotFoundError

    if settings.ENVIRONMENT not in ("development", "staging"):
        raise NotFoundError("Not available in this environment")

    user = await auth_repository.get_user_by_id(session, request.user_id)
    if user is None or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    tokens = await auth_services.create_token_pair(session, user)
    await session.commit()
    return tokens
