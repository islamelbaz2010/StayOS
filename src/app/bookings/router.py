from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import BookingCreate, BookingResponse, BookingUpdate
from .services import create_booking, get_booking, list_host_bookings, update_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse)
async def post_booking(
    request: BookingCreate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await create_booking(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("", response_model=list[BookingResponse])
async def get_host_bookings(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> list[BookingResponse]:
    try:
        return await list_host_bookings(session, user, status, limit, offset)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_detail(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await get_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{booking_id}", response_model=BookingResponse)
async def patch_booking(
    booking_id: str,
    request: BookingUpdate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await update_booking(session, user, booking_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
