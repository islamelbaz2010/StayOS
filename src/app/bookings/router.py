# ruff: noqa: I001
# Import ordering differs between local Ruff (0.1.8: ``app`` sorts with
# third-party) and CI Ruff (0.16.1: ``app`` is first-party). No single
# ordering satisfies both, so I001 is suppressed for this file only.
from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    BookingCancellationPreview,
    BookingCancelRequest,
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    StayInfoResponse,
)
from .services import (
    cancel_booking,
    check_in_booking,
    check_out_booking,
    complete_booking,
    create_booking,
    get_booking,
    get_stay_info,
    list_guest_bookings,
    list_host_bookings,
    mark_guest_no_show,
    preview_booking_cancellation,
    update_booking,
)

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


@router.get("/guest", response_model=list[BookingResponse])
async def get_guest_bookings(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("guest")),
    session: AsyncSession = Depends(get_session),
) -> list[BookingResponse]:
    try:
        return await list_guest_bookings(session, user, status, limit, offset)
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


@router.get("/{booking_id}/cancellation-preview", response_model=BookingCancellationPreview)
async def get_cancellation_preview(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingCancellationPreview:
    try:
        return await preview_booking_cancellation(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def post_cancel_booking(
    booking_id: str,
    request: BookingCancelRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await cancel_booking(session, user, booking_id, request.reason)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{booking_id}/stay", response_model=StayInfoResponse)
async def get_stay_info_endpoint(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StayInfoResponse:
    try:
        return await get_stay_info(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
async def post_check_in(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await check_in_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{booking_id}/check-out", response_model=BookingResponse)
async def post_check_out(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await check_out_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{booking_id}/no-show", response_model=BookingResponse)
async def post_no_show(
    booking_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await mark_guest_no_show(session, user, booking_id)
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


@router.post("/{booking_id}/complete", response_model=BookingResponse)
async def complete_booking_endpoint(
    booking_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await complete_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
