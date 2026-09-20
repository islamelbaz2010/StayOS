from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from app.auth import dependencies as auth_dependencies
from app.auth.constants import StaffPermission, UserRole
from app.auth.models import StaffPermission as StaffPermissionGrant
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import (
    AuthorizationError,
    StayOSError,
    to_http_exception,
)

from .schemas import (
    AdminOverviewResponse,
    BookingFinancialContextResponse,
    DisputeContextResponse,
)
from .services import (
    get_admin_overview,
    get_booking_financial_context,
    get_dispute_context,
)

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_console_access(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Admin always; staff need at least one active permission grant —
    the overview is the console landing surface, so a staff member with
    any scope may open it. Section-level endpoints stay permission-gated."""
    if user.role == UserRole.ADMIN:
        return user
    if user.role == UserRole.STAFF:
        granted = await session.scalar(
            select(StaffPermissionGrant.id).where(
                StaffPermissionGrant.user_id == user.id,
                StaffPermissionGrant.is_active.is_(True),
            )
        )
        if granted is not None:
            return user
    raise AuthorizationError("Admin console access requires staff permissions")


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_overview(
    user: User = Depends(_require_console_access),
    session: AsyncSession = Depends(get_session),
) -> AdminOverviewResponse:
    try:
        return await get_admin_overview(session)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get(
    "/bookings/{booking_id}/financial",
    response_model=BookingFinancialContextResponse,
)
async def get_booking_financial(
    booking_id: str,
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            StaffPermission.PAYMENTS.value,
            allow_roles=(),
        )
    ),
    session: AsyncSession = Depends(get_session),
) -> BookingFinancialContextResponse:
    try:
        return await get_booking_financial_context(session, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get(
    "/disputes/{dispute_id}/context",
    response_model=DisputeContextResponse,
)
async def get_dispute_context_endpoint(
    dispute_id: str,
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            StaffPermission.DISPUTES.value,
            allow_roles=(),
        )
    ),
    session: AsyncSession = Depends(get_session),
) -> DisputeContextResponse:
    try:
        return await get_dispute_context(session, dispute_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
