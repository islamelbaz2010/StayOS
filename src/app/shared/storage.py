from typing import Any

import boto3
from botocore.config import Config

from app.config import settings
from app.shared.exceptions import ValidationError


def _credentials_for(bucket: str | None) -> tuple[str, str]:
    """Resolve the credential pair for a bucket.

    S3-compatible providers (Railway/Tigris) scope each credential pair
    to one bucket, so the private KYC and payment-proof buckets carry
    their own keys. Falls back to the shared AWS_* pair (which owns the
    listings bucket and covers single-credential deployments).
    """
    if bucket == settings.S3_KYC_BUCKET and settings.S3_KYC_ACCESS_KEY_ID:
        return (
            settings.S3_KYC_ACCESS_KEY_ID,
            settings.S3_KYC_SECRET_ACCESS_KEY,
        )
    if (
        bucket == settings.S3_PAYMENT_PROOF_BUCKET
        and settings.S3_PAYMENT_PROOF_ACCESS_KEY_ID
    ):
        return (
            settings.S3_PAYMENT_PROOF_ACCESS_KEY_ID,
            settings.S3_PAYMENT_PROOF_SECRET_ACCESS_KEY,
        )
    return (
        settings.AWS_ACCESS_KEY_ID,
        settings.AWS_SECRET_ACCESS_KEY,
    )


def _s3_signing_region() -> str:
    """Region embedded in the SigV4 credential scope for object storage.

    Railway/Tigris bucket credentials are issued for scope region
    ``auto`` — signing a presigned URL with AWS_REGION (e.g. ``ams``)
    produces ``SignatureDoesNotMatch`` on every direct PUT even though
    the endpoint, bucket and credentials are all correct. S3_REGION is
    an explicit override; otherwise custom endpoints default to
    ``auto`` and real AWS keeps AWS_REGION. AWS_REGION still governs
    the Textract/Rekognition clients, which are true AWS services.
    """
    if settings.S3_REGION:
        return settings.S3_REGION
    if settings.S3_ENDPOINT_URL:
        return "auto"
    return settings.AWS_REGION or "auto"


def s3_client(bucket: str | None = None) -> Any:
    access_key, secret_key = _credentials_for(bucket)
    return boto3.client(
        "s3",
        region_name=_s3_signing_region(),
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        config=Config(s3={"addressing_style": "virtual"}),
    )


def private_object_reference(bucket: str, key: str) -> str:
    return f"s3://{bucket}/{key}"


def resolve_object_url(bucket: str, key: str, stored_url: str) -> str:
    if not stored_url.startswith("s3://"):
        return stored_url
    return str(
        s3_client(bucket).generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=settings.S3_PRESIGNED_GET_TTL_SECONDS,
        )
    )


def verify_image_upload(bucket: str, key: str, allowed_types: set[str], max_size: int) -> None:
    try:
        metadata = s3_client(bucket).head_object(Bucket=bucket, Key=key)
    except Exception as exc:
        raise ValidationError("Uploaded image could not be verified") from exc
    content_type = str(metadata.get("ContentType") or "").lower()
    content_length = int(metadata.get("ContentLength") or 0)
    if content_type not in allowed_types or content_length <= 0 or content_length > max_size:
        raise ValidationError("Uploaded image is invalid or exceeds the size limit")
