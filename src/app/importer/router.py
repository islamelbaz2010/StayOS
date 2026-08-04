from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.importer import services as import_services
from app.importer.schemas import (
    ImportConfirmRequest,
    ImportPreviewResponse,
    ImportSummaryResponse,
)
from app.shared.exceptions import StayOSError, to_http_exception

router = APIRouter(prefix="/import", tags=["import"])

MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    user: User = Depends(auth_dependencies.require_role("admin")),
) -> ImportPreviewResponse:
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise to_http_exception(
            StayOSError("File too large. Maximum 10MB.")
        )
    try:
        return await import_services.generate_preview(file.filename or "upload.csv", content)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    except Exception as exc:
        raise to_http_exception(StayOSError(str(exc))) from exc


@router.post("/confirm", response_model=ImportSummaryResponse)
async def confirm_import(
    request: ImportConfirmRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> ImportSummaryResponse:
    try:
        return await import_services.execute_import(session, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
