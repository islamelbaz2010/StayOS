import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus
from app.auth.models import User
from app.database import get_session
from app.kyc import services as kyc_services
from app.kyc.models import KycDocument
from app.main import app
from fastapi.testclient import TestClient


def _make_user(
    user_id: str | None = None,
    kyc_status: KycStatus = KycStatus.UNVERIFIED,
    role: str = "guest",
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=role,
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_document(user_id: str, status: str = "unverified") -> KycDocument:
    now = datetime.now(UTC)
    doc_id = str(uuid.uuid4())
    return KycDocument(
        id=doc_id,
        user_id=user_id,
        account_id=None,
        document_type="passport",
        document_number="P12345",
        status=status,
        legal_name=None,
        front_image_key=f"kyc/{user_id}/{doc_id}/front.jpg",
        back_image_key=f"kyc/{user_id}/{doc_id}/back.jpg",
        selfie_image_key=f"kyc/{user_id}/{doc_id}/selfie.jpg",
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def kyc_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def test_initiate_kyc(kyc_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    document = _make_document(user.id)

    monkeypatch.setattr(
        "app.kyc.repository.create_kyc_document", AsyncMock(return_value=document)
    )
    monkeypatch.setattr(
        "app.kyc.repository.update_kyc_document", AsyncMock(return_value=document)
    )
    monkeypatch.setattr(
        "app.kyc.services.boto3.client",
        lambda *args, **kwargs: MagicMock(
            generate_presigned_url=lambda *args, **kwargs: "https://s3.example.com/presigned"
        ),
    )
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )

    token = auth_services.create_access_token(user)
    response = kyc_client.post(
        "/api/v1/kyc/initiate",
        json={"document_type": "passport", "document_number": "P12345"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["document_id"] == document.id
    assert data["upload_urls"]["front"] == "https://s3.example.com/presigned"


def test_submit_kyc(kyc_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    document = _make_document(user.id)
    updated = _make_document(user.id, status="pending")
    updated.id = document.id

    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_document_by_id", AsyncMock(return_value=document)
    )
    monkeypatch.setattr(
        "app.kyc.repository.update_kyc_document", AsyncMock(return_value=updated)
    )
    monkeypatch.setattr(
        "app.auth.repository.update_user", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.kyc.services._queue_kyc_processing", lambda document_id: None
    )
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )

    token = auth_services.create_access_token(user)
    response = kyc_client.post(
        f"/api/v1/kyc/documents/{document.id}/submit",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["document_id"] == document.id
    assert data["status"] == "pending"


def test_kyc_status(kyc_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    document = _make_document(user.id)

    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[document]),
    )

    token = auth_services.create_access_token(user)
    response = kyc_client.get(
        "/api/v1/kyc/status", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.id
    assert data["kyc_status"] == "unverified"
    assert len(data["documents"]) == 1


def test_process_kyc_as_admin(kyc_client: TestClient, monkeypatch) -> None:
    user = _make_user(role="admin")
    document = _make_document(user.id, status="verified")

    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.kyc.services.process_kyc_document", AsyncMock(return_value=document)
    )

    token = auth_services.create_access_token(user)
    response = kyc_client.post(
        f"/api/v1/kyc/documents/{document.id}/process",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == document.id
    assert data["status"] == "verified"


def test_process_kyc_requires_admin(kyc_client: TestClient, monkeypatch) -> None:
    user = _make_user(role="guest")
    document = _make_document(user.id)

    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )

    token = auth_services.create_access_token(user)
    response = kyc_client.post(
        f"/api/v1/kyc/documents/{document.id}/process",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_kyc_services_process_document(monkeypatch) -> None:
    user = _make_user()
    document = _make_document(user.id)

    async def _update_doc(session, doc, **kwargs):
        for key, value in kwargs.items():
            setattr(doc, key, value)
        return doc

    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_document_by_id",
        AsyncMock(return_value=document),
    )
    monkeypatch.setattr(
        "app.kyc.repository.update_kyc_document",
        AsyncMock(side_effect=_update_doc),
    )
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.auth.repository.update_user", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.update_account", AsyncMock(return_value=None)
    )

    textract_mock = MagicMock()
    textract_mock.analyze_id.return_value = {
        "IdentityDocuments": [
            {
                "IdentityDocumentFields": [
                    {
                        "Type": {"Text": "FIRST_NAME"},
                        "ValueDetection": {"Text": "Jane"},
                    },
                    {
                        "Type": {"Text": "LAST_NAME"},
                        "ValueDetection": {"Text": "Doe"},
                    },
                    {
                        "Type": {"Text": "DOCUMENT_NUMBER"},
                        "ValueDetection": {"Text": "P12345"},
                    },
                ]
            }
        ]
    }
    rekognition_mock = MagicMock()
    rekognition_mock.compare_faces.return_value = {
        "FaceMatches": [{"Similarity": 95.0}]
    }
    monkeypatch.setattr(
        "app.kyc.services.boto3.client",
        lambda name, **kwargs: (
            textract_mock if name == "textract" else rekognition_mock
        ),
    )
    async def _fake_to_thread(func, *args, **kwargs):  # noqa: RUF029
        return func(*args, **kwargs)

    monkeypatch.setattr("app.kyc.services.asyncio.to_thread", _fake_to_thread)

    import asyncio

    result = asyncio.run(kyc_services.process_kyc_document(None, document.id))
    assert result.status == "verified"
