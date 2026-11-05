"""Regression test for the presigned-PUT SignatureDoesNotMatch defect.

Railway/Tigris bucket credentials are issued for SigV4 scope region
``auto``. ``s3_client`` previously signed with ``AWS_REGION`` (ams on
staging), so every presigned PUT was rejected by the provider with
SignatureDoesNotMatch. AWS_REGION still governs the real-AWS clients
(Textract/Rekognition) — only the S3-compatible path switches scope.
"""

from unittest.mock import MagicMock, patch

from app.config import settings
from app.shared.storage import _s3_signing_region, s3_client


def test_s3_compatible_endpoint_signs_with_auto_region(monkeypatch):
    monkeypatch.setattr(settings, "S3_ENDPOINT_URL", "https://t3.storageapi.dev")
    monkeypatch.setattr(settings, "S3_REGION", "")
    monkeypatch.setattr(settings, "AWS_REGION", "ams")
    assert _s3_signing_region() == "auto"


def test_explicit_s3_region_overrides_default(monkeypatch):
    monkeypatch.setattr(settings, "S3_ENDPOINT_URL", "https://s3.example.com")
    monkeypatch.setattr(settings, "S3_REGION", "eu-west-1")
    monkeypatch.setattr(settings, "AWS_REGION", "ams")
    assert _s3_signing_region() == "eu-west-1"


def test_real_aws_keeps_aws_region(monkeypatch):
    monkeypatch.setattr(settings, "S3_ENDPOINT_URL", "")
    monkeypatch.setattr(settings, "S3_REGION", "")
    monkeypatch.setattr(settings, "AWS_REGION", "me-south-1")
    assert _s3_signing_region() == "me-south-1"


def test_client_uses_signing_region_for_compatible_endpoint(monkeypatch):
    monkeypatch.setattr(settings, "S3_ENDPOINT_URL", "https://t3.storageapi.dev")
    monkeypatch.setattr(settings, "S3_REGION", "")
    monkeypatch.setattr(settings, "AWS_REGION", "ams")
    captured: dict = {}

    def fake_client(*args, **kwargs):
        captured.update(kwargs)
        return MagicMock()

    with patch("app.shared.storage.boto3.client", side_effect=fake_client):
        s3_client("bucket-x")
    assert captured["region_name"] == "auto"
