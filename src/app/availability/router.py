from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import AvailabilityResponse, AvailabilityUpdateRequest, AvailabilityUpdateResponse
from .services import get_availability, update_availability

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("/{unit_id}", response_model=AvailabilityResponse)
async def get_unit_availability(
    unit_id: str,
    check_in: date,
    check_out: date,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> AvailabilityResponse:
    try:
        return await get_availability(session, user, unit_id, check_in, check_out)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{unit_id}", response_model=AvailabilityUpdateResponse)
async def patch_unit_availability(
    unit_id: str,
    request: AvailabilityUpdateRequest,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> AvailabilityUpdateResponse:
    try:
        rules = await update_availability(session, user, unit_id, request)
        return AvailabilityUpdateResponse(rules=rules)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
