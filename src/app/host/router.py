from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from . import schemas as host_schemas
from . import services as host_services

router = APIRouter(prefix="/host", tags=["host"])


# ============================================================
# HOST TODAY
# ============================================================

@router.get("/today", response_model=host_schemas.HostTodayResponse)
async def get_host_today_endpoint(
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostTodayResponse:
    try:
        return await host_services.get_host_today(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# HOST RESERVATIONS
# ============================================================

@router.get("/reservations", response_model=list[host_schemas.HostReservationSummary])
async def list_host_reservations_endpoint(
    status: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> list[host_schemas.HostReservationSummary]:
    try:
        return await host_services.list_host_reservations(
            session, user, status, limit, offset
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/reservations/{booking_id}", response_model=host_schemas.HostReservationDetail)
async def get_host_reservation_detail_endpoint(
    booking_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostReservationDetail:
    try:
        return await host_services.get_host_reservation_detail(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# HOST EARNINGS
# ============================================================

@router.get("/earnings", response_model=host_schemas.HostEarningsSummary)
async def get_host_earnings_endpoint(
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostEarningsSummary:
    try:
        return await host_services.get_host_earnings(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# HOST CALENDAR
# ============================================================

@router.get("/calendar", response_model=host_schemas.HostCalendarResponse)
async def get_host_calendar_endpoint(
    check_in: date,
    check_out: date,
    unit_id: str | None = None,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostCalendarResponse:
    try:
        return await host_services.get_host_calendar(
            session, user, unit_id, check_in, check_out
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# LISTING READINESS
# ============================================================

@router.get("/listings/{unit_id}/readiness", response_model=host_schemas.ListingReadinessResponse)
async def get_listing_readiness_endpoint(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.ListingReadinessResponse:
    try:
        return await host_services.get_listing_readiness(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# HOST LISTING DETAIL (management view)
# ============================================================

@router.get("/listings/{unit_id}", response_model=host_schemas.HostListingDetail)
async def get_host_listing_detail_endpoint(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostListingDetail:
    try:
        return await host_services.get_host_listing_detail(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# CO-HOST MANAGEMENT
# ============================================================

@router.post("/listings/{unit_id}/co-hosts", response_model=host_schemas.CoHostResponse)
async def invite_co_host_endpoint(
    unit_id: str,
    request: host_schemas.CoHostInvite,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.CoHostResponse:
    try:
        return await host_services.invite_co_host(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/listings/{unit_id}/co-hosts", response_model=list[host_schemas.CoHostResponse])
async def list_co_hosts_endpoint(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> list[host_schemas.CoHostResponse]:
    try:
        return await host_services.list_co_hosts(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/listings/{unit_id}/co-hosts/{co_host_id}", response_model=host_schemas.CoHostResponse)
async def update_co_host_endpoint(
    unit_id: str,
    co_host_id: str,
    request: host_schemas.CoHostUpdate,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.CoHostResponse:
    try:
        return await host_services.update_co_host(session, user, unit_id, co_host_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.delete("/listings/{unit_id}/co-hosts/{co_host_id}")
async def remove_co_host_endpoint(
    unit_id: str,
    co_host_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await host_services.remove_co_host(session, user, unit_id, co_host_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


# ============================================================
# HOST PROFILE
# ============================================================

@router.get("/profile", response_model=host_schemas.HostProfileResponse)
async def get_host_profile_endpoint(
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostProfileResponse:
    try:
        return await host_services.get_host_profile(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/profile", response_model=host_schemas.HostProfileResponse)
async def update_host_profile_endpoint(
    request: host_schemas.HostProfileUpdate,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> host_schemas.HostProfileResponse:
    try:
        return await host_services.update_host_profile(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
