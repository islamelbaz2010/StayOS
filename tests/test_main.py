from unittest.mock import AsyncMock

import pytest
from app.database import get_session
from app.main import app
from fastapi.testclient import TestClient


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def fake_session() -> AsyncMock:
    session = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def client(mock_redis_client) -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "StayOS API", "version": "0.1.0"}
    assert "X-Request-ID" in response.headers


def test_health_endpoint_ok(client: TestClient, fake_session: AsyncMock) -> None:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    try:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "ok"
        assert data["redis"] == "ok"
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_health_endpoint_db_error(client: TestClient, fake_session: AsyncMock) -> None:
    fake_session.execute = AsyncMock(side_effect=RuntimeError("database unreachable"))
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    try:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert data["database"] == "error"
        assert data["redis"] == "ok"
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_health_endpoint_redis_error(
    client: TestClient, fake_session: AsyncMock, mock_redis_client: AsyncMock
) -> None:
    mock_redis_client.ping = AsyncMock(side_effect=RuntimeError("redis unreachable"))
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    try:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert data["database"] == "ok"
        assert data["redis"] == "error"
    finally:
        app.dependency_overrides.pop(get_session, None)
