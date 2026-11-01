"""Pre-launch marketing lead capture — validation, dedup, privacy rules."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.marketing.constants import ALLOWED_EVENTS, LeadStatus
from app.marketing.schemas import EventCreate, GuestLeadCreate, HostLeadCreate
from app.marketing.services import hash_ip, normalize_email, normalize_phone

# ── Host lead validation ──────────────────────────────────────────

def _host(**kw):
    base = dict(
        full_name="Test Host", phone="+201001234567", city="Cairo",
        property_type="apartment", units_count=2, consent=True,
    )
    base.update(kw)
    return HostLeadCreate(**base)


def test_host_lead_valid():
    lead = _host()
    assert lead.property_type == "apartment" and lead.units_count == 2


def test_host_consent_required():
    with pytest.raises(ValidationError):
        _host(consent=False)
    with pytest.raises(ValidationError):
        _host(consent=None)


def test_host_property_type_allowlist():
    for bad in ("castle", "APARTMENT", "yacht", ""):
        with pytest.raises(ValidationError):
            _host(property_type=bad)
    for ok in ("villa", "chalet", "serviced_apartment", "hotel_resort", "other"):
        assert _host(property_type=ok).property_type == ok


def test_host_units_positive():
    for bad in (0, -3):
        with pytest.raises(ValidationError):
            _host(units_count=bad)


def test_host_email_validated_when_present():
    with pytest.raises(ValidationError):
        _host(email="not-an-email")
    assert _host(email="host@makazoh.com").email == "host@makazoh.com"
    assert _host(email=None).email is None


def test_host_phone_charset():
    with pytest.raises(ValidationError):
        _host(phone="abc; DROP TABLE")
    assert _host(phone="+20 (100) 123-4567").phone == "+20 (100) 123-4567"


def test_host_readiness_and_contact_allowlists():
    with pytest.raises(ValidationError):
        _host(property_readiness="maybe")
    with pytest.raises(ValidationError):
        _host(preferred_contact="fax")
    assert _host(preferred_contact="whatsapp").preferred_contact == "whatsapp"


# ── Guest lead validation ─────────────────────────────────────────

def _guest(**kw):
    base = dict(name="Test Guest", email="g@example.com", consent=True)
    base.update(kw)
    return GuestLeadCreate(**base)


def test_guest_lead_valid_email_or_phone():
    assert _guest().contact_key() == "g@example.com"
    assert _guest(email=None, phone="+201001234").contact_key() == "+201001234"


def test_guest_requires_contact():
    with pytest.raises(ValidationError, match="email or phone is required"):
        _guest(email=None, phone=None)


def test_guest_consent_required():
    with pytest.raises(ValidationError):
        _guest(consent=False)


def test_guest_email_format():
    with pytest.raises(ValidationError):
        _guest(email="bad@@x")


# ── Phone normalization (dedup key) ───────────────────────────────

def test_phone_normalization():
    assert normalize_phone("+20 100 123-4567") == "+201001234567"
    assert normalize_phone("0100-123-4567") == "01001234567"
    assert normalize_phone(" +1 (555) 000-1111 ") == "+15550001111"
    # same number, different formatting → same key → dedup works
    assert normalize_phone("+201001234567") == normalize_phone("+20 100 123 4567")


# ── Events allowlist ──────────────────────────────────────────────

def test_event_allowlist():
    with pytest.raises(ValidationError):
        EventCreate(event="arbitrary_injection")
    with pytest.raises(ValidationError):
        EventCreate(event="admin_delete")
    for ev in ALLOWED_EVENTS:
        assert EventCreate(event=ev).event == ev


def test_honeypot_field_accepted_then_ignored():
    # the router silently accepts honeypot fills — the schema must NOT reject them
    lead = _guest(website="spam.example")
    assert lead.website == "spam.example"


# ── Privacy / security helpers ────────────────────────────────────

def test_ip_hash_hmac_keyed_and_safe_without_key():
    # without a configured key → no predictable hash is stored at all
    h_nokey = hash_ip("203.0.113.7")
    assert h_nokey is None
    from app.config import settings
    settings.LEADS_IP_HMAC_KEY = "test-hmac-key"
    try:
        h1 = hash_ip("203.0.113.7")
        h2 = hash_ip("203.0.113.7")
        assert h1 == h2 and h1 != "203.0.113.7" and len(h1) == 32
        assert hash_ip("203.0.113.8") != h1  # keyed per-IP
        settings.LEADS_IP_HMAC_KEY = "different-key"
        assert hash_ip("203.0.113.7") != h1  # rotation changes output
    finally:
        settings.LEADS_IP_HMAC_KEY = ""


def test_contact_normalization():
    assert normalize_email("  User@Example.COM ") == "user@example.com"
    # same guest contact in different forms → same dedup key
    assert normalize_email("G@X.com") == normalize_email("g@x.com")
    assert normalize_phone("+20 100 123-4567") == "+201001234567"


def test_lead_status_lifecycle():
    assert LeadStatus.ALL == ("NEW", "CONTACTED", "QUALIFIED", "INVITED", "ONBOARDED", "NOT_A_FIT")


# ── Trusted-proxy client-IP resolution ────────────────────────────
# The Caddy edge APPENDS the real peer IP to X-Forwarded-For — the
# rightmost entry is trusted, leftmost is requester-controlled.


def _req(client_host: str = "10.0.0.1", xff: str | None = None):
    req = MagicMock()
    req.client = MagicMock(host=client_host)
    req.headers = {"x-forwarded-for": xff} if xff else {}
    return req


def test_client_ip_ignores_xff_when_trust_disabled(monkeypatch):
    from app.config import settings
    from app.security.client_ip import client_ip

    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", False)
    # a forged header must never reach attribution when trust is off
    assert client_ip(_req("10.0.0.1", "198.51.100.9")) == "10.0.0.1"


def test_client_ip_uses_rightmost_edge_entry_when_trusted(monkeypatch):
    from app.config import settings
    from app.security.client_ip import client_ip

    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    # Caddy appends the real client IP — client-supplied leftmost values
    # are attacker-controlled and must be discarded
    assert client_ip(_req("10.0.0.1", "1.2.3.4, 203.0.113.7")) == "203.0.113.7"
    assert client_ip(_req("10.0.0.1", "203.0.113.7")) == "203.0.113.7"
    assert client_ip(_req("10.0.0.1", " 9.9.9.9 , 8.8.8.8 ")) == "8.8.8.8"
    # no header → socket peer fallback
    assert client_ip(_req("10.0.0.1", None)) == "10.0.0.1"


@pytest.mark.asyncio
async def test_rate_limit_keys_on_trusted_client_ip(monkeypatch):
    """Spoofed XFF must not change the rate-limit bucket; distinct
    visitors must get distinct buckets."""
    from app.config import settings
    from app.security.rate_limit import rate_limit
    from app.shared import redis as redis_state

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
    redis = AsyncMock()
    redis.eval = AsyncMock(return_value=0)
    monkeypatch.setattr(redis_state, "redis_client", redis)

    req = _req("172.18.0.2", "6.6.6.6, 203.0.113.7")
    req.url.path = "/api/v1/public/leads/host"
    await rate_limit(req, key_prefix="leads", limit=10, window_seconds=300)
    key = redis.eval.call_args.args[2]
    assert "203.0.113.7" in key and "6.6.6.6" not in key and "172.18.0.2" not in key

    # different real visitor → different bucket
    redis.eval.reset_mock()
    req2 = _req("172.18.0.2", "1.1.1.1, 198.51.100.4")
    req2.url.path = "/api/v1/public/leads/host"
    await rate_limit(req2, key_prefix="leads", limit=10, window_seconds=300)
    assert redis.eval.call_args.args[2] != key
