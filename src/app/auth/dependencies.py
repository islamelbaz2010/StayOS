from collections.abc import Callable
from typing import Any

from fastapi import Depends
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth import services as auth_services
from app.auth.constants import KycStatus
from app.auth.models import User
from app.config import settings
from app.database import get_session
from app.shared.exceptions import AuthenticationError, AuthorizationError, ValidationError

security = HTTPBearer(auto_error=False)


async def get_current_user(
    session: AsyncSession = Depends(get_session),
    token: Any = Depends(security),
) -> User:
    if token is None or not token.credentials:
        raise AuthenticationError("Authentication required")

    payload = auth_services.decode_token(
        token.credentials, expected_type="access"
    )
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    user = await auth_repository.get_user_by_id(session, user_id)
    if user is None:
        raise AuthenticationError("User not found")
    if not user.is_active:
        raise AuthenticationError("Account disabled")

    token_kyc_status = payload.get("kyc_status")
    if user.kyc_status in (KycStatus.VERIFIED, KycStatus.REJECTED) and token_kyc_status != user.kyc_status:
        raise AuthenticationError("KYC status has changed; please refresh your token")

    return user


async def require_active_user(
    user: User = Depends(get_current_user),
) -> User:
    return user


def require_role(*allowed_roles: str) -> Callable[..., Any]:
    async def _role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise AuthorizationError("Insufficient permissions")
        return user

    return _role_checker


async def require_kyc_verified(
    user: User = Depends(get_current_user),
) -> User:
    if user.kyc_status != KycStatus.VERIFIED:
        raise ValidationError("KYC verification required")
    return user


def get_public_key() -> str:
    return settings.JWT_PUBLIC_KEY
