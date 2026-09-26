from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import StaffPermission, UserRole
from app.auth.models import StaffPermission as StaffPermissionGrant
from app.auth.models import User
from app.database import get_session
from app.finance import adjustments as finance_adjustments
from app.shared.exceptions import (
    AuthorizationError,
    StayOSError,
    to_http_exception,
)

from .schemas import (
    AdjustmentCreateRequest,
    AdjustmentDecisionRequest,
    AdjustmentResponse,
    AdminListingListItem,
    AdminOverviewResponse,
    AdminUserListItem,
    BookingFinancialContextResponse,
    DisputeContextResponse,
)
from .services import (
    get_admin_overview,
    get_booking_financial_context,
    get_dispute_context,
    list_admin_listings,
    list_admin_users,
)

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_console_access(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Admin always; staff need at least one active permission grant —
    the overview is the console landing surface, so a staff member with
    any scope may open it. Section-level endpoints stay permission-gated."""
    if user.role == UserRole.ADMIN:
        return user
    if user.role == UserRole.STAFF:
        granted = await session.scalar(
            select(StaffPermissionGrant.id).where(
                StaffPermissionGrant.user_id == user.id,
                StaffPermissionGrant.is_active.is_(True),
            )
        )
        if granted is not None:
            return user
    raise AuthorizationError("Admin console access requires staff permissions")


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_overview(
    user: User = Depends(_require_console_access),
    session: AsyncSession = Depends(get_session),
) -> AdminOverviewResponse:
    try:
        return await get_admin_overview(session)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/users", response_model=list[AdminUserListItem])
async def get_users(
    role: str | None = Query(default=None),
    kyc_status: str | None = Query(default=None),
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> list[AdminUserListItem]:
    return await list_admin_users(session, role=role, kyc_status=kyc_status)


@router.get("/listings", response_model=list[AdminListingListItem])
async def get_listings(
    status: str | None = Query(default=None),
    governorate: str | None = Query(default=None),
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            StaffPermission.LISTINGS.value,
            allow_roles=(),
        )
    ),
    session: AsyncSession = Depends(get_session),
) -> list[AdminListingListItem]:
    return await list_admin_listings(
        session, status=status, governorate=governorate
    )


@router.get(
    "/bookings/{booking_id}/financial",
    response_model=BookingFinancialContextResponse,
)
async def get_booking_financial(
    booking_id: str,
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            StaffPermission.PAYMENTS.value,
            allow_roles=(),
        )
    ),
    session: AsyncSession = Depends(get_session),
) -> BookingFinancialContextResponse:
    try:
        return await get_booking_financial_context(session, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


_PAYMENTS_PERMISSION = auth_dependencies.require_staff_permission(
    StaffPermission.PAYMENTS.value,
    allow_roles=(),
)


def _to_adjustment_response(adjustment) -> AdjustmentResponse:
    return AdjustmentResponse(
        id=adjustment.id,
        booking_id=adjustment.booking_id,
        user_id=adjustment.user_id,
        listing_id=adjustment.listing_id,
        adjustment_type=adjustment.adjustment_type,
        category=adjustment.category,
        amount_egp=adjustment.amount_egp,
        reason=adjustment.reason,
        internal_note=adjustment.internal_note,
        customer_note=adjustment.customer_note,
        status=adjustment.status,
        requested_by_id=adjustment.requested_by_id,
        created_by_id=adjustment.created_by_id,
        decided_by_id=adjustment.decided_by_id,
        decided_at=adjustment.decided_at,
        applied_at=adjustment.applied_at,
        financial_transaction_id=adjustment.financial_transaction_id,
        created_at=adjustment.created_at,
        updated_at=adjustment.updated_at,
    )


@router.get("/adjustments", response_model=list[AdjustmentResponse])
async def list_adjustments_endpoint(
    status: str | None = Query(default=None),
    adjustment_type: str | None = Query(default=None),
    booking_id: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(_PAYMENTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> list[AdjustmentResponse]:
    rows = await finance_adjustments.list_adjustments(
        session,
        status=status,
        adjustment_type=adjustment_type,
        booking_id=booking_id,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    return [_to_adjustment_response(r) for r in rows]


@router.post("/adjustments", response_model=AdjustmentResponse, status_code=201)
async def create_adjustment_endpoint(
    body: AdjustmentCreateRequest,
    user: User = Depends(_PAYMENTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> AdjustmentResponse:
    try:
        adjustment = await finance_adjustments.create_adjustment(
            session,
            actor_id=user.id,
            adjustment_type=body.adjustment_type,
            category=body.category,
            amount_egp=body.amount_egp,
            reason=body.reason,
            booking_id=body.booking_id,
            user_id=body.user_id,
            listing_id=body.listing_id,
            requested_by_id=body.requested_by_id,
            internal_note=body.internal_note,
            customer_note=body.customer_note,
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return _to_adjustment_response(adjustment)


@router.post(
    "/adjustments/{adjustment_id}/decide", response_model=AdjustmentResponse
)
async def decide_adjustment_endpoint(
    adjustment_id: str,
    body: AdjustmentDecisionRequest,
    user: User = Depends(_PAYMENTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> AdjustmentResponse:
    try:
        adjustment = await finance_adjustments.decide_adjustment(
            session, adjustment_id, actor_id=user.id, approve=body.approve
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return _to_adjustment_response(adjustment)


@router.post(
    "/adjustments/{adjustment_id}/apply", response_model=AdjustmentResponse
)
async def apply_adjustment_endpoint(
    adjustment_id: str,
    user: User = Depends(_PAYMENTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> AdjustmentResponse:
    try:
        adjustment = await finance_adjustments.apply_adjustment(
            session, adjustment_id
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return _to_adjustment_response(adjustment)


@router.post(
    "/adjustments/{adjustment_id}/cancel", response_model=AdjustmentResponse
)
async def cancel_adjustment_endpoint(
    adjustment_id: str,
    user: User = Depends(_PAYMENTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> AdjustmentResponse:
    try:
        adjustment = await finance_adjustments.cancel_adjustment(
            session, adjustment_id
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return _to_adjustment_response(adjustment)


@router.get(
    "/disputes/{dispute_id}/context",
    response_model=DisputeContextResponse,
)
async def get_dispute_context_endpoint(
    dispute_id: str,
    user: User = Depends(
        auth_dependencies.require_staff_permission(
            StaffPermission.DISPUTES.value,
            allow_roles=(),
        )
    ),
    session: AsyncSession = Depends(get_session),
) -> DisputeContextResponse:
    try:
        return await get_dispute_context(session, dispute_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
