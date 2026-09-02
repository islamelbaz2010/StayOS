import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import Account, User
from app.auth.schemas import TokenPair
from app.config import settings
from app.database import get_session
from app.main import app


def _make_user(
    user_id: str | None = None,
    phone: str = "+1234567890",
    email: str = "user@example.com",
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.UNVERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number=phone,
        email=email,
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_account(user_id: str) -> Account:
    now = datetime.now(UTC)
    return Account(
        id=str(uuid.uuid4()),
        user_id=user_id,
        legal_name="Test Account",
        national_id="1234567890",
        tax_id="T123",
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def auth_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def test_get_otp_challenge(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "test_key")
    monkeypatch.setattr(auth_services.settings, "AKEDLY_PIPELINE_ID", "test_pipeline")

    async def fake_akedly_call(method, path, *, params=None, json_body=None):
        return {
            "status": "success",
            "data": {
                "challenge": "deadbeef",
                "difficulty": 4,
                "challengeToken": "tok-1",
                "challengeRequired": True,
                "turnstile": {"required": True, "siteKey": "site-key-1"},
            },
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_akedly_call)

    response = auth_client.get("/api/v1/auth/otp/challenge")

    assert response.status_code == 200
    data = response.json()
    assert data["challenge"] == "deadbeef"
    assert data["difficulty"] == 4
    assert data["challenge_token"] == "tok-1"
    assert data["turnstile_required"] is True
    assert data["turnstile_site_key"] == "site-key-1"
    # The response body must never leak the API key/pipeline ID.
    assert "test_key" not in response.text
    assert "test_pipeline" not in response.text


def test_send_otp(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "test_key")
    monkeypatch.setattr(auth_services.settings, "AKEDLY_PIPELINE_ID", "test_pipeline")

    async def fake_akedly_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return {
                "status": "success",
                "data": {
                    "challenge": "aa",
                    "difficulty": 0,
                    "challengeToken": "tok-1",
                    "challengeRequired": True,
                    "turnstile": {"required": False},
                },
            }
        return {
            "status": "success",
            "message": "OTP sent successfully",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_akedly_call)

    response = auth_client.post("/api/v1/auth/otp/send", json={"phone_number": "+1234567890"})

    assert response.status_code == 200
    data = response.json()
    assert data["phone_number"] == "+1234567890"
    assert data["status"] == "OTP sent successfully"


def test_verify_otp(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    token_pair = TokenPair(access_token="access", refresh_token="refresh", expires_in=900)
    monkeypatch.setattr("app.auth.services.verify_otp", AsyncMock(return_value=True))
    monkeypatch.setattr(
        "app.auth.services.get_or_create_user_by_phone", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.services.create_token_pair", AsyncMock(return_value=token_pair)
    )

    response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone_number": "+1234567890", "code": "123456"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "access"
    assert data["refresh_token"] == "refresh"


def test_verify_otp_invalid(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr("app.auth.services.verify_otp", AsyncMock(return_value=False))

    response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone_number": "+1234567890", "code": "000000"},
    )

    assert response.status_code == 401


def test_firebase_auth(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    token_pair = TokenPair(access_token="access", refresh_token="refresh", expires_in=900)
    monkeypatch.setattr(
        "app.auth.services.verify_firebase_id_token",
        AsyncMock(return_value={"sub": "firebase123", "email": "fb@example.com"}),
    )
    monkeypatch.setattr(
        "app.auth.services.get_or_create_user_from_firebase", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.services.create_token_pair", AsyncMock(return_value=token_pair)
    )

    response = auth_client.post("/api/v1/auth/firebase", json={"id_token": "token"})

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "access"


def test_refresh_token(auth_client: TestClient, monkeypatch) -> None:
    token_pair = TokenPair(access_token="access2", refresh_token="refresh2", expires_in=900)
    monkeypatch.setattr(
        "app.auth.services.rotate_refresh_token", AsyncMock(return_value=token_pair)
    )

    response = auth_client.post("/api/v1/auth/refresh", json={"refresh_token": "old"})

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "access2"


def test_logout(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.auth.services.revoke_refresh_token", AsyncMock(return_value=None)
    )

    response = auth_client.post("/api/v1/auth/logout", json={"refresh_token": "old"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_me(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    token = auth_services.create_access_token(user)

    response = auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user.id
    assert data["kyc_status"] == "unverified"


def test_get_me_missing_token(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_account(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    account = _make_account(user.id)
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id",
        AsyncMock(return_value=account),
    )
    token = auth_services.create_access_token(user)

    response = auth_client.get(
        "/api/v1/auth/me/account", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.id
    assert data["legal_name"] == "Test Account"


def test_update_account(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    account = _make_account(user.id)
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id",
        AsyncMock(return_value=account),
    )
    monkeypatch.setattr(
        "app.auth.repository.update_account",
        AsyncMock(return_value=account),
    )
    token = auth_services.create_access_token(user)

    response = auth_client.patch(
        "/api/v1/auth/me/account",
        json={"legal_name": "New Name"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["legal_name"] == "Test Account"


def test_public_key(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/auth/.well-known/jwks.json")
    assert response.status_code == 200
    assert response.json()["public_key"] == settings.JWT_PUBLIC_KEY


def test_jwt_round_trip() -> None:
    user = _make_user()
    token = auth_services.create_access_token(user)
    payload = jose_jwt.decode(
        token, settings.JWT_PUBLIC_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    assert payload["sub"] == user.id
    assert payload["type"] == "access"
    assert payload["kyc_status"] == "unverified"
