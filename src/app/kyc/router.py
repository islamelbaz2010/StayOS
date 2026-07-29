from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.kyc import schemas as kyc_schemas
from app.kyc import services as kyc_services
from app.shared.exceptions import StayOSError, to_http_exception

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
    )


@router.post("/documents/{document_id}/process", response_model=kyc_schemas.KycDocumentResponse)
async def process_kyc(
    document_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> kyc_schemas.KycDocumentResponse:
    try:
        document = await kyc_services.process_kyc_document(session, document_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return kyc_schemas.KycDocumentResponse.model_validate(document)
