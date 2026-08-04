from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth import schemas as auth_schemas
from app.auth import services as auth_services
from app.auth.models import User
from app.database import get_session
from app.security.rate_limit import (
    login_rate_limit,
    otp_send_rate_limit,
    otp_verify_rate_limit,
    refresh_rate_limit,
)
from app.shared.exceptions import StayOSError, to_http_exception

router = APIRouter(prefix="/auth", tags=["auth"])


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
) -> auth_schemas.UserResponse:
    return auth_schemas.UserResponse.model_validate(user)


@router.get("/me/account", response_model=auth_schemas.AccountResponse)
async def get_account(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> auth_schemas.AccountResponse:
    account = await auth_services.ensure_account(session, user)
    return auth_schemas.AccountResponse.model_validate(account)


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
