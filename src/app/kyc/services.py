import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import boto3
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth.constants import KycDocumentType, KycStatus
from app.auth.models import User
from app.config import settings
from app.kyc import repository as kyc_repository
from app.kyc import schemas as kyc_schemas
from app.kyc.models import KycDocument
from app.kyc.providers import (
    ProviderEvent,
    ProviderOutcome,
    ProviderUnavailableError,
    get_verification_provider,
)
from app.kyc.schemas import KycInitiateRequest, KycInitiateResponse, KycUploadUrls
from app.shared.exceptions import (
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)

_UPLOAD_TTL_SECONDS = 900
logger = logging.getLogger(__name__)

_DOWNLOAD_TTL_SECONDS = 900

# Manual-upload capture contract per document type. Provider-managed
# verification owns document-side requirements per country/document, so
# StayOS must not assume a universal Front/Back/Selfie layout.
DOCUMENT_REQUIRED_SIDES: dict[str, tuple[str, ...]] = {
    KycDocumentType.PASSPORT: ("front", "selfie"),
    KycDocumentType.NATIONAL_ID: ("front", "back", "selfie"),
    KycDocumentType.DRIVING_LICENSE: ("front", "back", "selfie"),
    KycDocumentType.RESIDENCE_PERMIT: ("front", "back", "selfie"),
}


def _require_storage_config() -> None:
    missing = [
        name
        for name in (
            "S3_KYC_BUCKET",
            "AWS_REGION",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
        )
        if not getattr(settings, name)
    ]
    if missing:
        logger.error(
            "KYC document storage is not configured (missing: %s)",
            ", ".join(missing),
        )
        raise ServiceUnavailableError(
            "Document upload is temporarily unavailable. Please try again later."
        )


def _s3_client() -> Any:
    _require_storage_config()
    from app.shared.storage import s3_client

    # Per-bucket credentials (Railway/Tigris) and the S3-compatible
    # endpoint live in the shared client — a bare boto3.client would
    # presign against AWS S3 and every upload PUT would fail.
    return s3_client(settings.S3_KYC_BUCKET)


def _textract_client() -> Any:
    return boto3.client(
        "textract",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _rekognition_client() -> Any:
    return boto3.client(
        "rekognition",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _kyc_object_key(user_id: str, document_id: str, side: str) -> str:
    return f"kyc/{user_id}/{document_id}/{side}.jpg"


def _generate_presigned_put_url(bucket: str, key: str, content_type: str) -> str:
    client = _s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=_UPLOAD_TTL_SECONDS,
    )


def _generate_presigned_get_url(bucket: str, key: str) -> str:
    client = _s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=_DOWNLOAD_TTL_SECONDS,
    )


async def initiate_kyc_document(
    session: AsyncSession,
    user: User,
    request: KycInitiateRequest,
) -> KycInitiateResponse:
    # ``provider_managed`` rows are created by verification sessions only —
    # a client must not initiate a manual upload under that type.
    if request.document_type == KycDocumentType.PROVIDER_MANAGED:
        raise ValidationError("Unsupported document type for manual upload")

    # Fail fast before writing a KYC document row when storage is not
    # configured — otherwise presigning crashes (500) and orphans the row.
    _require_storage_config()

    # ``user.account`` is a lazy relationship — accessing it here would run
    # sync IO inside the async session (MissingGreenlet). Fetch explicitly.
    account = await auth_repository.get_account_by_user_id(session, user.id)
    document = await kyc_repository.create_kyc_document(
        session,
        user_id=user.id,
        document_type=request.document_type,
        document_number=request.document_number,
        account_id=account.id if account else None,
    )

    front_key = _kyc_object_key(user.id, document.id, "front")
    back_key = _kyc_object_key(user.id, document.id, "back")
    selfie_key = _kyc_object_key(user.id, document.id, "selfie")

    front_url = _generate_presigned_put_url(
        settings.S3_KYC_BUCKET, front_key, request.front_content_type
    )
    back_url = _generate_presigned_put_url(
        settings.S3_KYC_BUCKET, back_key, request.back_content_type
    )
    selfie_url = _generate_presigned_put_url(
        settings.S3_KYC_BUCKET, selfie_key, request.selfie_content_type
    )

    await kyc_repository.update_kyc_document(
        session,
        document,
        front_image_key=front_key,
        back_image_key=back_key,
        selfie_image_key=selfie_key,
    )

    expires_at = datetime.now(UTC) + timedelta(seconds=_UPLOAD_TTL_SECONDS)
    return KycInitiateResponse(
        document_id=document.id,
        upload_urls=KycUploadUrls(front=front_url, back=back_url, selfie=selfie_url),
        expires_at=expires_at,
    )


