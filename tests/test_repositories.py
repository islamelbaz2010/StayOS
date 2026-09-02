import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth import repository as auth_repository
from app.auth.models import Account, RefreshToken, User
from app.kyc import repository as kyc_repository
from app.kyc.models import KycDocument


def _result_mock(value):
    result = MagicMock()
    result.scalar_one_or_none = MagicMock(return_value=value)
    return result


def _scalar_result_mock(values):
    result = MagicMock()
    scalars = MagicMock()
    scalars.all = MagicMock(return_value=values)
    result.scalars = MagicMock(return_value=scalars)
    return result


def _user():
    return User(id=str(uuid.uuid4()), phone_number="+1234567890", role="guest")


def _account(user_id):
    return Account(id=str(uuid.uuid4()), user_id=user_id)


def _refresh_token(user_id):
    return RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash="hash",
        expires_at=datetime.now(UTC),
    )


def _document(user_id):
    return KycDocument(
        id=str(uuid.uuid4()),
        user_id=user_id,
        document_type="passport",
    )


@pytest.fixture
def fake_session() -> AsyncMock:
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return session


async def test_get_user_by_id(fake_session) -> None:
    user = _user()
    fake_session.get.return_value = user
    result = await auth_repository.get_user_by_id(fake_session, user.id)
    assert result is user


async def test_get_user_by_phone(fake_session) -> None:
    user = _user()
    fake_session.execute.return_value = _result_mock(user)
    result = await auth_repository.get_user_by_phone(fake_session, user.phone_number)
    assert result is user


async def test_get_user_by_email(fake_session) -> None:
    user = _user()
    fake_session.execute.return_value = _result_mock(user)
    result = await auth_repository.get_user_by_email(fake_session, "user@example.com")
    assert result is user


async def test_get_user_by_firebase_uid(fake_session) -> None:
    user = _user()
    fake_session.execute.return_value = _result_mock(user)
    result = await auth_repository.get_user_by_firebase_uid(fake_session, "fb123")
    assert result is user


async def test_create_user(fake_session) -> None:
    result = await auth_repository.create_user(
        fake_session, phone_number="+1234567890", role="guest"
    )
    assert isinstance(result, User)
    assert fake_session.add.called
    assert fake_session.flush.called
    assert fake_session.refresh.called


async def test_update_user(fake_session) -> None:
    user = _user()
    result = await auth_repository.update_user(
        fake_session, user, kyc_status="verified"
    )
    assert result.kyc_status == "verified"
    assert fake_session.add.called


async def test_get_account_by_user_id(fake_session) -> None:
    account = _account("user-id")
    fake_session.execute.return_value = _result_mock(account)
    result = await auth_repository.get_account_by_user_id(fake_session, "user-id")
    assert result is account


async def test_create_account(fake_session) -> None:
    result = await auth_repository.create_account(fake_session, user_id="user-id")
    assert isinstance(result, Account)
    assert fake_session.add.called


async def test_update_account(fake_session) -> None:
    account = _account("user-id")
    result = await auth_repository.update_account(
        fake_session, account, legal_name="Jane Doe"
    )
    assert result.legal_name == "Jane Doe"
    assert fake_session.add.called


async def test_create_refresh_token(fake_session) -> None:
    result = await auth_repository.create_refresh_token(
        fake_session,
        user_id="user-id",
        token_hash="hash",
        expires_at=datetime.now(UTC),
    )
    assert isinstance(result, RefreshToken)
    assert fake_session.add.called


async def test_get_refresh_token_by_hash(fake_session) -> None:
    token = _refresh_token("user-id")
    fake_session.execute.return_value = _result_mock(token)
    result = await auth_repository.get_refresh_token_by_hash(fake_session, "hash")
    assert result is token


async def test_revoke_refresh_token(fake_session) -> None:
    token = _refresh_token("user-id")
    now = datetime.now(UTC)
    result = await auth_repository.revoke_refresh_token(fake_session, token, now)
    assert result.revoked_at is now
    assert fake_session.add.called


async def test_get_kyc_document_by_id(fake_session) -> None:
    document = _document("user-id")
    fake_session.get.return_value = document
    result = await kyc_repository.get_kyc_document_by_id(fake_session, document.id)
    assert result is document


async def test_get_kyc_documents_by_user_id(fake_session) -> None:
    document = _document("user-id")
    fake_session.execute.return_value = _scalar_result_mock([document])
    result = await kyc_repository.get_kyc_documents_by_user_id(fake_session, "user-id")
    assert result == [document]


async def test_create_kyc_document(fake_session) -> None:
    result = await kyc_repository.create_kyc_document(
        fake_session, user_id="user-id", document_type="passport"
    )
    assert isinstance(result, KycDocument)
    assert fake_session.add.called


async def test_update_kyc_document(fake_session) -> None:
    document = _document("user-id")
    result = await kyc_repository.update_kyc_document(
        fake_session, document, status="verified"
    )
    assert result.status == "verified"
    assert fake_session.add.called
