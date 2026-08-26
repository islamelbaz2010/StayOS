import os
from unittest.mock import AsyncMock

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient


def _generate_test_jwt_keys() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem.decode("utf-8"), public_pem.decode("utf-8")


_jwt_private_key, _jwt_public_key = _generate_test_jwt_keys()

# Set test environment variables at module import time so app.config loads them
# before any test module imports from src/app.
_env_vars = {
    "DATABASE_URL": "postgresql+asyncpg://test:test@localhost:5432/stayos_test",
    "REDIS_URL": "redis://localhost:6379/1",
    "ENVIRONMENT": "test",
    "LOG_LEVEL": "DEBUG",
    "CORS_ORIGINS": "http://localhost:3000",
    "FIREBASE_PROJECT_ID": "test-project",
    "FIREBASE_CLIENT_EMAIL": "test@test-project.iam.gserviceaccount.com",
    "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
    "TWILIO_ACCOUNT_SID": "test_sid",
    "TWILIO_AUTH_TOKEN": "test_token",
    "TWILIO_VERIFY_SERVICE_SID": "test_service_sid",
    "AKEDLY_API_KEY": "test_akedly_key",
    "AKEDLY_PIPELINE_ID": "test_akedly_pipeline",
    "PAYMOB_API_KEY": "test_api_key",
    "PAYMOB_HMAC_SECRET": "test_hmac_secret",
    "META_WHATSAPP_TOKEN": "test_token",
    "META_PHONE_NUMBER_ID": "test_phone_id",
    "S3_LISTINGS_BUCKET": "test-listings",
    "S3_KYC_BUCKET": "test-kyc",
    "AWS_REGION": "us-east-1",
    "AWS_ACCESS_KEY_ID": "test_access_key",
    "AWS_SECRET_ACCESS_KEY": "test_secret_key",
    "SENTRY_DSN": "",
    "JWT_PRIVATE_KEY": _jwt_private_key,
    "JWT_PUBLIC_KEY": _jwt_public_key,
}

for _key, _value in _env_vars.items():
    os.environ.setdefault(_key, _value)


@pytest.fixture
def mock_redis_client(monkeypatch) -> AsyncMock:
    """Return a mock async Redis client and patch redis.asyncio.from_url."""
    client = AsyncMock()
    client.ping = AsyncMock(return_value=True)
    client.close = AsyncMock()
    client.get = AsyncMock(return_value=None)
    client.setex = AsyncMock()
    client.incr = AsyncMock(return_value=1)
    client.expire = AsyncMock(return_value=True)
    client.delete = AsyncMock()
    monkeypatch.setattr("app.main.aioredis.from_url", AsyncMock(return_value=client))
    return client


@pytest.fixture
def client(mock_redis_client) -> TestClient:
    """Return a FastAPI TestClient with mocked Redis."""
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def fake_session() -> AsyncMock:
    """Return a generic async SQLAlchemy session mock."""
    return AsyncMock()
