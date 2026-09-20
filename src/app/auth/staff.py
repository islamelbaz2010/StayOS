"""Internal staff account management (admin-only).

Staff accounts are regular users with ``role = staff`` plus explicit
``auth.staff_permissions`` grants. They sign in through the normal OTP
flow — no passwords are created here. Staff management itself is
admin-only so staff can never escalate their own access.
"""

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth.constants import StaffPermission, UserRole
from app.auth.models import StaffPermission as StaffPermissionRow
from app.auth.models import User
from app.shared.exceptions import ConflictError, NotFoundError, ValidationError
from app.shared.outbox import write_event

from .staff_schemas import (
    StaffCreateRequest,
    StaffPermissionsUpdate,
    StaffResponse,
    StaffUpdateRequest,
)


def _valid_permissions() -> set[str]:
    return {p.value for p in StaffPermission}


async def has_permission(
    session: AsyncSession, user: User, permission: str
) -> bool:
    """True for admins (implicit) or staff holding an active grant."""
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.STAFF:
        return False
    result = await session.execute(
        select(StaffPermissionRow.id).where(
            StaffPermissionRow.user_id == user.id,
            StaffPermissionRow.permission == permission,
            StaffPermissionRow.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


async def _permissions_map(
    session: AsyncSession, user_ids: list[str]
) -> dict[str, list[str]]:
    if not user_ids:
        return {}
    result = await session.execute(
        select(StaffPermissionRow.user_id, StaffPermissionRow.permission).where(
            StaffPermissionRow.user_id.in_(user_ids),
            StaffPermissionRow.is_active.is_(True),
        )
    )
    out: dict[str, list[str]] = {}
    for user_id, permission in result.all():
        out.setdefault(user_id, []).append(permission)
    return out


def _to_response(user: User, permissions: list[str]) -> StaffResponse:
    return StaffResponse(
        id=user.id,
        phone_number=user.phone_number,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        permissions=sorted(permissions),
        created_at=user.created_at,
    )


async def list_staff(session: AsyncSession) -> list[StaffResponse]:
    result = await session.execute(
        select(User)
        .where(User.role.in_([UserRole.STAFF, UserRole.ADMIN]))
        .order_by(User.created_at)
    )
    users = list(result.scalars().all())
    perms = await _permissions_map(session, [u.id for u in users])
    return [_to_response(u, perms.get(u.id, [])) for u in users]


async def create_staff(
    session: AsyncSession, admin: User, request: StaffCreateRequest
) -> StaffResponse:
    invalid = set(request.permissions) - _valid_permissions()
    if invalid:
        raise ValidationError(f"Unknown permissions: {sorted(invalid)}")

    existing = await auth_repository.get_user_by_phone(session, request.phone_number)
    if existing is not None:
        if existing.role == UserRole.STAFF:
            raise ConflictError("A staff account already exists for this phone")
        raise ConflictError("Phone number already belongs to an existing account")

    email = request.email.strip().lower() if request.email else None
    if email:
        by_email = await auth_repository.get_user_by_email(session, email)
        if by_email is not None:
            raise ConflictError("Email already belongs to an existing account")

    user = await auth_repository.create_user(
        session,
        id=str(uuid4()),
        phone_number=request.phone_number,
        email=email,
        display_name=request.display_name,
        role=UserRole.STAFF,
        is_active=True,
        kyc_status="verified",  # internal accounts bypass guest KYC
    )

    for permission in sorted(set(request.permissions)):
        session.add(
            StaffPermissionRow(
                id=str(uuid4()),
                user_id=user.id,
                permission=permission,
                granted_by=admin.id,
            )
        )
    await session.flush()

    await write_event(
        session,
        aggregate_type="User",
        aggregate_id=UUID(user.id),
        event_type="staff.created",
        payload={
            "user_id": user.id,
            "created_by": admin.id,
            "permissions": sorted(set(request.permissions)),
        },
    )

    return _to_response(user, sorted(set(request.permissions)))


async def update_staff(
    session: AsyncSession, admin: User, user_id: str, request: StaffUpdateRequest
) -> StaffResponse:
    user = await auth_repository.get_user_by_id(session, user_id)
    if user is None or user.role not in (UserRole.STAFF, UserRole.ADMIN):
        raise NotFoundError("Staff account not found")

    if request.is_active is not None:
        if user.id == admin.id and request.is_active is False:
            raise ValidationError("Cannot deactivate your own account")
        user.is_active = request.is_active
    if request.display_name is not None:
        user.display_name = request.display_name
    session.add(user)
    await session.flush()

    await write_event(
        session,
        aggregate_type="User",
        aggregate_id=UUID(user.id),
        event_type="staff.updated",
        payload={
            "user_id": user.id,
            "updated_by": admin.id,
            "is_active": user.is_active,
        },
    )

    perms = await _permissions_map(session, [user.id])
    return _to_response(user, perms.get(user.id, []))


async def set_staff_permissions(
    session: AsyncSession,
    admin: User,
    user_id: str,
    request: StaffPermissionsUpdate,
) -> StaffResponse:
    invalid = set(request.permissions) - _valid_permissions()
    if invalid:
        raise ValidationError(f"Unknown permissions: {sorted(invalid)}")

    user = await auth_repository.get_user_by_id(session, user_id)
    if user is None or user.role != UserRole.STAFF:
        raise NotFoundError("Staff account not found")

    result = await session.execute(
        select(StaffPermissionRow).where(StaffPermissionRow.user_id == user.id)
    )
    existing = {row.permission: row for row in result.scalars().all()}
    desired = set(request.permissions)

    for permission, row in existing.items():
        row.is_active = permission in desired
        session.add(row)
    for permission in desired - set(existing):
        session.add(
            StaffPermissionRow(
                id=str(uuid4()),
                user_id=user.id,
                permission=permission,
                granted_by=admin.id,
            )
        )
    await session.flush()

    await write_event(
        session,
        aggregate_type="User",
        aggregate_id=UUID(user.id),
        event_type="staff.permissions_updated",
        payload={
            "user_id": user.id,
            "updated_by": admin.id,
            "permissions": sorted(desired),
        },
    )

    return _to_response(user, sorted(desired))