async def get_kyc_document_image_downloads(
    session: AsyncSession,
    document_id: str,
) -> kyc_schemas.KycImageDownloadResponse:
    document = await kyc_repository.get_kyc_document_by_id(session, document_id)
    if document is None:
        raise NotFoundError("KYC document not found")

    def url(key: str | None) -> str | None:
        # Presigned GETs generate regardless of object existence — only
        # offer links for objects that were actually uploaded (initiate
        # records the optional back-side key before any PUT happens).
        if not key or not _object_exists(settings.S3_KYC_BUCKET, key):
            return None
        return _generate_presigned_get_url(settings.S3_KYC_BUCKET, key)

    return kyc_schemas.KycImageDownloadResponse(
        front_url=url(document.front_image_key),
        back_url=url(document.back_image_key),
        selfie_url=url(document.selfie_image_key),
    )


def _object_exists(bucket: str, key: str) -> bool:
    """HEAD the object to confirm the browser-side PUT actually landed."""
    if settings.ENVIRONMENT == "test":
        # No storage in unit tests; existence checks are covered by the
        # upload-path integration tests.
        return True
    try:
        _s3_client().head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False


def _queue_kyc_processing(document_id: str) -> None:
    from app.celery_app import celery_app

    celery_app.send_task(
        "app.kyc.tasks.process_kyc_document",
        args=[document_id],
    )


async def submit_kyc_document(
    session: AsyncSession, user: User, document_id: str
) -> KycDocument:
    document = await kyc_repository.get_kyc_document_by_id(session, document_id)
    if document is None or document.user_id != user.id:
        raise ValidationError("KYC document not found")

    # A key recorded at initiate is only a claim — the browser may never
    # have PUT the object (e.g. the optional back side). Verify each
    # claimed object and clear keys that were never uploaded so admin
    # review and downstream consumers see exactly what was submitted.
    bucket = settings.S3_KYC_BUCKET
    for field_name in ("front_image_key", "back_image_key", "selfie_image_key"):
        key = getattr(document, field_name)
        if key and not _object_exists(bucket, key):
            await kyc_repository.update_kyc_document(
                session, document, **{field_name: None}
            )

    required_sides = DOCUMENT_REQUIRED_SIDES.get(
        document.document_type, ("front", "selfie")
    )
    missing = [
        side
        for side in required_sides
        if not getattr(document, f"{side}_image_key")
    ]
    if missing:
        raise ValidationError(
            f"Missing required image uploads: {', '.join(missing)}"
        )

    updated = await kyc_repository.update_kyc_document(
        session, document, status="pending"
    )
    await auth_repository.update_user(
        session, user, kyc_status="pending"
    )

    _queue_kyc_processing(document.id)
    return updated


