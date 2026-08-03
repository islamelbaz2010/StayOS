from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.security.rate_limit import listings_rate_limit
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import (
    AvailabilityResponse,
    BulkAvailabilityRequest,
    BulkPricingRequest,
    CalendarRuleCreate,
    CalendarRuleResponse,
    CalendarRuleUpdate,
    HostDashboardStats,
    HostReservationCalendarResponse,
    ListingCreate,
    ListingResponse,
    ListingSearchFilters,
    ListingSearchResponse,
    ListingUpdate,
    PhotoPresignRequest,
    PhotoPresignResponse,
)
from .services import (
    archive_listing,
    bulk_update_availability,
    bulk_update_pricing,
    create_host_calendar_rule,
    create_listing,
    delete_host_calendar_rule,
    generate_photo_presigned_url,
    get_availability,
    get_host_dashboard,
    get_host_reservation_calendar,
    get_listing_detail,
    publish_listing,
    search_listings,
    unpublish_listing,
    update_host_calendar_rule,
    update_listing,
)

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ListingSearchResponse)
async def list_listings(
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
    filters: ListingSearchFilters = Depends(),
) -> ListingSearchResponse:
    try:
        return await search_listings(session, filters)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("", response_model=ListingResponse)
async def post_listing(
    request: ListingCreate,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await create_listing(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{unit_id}", response_model=ListingResponse)
async def get_listing(
    unit_id: str,
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await get_listing_detail(session, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{unit_id}", response_model=ListingResponse)
async def patch_listing(
    unit_id: str,
    request: ListingUpdate,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await update_listing(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{unit_id}/availability", response_model=AvailabilityResponse)
async def get_listing_availability(
    unit_id: str,
    check_in: date,
    check_out: date,
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> AvailabilityResponse:
    try:
        return await get_availability(session, unit_id, check_in, check_out)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/publish", response_model=ListingResponse)
async def post_publish_listing(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await publish_listing(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/unpublish", response_model=ListingResponse)
async def post_unpublish_listing(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await unpublish_listing(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/archive", response_model=ListingResponse)
async def post_archive_listing(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await archive_listing(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/photos/presign", response_model=PhotoPresignResponse)
async def presign_photo_upload(
    unit_id: str,
    request: PhotoPresignRequest,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> PhotoPresignResponse:
    try:
        return await generate_photo_presigned_url(
            session, user, unit_id, request.filename, request.content_type
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/calendar", response_model=CalendarRuleResponse)
async def post_host_calendar_rule(
    unit_id: str,
    request: CalendarRuleCreate,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> CalendarRuleResponse:
    try:
        return await create_host_calendar_rule(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{unit_id}/calendar/{rule_id}", response_model=CalendarRuleResponse)
async def patch_host_calendar_rule(
    unit_id: str,
    rule_id: str,
    request: CalendarRuleUpdate,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> CalendarRuleResponse:
    try:
        return await update_host_calendar_rule(session, user, unit_id, rule_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.delete("/{unit_id}/calendar/{rule_id}")
async def delete_host_calendar_rule_endpoint(
    unit_id: str,
    rule_id: str,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await delete_host_calendar_rule(session, user, unit_id, rule_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/calendar/bulk-availability", response_model=list[CalendarRuleResponse])
async def post_bulk_availability(
    unit_id: str,
    request: BulkAvailabilityRequest,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> list[CalendarRuleResponse]:
    try:
        return await bulk_update_availability(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/calendar/bulk-pricing", response_model=list[CalendarRuleResponse])
async def post_bulk_pricing(
    unit_id: str,
    request: BulkPricingRequest,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> list[CalendarRuleResponse]:
    try:
        return await bulk_update_pricing(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/host/dashboard", response_model=HostDashboardStats)
async def get_host_dashboard_endpoint(
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> HostDashboardStats:
    try:
        return await get_host_dashboard(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/host/reservations", response_model=HostReservationCalendarResponse)
async def get_host_reservations_endpoint(
    check_in: date,
    check_out: date,
    unit_id: str | None = None,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> HostReservationCalendarResponse:
    try:
        return await get_host_reservation_calendar(
            session, user, unit_id, check_in, check_out
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
