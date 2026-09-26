"""R1 account/profile surface: profile fields, privacy controls,
notification preferences, sessions, and enforcement behavior."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import Account, RefreshToken, User
from app.database import get_session
from app.main import app
from app.messages import services as messages_services
from app.messages.models import Conversation, ConversationParticipant
from app.notifications import services as notification_services
from app.notifications.constants import (
    NotificationCategory,
    category_for_event,
)
from fastapi.testclient import TestClient


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.UNVERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
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
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def auth_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(
        fake_session
    )
    yield client
    app.dependency_overrides.pop(get_session, None)


def _auth_headers(user: User) -> dict[str, str]:
    token = auth_services.create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Profile fields via PATCH /me
# ---------------------------------------------------------------------------


def test_update_me_profile_fields(auth_client: TestClient, monkeypatch) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    update_user = AsyncMock(side_effect=lambda s, u, **kw: _apply(u, kw))
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    response = auth_client.patch(
        "/api/v1/auth/me",
        json={
            "bio": "I love Alexandria weekends.",
            "languages": ["AR", "en", "en"],
            "location": "Cairo",
            "interests": [" diving ", "desert trips"],
            "locale": "en",
        },
        headers=_auth_headers(user),
    )

    assert response.status_code == 200
    kwargs = update_user.await_args.kwargs
    assert kwargs["bio"] == "I love Alexandria weekends."
    assert kwargs["languages"] == ["ar", "en"]
    assert kwargs["location"] == "Cairo"
    assert kwargs["interests"] == ["diving", "desert trips"]
    assert kwargs["locale"] == "en"
    data = response.json()
    assert data["bio"] == "I love Alexandria weekends."
    assert data["languages"] == ["ar", "en"]


def test_update_me_rejects_unknown_language(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    update_user = AsyncMock(return_value=user)
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    response = auth_client.patch(
        "/api/v1/auth/me",
        json={"languages": ["xx"]},
        headers=_auth_headers(user),
    )

    assert response.status_code == 422
    update_user.assert_not_awaited()


def test_update_me_rejects_bad_locale(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    response = auth_client.patch(
        "/api/v1/auth/me",
        json={"locale": "fr"},
        headers=_auth_headers(user),
    )
    assert response.status_code == 422


def _apply(user: User, kwargs: dict) -> User:
    for key, value in kwargs.items():
        setattr(user, key, value)
    return user


# ---------------------------------------------------------------------------
# Account: mailing address + emergency contact
# ---------------------------------------------------------------------------


def test_update_account_mailing_and_emergency(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    account = _make_account(user.id)
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id",
        AsyncMock(return_value=account),
    )
    update_account = AsyncMock(side_effect=lambda s, a, **kw: _apply_obj(a, kw))
    monkeypatch.setattr(
        "app.auth.repository.update_account", update_account
    )

    response = auth_client.patch(
        "/api/v1/auth/me/account",
        json={
            "mailing_address": {"city": "  Giza ", "street": "", "postal_code": "12511"},
            "emergency_contact": {"name": "Mona", "phone": "+201234", "relationship": "sister"},
        },
        headers=_auth_headers(user),
    )

    assert response.status_code == 200
    kwargs = update_account.await_args.kwargs
    # Empty strings dropped; values trimmed.
    assert kwargs["mailing_address"] == {"city": "Giza", "postal_code": "12511"}
    assert kwargs["emergency_contact"] == {
        "name": "Mona",
        "phone": "+201234",
        "relationship": "sister",
    }
    data = response.json()
    assert data["mailing_address"]["city"] == "Giza"
    assert data["emergency_contact"]["name"] == "Mona"


def _apply_obj(obj, kwargs: dict):
    for key, value in kwargs.items():
        setattr(obj, key, value)
    return obj


def test_account_response_masks_payout_but_shows_emergency(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    account = _make_account(user.id)
    account.payout_account_number = "123456789012"
    account.mailing_address = {"city": "Alexandria"}
    account.emergency_contact = {"name": "Ali", "phone": "+20111"}
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id",
        AsyncMock(return_value=account),
    )

    response = auth_client.get(
        "/api/v1/auth/me/account", headers=_auth_headers(user)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["payout_account_number"] == "••••9012"
    assert data["mailing_address"]["city"] == "Alexandria"
    assert data["emergency_contact"] == {"name": "Ali", "phone": "+20111"}


# ---------------------------------------------------------------------------
# Privacy settings
# ---------------------------------------------------------------------------


def test_privacy_defaults_and_update(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )

    response = auth_client.get(
        "/api/v1/auth/me/privacy", headers=_auth_headers(user)
    )
    assert response.status_code == 200
    assert response.json() == {"profile_public": True, "read_receipts": True}

    update_user = AsyncMock(side_effect=lambda s, u, **kw: _apply(u, kw))
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    response = auth_client.patch(
        "/api/v1/auth/me/privacy",
        json={"profile_public": False},
        headers=_auth_headers(user),
    )
    assert response.status_code == 200
    assert response.json() == {"profile_public": False, "read_receipts": True}
    assert update_user.await_args.kwargs == {"profile_public": False}


def test_privacy_requires_auth(auth_client: TestClient) -> None:
    assert auth_client.get("/api/v1/auth/me/privacy").status_code == 401
    assert (
        auth_client.patch(
            "/api/v1/auth/me/privacy", json={"read_receipts": False}
        ).status_code
        == 401
    )


# ---------------------------------------------------------------------------
# Notification preferences
# ---------------------------------------------------------------------------


def test_notification_preferences_state_defaults() -> None:
    user = _make_user()
    state = auth_services.notification_preferences_state(user)
    assert state == {
        "account_policies": True,
        "host_activity": True,
        "messages": True,
        "offers": True,
        "reminders": True,
        "reservations": True,
    }


def test_notification_preferences_state_locked_always_on() -> None:
    """A corrupted/legacy stored map cannot switch a locked category off."""
    user = _make_user()
    user.notification_preferences = {"reservations": False, "messages": False}
    state = auth_services.notification_preferences_state(user)
    assert state["reservations"] is True
    assert state["messages"] is False


def test_put_notification_preferences_toggles_optional(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    update_user = AsyncMock(side_effect=lambda s, u, **kw: _apply(u, kw))
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    response = auth_client.put(
        "/api/v1/auth/me/notification-preferences",
        json={"preferences": {"messages": False, "offers": False}},
        headers=_auth_headers(user),
    )

    assert response.status_code == 200
    prefs = response.json()["preferences"]
    assert prefs["messages"] is False
    assert prefs["offers"] is False
    assert prefs["reservations"] is True


def test_put_notification_preferences_locked_rejected(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    update_user = AsyncMock(return_value=user)
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    response = auth_client.put(
        "/api/v1/auth/me/notification-preferences",
        json={"preferences": {"reservations": False}},
        headers=_auth_headers(user),
    )

    assert response.status_code == 422
    update_user.assert_not_awaited()


def test_put_notification_preferences_unknown_rejected(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    response = auth_client.put(
        "/api/v1/auth/me/notification-preferences",
        json={"preferences": {"marketing_tv": False}},
        headers=_auth_headers(user),
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Enforcement: optional categories gate dispatch; locked never do
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_message_notification_suppressed_when_opted_out(
    monkeypatch,
) -> None:
    user = _make_user()
    user.notification_preferences = {"messages": False}
    monkeypatch.setattr(
        notification_services.auth_repository,
        "get_user_by_id",
        AsyncMock(return_value=user),
    )
    create_notification = AsyncMock()
    monkeypatch.setattr(
        notification_services.repository, "create_notification", create_notification
    )
    fake_session = AsyncMock()

    result = await notification_services._create_notifications_for_contact(
        fake_session,
        event_id="evt-1",
        event_type="message.received",
        payload={"guest_id": user.id},
        contact={"user_id": user.id, "locale": "ar"},
    )

    assert result == []
    create_notification.assert_not_awaited()


@pytest.mark.asyncio
async def test_locked_event_delivers_despite_opt_out_map(monkeypatch) -> None:
    """Even if the stored map contains a locked key, delivery stands."""
    user = _make_user()
    user.notification_preferences = {"reservations": False}
    monkeypatch.setattr(
        notification_services.auth_repository,
        "get_user_by_id",
        AsyncMock(return_value=user),
    )
    create_notification = AsyncMock(
        side_effect=lambda **kw: MagicMock(**kw)
    )
    monkeypatch.setattr(
        notification_services.repository, "create_notification", create_notification
    )
    fake_session = AsyncMock()

    result = await notification_services._create_notifications_for_contact(
        fake_session,
        event_id="evt-2",
        event_type="booking.cancelled",
        payload={"guest_id": user.id, "cancelled_by": "host"},
        contact={"user_id": user.id, "email": "u@x.com", "locale": "en"},
    )

    assert len(result) > 0
    create_notification.assert_awaited()


def test_category_mapping() -> None:
    assert category_for_event("message.received") == NotificationCategory.MESSAGES
    assert category_for_event("owner.outreach") == NotificationCategory.OFFERS
    assert category_for_event("payment.required") == NotificationCategory.REMINDERS
    assert (
        category_for_event("listing.approved")
        == NotificationCategory.HOST_ACTIVITY
    )
    assert (
        category_for_event("booking.cancelled")
        == NotificationCategory.RESERVATIONS
    )
    # Unknown events fail closed to the locked account category.
    assert (
        category_for_event("some.new_event")
        == NotificationCategory.ACCOUNT_POLICIES
    )


# ---------------------------------------------------------------------------
# Read receipts masking
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_read_receipts_hidden_for_opted_out_participant() -> None:
    viewer = _make_user()
    other_id = str(uuid.uuid4())
    read_time = datetime.now(UTC)

    conversation = MagicMock(spec=Conversation)
    p_self = ConversationParticipant(
        conversation_id="c1", user_id=viewer.id, role="guest"
    )
    p_self.last_read_at = read_time
    p_other = ConversationParticipant(
        conversation_id="c1", user_id=other_id, role="host"
    )
    p_other.last_read_at = read_time
    conversation.participants = [p_self, p_other]

    fake_result = MagicMock()
    fake_result.all.return_value = [(other_id, False)]
    fake_session = AsyncMock()
    fake_session.execute = AsyncMock(return_value=fake_result)

    items = await messages_services._participant_responses(
        fake_session, conversation, viewer
    )

    by_user = {item.user_id: item for item in items}
    assert by_user[viewer.id].last_read_at == read_time
    assert by_user[other_id].last_read_at is None


@pytest.mark.asyncio
async def test_read_receipts_visible_by_default() -> None:
    viewer = _make_user()
    other_id = str(uuid.uuid4())
    read_time = datetime.now(UTC)

    conversation = MagicMock(spec=Conversation)
    p_other = ConversationParticipant(
        conversation_id="c1", user_id=other_id, role="host"
    )
    p_other.last_read_at = read_time
    conversation.participants = [p_other]

    fake_result = MagicMock()
    fake_result.all.return_value = [(other_id, True)]
    fake_session = AsyncMock()
    fake_session.execute = AsyncMock(return_value=fake_result)

    items = await messages_services._participant_responses(
        fake_session, conversation, viewer
    )
    assert items[0].last_read_at == read_time


# ---------------------------------------------------------------------------
# Public host profile privacy flag
# ---------------------------------------------------------------------------


def test_public_host_profile_masks_optional_fields() -> None:
    from app.listings.services import _public_optional_profile_fields

    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    host.bio = "Host bio"
    host.languages = ["ar", "en"]
    host.location = "Cairo"
    host.profile_public = False

    fields = _public_optional_profile_fields(host)
    assert fields == {"bio": None, "languages": [], "location": None}

    host.profile_public = True
    fields = _public_optional_profile_fields(host)
    assert fields == {
        "bio": "Host bio",
        "languages": ["ar", "en"],
        "location": "Cairo",
    }


# ---------------------------------------------------------------------------
# Sessions / logout-all
# ---------------------------------------------------------------------------


def test_list_sessions(
    auth_client: TestClient, fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    now = datetime.now(UTC)
    tokens = [
        RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash="h1",
            expires_at=now + timedelta(days=30),
            created_at=now,
            updated_at=now,
        )
    ]
    fake_result = MagicMock()
    fake_result.scalars.return_value.all.return_value = tokens
    fake_session.execute = AsyncMock(return_value=fake_result)

    response = auth_client.get(
        "/api/v1/auth/me/sessions", headers=_auth_headers(user)
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["sessions"]) == 1
    assert data["sessions"][0]["id"] == tokens[0].id


def test_logout_all_revokes_sessions(
    auth_client: TestClient, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.repository.get_user_by_id", AsyncMock(return_value=user)
    )
    revoke = AsyncMock(return_value=3)
    monkeypatch.setattr(
        "app.auth.services.revoke_all_sessions", revoke
    )

    response = auth_client.post(
        "/api/v1/auth/me/logout-all", headers=_auth_headers(user)
    )

    assert response.status_code == 200
    assert response.json() == {"revoked": 3}
    revoke.assert_awaited_once()


def test_sessions_require_auth(auth_client: TestClient) -> None:
    assert auth_client.get("/api/v1/auth/me/sessions").status_code == 401
    assert auth_client.post("/api/v1/auth/me/logout-all").status_code == 401
