from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import (
    PaymentConfirmationRequest,
    PromoApplyRequest,
    ReservationCancelRequest,
    ReservationCreate,
    ReservationListFilters,
    ReservationListResponse,
    ReservationResponse,
)
from .services import (
    apply_promo_code,
    cancel_reservation,
    check_in_reservation,
    check_out_reservation,
    confirm_reservation,
    create_reservation,
    get_reservation,
    list_reservations,
)

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationResponse)
async def post_reservation(
    request: ReservationCreate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await create_reservation(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("", response_model=ReservationListResponse)
async def get_reservations(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
    filters: ReservationListFilters = Depends(),
) -> ReservationListResponse:
    try:
        return await list_reservations(session, user, filters)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation_detail(
    reservation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await get_reservation(session, user, reservation_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{reservation_id}/confirm", response_model=ReservationResponse)
async def post_confirm_reservation(
    reservation_id: str,
    request: PaymentConfirmationRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await confirm_reservation(session, reservation_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
async def post_cancel_reservation(
    reservation_id: str,
    request: ReservationCancelRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await cancel_reservation(session, user, reservation_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{reservation_id}/check-in", response_model=ReservationResponse)
async def post_check_in(
    reservation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await check_in_reservation(session, user, reservation_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{reservation_id}/check-out", response_model=ReservationResponse)
async def post_check_out(
    reservation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await check_out_reservation(session, user, reservation_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{reservation_id}/promo", response_model=ReservationResponse)
async def post_apply_promo(
    reservation_id: str,
    request: PromoApplyRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReservationResponse:
    try:
        return await apply_promo_code(session, user, reservation_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
