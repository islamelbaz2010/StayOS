import hashlib
import json
import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.kyc import schemas as kyc_schemas
from app.kyc import services as kyc_services
from app.shared import redis as redis_state
from app.shared.exceptions import (
    AuthenticationError,
    StayOSError,
    to_http_exception,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyc", tags=["kyc"])


@router.post("/initiate", response_model=kyc_schemas.KycInitiateResponse)
async def initiate_kyc(
    request: kyc_schemas.KycInitiateRequest,
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycInitiateResponse:
    try:
        return await kyc_services.initiate_kyc_document(session, user, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/documents/{document_id}/submit", response_model=kyc_schemas.KycSubmitResponse)
async def submit_kyc(
    document_id: str,
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycSubmitResponse:
    try:
        document = await kyc_services.submit_kyc_document(
            session, user, document_id
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return kyc_schemas.KycSubmitResponse(
        document_id=document.id, status=document.status
    )


@router.get("/status", response_model=kyc_schemas.KycStatusResponse)
async def kyc_status(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycStatusResponse:
    from app.kyc import repository as kyc_repository

    documents = await kyc_repository.get_kyc_documents_by_user_id(session, user.id)
    return kyc_schemas.KycStatusResponse(
        user_id=user.id,
        kyc_status=user.kyc_status,
        documents=[
            kyc_schemas.KycDocumentResponse.model_validate(d) for d in documents
        ],
        verification_mode=kyc_services.verification_mode(),
        automated_available=kyc_services.automated_verification_available(),
        required_sides={
            doc_type: list(sides)
            for doc_type, sides in kyc_services.DOCUMENT_REQUIRED_SIDES.items()
        },
    )


@router.post(
    "/verification/session",
    response_model=kyc_schemas.KycVerificationSessionResponse,
)
async def verification_session(
    user: User = Depends(auth_dependencies.require_active_user),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycVerificationSessionResponse:
    """Mint a provider SDK session, or report the manual fallback mode."""
    try:
        return await kyc_services.create_verification_session(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


async def _acquire_kyc_webhook_idempotency(key: str) -> bool:
    client = redis_state.redis_client
    if client is None:
        # In production Redis must be available; tests may leave it mocked.
        return True
    result = await client.set(f"kyc_webhook:{key}", "1", nx=True, ex=86400 * 7)
    return bool(result)


@router.post(
    "/webhooks/sumsub", response_model=kyc_schemas.KycWebhookResponse
)
async def sumsub_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycWebhookResponse:
    """Sumsub verification webhook — server-authoritative result channel.

    The browser's "finished" state is never trusted: the signature-verified
    webhook is the only path that mutates verification state.
    """
    from app.kyc.providers.sumsub import SumsubProvider

    body = await request.body()
    provider = SumsubProvider()
    if not provider.verify_webhook_signature(dict(request.headers), body):
        raise to_http_exception(AuthenticationError("Invalid webhook signature"))

    try:
        payload = json.loads(body)
    except ValueError:
        raise to_http_exception(AuthenticationError("Invalid webhook payload"))

    if not await _acquire_kyc_webhook_idempotency(
        hashlib.sha256(body).hexdigest()
    ):
        return kyc_schemas.KycWebhookResponse(message="already processed")

    event = provider.parse_webhook(payload)
    if event is None:
        return kyc_schemas.KycWebhookResponse(message="ignored")

    message = await kyc_services.apply_provider_event(session, event)
    return kyc_schemas.KycWebhookResponse(message=message)


@router.get("/pending", response_model=kyc_schemas.KycPendingListResponse)
async def list_pending_kyc(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_staff_permission("kyc")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycPendingListResponse:
    """Manual review queue plus read-only provider activity.

    ``data`` holds only actionable items — manual upload submissions and
    provider escalations (``manual_review``). ``inflight`` lists
    provider-managed verifications still owned by the provider so staff
    can see in-progress automated activity without being offered fake
    Approve/Reject controls on decisions the provider owns."""
    from app.kyc import repository as kyc_repository

    documents = await kyc_repository.get_pending_kyc_documents(
        session, limit=limit, offset=offset
    )
    inflight = await kyc_repository.get_provider_inflight_kyc_documents(
        session, limit=limit
    )
    return kyc_schemas.KycPendingListResponse(
        data=[kyc_schemas.KycDocumentResponse.model_validate(d) for d in documents],
        total=len(documents),
        inflight=[
            kyc_schemas.KycDocumentResponse.model_validate(d) for d in inflight
        ],
    )


@router.post("/documents/{document_id}/process", response_model=kyc_schemas.KycDocumentResponse)
async def process_kyc(
    document_id: str,
    user: User = Depends(auth_dependencies.require_staff_permission("kyc")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycDocumentResponse:
    try:
        document = await kyc_services.process_kyc_document(session, document_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return kyc_schemas.KycDocumentResponse.model_validate(document)


@router.get("/documents/{document_id}/images", response_model=kyc_schemas.KycImageDownloadResponse)
async def download_kyc_images(
    document_id: str,
    user: User = Depends(auth_dependencies.require_staff_permission("kyc")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycImageDownloadResponse:
    try:
        return await kyc_services.get_kyc_document_image_downloads(session, document_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/documents/{document_id}/approve", response_model=kyc_schemas.KycDocumentResponse)
async def approve_kyc(
    document_id: str,
    request: kyc_schemas.KycApproveRequest,
    user: User = Depends(auth_dependencies.require_staff_permission("kyc")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycDocumentResponse:
    try:
        document = await kyc_services.manual_approve_kyc(
            session, document_id, legal_name=request.legal_name
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return kyc_schemas.KycDocumentResponse.model_validate(document)


@router.post("/documents/{document_id}/reject", response_model=kyc_schemas.KycDocumentResponse)
async def reject_kyc(
    document_id: str,
    request: kyc_schemas.KycRejectRequest,
    user: User = Depends(auth_dependencies.require_staff_permission("kyc")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycDocumentResponse:
    try:
        document = await kyc_services.manual_reject_kyc(
            session, document_id, reason=request.reason
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return kyc_schemas.KycDocumentResponse.model_validate(document)
