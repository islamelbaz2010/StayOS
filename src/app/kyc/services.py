import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

import boto3
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth.models import User
from app.config import settings
from app.kyc import repository as kyc_repository
from app.kyc.models import KycDocument
from app.kyc.schemas import KycInitiateRequest, KycInitiateResponse, KycUploadUrls
from app.shared.exceptions import ValidationError

_UPLOAD_TTL_SECONDS = 900


def _s3_client() -> Any:
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


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


def _generate_presigned_put_url(bucket: str, key: str) -> str:
    client = _s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": "image/jpeg"},
        ExpiresIn=_UPLOAD_TTL_SECONDS,
    )


async def initiate_kyc_document(
    session: AsyncSession,
    user: User,
    request: KycInitiateRequest,
) -> KycInitiateResponse:
    document = await kyc_repository.create_kyc_document(
        session,
        user_id=user.id,
        document_type=request.document_type,
        document_number=request.document_number,
        account_id=user.account.id if user.account else None,
    )

    front_key = _kyc_object_key(user.id, document.id, "front")
    back_key = _kyc_object_key(user.id, document.id, "back")
    selfie_key = _kyc_object_key(user.id, document.id, "selfie")

    front_url = _generate_presigned_put_url(settings.S3_KYC_BUCKET, front_key)
    back_url = _generate_presigned_put_url(settings.S3_KYC_BUCKET, back_key)
    selfie_url = _generate_presigned_put_url(settings.S3_KYC_BUCKET, selfie_key)

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

    if not document.front_image_key or not document.selfie_image_key:
        raise ValidationError("Missing required image uploads")

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

    fields = await _analyze_id_document(document.front_image_key)
    similarity = await _compare_faces(
        document.selfie_image_key, document.front_image_key
    )

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
