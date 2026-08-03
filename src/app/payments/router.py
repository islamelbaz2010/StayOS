from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import (
    PaymentListItem,
    PaymentProofPresignRequest,
    PaymentProofPresignResponse,
    PaymentProofUpload,
    PaymentResponse,
    PaymentVerifyRequest,
)
from .services import (
    get_payment,
    get_payment_by_booking,
    list_guest_payments,
    list_pending_payments,
    presign_proof_upload,
    reject_payment,
    upload_proof,
    verify_payment,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/booking/{booking_id}", response_model=PaymentResponse)
async def get_payment_for_booking(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PaymentResponse:
    try:
        return await get_payment_by_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_detail(
    payment_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PaymentResponse:
    try:
        return await get_payment(session, user, payment_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("", response_model=list[PaymentListItem])
async def list_my_payments(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("guest")),
    session: AsyncSession = Depends(get_session),
) -> list[PaymentListItem]:
    try:
        return await list_guest_payments(session, user, limit, offset)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{payment_id}/proof/presign", response_model=PaymentProofPresignResponse)
async def presign_proof(
    payment_id: str,
    request: PaymentProofPresignRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PaymentProofPresignResponse:
    try:
        return await presign_proof_upload(
            session, user, payment_id, request.filename, request.content_type
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{payment_id}/proof", response_model=PaymentResponse)
async def submit_proof(
    payment_id: str,
    request: PaymentProofUpload,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PaymentResponse:
    try:
        return await upload_proof(session, user, payment_id, request.s3_key, request.url)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment_endpoint(
    payment_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> PaymentResponse:
    try:
        return await verify_payment(session, user, payment_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment_endpoint(
    payment_id: str,
    request: PaymentVerifyRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> PaymentResponse:
    try:
        reason = request.reject_reason or "Payment proof could not be verified"
        return await reject_payment(session, user, payment_id, reason)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/admin/queue", response_model=list[PaymentListItem])
async def payment_queue(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> list[PaymentListItem]:
    try:
        return await list_pending_payments(session, user, status, limit, offset)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
