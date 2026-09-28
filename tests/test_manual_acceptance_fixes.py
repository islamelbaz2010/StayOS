"""Regression coverage for the manual-acceptance batch:

- Host earnings drifted call site (BookingEconomics is a single object,
  not a tuple — the unpacked call 500'd in production).
- Routine checkout completing the booking lifecycle without admin approval
  (auto-complete on checkout + hourly sweep for stays never checked out).
- KYC provider abstraction: session modes, webhook signature/state
  mapping, idempotent replays, terminal-state guards.
- KYC submit verifying claimed object keys (phantom "Back" document slot).
"""

import hashlib
import hmac
import json
import uuid
from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings import services as booking_services
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.host import services as host_services
from app.kyc import repository as kyc_repository
from app.kyc import services as kyc_services
from app.kyc.models import KycDocument
from app.kyc.providers.base import ProviderEvent, ProviderOutcome, VerificationSession
from app.kyc.providers.sumsub import SumsubProvider
from app.main import app
from app.payments.constants import PaymentStatus
from app.payments.models import Payment

_FUTURE_1 = date.today() + timedelta(days=10)
_FUTURE_2 = date.today() + timedelta(days=13)


def _make_user(user_id: str = "user-1", role: str = "guest", kyc_status: str = "unverified") -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+1234567890",
        email="u@example.com",
        firebase_uid=None,
        display_name="T",
        locale="ar",
        role=role,
        kyc_status=kyc_status,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


