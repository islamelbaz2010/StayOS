"""Server-side authorization for host operations.

A user can operate on a unit if they are:
1. The unit owner (``unit.host_id == user.id``)
2. An admin (``user.role == ADMIN``)
3. An active co-host with the required permission scope

This module is the single source of truth for host authorization. Every
host-facing service calls ``assert_can_manage_unit`` or
``assert_can_access_unit`` before touching unit/booking data.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import UserRole
from app.auth.models import User
from app.listings.cohost_models import UnitCoHost
from app.listings.models import Unit
from app.shared.exceptions import AuthorizationError

from .constants import CoHostPermissionScope


async def get_managed_unit_ids(
    session: AsyncSession, user: User
) -> list[str]:
    """Return all unit IDs the user can operate (owned + co-hosted)."""
    # Owned units
    owned_result = await session.execute(
        select(Unit.id).where(Unit.host_id == user.id)
    )
    unit_ids = [row[0] for row in owned_result.all()]

    if user.role == UserRole.ADMIN:
        all_result = await session.execute(select(Unit.id))
        unit_ids = [row[0] for row in all_result.all()]

    # Co-hosted units
    cohost_result = await session.execute(
        select(UnitCoHost.unit_id).where(
            UnitCoHost.co_host_user_id == user.id,
            UnitCoHost.is_active.is_(True),
        )
    )
    unit_ids.extend(row[0] for row in cohost_result.all())

    return list(set(unit_ids))


async def get_unit_permission_scope(
    session: AsyncSession, user: User, unit: Unit
) -> str | None:
    """Return the user's permission scope for a unit, or None if no access.

    Returns:
    - "owner" if the user owns the unit
    - "admin" if the user is an admin
    - The co-host's permission_scope if they are an active co-host
    - None if the user has no access
    """
    if unit.host_id == user.id:
        return "owner"
    if user.role == UserRole.ADMIN:
        return "admin"
    result = await session.execute(
        select(UnitCoHost.permission_scope).where(
            UnitCoHost.unit_id == unit.id,
            UnitCoHost.co_host_user_id == user.id,
            UnitCoHost.is_active.is_(True),
        )
    )
    row = result.scalar_one_or_none()
    return row


async def assert_can_access_unit(
    session: AsyncSession, user: User, unit: Unit
) -> str:
    """Assert the user can access the unit. Returns their permission scope."""
    scope = await get_unit_permission_scope(session, user, unit)
    if scope is None:
        raise AuthorizationError("You do not have access to this property")
    return scope


async def assert_can_manage_unit(
    session: AsyncSession, user: User, unit: Unit
) -> str:
    """Assert the user can manage the unit (any scope). Returns scope."""
    return await assert_can_access_unit(session, user, unit)


async def assert_can_edit_listing(
    session: AsyncSession, user: User, unit: Unit
) -> None:
    """Only owner, admin, or full_access co-host can edit listing details."""
    scope = await assert_can_access_unit(session, user, unit)
    if scope in ("owner", "admin", CoHostPermissionScope.FULL_ACCESS):
        return
    raise AuthorizationError("You do not have permission to edit this listing")


async def assert_can_manage_calendar(
    session: AsyncSession, user: User, unit: Unit
) -> None:
    """Owner, admin, and all co-host scopes can manage calendar."""
    await assert_can_access_unit(session, user, unit)


async def assert_can_message(
    session: AsyncSession, user: User, unit: Unit
) -> None:
    """Owner, admin, full_access and calendar_messaging co-hosts can message."""
    scope = await assert_can_access_unit(session, user, unit)
    if scope in (
        "owner",
        "admin",
        CoHostPermissionScope.FULL_ACCESS,
        CoHostPermissionScope.CALENDAR_MESSAGING,
    ):
        return
    raise AuthorizationError("You do not have permission to message guests for this property")


async def assert_owner_or_admin(user: User, unit: Unit) -> None:
    """Only the owner or an admin — co-hosts cannot do this."""
    if unit.host_id == user.id:
        return
    if user.role == UserRole.ADMIN:
        return
    raise AuthorizationError("Only the property owner or an admin can do this")
