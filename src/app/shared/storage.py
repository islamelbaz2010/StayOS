from typing import Any

import boto3
from botocore.config import Config

from app.config import settings
from app.shared.exceptions import ValidationError


def s3_client() -> Any:
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        config=Config(s3={"addressing_style": "virtual"}),
    )


def private_object_reference(bucket: str, key: str) -> str:
    return f"s3://{bucket}/{key}"


def resolve_object_url(bucket: str, key: str, stored_url: str) -> str:
    if not stored_url.startswith("s3://"):
        return stored_url
    return str(
        s3_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=settings.S3_PRESIGNED_GET_TTL_SECONDS,
        )
    )


def verify_image_upload(bucket: str, key: str, allowed_types: set[str], max_size: int) -> None:
    try:
        metadata = s3_client().head_object(Bucket=bucket, Key=key)
    except Exception as exc:
        raise ValidationError("Uploaded image could not be verified") from exc
    content_type = str(metadata.get("ContentType") or "").lower()
    content_length = int(metadata.get("ContentLength") or 0)
    if content_type not in allowed_types or content_length <= 0 or content_length > max_size:
        raise ValidationError("Uploaded image is invalid or exceeds the size limit")
