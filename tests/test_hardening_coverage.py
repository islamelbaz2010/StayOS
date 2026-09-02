from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.database import get_session
from app.main import app
from app.notifications import templates
from app.security import pii
from app.security.rate_limit import RateLimitError, rate_limit
from app.security.sentry import init_sentry


@pytest.fixture
def client_with_db_override(mock_redis_client):
    fake_session = AsyncMock()
    fake_session.execute = AsyncMock()

    async def _override():
        yield fake_session

    original = app.dependency_overrides.get(get_session)
    app.dependency_overrides[get_session] = _override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_session, None)
    if original is not None:
        app.dependency_overrides[get_session] = original


def test_liveness_endpoint(client_with_db_override) -> None:
    response = client_with_db_override.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_endpoint(client_with_db_override) -> None:
    response = client_with_db_override.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_deep_health_endpoint(client_with_db_override) -> None:
    response = client_with_db_override.get("/health/deep")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_metrics_endpoint(client_with_db_override) -> None:
    response = client_with_db_override.get("/metrics")
    assert response.status_code == 200
    assert "stayos_http_requests_total" in response.text


def test_version_endpoint(client_with_db_override) -> None:
    response = client_with_db_override.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "StayOS API"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_rate_limit_enforces_limit(monkeypatch) -> None:
    from app.config import settings as app_settings
    from app.shared import redis as redis_state

    monkeypatch.setattr(app_settings, "ENVIRONMENT", "development")

    redis_client = AsyncMock()
    # Lua script returns current count (> 0) when limit is exceeded
    redis_client.eval = AsyncMock(return_value=5)
    redis_state.redis_client = redis_client

    request = MagicMock(spec=Request)
    request.client = MagicMock(host="127.0.0.1")
    request.url.path = "/api/v1/auth/login"

    with pytest.raises(RateLimitError, match="Rate limit exceeded"):
        await rate_limit(request, limit=1, window_seconds=60)


def test_sentry_initializes_with_dsn(monkeypatch) -> None:
    from app.config import settings as app_settings

    monkeypatch.setattr(app_settings, "SENTRY_DSN", "https://public@sentry.example.com/1")
    with patch("sentry_sdk.init") as mock_init:
        init_sentry()
        assert mock_init.called


def test_pii_empty_and_no_match() -> None:
    assert pii.mask_pii("") == ""
    assert pii.mask_pii("just some text") == "just some text"


def test_render_template_unknown_event_raises() -> None:
    with pytest.raises(ValueError):
        templates.render_template("unknown.event", "email", "en", {})
