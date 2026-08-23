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
    HostProfileResponse,
    HostReservationCalendarResponse,
    ListingCreate,
    ListingResponse,
    ListingSearchFilters,
    ListingSearchResponse,
    ListingUpdate,
    PhotoCreate,
    PhotoPresignRequest,
    PhotoPresignResponse,
    PhotoResponse,
)
from .services import (
    approve_listing,
    archive_listing,
    bulk_update_availability,
    bulk_update_pricing,
    create_host_calendar_rule,
    create_listing,
    create_photo,
    delete_host_calendar_rule,
    delete_photo,
    generate_photo_presigned_url,
    get_availability,
    get_host_dashboard,
    get_host_listing_detail,
    get_host_listings,
    get_host_profile,
    get_host_reservation_calendar,
    get_listing_detail,
    get_pending_listings,
    get_similar_listings,
    list_photos,
    publish_listing,
    reject_listing,
    search_listings,
    set_cover_photo,
    submit_for_review,
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


@router.get("/host/listings", response_model=list[ListingResponse])
async def get_host_listings_endpoint(
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> list[ListingResponse]:
    try:
        return await get_host_listings(session, user)
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


@router.get("/host/{unit_id}", response_model=ListingResponse)
async def get_host_listing_endpoint(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await get_host_listing_detail(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/profiles/host/{host_id}", response_model=HostProfileResponse)
async def get_host_profile_endpoint(
    host_id: str,
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> HostProfileResponse:
    try:
        return await get_host_profile(session, host_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{unit_id}/submit", response_model=ListingResponse)
async def post_submit_for_review(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await submit_for_review(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/admin/pending", response_model=list[ListingResponse])
async def get_admin_pending_endpoint(
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> list[ListingResponse]:
    try:
        return await get_pending_listings(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/admin/{unit_id}/approve", response_model=ListingResponse)
async def post_approve_listing(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await approve_listing(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/admin/{unit_id}/reject", response_model=ListingResponse)
async def post_reject_listing(
    unit_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> ListingResponse:
    try:
        return await reject_listing(session, user, unit_id)
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


@router.post("/{unit_id}/photos", response_model=PhotoResponse)
async def post_photo(
    unit_id: str,
    request: PhotoCreate,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> PhotoResponse:
    try:
        return await create_photo(session, user, unit_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{unit_id}/photos", response_model=list[PhotoResponse])
async def get_photos(
    unit_id: str,
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> list[PhotoResponse]:
    try:
        return await list_photos(session, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/{unit_id}/photos/{photo_id}/cover", response_model=PhotoResponse)
async def patch_cover_photo(
    unit_id: str,
    photo_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> PhotoResponse:
    try:
        return await set_cover_photo(session, user, unit_id, photo_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.delete("/{unit_id}/photos/{photo_id}")
async def delete_photo_endpoint(
    unit_id: str,
    photo_id: str,
    user: User = Depends(auth_dependencies.require_role("host", "admin")),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await delete_photo(session, user, unit_id, photo_id)
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


@router.get("/{unit_id}/similar", response_model=list[dict])
async def get_similar_listings_endpoint(
    unit_id: str,
    limit: int = 6,
    _: None = Depends(listings_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    try:
        return await get_similar_listings(session, unit_id, limit)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
