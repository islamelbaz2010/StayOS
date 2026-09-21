"""Paymob Payment Intention + webhook hardening tests.

Deterministic — no real Paymob secrets required. Covers the acceptance
matrix: intention payload, env separation, HMAC scheme, webhook
integration/currency/amount validation, idempotency, and reconciliation.
"""

import hashlib
import hmac as hmac_module
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.database import get_session
from app.finance import providers
from app.main import app
from app.shared.exceptions import PaymentError, ValidationError


@pytest.fixture
def finance_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    async def _override() -> AsyncMock:
        yield fake_session

    app.dependency_overrides[get_session] = _override
    yield client
    app.dependency_overrides.pop(get_session, None)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _paymob_obj(**overrides: object) -> dict[str, object]:
    """A realistic Paymob transaction-callback ``obj``."""
    obj: dict[str, object] = {
        "id": 987654321,
        "amount_cents": 450000,
        "currency": "EGP",
        "success": True,
        "pending": False,
        "error_occured": False,
        "has_parent_transaction": False,
        "is_3d_secure": True,
        "is_auth": False,
        "is_capture": False,
        "is_refunded": False,
        "is_standalone_payment": True,
        "is_voided": False,
        "created_at": "2026-01-01T00:00:00.000000",
        "integration_id": 5935386,
        "owner": 123,
        "order": {"id": 555000111, "merchant_order_id": "res-abc"},
        "source_data": {"pan": "2346", "sub_type": "MasterCard", "type": "card"},
    }
    obj.update(overrides)
    return obj


def _signed_payload(obj: dict[str, object]) -> tuple[dict[str, object], str]:
    payload = {"type": "TRANSACTION", "obj": obj}
    signature = providers.compute_paymob_hmac(payload)
    return payload, signature


# ---------------------------------------------------------------------------
# HMAC — real Paymob scheme (ordered fields, SHA512)
# ---------------------------------------------------------------------------


def test_hmac_uses_sha512_over_ordered_fields() -> None:
    payload, signature = _signed_payload(_paymob_obj())
    assert len(signature) == 128  # sha512 hex digest
    assert providers.verify_paymob_hmac(payload, signature) is True
    assert providers.verify_paymob_hmac(payload, "0" * 128) is False


def test_hmac_matches_documented_field_concatenation() -> None:
    obj = _paymob_obj()
    payload, signature = _signed_payload(obj)
    signed = "".join(
        [
            "450000",
            "2026-01-01T00:00:00.000000",
            "EGP",
            "false",  # error_occured
            "false",  # has_parent_transaction
            "987654321",
            "5935386",
            "true",  # is_3d_secure
            "false",
            "false",
            "false",
            "true",
            "false",
            "555000111",  # order.id
            "123",
            "false",  # pending
            "2346",
            "MasterCard",
            "true",  # success
        ]
    )
    expected = hmac_module.new(
        providers.settings.PAYMOB_HMAC_SECRET.encode(),
        signed.encode(),
        hashlib.sha512,
    ).hexdigest()
    assert signature == expected


def test_hmac_rejects_missing_signature_and_secret(monkeypatch) -> None:
    payload, signature = _signed_payload(_paymob_obj())
    assert providers.verify_paymob_hmac(payload, None) is False
    monkeypatch.setattr(providers.settings, "PAYMOB_HMAC_SECRET", "")
    assert providers.verify_paymob_hmac(payload, signature) is False


def test_hmac_tampering_detected() -> None:
    obj = _paymob_obj()
    payload, signature = _signed_payload(obj)
    tampered = {"type": "TRANSACTION", "obj": {**obj, "amount_cents": 1}}
    assert providers.verify_paymob_hmac(tampered, signature) is False


# ---------------------------------------------------------------------------
# Extractors — Paymob sends numeric ids
# ---------------------------------------------------------------------------


def test_extractors_handle_numeric_ids() -> None:
    payload, _ = _signed_payload(_paymob_obj())
    assert providers.extract_paymob_provider_ref(payload) == "987654321"
    assert providers.extract_paymob_order_ref(payload) == "555000111"
    assert providers.extract_paymob_integration_id(payload) == "5935386"
    assert providers.extract_paymob_currency(payload) == "EGP"
    assert providers.extract_paymob_reservation_id(payload) == "res-abc"
    assert providers.extract_paymob_amount(payload) == 4500
    assert providers.extract_paymob_amount_cents(payload) == 450000
    assert providers.extract_paymob_status(payload) == "True"