def _parse_textract_id_fields(response: dict[str, Any]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for identity in response.get("IdentityDocuments", []):
        for field in identity.get("IdentityDocumentFields", []):
            field_type = field.get("Type", {})
            value = field.get("ValueDetection", {})
            name = str(field_type.get("Text", "")).upper().replace(" ", "_")
            text = str(value.get("Text", ""))
            if name and text:
                fields[name] = text
    return fields


async def _analyze_id_document(key: str) -> dict[str, str]:
    client = _textract_client()
    response = await asyncio.to_thread(
        client.analyze_id,
        DocumentPages=[{"S3Object": {"Bucket": settings.S3_KYC_BUCKET, "Name": key}}],
    )
    return _parse_textract_id_fields(response)


async def _compare_faces(selfie_key: str, id_key: str) -> float:
    client = _rekognition_client()
    response = await asyncio.to_thread(
        client.compare_faces,
        SourceImage={"S3Object": {"Bucket": settings.S3_KYC_BUCKET, "Name": selfie_key}},
        TargetImage={"S3Object": {"Bucket": settings.S3_KYC_BUCKET, "Name": id_key}},
    )
    matches = response.get("FaceMatches", [])
    if not matches:
        return 0.0
    return float(matches[0].get("Similarity", 0.0))


async def process_kyc_document(
    session: AsyncSession, document_id: str
) -> KycDocument:
    document = await kyc_repository.get_kyc_document_by_id(session, document_id)
    if document is None:
        raise ValidationError("KYC document not found")

    if not document.front_image_key or not document.selfie_image_key:
        raise ValidationError("Missing required image uploads")

    try:
        fields = await _analyze_id_document(document.front_image_key)
        similarity = await _compare_faces(
            document.selfie_image_key, document.front_image_key
        )
    except Exception:
        # AWS-native verification (Textract/Rekognition) requires AWS
        # credentials the deployment may not have — e.g. S3-compatible
        # object storage creds. Leave the document pending so the staff
        # review queue picks it up instead of retry-storming forever.
        logger.warning(
            "KYC auto-verification unavailable for document %s; "
            "leaving pending for staff review",
            document_id,
            exc_info=True,
        )
        return document

    first_name = fields.get("FIRST_NAME", "")
    last_name = fields.get("LAST_NAME", "")
    legal_name = f"{first_name} {last_name}".strip()
    document_number = fields.get("DOCUMENT_NUMBER")

    verification_payload = {
        "textract_fields": fields,
        "face_similarity": similarity,
    }

    if legal_name and document_number and similarity >= 90.0:
        status = "verified"
        verified_at = datetime.now(UTC)
        rejected_at = None
        rejection_reason = None
    else:
        status = "rejected"
        verified_at = None
        rejected_at = datetime.now(UTC)
        rejection_reason = "Unable to verify identity document or face mismatch"

    updated = await kyc_repository.update_kyc_document(
        session,
        document,
        status=status,
        legal_name=legal_name or None,
        document_number=document_number,
        verification_payload=verification_payload,
        verified_at=verified_at,
        rejected_at=rejected_at,
        rejection_reason=rejection_reason,
    )

    user = await auth_repository.get_user_by_id(session, document.user_id)
    if user is not None:
        await auth_repository.update_user(session, user, kyc_status=status)
        if status == "verified" and legal_name:
            account = await auth_repository.get_account_by_user_id(
                session, user.id
            )
            if account is not None:
                await auth_repository.update_account(
                    session, account, legal_name=legal_name
                )

    return updated


async def manual_approve_kyc(
    session: AsyncSession, document_id: str, legal_name: str | None = None
) -> KycDocument:
    document = await kyc_repository.get_kyc_document_by_id(session, document_id)
    if document is None:
        raise ValidationError("KYC document not found")
    if document.status == "verified":
        raise ValidationError("KYC document is already verified")

    now = datetime.now(UTC)
    updated = await kyc_repository.update_kyc_document(
        session,
        document,
        status="verified",
        legal_name=legal_name or document.legal_name,
        verified_at=now,
        rejected_at=None,
        rejection_reason=None,
        verification_payload={
            **(document.verification_payload or {}),
            "manual_review": True,
            "reviewed_at": now.isoformat(),
        },
    )

    user = await auth_repository.get_user_by_id(session, document.user_id)
    if user is not None:
        await auth_repository.update_user(session, user, kyc_status="verified")
        if legal_name:
            account = await auth_repository.get_account_by_user_id(
                session, user.id
            )
            if account is not None:
                await auth_repository.update_account(
                    session, account, legal_name=legal_name
                )

    return updated


async def manual_reject_kyc(
    session: AsyncSession, document_id: str, reason: str
) -> KycDocument:
    document = await kyc_repository.get_kyc_document_by_id(session, document_id)
    if document is None:
        raise ValidationError("KYC document not found")
    if document.status == "verified":
        raise ValidationError("Cannot reject a verified KYC document")

    now = datetime.now(UTC)
    updated = await kyc_repository.update_kyc_document(
        session,
        document,
        status="rejected",
        rejected_at=now,
        rejection_reason=reason,
        verification_payload={
            **(document.verification_payload or {}),
            "manual_review": True,
            "reviewed_at": now.isoformat(),
            "rejection_reason": reason,
        },
    )

    user = await auth_repository.get_user_by_id(session, document.user_id)
    if user is not None:
        await auth_repository.update_user(session, user, kyc_status="rejected")

    return updated


# ---------------------------------------------------------------------------
# Automated provider verification (supersedes FD-02 manual-only alpha)
# ---------------------------------------------------------------------------

_PROVIDER_DOC_STATUSES_OPEN = ("pending", "retry_required", "manual_review")


def verification_mode() -> str:
    """Effective mode: ``automated`` degrades to the manual path when the
    provider is not configured unless strict ``automated`` was requested."""
    return settings.KYC_VERIFICATION_MODE


def automated_verification_available() -> bool:
    return get_verification_provider() is not None


async def create_verification_session(
    session: AsyncSession, user: User
) -> kyc_schemas.KycVerificationSessionResponse:
    """Start (or resume) an automated verification session for the client
    SDK. Falls back to the manual upload flow per KYC_VERIFICATION_MODE —
    a provider outage must never block onboarding or silently pass/fail.
    """
    mode = verification_mode()
    if mode == "manual":
        return kyc_schemas.KycVerificationSessionResponse(mode="manual")

    provider = get_verification_provider()
    if provider is None:
        if mode == "automated_fallback":
            return kyc_schemas.KycVerificationSessionResponse(mode="manual")
        raise ServiceUnavailableError(
            "Automated identity verification is not configured."
        )

    # Resume an in-flight provider verification so retries continue the
    # same applicant attempt chain instead of orphaning sessions.
    documents = await kyc_repository.get_kyc_documents_by_user_id(session, user.id)
    document = next(
        (
            d
            for d in documents
            if d.provider == provider.name and d.status in _PROVIDER_DOC_STATUSES_OPEN
        ),
        None,
    )

    try:
        vs = await provider.create_session(
            user.id,
            applicant_id=document.provider_applicant_id if document else None,
        )
    except ProviderUnavailableError:
        if mode == "automated_fallback":
            return kyc_schemas.KycVerificationSessionResponse(mode="manual")
        raise ServiceUnavailableError(
            "Automated identity verification is temporarily unavailable."
        )

    if document is None:
        account = await auth_repository.get_account_by_user_id(session, user.id)
        document = await kyc_repository.create_kyc_document(
            session,
            user_id=user.id,
            document_type="provider_managed",
            account_id=account.id if account else None,
            provider=provider.name,
            provider_applicant_id=vs.applicant_id or None,
            status="pending",
        )
    if user.kyc_status == str(KycStatus.UNVERIFIED):
        await auth_repository.update_user(session, user, kyc_status="pending")

    return kyc_schemas.KycVerificationSessionResponse(
        mode=provider.name,
        provider=provider.name,
        document_id=document.id,
        access_token=vs.access_token,
        expires_at=vs.expires_at,
    )


_TERMINAL_STATUSES = {"verified", "rejected"}

_OUTCOME_TO_STATUS = {
    ProviderOutcome.VERIFIED: "verified",
    ProviderOutcome.RETRY_REQUIRED: "retry_required",
    ProviderOutcome.MANUAL_REVIEW: "manual_review",
    ProviderOutcome.REJECTED: "rejected",
    ProviderOutcome.IN_PROGRESS: "pending",
}


async def apply_provider_event(
    session: AsyncSession, event: ProviderEvent
) -> str:
    """Server-authoritative state transition from a provider webhook.

    Idempotent: replays that would re-apply the current status return
    ``"already processed"``; a verified record never downgrades; a rejected
    record may only be corrected by a subsequent VERIFIED outcome (provider
    re-review). The provider payload is retained for audit but personal
    data and fraud labels are never logged or returned to the user.
    """
    from app.kyc import repository as kyc_repository

    document = await kyc_repository.get_kyc_document_by_applicant(
        session, event.applicant_id
    )
    if document is None and event.external_user_id:
        # Providers that create the applicant lazily inside their SDK
        # (Sumsub) can't hand us the applicantId at session time — the
        # first webhook resolves by externalUserId (our stable user id)
        # and backfills the real applicantId below.
        documents = await kyc_repository.get_kyc_documents_by_user_id(
            session, event.external_user_id
        )
        document = next(
            (d for d in documents if d.provider == event.provider), None
        )
    if document is None:
        return "not found"

    if document.provider_applicant_id != event.applicant_id:
        # Backfill the real provider applicantId — happens before the
        # idempotency guards so a status-noop first event still binds.
        await kyc_repository.update_kyc_document(
            session, document, provider_applicant_id=event.applicant_id
        )

    new_status = _OUTCOME_TO_STATUS[event.outcome]
    if document.status == new_status:
        return "already processed"
    if document.status == "verified":
        return "ignored"
    if document.status == "rejected" and event.outcome is not ProviderOutcome.VERIFIED:
        return "ignored"

    now = datetime.now(UTC)
    fields: dict[str, object] = {"status": new_status}
    if event.outcome is ProviderOutcome.VERIFIED:
        fields["verified_at"] = now
        provider = get_verification_provider()
        if provider is not None and provider.name == event.provider:
            try:
                legal_name = await provider.get_applicant_legal_name(
                    event.applicant_id
                )
            except Exception:
                legal_name = None
            if legal_name:
                fields["legal_name"] = legal_name
    elif event.outcome is ProviderOutcome.REJECTED:
        fields["rejected_at"] = now
        fields["rejection_reason"] = event.reason or "Verification rejected"

    payload = dict(document.verification_payload or {})
    payload["last_provider_event"] = event.event_type
    fields["verification_payload"] = payload

    await kyc_repository.update_kyc_document(session, document, **fields)
    owner = await auth_repository.get_user_by_id(session, document.user_id)
    if owner is not None:
        await auth_repository.update_user(
            session, owner, kyc_status=new_status
        )

    if event.outcome is ProviderOutcome.VERIFIED and document.legal_name:
        account = await auth_repository.get_account_by_user_id(
            session, document.user_id
        )
        if account is not None:
            await auth_repository.update_account(
                session, account, legal_name=document.legal_name
            )

    return "processed"
