import json
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from botocore.exceptions import ClientError
from fastapi import Request

from app.config import settings as app_settings
from app.security import pii
from app.security.audit import _safe_payload, audit_middleware
from app.security.logging import JsonFormatter, setup_logging
from app.security.middleware import security_headers_middleware
from app.security.pii import mask_pii
from app.security.rate_limit import RateLimitError, login_rate_limit, rate_limit
from app.security.secrets import SecretNotFoundError, SecretsManager, get_secret
from app.security.sentry import init_sentry


def test_mask_pii_email() -> None:
    masked = pii.mask_pii("Contact me at john.doe@example.com please")
    assert "john.doe@example.com" not in masked
    assert "@example.com" in masked


def test_mask_pii_phone() -> None:
    masked = pii.mask_pii("My number is 01012345678")
    assert "01012345678" not in masked
    assert "+20XXXXXXXXXX" in masked


def test_mask_pii_national_id() -> None:
    masked = pii.mask_pii("ID 28509250101234")
    assert "28509250101234" not in masked
    assert "XXXXXXXXXXXXXX" in masked


@pytest.mark.asyncio
async def test_rate_limit_skips_in_test_environment() -> None:
    request = MagicMock(spec=Request)
    request.client = MagicMock(host="127.0.0.1")
    request.url.path = "/api/v1/auth/otp/send"
    await rate_limit(request, limit=1, window_seconds=60)


@pytest.mark.asyncio
async def test_rate_limit_raises_when_redis_unavailable(monkeypatch) -> None:
    from app.shared import redis as redis_state

    monkeypatch.setattr(app_settings, "ENVIRONMENT", "development")
    redis_state.redis_client = None
    request = MagicMock(spec=Request)
    request.client = MagicMock(host="127.0.0.1")
    request.url.path = "/api/v1/auth/login"

    with pytest.raises(RateLimitError):
        await login_rate_limit(request)


@pytest.mark.asyncio
async def test_security_headers_middleware_adds_headers() -> None:
    async def call_next(request: Request) -> MagicMock:
        response = MagicMock()
        response.headers = {}
        return response

    request = MagicMock(spec=Request)
    request.state.request_id = "req-123"
    response = await security_headers_middleware(request, call_next)  # type: ignore[arg-type]
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Request-ID"] == "req-123"


def test_safe_payload_masks_sensitive_keys() -> None:
    payload = json.dumps({"password": "secret123", "email": "user@example.com"})
    result = _safe_payload(payload)
    assert '"password": "***"' in result
    assert "secret123" not in result


@pytest.mark.asyncio
async def test_audit_middleware_runs_without_error() -> None:
    async def call_next(request: Request) -> MagicMock:
        response = MagicMock()
        response.status_code = 200
        response.headers = {}
        return response

    request = MagicMock(spec=Request)
    request.url.path = "/api/v1/units"
    request.method = "GET"
    request.client = MagicMock(host="127.0.0.1")
    request.headers = {}
    request.state.request_id = "req-123"
    request.state.user = None

    with patch("app.security.audit.AsyncSessionLocal") as mock_session_class:
        mock_session = AsyncMock()
        mock_session_class.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_class.return_value.__aexit__ = AsyncMock(return_value=None)
        response = await audit_middleware(request, call_next)  # type: ignore[arg-type]
    assert response.status_code == 200


def test_secrets_manager_uses_environment_override() -> None:
    with patch.dict("os.environ", {"SENTRY_DSN": "https://env@sentry.io/1"}):
        manager = SecretsManager()
        assert manager.get_secret("SENTRY_DSN") == "https://env@sentry.io/1"


def test_secrets_manager_raises_when_not_found() -> None:
    manager = SecretsManager(secret_arn="")
    with pytest.raises(SecretNotFoundError):
        manager.get_secret("MISSING_SECRET")


def test_json_formatter_masks_pii_in_message() -> None:
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg="Email %s logged",
        args=("john@example.com",),
        exc_info=None,
    )
    output = formatter.format(record)
    assert "john@example.com" not in output
    assert "@example.com" in output


def test_setup_logging_configures_root_logger() -> None:
    root = logging.getLogger()
    setup_logging("INFO", json_output=False)
    assert any(isinstance(h, logging.StreamHandler) for h in root.handlers)


# ============================================================
# SECRETS MANAGER COVERAGE
# ============================================================

def test_secrets_manager_fetch_from_aws_dict_secret() -> None:
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.return_value = {
            "SecretString": json.dumps({"SENTRY_DSN": "https://aws@sentry.io/1"})
        }
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        assert manager.get_secret("SENTRY_DSN") == "https://aws@sentry.io/1"


def test_secrets_manager_fetch_from_aws_plain_string_secret() -> None:
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.return_value = {
            "SecretString": "plain-secret-value"
        }
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        assert manager.get_secret("ANY_KEY") == "plain-secret-value"


def test_secrets_manager_fetch_from_aws_missing_key_returns_whole_value() -> None:
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.return_value = {
            "SecretString": json.dumps({"OTHER_KEY": "value"})
        }
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        result = manager.get_secret("SENTRY_DSN")
        assert result == {"OTHER_KEY": "value"}


def test_secrets_manager_binary_secret_raises() -> None:
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.return_value = {
            "SecretBinary": b"binary-data"
        }
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        with pytest.raises(SecretNotFoundError):
            manager.get_secret("SENTRY_DSN")


def test_secrets_manager_resource_not_found_raises() -> None:
    error = ClientError(
        {"Error": {"Code": "ResourceNotFoundException", "Message": "not found"}},
        "GetSecretValue",
    )
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.side_effect = error
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        with pytest.raises(SecretNotFoundError):
            manager.get_secret("SENTRY_DSN")


def test_secrets_manager_other_aws_error_raises() -> None:
    error = ClientError(
        {"Error": {"Code": "InvalidRequestException", "Message": "invalid"}},
        "GetSecretValue",
    )
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.side_effect = error
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        with pytest.raises(SecretNotFoundError):
            manager.get_secret("SENTRY_DSN")


def test_secrets_manager_caches_aws_value() -> None:
    with patch("app.security.secrets.boto3.client") as mock_client:
        mock_client.return_value.get_secret_value.return_value = {
            "SecretString": json.dumps({"KEY": "value"})
        }
        manager = SecretsManager(secret_arn="arn:aws:secretsmanager:region:account:secret:name")
        assert manager.get_secret("KEY") == "value"
        assert manager.get_secret("KEY") == "value"
        assert mock_client.return_value.get_secret_value.call_count == 1


def test_get_secret_module_function_uses_environment() -> None:
    with patch.dict("os.environ", {"MODULE_TEST_SECRET": "env-value"}):
        assert get_secret("MODULE_TEST_SECRET") == "env-value"


def test_mask_pii_short_email_local() -> None:
    assert mask_pii("ab@example.com") == "**@example.com"


def test_init_sentry_failure_is_logged(monkeypatch, caplog) -> None:
    import sentry_sdk

    monkeypatch.setattr("app.security.sentry.settings.SENTRY_DSN", "https://example.com/1")

    def _raise(*args, **kwargs):
        raise RuntimeError("sentry unavailable")

    monkeypatch.setattr(sentry_sdk, "init", _raise)
    with caplog.at_level("ERROR", logger="app.security.sentry"):
        init_sentry()
    assert "Failed to initialize Sentry" in caplog.text