# ---------------------------------------------------------------------------
# Host earnings — production regression
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_host_earnings_with_verified_payment(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: booking_economics returns a single BookingEconomics
    object; the drifted ``economics, _ = ...`` unpack raised TypeError and
    500'd /host/earnings for any host with a verified payment."""
    host = _make_user(user_id="host-1", role="host")

    from app.host import repository as host_repository

    monkeypatch.setattr(
        host_repository,
        "get_host_earnings",
        AsyncMock(
            return_value={
                "total_bookings": 1,
                "confirmed_bookings": 1,
                "completed_stays": 1,
                "total_revenue_egp": 3000,
                "pending_verification_egp": 0,
                "refund_pending_egp": 0,
                "net_earnings_egp": 0,
                "per_unit": [],
            }
        ),
    )

    payment = MagicMock(spec=Payment)
    payment.host_id = host.id
    payment.status = str(PaymentStatus.VERIFIED)

    escrow_result = MagicMock()
    escrow_result.scalars.return_value.all.return_value = []
    payments_result = MagicMock()
    payments_result.scalars.return_value.all.return_value = [payment]
    card_result = MagicMock()
    card_result.scalar.return_value = 0
    fake_session.execute = AsyncMock(
        side_effect=[escrow_result, payments_result, card_result]
    )

    from app.finance import services as finance_services

    monkeypatch.setattr(
        finance_services,
        "booking_economics",
        AsyncMock(
            return_value=SimpleNamespace(host_net_egp=2750, platform_share_egp=250)
        ),
    )

    result = await host_services.get_host_earnings(fake_session, host)
    assert result.host_earnings_egp == 2750


# ---------------------------------------------------------------------------
# Booking completion lifecycle
# ---------------------------------------------------------------------------


def _make_booking(user_id: str = "guest-1", **kwargs: object) -> Booking:
    now = datetime.now(UTC)
    unit = MagicMock()
    unit.id = "unit-1"
    unit.host_id = "host-1"
    listing = MagicMock()
    listing.title_en = "Test Apt"
    listing.title_ar = "شقة"
    unit.listing = listing
    return Booking(
        id=kwargs.get("id") or str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id=user_id,
        status=str(kwargs.get("status") or BookingStatus.CONFIRMED),
        check_in=kwargs.get("check_in") or _FUTURE_1,
        check_out=kwargs.get("check_out") or _FUTURE_2,
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        created_at=now,
        updated_at=now,
        checked_in_at=kwargs.get("checked_in_at"),
        checked_out_at=kwargs.get("checked_out_at"),
        unit=unit,
    )


def _capture_update(monkeypatch) -> None:
    async def _apply(session, booking, **kwargs):
        for key, value in kwargs.items():
            setattr(booking, key, value)
        return booking

    monkeypatch.setattr(bookings_repository, "update_booking", _apply)


@pytest.mark.asyncio
async def test_checkout_completes_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A routine guest/host checkout must transition CONFIRMED → COMPLETED
    directly — admin approval is not part of the normal lifecycle."""
    guest = _make_user(user_id="guest-1")
    booking = _make_booking(checked_in_at=datetime.now(UTC))

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        booking_services, "_cancellation_actor", AsyncMock(return_value="guest")
    )
    monkeypatch.setattr(booking_services, "write_event", AsyncMock())
    _capture_update(monkeypatch)

    response = await booking_services.check_out_booking(
        fake_session, guest, booking.id
    )
    assert response.status == "completed"
    assert booking.checked_out_at is not None


@pytest.mark.asyncio
async def test_complete_booking_system_fills_missing_checkout(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """The hourly sweep completes stays whose checkout day passed without
    an explicit checkout, anchoring checked_out_at to the checkout day."""
    booking = _make_booking(check_out=date.today() - timedelta(days=1))
    assert booking.checked_out_at is None

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(booking_services, "write_event", AsyncMock())
    _capture_update(monkeypatch)

    updated = await booking_services.complete_booking_system(fake_session, booking.id)
    assert updated.status == str(BookingStatus.COMPLETED)
    assert updated.checked_out_at is not None


@pytest.mark.asyncio
async def test_complete_booking_system_rejects_wrong_state(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.shared.exceptions import ValidationError

    booking = _make_booking(status=BookingStatus.CANCELLED)
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    with pytest.raises(ValidationError):
        await booking_services.complete_booking_system(fake_session, booking.id)


# ---------------------------------------------------------------------------
# KYC — provider abstraction
# ---------------------------------------------------------------------------


class _FakeProvider:
    seen_applicant: str | None = None

    def __init__(self, name: str = "fakesub"):
        self.name = name

    async def create_session(self, user_id, applicant_id=None):
        self.seen_applicant = applicant_id
        return VerificationSession(
            provider=self.name,
            applicant_id=applicant_id or "app-123",
            access_token="sdk-token",
            expires_at=None,
        )

    async def get_applicant_legal_name(self, applicant_id):
        return "Test Person"


@pytest.mark.asyncio
async def test_verification_session_manual_mode(
    fake_session: AsyncMock, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "KYC_VERIFICATION_MODE", "manual")
    user = _make_user()
    resp = await kyc_services.create_verification_session(fake_session, user)
    assert resp.mode == "manual"
    assert resp.access_token is None


@pytest.mark.asyncio
async def test_verification_session_automated_unconfigured_fails(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.shared.exceptions import ServiceUnavailableError

    monkeypatch.setattr(settings, "KYC_VERIFICATION_MODE", "automated")
    monkeypatch.setattr(kyc_services, "get_verification_provider", lambda: None)
    with pytest.raises(ServiceUnavailableError):
        await kyc_services.create_verification_session(
            fake_session, _make_user()
        )


@pytest.mark.asyncio
async def test_verification_session_fallback_returns_manual(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Provider unavailable under automated_fallback → manual upload path,
    never a fabricated verification."""
    monkeypatch.setattr(settings, "KYC_VERIFICATION_MODE", "automated_fallback")
    monkeypatch.setattr(kyc_services, "get_verification_provider", lambda: None)
    resp = await kyc_services.create_verification_session(
        fake_session, _make_user()
    )
    assert resp.mode == "manual"


@pytest.mark.asyncio
async def test_verification_session_creates_provider_document(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.auth import repository as auth_repository

    monkeypatch.setattr(settings, "KYC_VERIFICATION_MODE", "automated")
    provider = _FakeProvider()
    monkeypatch.setattr(
        kyc_services, "get_verification_provider", lambda: provider
    )
    monkeypatch.setattr(
        kyc_repository, "get_kyc_documents_by_user_id", AsyncMock(return_value=[])
    )
    created = {}

    async def _create(session, **kwargs):
        created.update(kwargs)
        return _make_doc(user_id=kwargs["user_id"], status="pending",
                         provider=kwargs.get("provider"),
                         applicant_id=kwargs.get("provider_applicant_id"))

    monkeypatch.setattr(kyc_repository, "create_kyc_document", _create)
    monkeypatch.setattr(
        auth_repository, "get_account_by_user_id", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(auth_repository, "update_user", AsyncMock())

    user = _make_user()
    resp = await kyc_services.create_verification_session(fake_session, user)

    assert resp.mode == "fakesub"
    assert resp.access_token == "sdk-token"
    assert created["provider"] == "fakesub"
    assert created["provider_applicant_id"] == "app-123"
    assert created["document_type"] == "provider_managed"


@pytest.mark.asyncio
async def test_verification_session_resumes_existing_applicant(
    fake_session: AsyncMock, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "KYC_VERIFICATION_MODE", "automated")
    provider = _FakeProvider()
    monkeypatch.setattr(
        kyc_services, "get_verification_provider", lambda: provider
    )
    existing = _make_doc(
        user_id="user-1", status="retry_required",
        provider="fakesub", applicant_id="app-777",
    )
    monkeypatch.setattr(
        kyc_repository,
        "get_kyc_documents_by_user_id",
        AsyncMock(return_value=[existing]),
    )
    from app.auth import repository as auth_repository
    monkeypatch.setattr(
        auth_repository, "get_account_by_user_id", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(auth_repository, "update_user", AsyncMock())

    resp = await kyc_services.create_verification_session(
        fake_session, _make_user(user_id="user-1")
    )
    assert provider.seen_applicant == "app-777"
    assert resp.document_id == existing.id


def _make_doc(
    user_id: str = "user-1",
    status: str = "pending",
    provider: str | None = None,
    applicant_id: str | None = None,
) -> KycDocument:
    now = datetime.now(UTC)
    doc = KycDocument(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=None,
        document_type="provider_managed" if provider else "national_id",
        status=status,
        created_at=now,
        updated_at=now,
    )
    doc.provider = provider
    doc.provider_applicant_id = applicant_id
    return doc


# ---- Sumsub signature verification ---------------------------------------


def _sumsub_headers(secret: str, body: bytes, alg="sha256") -> dict[str, str]:
    digest = hmac.new(secret.encode(), body, getattr(hashlib, alg)).hexdigest()
    alg_name = {
        "sha256": "HMAC_SHA256_HEX",
        "sha512": "HMAC_SHA512_HEX",
        "sha1": "HMAC_SHA1_HEX",
    }[alg]
    return {"x-payload-digest": digest, "x-payload-digest-alg": alg_name}


def test_sumsub_webhook_signature_valid(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUMSUB_WEBHOOK_SECRET", "whsec")
    body = b'{"type":"applicantReviewed"}'
    provider = SumsubProvider()
    assert provider.verify_webhook_signature(
        _sumsub_headers("whsec", body), body
    )
    assert provider.verify_webhook_signature(
        _sumsub_headers("whsec", body, "sha512"), body
    )


def test_sumsub_webhook_signature_fails_closed(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUMSUB_WEBHOOK_SECRET", "")
    monkeypatch.setattr(settings, "SUMSUB_SECRET_KEY", "")
    provider = SumsubProvider()
    assert not provider.verify_webhook_signature(
        {"x-payload-digest": "x"}, b"{}"
    )
    monkeypatch.setattr(settings, "SUMSUB_WEBHOOK_SECRET", "whsec")
    assert not provider.verify_webhook_signature(
        {"x-payload-digest": "deadbeef"}, b"{}"
    )
    assert not provider.verify_webhook_signature(
        _sumsub_headers("other-secret", b"{}"), b"{}"
    )


# ---- Sumsub webhook payload → outcome mapping -----------------------------


def _payload(answer=None, reject_type=None, event="applicantReviewed"):
    p = {"type": event, "applicantId": "app-1", "externalUserId": "u1"}
    if answer:
        p["reviewResult"] = {
            "reviewAnswer": answer,
            "reviewRejectType": reject_type,
        }
    return p


@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        (_payload(answer="GREEN"), ProviderOutcome.VERIFIED),
        (_payload(answer="RED", reject_type="FINAL"), ProviderOutcome.REJECTED),
        (_payload(answer="RED", reject_type="RETRY"), ProviderOutcome.RETRY_REQUIRED),
        (_payload(answer="RED", reject_type="EXTERNAL"), ProviderOutcome.MANUAL_REVIEW),
        (_payload(event="applicantOnHold"), ProviderOutcome.MANUAL_REVIEW),
        (_payload(event="applicantPending"), ProviderOutcome.IN_PROGRESS),
        (_payload(event="applicantAwaitingUser"), ProviderOutcome.RETRY_REQUIRED),
        (_payload(event="applicantCreated"), None),
        (_payload(answer="IGNORE"), None),
    ],
)
def test_sumsub_webhook_mapping(payload, expected) -> None:
    event = SumsubProvider().parse_webhook(payload)
    assert (event.outcome if event else None) == expected


# ---- Server-authoritative event application --------------------------------


def _wire_apply(monkeypatch, doc_status: str = "pending"):
    doc = _make_doc(
        status=doc_status, provider="sumsub", applicant_id="app-1"
    )

    async def _update(session, d, **kwargs):
        for k, v in kwargs.items():
            setattr(d, k, v)
        return d

    monkeypatch.setattr(
        kyc_repository,
        "get_kyc_document_by_applicant",
        AsyncMock(return_value=doc),
    )
    monkeypatch.setattr(kyc_repository, "update_kyc_document", _update)

    from app.auth import repository as auth_repository

    owner = _make_user(user_id=doc.user_id)
    monkeypatch.setattr(
        auth_repository, "get_user_by_id", AsyncMock(return_value=owner)
    )
    monkeypatch.setattr(auth_repository, "update_user", AsyncMock())
    monkeypatch.setattr(
        auth_repository, "get_account_by_user_id", AsyncMock(return_value=None)
    )
    return doc, owner


@pytest.mark.asyncio
async def test_apply_green_verifies(fake_session: AsyncMock, monkeypatch) -> None:
    doc, owner = _wire_apply(monkeypatch)
    monkeypatch.setattr(
        kyc_services,
        "get_verification_provider",
        lambda: _FakeProvider(name="sumsub"),
    )
    event = ProviderEvent(
        provider="sumsub",
        applicant_id="app-1",
        outcome=ProviderOutcome.VERIFIED,
        event_type="applicantReviewed",
    )
    result = await kyc_services.apply_provider_event(fake_session, event)
    assert result == "processed"
    assert doc.status == "verified"
    assert doc.verified_at is not None
    assert doc.legal_name == "Test Person"
    auth_update = kyc_services.auth_repository.update_user
    assert any(
        c.kwargs.get("kyc_status") == "verified" for c in auth_update.mock_calls
    )


@pytest.mark.asyncio
async def test_apply_retry_and_manual_review(
    fake_session: AsyncMock, monkeypatch
) -> None:
    doc, _ = _wire_apply(monkeypatch)
    event = ProviderEvent(
        provider="sumsub",
        applicant_id="app-1",
        outcome=ProviderOutcome.RETRY_REQUIRED,
        event_type="applicantReviewed",
    )
    assert await kyc_services.apply_provider_event(fake_session, event) == "processed"
    assert doc.status == "retry_required"

    doc.status = "pending"
    event.outcome = ProviderOutcome.MANUAL_REVIEW
    assert await kyc_services.apply_provider_event(fake_session, event) == "processed"
    assert doc.status == "manual_review"


@pytest.mark.asyncio
async def test_apply_is_idempotent_and_immutable(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Duplicate webhooks must not create duplicate transitions; a verified
    record never downgrades; rejection can only be corrected by VERIFIED."""
    doc, _ = _wire_apply(monkeypatch, doc_status="verified")
    event = ProviderEvent(
        provider="sumsub",
        applicant_id="app-1",
        outcome=ProviderOutcome.REJECTED,
        event_type="applicantReviewed",
    )
    assert await kyc_services.apply_provider_event(fake_session, event) == "ignored"
    assert doc.status == "verified"

    doc.status = "verified"
    event.outcome = ProviderOutcome.VERIFIED
    assert (
        await kyc_services.apply_provider_event(fake_session, event)
        == "already processed"
    )

    doc.status = "rejected"
    event.outcome = ProviderOutcome.RETRY_REQUIRED
    assert await kyc_services.apply_provider_event(fake_session, event) == "ignored"
    assert doc.status == "rejected"


@pytest.mark.asyncio
async def test_apply_unknown_applicant(fake_session: AsyncMock, monkeypatch) -> None:
    monkeypatch.setattr(
        kyc_repository,
        "get_kyc_document_by_applicant",
        AsyncMock(return_value=None),
    )
    event = ProviderEvent(
        provider="sumsub",
        applicant_id="ghost",
        outcome=ProviderOutcome.VERIFIED,
        event_type="applicantReviewed",
    )
    assert await kyc_services.apply_provider_event(fake_session, event) == "not found"


# ---- Webhook endpoint -------------------------------------------------------


def test_sumsub_webhook_endpoint_verifies_signature(
    client: TestClient, fake_session: AsyncMock, monkeypatch
) -> None:
    from app.database import get_session

    async def _override():
        yield fake_session

    app.dependency_overrides[get_session] = _override
    monkeypatch.setattr(settings, "SUMSUB_WEBHOOK_SECRET", "whsec")
    monkeypatch.setattr(
        kyc_services, "apply_provider_event", AsyncMock(return_value="processed")
    )
    try:
        body = json.dumps(_payload(answer="GREEN")).encode()
        bad = client.post("/api/v1/kyc/webhooks/sumsub", content=body)
        assert bad.status_code == 401

        good = client.post(
            "/api/v1/kyc/webhooks/sumsub",
            content=body,
            headers=_sumsub_headers("whsec", body),
        )
        assert good.status_code == 200
        assert good.json()["message"] == "processed"
    finally:
        app.dependency_overrides.pop(get_session, None)


# ---- Submit clears phantom document keys ------------------------------------


@pytest.mark.asyncio
async def test_submit_clears_unuploaded_keys(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Initiate records all three keys; if the browser never PUT the back
    image, submit must clear the phantom key so admin sees exactly what
    was uploaded (front + selfie, no misleading empty Back slot)."""
    user = _make_user()
    doc = _make_doc(user_id=user.id)
    doc.front_image_key = "kyc/u/d/front.jpg"
    doc.back_image_key = "kyc/u/d/back.jpg"  # claimed, never uploaded
    doc.selfie_image_key = "kyc/u/d/selfie.jpg"

    monkeypatch.setattr(
        kyc_repository, "get_kyc_document_by_id", AsyncMock(return_value=doc)
    )

    async def _update(session, d, **kwargs):
        for k, v in kwargs.items():
            setattr(d, k, v)
        return d

    monkeypatch.setattr(kyc_repository, "update_kyc_document", _update)
    monkeypatch.setattr(
        kyc_services,
        "_object_exists",
        lambda bucket, key: "back" not in key,
    )
    monkeypatch.setattr(kyc_services, "_queue_kyc_processing", lambda _id: None)

    from app.auth import repository as auth_repository

    monkeypatch.setattr(auth_repository, "update_user", AsyncMock())

    updated = await kyc_services.submit_kyc_document(fake_session, user, doc.id)
    assert updated.back_image_key is None
    assert updated.front_image_key is not None
    assert updated.status == "pending"
