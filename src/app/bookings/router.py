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
    BookingOfferCreate,
    BookingOfferResponse,
    BookingResponse,
    BookingTimelineResponse,
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
    get_booking_timeline,
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


# Custom-offer endpoints are declared before /{booking_id} so the literal
# "offers" segment is not captured as a booking id.

@router.post("/offers", response_model=BookingOfferResponse, status_code=201)
async def post_booking_offer(
    request: BookingOfferCreate,
    conversation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingOfferResponse:
    """Host sends a custom-priced stay offer inside a conversation."""
    from .offers import create_booking_offer

    try:
        return await create_booking_offer(session, user, conversation_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/offers", response_model=list[BookingOfferResponse])
async def get_conversation_offers(
    conversation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[BookingOfferResponse]:
    from .offers import list_conversation_offers

    try:
        return await list_conversation_offers(session, user, conversation_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/offers/{offer_id}/accept", response_model=BookingResponse)
async def post_accept_offer(
    offer_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    from .offers import accept_booking_offer

    try:
        return await accept_booking_offer(session, user, offer_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/offers/{offer_id}/decline", response_model=BookingOfferResponse)
async def post_decline_offer(
    offer_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookingOfferResponse:
    from .offers import decline_booking_offer

    try:
        return await decline_booking_offer(session, user, offer_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("", response_model=list[BookingResponse])
async def get_host_bookings(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            "operations", allow_roles=("host",)
        )
    ),
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
    user: User = Depends(auth_dependencies.require_staff_permission("operations")),
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
    user: User = Depends(auth_dependencies.require_staff_permission("operations")),
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    try:
        return await complete_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get(
    "/admin/{booking_id}/timeline", response_model=BookingTimelineResponse
)
async def get_booking_timeline_endpoint(
    booking_id: str,
    user: User = Depends(
        auth_dependencies.require_staff_permission("operations")
    ),
    session: AsyncSession = Depends(get_session),
) -> BookingTimelineResponse:
    """Admin/staff operational timeline — every recorded lifecycle,
    payment, messaging and dispute event for one booking."""
    try:
        return await get_booking_timeline(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