def test_extract_reservation_id_from_payment_key_claims() -> None:
    obj = _paymob_obj(order={"id": 555000111})
    obj["payment_key_claims"] = {"extra": {"reservation_id": "res-xyz"}}
    payload, _ = _signed_payload(obj)
    assert providers.extract_paymob_reservation_id(payload) == "res-xyz"


# ---------------------------------------------------------------------------
# Payment Intention API
# ---------------------------------------------------------------------------


class _IntentionResponse:
    def __init__(self, payload: dict[str, object], status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            import httpx

            raise httpx.HTTPStatusError(
                "error", request=MagicMock(), response=MagicMock(status_code=self.status_code)
            )

    def json(self) -> dict[str, object]:
        return self._payload


class _IntentionClient:
    last_request: dict[str, object] | None = None

    async def __aenter__(self) -> "_IntentionClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, url: str, json: dict[str, object], **kw: object) -> _IntentionResponse:
        _IntentionClient.last_request = {"url": url, "json": json, "kwargs": kw}
        return _IntentionResponse({"id": "intention-1", "client_secret": "cs_123"})


def _configure_intention(monkeypatch, env: str = "development") -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", env)
    monkeypatch.setattr(providers.settings, "PAYMOB_SECRET_KEY", "sk_test_abc")
    monkeypatch.setattr(providers.settings, "PAYMOB_PUBLIC_KEY", "pk_test_xyz")
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    monkeypatch.setattr(providers.httpx, "AsyncClient", _IntentionClient)


@pytest.mark.asyncio
async def test_intention_payload_and_checkout_url(monkeypatch) -> None:
    _configure_intention(monkeypatch)
    result = await providers.create_paymob_payment("res-42", 4500)

    req = _IntentionClient.last_request
    assert req is not None
    assert req["url"].endswith("/v1/intention/")
    body = req["json"]
    assert body["amount"] == 450000
    assert body["currency"] == "EGP"
    assert body["payment_methods"] == [5935386]
    assert body["special_reference"] == "res-42"
    assert body["extras"]["reservation_id"] == "res-42"

    headers = req["kwargs"].get("headers", {})
    assert headers["Authorization"] == "Token sk_test_abc"

    assert result["order_id"] == "intention-1"
    assert result["payment_token"] == "cs_123"
    assert "publicKey=pk_test_xyz" in result["iframe_url"]
    assert "clientSecret=cs_123" in result["iframe_url"]


@pytest.mark.asyncio
async def test_intention_test_key_rejected_in_production(monkeypatch) -> None:
    _configure_intention(monkeypatch, env="production")
    with pytest.raises(PaymentError, match="test credentials"):
        await providers.create_paymob_payment("res-42", 4500)


@pytest.mark.asyncio
async def test_intention_live_key_rejected_outside_production(monkeypatch) -> None:
    _configure_intention(monkeypatch, env="development")
    monkeypatch.setattr(providers.settings, "PAYMOB_SECRET_KEY", "sk_live_abc")
    with pytest.raises(PaymentError, match="live credentials"):
        await providers.create_paymob_payment("res-42", 4500)


@pytest.mark.asyncio
async def test_intention_egy_regional_test_key_accepted(monkeypatch) -> None:
    # Paymob Egypt-region keys carry the marker inside the token.
    _configure_intention(monkeypatch)
    monkeypatch.setattr(
        providers.settings, "PAYMOB_SECRET_KEY", "egy_sk_test_abcd1234"
    )
    result = await providers.create_paymob_payment("res-42", 4500)
    assert result["order_id"] == "intention-1"


@pytest.mark.asyncio
async def test_intention_egy_regional_test_key_rejected_in_production(
    monkeypatch,
) -> None:
    _configure_intention(monkeypatch, env="production")
    monkeypatch.setattr(
        providers.settings, "PAYMOB_SECRET_KEY", "egy_sk_test_abcd1234"
    )
    with pytest.raises(PaymentError, match="test credentials"):
        await providers.create_paymob_payment("res-42", 4500)


@pytest.mark.asyncio
async def test_intention_missing_secret_key(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(providers.settings, "PAYMOB_SECRET_KEY", "")
    monkeypatch.setattr(providers.settings, "PAYMOB_API_KEY", "")
    with pytest.raises(PaymentError):
        await providers.create_paymob_payment("res-42", 4500)


@pytest.mark.asyncio
async def test_intention_missing_integration_id(monkeypatch) -> None:
    _configure_intention(monkeypatch)
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", None)
    with pytest.raises(PaymentError, match="integration"):
        await providers.create_paymob_payment("res-42", 4500)


@pytest.mark.asyncio
async def test_intention_4xx_not_retried(monkeypatch) -> None:
    _configure_intention(monkeypatch)

    class _BadRequest:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return None

        async def post(self, *a, **kw):
            return _IntentionResponse({"detail": "bad"}, status_code=400)

    monkeypatch.setattr(providers.httpx, "AsyncClient", _BadRequest)
    with pytest.raises(PaymentError):
        await providers.paymob_create_intention("res-42", 4500)


# ---------------------------------------------------------------------------
# Webhook hardening
# ---------------------------------------------------------------------------


def _post_webhook(client: TestClient, payload: dict, signature: str | None):
    url = "/api/v1/finance/webhooks/paymob"
    if signature is not None:
        return client.post(f"{url}?hmac={signature}", json=payload)
    return client.post(url, json=payload)


def _webhook_mocks(monkeypatch) -> AsyncMock:
    """Stub idempotency + confirmation; returns the confirm mock."""
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    confirm = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr(
        "app.reservations.services.confirm_reservation_by_provider", confirm
    )
    return confirm


def test_webhook_hmac_query_param_accepted(finance_client, monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    confirm = _webhook_mocks(monkeypatch)
    payload, sig = _signed_payload(_paymob_obj())
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.status_code == 200
    assert resp.json()["message"] == "processed"
    confirm.assert_awaited_once()
    # Amount must be passed through for reconciliation validation.
    assert confirm.await_args.kwargs["expected_amount_egp"] == 4500


def test_webhook_rejects_wrong_integration(finance_client, monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    confirm = _webhook_mocks(monkeypatch)
    payload, sig = _signed_payload(_paymob_obj(integration_id=9999999))
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.status_code == 200
    assert resp.json()["message"] == "ignored"
    confirm.assert_not_awaited()


def test_webhook_rejects_wrong_currency(finance_client, monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    confirm = _webhook_mocks(monkeypatch)
    payload, sig = _signed_payload(_paymob_obj(currency="USD"))
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.status_code == 200
    assert resp.json()["message"] == "ignored"
    confirm.assert_not_awaited()


def test_webhook_missing_signature_rejected(finance_client) -> None:
    payload, _ = _signed_payload(_paymob_obj())
    resp = _post_webhook(finance_client, payload, None)
    assert resp.status_code == 401


def test_webhook_missing_refs_rejected(finance_client, monkeypatch) -> None:
    payload, sig = _signed_payload(
        _paymob_obj(order={}, payment_key_claims={}, id=None)
    )
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.status_code in (400, 422)


def test_webhook_duplicate_callback_idempotent(finance_client, monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    confirm = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=False),
    )
    monkeypatch.setattr(
        "app.reservations.services.confirm_reservation_by_provider", confirm
    )
    payload, sig = _signed_payload(_paymob_obj())
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.json()["message"] == "already processed"
    confirm.assert_not_awaited()


def test_webhook_failed_payment(finance_client, monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 5935386)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    fail = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr("app.reservations.services.fail_reservation_by_provider", fail)
    payload, sig = _signed_payload(_paymob_obj(success=False))
    resp = _post_webhook(finance_client, payload, sig)
    assert resp.json()["message"] == "failed"
    fail.assert_awaited_once()


# ---------------------------------------------------------------------------
# Provider routing — Paymob primary (FD-01), Stripe dormant fallback
# ---------------------------------------------------------------------------


def test_provider_routing_paymob_wins_when_configured(monkeypatch) -> None:
    from app.reservations import services as res_svc
    from app.reservations.constants import PaymentMethod, PaymentProvider

    monkeypatch.setattr(res_svc.settings, "PAYMOB_SECRET_KEY", "sk_test_x")
    monkeypatch.setattr(res_svc.settings, "STRIPE_SECRET_KEY", "sk_test_y")
    # Even card bookings go to Paymob while Paymob is configured.
    for method in PaymentMethod:
        assert res_svc._payment_method_to_provider(method) == PaymentProvider.PAYMOB


def test_provider_routing_stripe_fallback_for_card(monkeypatch) -> None:
    from app.reservations import services as res_svc
    from app.reservations.constants import PaymentMethod, PaymentProvider

    monkeypatch.setattr(res_svc.settings, "PAYMOB_SECRET_KEY", "")
    monkeypatch.setattr(res_svc.settings, "PAYMOB_API_KEY", "")
    monkeypatch.setattr(res_svc.settings, "STRIPE_SECRET_KEY", "sk_test_y")
    assert res_svc._payment_method_to_provider(PaymentMethod.CARD) == PaymentProvider.STRIPE
    assert (
        res_svc._payment_method_to_provider(PaymentMethod.VODAFONE_CASH)
        == PaymentProvider.PAYMOB
    )


# ---------------------------------------------------------------------------
# Reconciliation — amount / ownership validation in the service layer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_confirm_rejects_amount_mismatch(monkeypatch) -> None:
    from app.reservations import services as res_svc
    from app.reservations.constants import PaymentStatus, ReservationStatus

    reservation = MagicMock()
    reservation.id = "res-1"
    reservation.status = ReservationStatus.PENDING_PAYMENT
    intent = MagicMock()
    intent.id = "pi-1"
    intent.reservation_id = "res-1"
    intent.provider = "paymob"
    intent.provider_ref = "intention-1"
    intent.amount_egp = 4500
    intent.status = PaymentStatus.PENDING
    intent.provider_metadata = None
    reservation.payment_intents = [intent]

    monkeypatch.setattr(
        res_svc.reservations_repository,
        "get_reservation_with_relations",
        AsyncMock(return_value=reservation),
    )
    monkeypatch.setattr(
        res_svc.reservations_repository,
        "get_payment_intent_by_provider_ref",
        AsyncMock(return_value=None),  # txn ref ≠ stored intention ref
    )

    with pytest.raises(ValidationError, match="amount"):
        await res_svc.confirm_reservation_by_provider(
            AsyncMock(),
            "res-1",
            "paymob",
            "txn-999",
            expected_amount_egp=9999,
        )


@pytest.mark.asyncio
async def test_confirm_matches_intent_via_reservation_fallback(monkeypatch) -> None:
    from app.reservations import services as res_svc
    from app.reservations.constants import PaymentStatus, ReservationStatus

    reservation = MagicMock()
    reservation.id = str(uuid.uuid4())
    reservation.status = ReservationStatus.PENDING_PAYMENT
    intent = MagicMock()
    intent.id = str(uuid.uuid4())
    intent.reservation_id = reservation.id
    intent.provider = "paymob"
    intent.provider_ref = "intention-1"
    intent.amount_egp = 4500
    intent.status = PaymentStatus.PENDING
    intent.provider_metadata = None
    reservation.payment_intents = [intent]

    session = AsyncMock()
    monkeypatch.setattr(
        res_svc.reservations_repository,
        "get_reservation_with_relations",
        AsyncMock(return_value=reservation),
    )
    monkeypatch.setattr(
        res_svc.reservations_repository,
        "get_payment_intent_by_provider_ref",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        res_svc.reservations_repository,
        "confirm_calendar_booking",
        AsyncMock(),
    )
    monkeypatch.setattr(
        res_svc, "_get_host_id_for_reservation", AsyncMock(return_value="host-1")
    )
    monkeypatch.setattr(res_svc, "write_event", AsyncMock())
    monkeypatch.setattr(res_svc, "_to_response", lambda r: MagicMock())

    await res_svc.confirm_reservation_by_provider(
        session, reservation.id, "paymob", "txn-999", expected_amount_egp=4500
    )
    assert intent.status == PaymentStatus.CAPTURED
    assert intent.provider_metadata["transaction_ref"] == "txn-999"
    assert reservation.status == ReservationStatus.CONFIRMED
