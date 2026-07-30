#!/usr/bin/env python3
"""Export the FastAPI OpenAPI schema to apps/web/lib/openapi.json.

This script runs without starting the server, so it can be used as a build step
for generating typed frontend API contracts.
"""

import json
import os
import sys
from pathlib import Path


def _set_test_environment() -> None:
    """Provide minimal environment values so app.config can load."""
    defaults = {
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
        "JWT_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\nMIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEAtest\n-----END PRIVATE KEY-----\n",
        "JWT_PUBLIC_KEY": "-----BEGIN PUBLIC KEY-----\nMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALRJtest\n-----END PUBLIC KEY-----\n",
    }
    for key, value in defaults.items():
        os.environ.setdefault(key, value)


def main() -> None:
    _set_test_environment()

    project_root = Path(__file__).resolve().parent.parent
    src_path = project_root / "src"
    sys.path.insert(0, str(src_path))

    from app.main import app

    output_path = project_root / "apps" / "web" / "lib" / "openapi.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    schema = app.openapi()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    print(f"OpenAPI schema exported to {output_path}")


if __name__ == "__main__":
    main()
