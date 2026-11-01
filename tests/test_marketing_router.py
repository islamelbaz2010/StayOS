"""Marketing lead endpoints — public capture + admin RBAC boundary."""
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.auth import services as auth_services
from app.auth.constants import KycStatus
from app.auth.models import User
from app.config import settings
from app.database import get_session
from app.marketing import services
from app.marketing.constants import LeadStatus
from app.marketing.models import GuestLead, HostLead

HOST_PAYLOAD = {
    "full_name": "QA Host",
    "phone": "+201001112223",
    "city": "Cairo",
    "property_type": "villa",
    "units_count": 1,
    "consent": True,
}
GUEST_PAYLOAD = {
    "name": "QA Guest",
    "email": "qa.guest@example.com",
    "consent": True,
}


def _make_user(role: str = "admin") -> User:
    now = datetime.now(UTC)
    return User(
        id=f"qa-{role}-1",
        phone_number="+201000000000",
        email=f"{role}@example.com",
        firebase_uid=None,
        display_name="QA",
        locale="en",
        role=role,
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch: pytest.MonkeyPatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


@pytest.fixture
def mkt_client(client: TestClient, fake_session: AsyncMock):
    async def _override():
        yield fake_session

    client.app.dependency_overrides[get_session] = _override
    yield client, fake_session
    client.app.dependency_overrides.pop(get_session, None)


# ── Public lead capture ───────────────────────────────────────────


def test_host_lead_created(mkt_client):
    client, session = mkt_client
    session.scalar = AsyncMock(return_value=None)  # no existing duplicate
    r = client.post("/api/v1/public/leads/host", json=HOST_PAYLOAD)
    assert r.status_code == 201
    body = r.json()
    assert body["created"] is True and body["status"] == LeadStatus.NEW
    session.add.assert_called_once()


def test_host_lead_duplicate_returns_existing(mkt_client):
    client, session = mkt_client
    session.scalar = AsyncMock(
        return_value=HostLead(id="lead-dup", status=LeadStatus.NEW)
    )
    r = client.post("/api/v1/public/leads/host", json=HOST_PAYLOAD)
    assert r.status_code == 201
    assert r.json() == {"id": "lead-dup", "status": LeadStatus.NEW, "created": False}
    session.add.assert_not_called()


def test_concurrent_duplicate_falls_back_to_unique_constraint(mkt_client):
    """Race: two requests pass the SELECT check, one commits, the other
    hits the unique constraint and must return the existing lead."""
    from sqlalchemy.exc import IntegrityError

    client, session = mkt_client
    session.scalar = AsyncMock(
        side_effect=[None, HostLead(id="lead-race", status=LeadStatus.NEW)]
    )
    session.commit = AsyncMock(
        side_effect=IntegrityError("INSERT", {}, Exception("duplicate key"))
    )
    r = client.post("/api/v1/public/leads/host", json=HOST_PAYLOAD)
    assert r.status_code == 201
    assert r.json() == {"id": "lead-race", "status": LeadStatus.NEW, "created": False}
    session.rollback.assert_called_once()


def test_guest_lead_created(mkt_client):
    client, session = mkt_client
    session.scalar = AsyncMock(return_value=None)
    r = client.post("/api/v1/public/leads/guest", json=GUEST_PAYLOAD)
    assert r.status_code == 201
    assert r.json()["created"] is True


def test_guest_requires_contact(mkt_client):
    client, _ = mkt_client
    r = client.post(
        "/api/v1/public/leads/guest",
        json={"name": "No Contact", "consent": True},
    )
    assert r.status_code == 422


def test_consent_enforced(mkt_client):
    client, session = mkt_client
    r = client.post(
        "/api/v1/public/leads/host", json={**HOST_PAYLOAD, "consent": False}
    )
    assert r.status_code == 422
    session.add.assert_not_called()


def test_honeypot_short_circuits_without_write(mkt_client):
    client, session = mkt_client
    r = client.post(
        "/api/v1/public/leads/guest",
        json={**GUEST_PAYLOAD, "website": "spam.example"},
    )
    assert r.status_code == 201
    assert r.json() == {"id": None, "status": "received"}
    session.add.assert_not_called()


def test_event_recorded(mkt_client):
    client, session = mkt_client
    r = client.post(
        "/api/v1/public/events",
        json={"event": "page_view", "session_id": "s1", "utm_source": "ig"},
    )
    assert r.status_code == 202
    session.add.assert_called_once()


def test_event_allowlist_enforced(mkt_client):
    client, _ = mkt_client
    r = client.post("/api/v1/public/events", json={"event": "shell_exec"})
    assert r.status_code == 422


# ── Trusted-proxy client-IP handling at the endpoint level ────────


def test_endpoint_passes_edge_appended_ip_to_service(mkt_client, monkeypatch):
    """Spoofed leftmost XFF entries must not reach lead attribution."""
    client, session = mkt_client
    session.scalar = AsyncMock(
        return_value=GuestLead(id="g-1", status=LeadStatus.NEW)
    )
    seen: list[str | None] = []

    async def _spy(s, payload, ip):
        seen.append(ip)
        return GuestLead(id="g-1", status=LeadStatus.NEW), False

    monkeypatch.setattr(services, "create_guest_lead", _spy)
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    r = client.post(
        "/api/v1/public/leads/guest",
        json=GUEST_PAYLOAD,
        headers={"x-forwarded-for": "198.51.100.9, 203.0.113.55"},
    )
    assert r.status_code == 201
    # rightmost = the entry appended by our edge, not the client-supplied one
    assert seen == ["203.0.113.55"]


def test_endpoint_ignores_xff_when_trust_disabled(mkt_client, monkeypatch):
    client, session = mkt_client
    session.scalar = AsyncMock(
        return_value=GuestLead(id="g-1", status=LeadStatus.NEW)
    )
    seen: list[str | None] = []

    async def _spy(s, payload, ip):
        seen.append(ip)
        return GuestLead(id="g-1", status=LeadStatus.NEW), False

    monkeypatch.setattr(services, "create_guest_lead", _spy)
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", False)
    client.post(
        "/api/v1/public/leads/guest",
        json=GUEST_PAYLOAD,
        headers={"x-forwarded-for": "198.51.100.9"},
    )
    assert seen and seen[0] != "198.51.100.9"  # socket peer, not the header


# ── Admin RBAC ────────────────────────────────────────────────────


def test_admin_endpoints_require_auth(mkt_client):
    client, _ = mkt_client
    assert client.get("/api/v1/admin/leads").status_code == 401
    assert client.get("/api/v1/admin/leads/summary").status_code == 401
    assert client.get("/api/v1/admin/leads/export.csv").status_code == 401
    assert (
        client.patch(
            "/api/v1/admin/leads/HOST/x/status", json={"status": "NEW"}
        ).status_code
        == 401
    )
    assert (
        client.post("/api/v1/admin/leads/HOST/x/notes", json={"note": "hi"}).status_code
        == 401
    )


def test_admin_endpoints_reject_non_admin(mkt_client, monkeypatch):
    client, _ = mkt_client
    host = _make_user(role="host")
    _patch_auth_user(monkeypatch, host)
    h = {"Authorization": f"Bearer {_token_for(host)}"}
    assert client.get("/api/v1/admin/leads", headers=h).status_code == 403
    assert client.get("/api/v1/admin/leads/summary", headers=h).status_code == 403
    assert client.get("/api/v1/admin/leads/export.csv", headers=h).status_code == 403
    assert (
        client.patch(
            "/api/v1/admin/leads/HOST/x/status", json={"status": "NEW"}, headers=h
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/v1/admin/leads/HOST/x/notes", json={"note": "hi"}, headers=h
        ).status_code
        == 403
    )


def test_admin_list_leads_ok(mkt_client, monkeypatch):
    client, session = mkt_client
    admin = _make_user()
    _patch_auth_user(monkeypatch, admin)
    session.scalars = AsyncMock(
        return_value=MagicMock(all=MagicMock(return_value=[]))
    )
    h = {"Authorization": f"Bearer {_token_for(admin)}"}
    r = client.get("/api/v1/admin/leads", headers=h)
    assert r.status_code == 200 and r.json() == []
    assert client.get("/api/v1/admin/leads?kind=host", headers=h).status_code == 422


def test_admin_set_status_validates(mkt_client, monkeypatch):
    client, session = mkt_client
    admin = _make_user()
    _patch_auth_user(monkeypatch, admin)
    h = {"Authorization": f"Bearer {_token_for(admin)}"}
    # invalid kind → 404 (prevents probing which kinds exist)
    assert (
        client.patch(
            "/api/v1/admin/leads/BOGUS/x/status",
            json={"status": "NEW"},
            headers=h,
        ).status_code
        == 404
    )
    # invalid status value → 422
    assert (
        client.patch(
            "/api/v1/admin/leads/HOST/x/status",
            json={"status": "BOGUS"},
            headers=h,
        ).status_code
        == 422
    )
    # nonexistent lead → 404
    session.get = AsyncMock(return_value=None)
    assert (
        client.patch(
            "/api/v1/admin/leads/HOST/nope/status",
            json={"status": "CONTACTED"},
            headers=h,
        ).status_code
        == 404
    )


def test_admin_note_requires_existing_lead(mkt_client, monkeypatch):
    client, session = mkt_client
    admin = _make_user()
    _patch_auth_user(monkeypatch, admin)
    session.get = AsyncMock(return_value=None)
    h = {"Authorization": f"Bearer {_token_for(admin)}"}
    assert (
        client.post(
            "/api/v1/admin/leads/HOST/nope/notes",
            json={"note": "hello"},
            headers=h,
        ).status_code
        == 404
    )
