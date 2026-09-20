"""Admin staff-management endpoints (admin role only).

Staff management is intentionally NOT grantable to staff — only a full
admin can create accounts or change permission sets, so staff can never
escalate their own access.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth import staff as staff_services
from app.auth.models import User
from app.auth.constants import STAFF_ROLE_GROUPS
from app.auth.staff_schemas import (
    RoleGroupResponse,
    StaffCreateRequest,
    StaffPermissionsUpdate,
    StaffResponse,
    StaffUpdateRequest,
)
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

router = APIRouter(prefix="/admin/staff", tags=["admin-staff"])


@router.get("", response_model=list[StaffResponse])
async def list_staff_endpoint(
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> list[StaffResponse]:
    return await staff_services.list_staff(session)


@router.get("/role-groups", response_model=list[RoleGroupResponse])
async def list_role_groups_endpoint(
    _: User = Depends(auth_dependencies.require_role("admin")),
) -> list[RoleGroupResponse]:
    """FD-18: Job Role / Role Group → Permission Set templates. Applying a
    group grants its permission set; individual overrides still apply."""
    return [
        RoleGroupResponse(
            key=key,
            label_en=str(group["label_en"]),
            label_ar=str(group["label_ar"]),
            permissions=list(group["permissions"]),  # type: ignore[arg-type]
        )
        for key, group in STAFF_ROLE_GROUPS.items()
    ]


@router.post("", response_model=StaffResponse, status_code=201)
async def create_staff_endpoint(
    request: StaffCreateRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> StaffResponse:
    try:
        result = await staff_services.create_staff(session, user, request)
        await session.commit()
        return result
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{user_id}", response_model=StaffResponse)
async def update_staff_endpoint(
    user_id: str,
    request: StaffUpdateRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> StaffResponse:
    try:
        result = await staff_services.update_staff(session, user, user_id, request)
        await session.commit()
        return result
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.put("/{user_id}/permissions", response_model=StaffResponse)
async def set_permissions_endpoint(
    user_id: str,
    request: StaffPermissionsUpdate,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> StaffResponse:
    try:
        result = await staff_services.set_staff_permissions(
            session, user, user_id, request
        )
        await session.commit()
        return result
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
