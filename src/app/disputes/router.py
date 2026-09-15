"""Dispute workflow endpoints.

Guests/hosts file disputes against their bookings; admins (or staff with
the disputes permission) work the queue.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import StaffPermission
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from . import services as dispute_services
from .schemas import (
    DisputeAdminUpdate,
    DisputeCreate,
    DisputeListResponse,
    DisputeResponse,
)

router = APIRouter(prefix="/disputes", tags=["disputes"])


@router.post("", response_model=DisputeResponse, status_code=201)
async def post_dispute(
    request: DisputeCreate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DisputeResponse:
    try:
        result = await dispute_services.create_dispute(session, user, request)
        await session.commit()
        return result
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("", response_model=DisputeListResponse)
async def get_my_disputes(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DisputeListResponse:
    disputes = await dispute_services.list_my_disputes(session, user)
    return DisputeListResponse(data=disputes, total=len(disputes))


@router.get("/admin/all", response_model=DisputeListResponse)
async def get_admin_disputes(
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _: User = Depends(
        auth_dependencies.require_staff_permission(StaffPermission.DISPUTES)
    ),
    session: AsyncSession = Depends(get_session),
) -> DisputeListResponse:
    disputes, total = await dispute_services.list_disputes_admin(
        session, status=status, limit=limit, offset=offset
    )
    return DisputeListResponse(data=disputes, total=total)


@router.get("/{dispute_id}", response_model=DisputeResponse)
async def get_dispute(
    dispute_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DisputeResponse:
    try:
        return await dispute_services.get_dispute(session, user, dispute_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/admin/{dispute_id}", response_model=DisputeResponse)
async def patch_dispute_admin(
    dispute_id: str,
    request: DisputeAdminUpdate,
    user: User = Depends(
        auth_dependencies.require_staff_permission(StaffPermission.DISPUTES)
    ),
    session: AsyncSession = Depends(get_session),
) -> DisputeResponse:
    try:
        result = await dispute_services.update_dispute_admin(
            session, user, dispute_id, request
        )
        await session.commit()
        return result
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
