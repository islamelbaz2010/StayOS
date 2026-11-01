"""Pre-launch marketing lead capture — validation, dedup, privacy rules."""
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
