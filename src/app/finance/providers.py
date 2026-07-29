import asyncio
import hashlib
import hmac
import json
import time
from typing import Any, cast

import httpx

from app.config import settings
from app.shared.exceptions import PaymentError


def _canonical_payload(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def compute_paymob_signature(payload: dict[str, Any]) -> str:
    """Compute the Paymob HMAC signature for a payload using the merchant secret."""
    return hmac.new(
        settings.PAYMOB_HMAC_SECRET.encode(),
        _canonical_payload(payload).encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_paymob_hmac(
    payload: dict[str, Any], signature_header: str | None
) -> bool:
    """Verify a Paymob webhook HMAC signature.

    Paymob signatures are typically computed over a canonical ordered JSON
    representation of the webhook payload using the merchant HMAC secret.
    """
    if not signature_header or not settings.PAYMOB_HMAC_SECRET:
        return False
    expected = hmac.new(
        settings.PAYMOB_HMAC_SECRET.encode(),
        _canonical_payload(payload).encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def verify_stripe_signature(
    payload: bytes, signature_header: str | None, secret: str
) -> bool:
    """Verify a Stripe webhook signature using the signed payload format."""
    if not signature_header or not secret:
        return False

    parts = dict(part.split("=") for part in signature_header.split(",") if "=" in part)
    timestamp = parts.get("t")
    signature = parts.get("v1")
    if not timestamp or not signature:
        return False

    # Optional timestamp tolerance: reject webhooks older than 5 minutes.
    try:
        if abs(time.time() - int(timestamp)) > 300:
            return False
    except ValueError:
        return False

    signed_payload = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(
        secret.encode(), signed_payload.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


_PAYMOB_BASE = "https://accept.paymob.com/api"
_STRIPE_BASE = "https://api.stripe.com/v1"
_MAX_RETRIES = 3
_BACKOFF_SECONDS = 2


async def _paymob_post(
    client: httpx.AsyncClient, path: str, payload: dict[str, Any]
) -> dict[str, Any]:
    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.post(
                f"{_PAYMOB_BASE}{path}", json=payload, timeout=30.0
            )
            response.raise_for_status()
            return cast(dict[str, Any], response.json())
        except httpx.TimeoutException as exc:
            if attempt == _MAX_RETRIES - 1:
                raise PaymentError(f"Paymob request timed out: {exc}") from exc
            await asyncio.sleep(_BACKOFF_SECONDS**attempt)
        except httpx.HTTPError as exc:
            if attempt == _MAX_RETRIES - 1:
                raise PaymentError(f"Paymob request failed: {exc}") from exc
            await asyncio.sleep(_BACKOFF_SECONDS**attempt)
    raise PaymentError("Paymob request exhausted retries")


async def paymob_auth_token() -> str:
    """Authenticate with Paymob and return a temporary auth token."""
    if settings.ENVIRONMENT == "test":
        return "paymob-token-test"
    if not settings.PAYMOB_API_KEY:
        raise PaymentError("Paymob API key not configured")

    async with httpx.AsyncClient() as client:
        data = await _paymob_post(client, "/auth/tokens", {"api_key": settings.PAYMOB_API_KEY})
        token = data.get("token")
        if not token:
            raise PaymentError("Paymob auth token missing")
        return str(token)


async def paymob_create_order(
    auth_token: str, reservation_id: str, amount_egp: int
) -> dict[str, Any]:
    """Create a Paymob order for a reservation."""
    if settings.ENVIRONMENT == "test":
        return {"id": f"paymob-order-{reservation_id}"}

    payload = {
        "auth_token": auth_token,
        "delivery_needed": "false",
        "amount_cents": amount_egp * 100,
        "currency": "EGP",
        "merchant_order_id": reservation_id,
        "items": [],
    }
    async with httpx.AsyncClient() as client:
        return await _paymob_post(client, "/ecommerce/orders", payload)


async def paymob_create_payment_key(
    auth_token: str, order_id: str, amount_egp: int, billing_data: dict[str, Any]
) -> dict[str, Any]:
    """Create a Paymob payment key (iframe token)."""
    if settings.ENVIRONMENT == "test":
        return {"token": f"paymob-token-{order_id}"}

    integration_id = settings.PAYMOB_INTEGRATION_ID
    if not integration_id:
        raise PaymentError("Paymob integration id not configured")

    payload = {
        "auth_token": auth_token,
        "amount_cents": amount_egp * 100,
        "expiration": 3600,
        "order_id": order_id,
        "billing_data": billing_data,
        "currency": "EGP",
        "integration_id": integration_id,
        "lock_order_when_paid": "false",
    }
    async with httpx.AsyncClient() as client:
        return await _paymob_post(client, "/acceptance/payment_keys", payload)


async def create_paymob_payment(
    reservation_id: str, amount_egp: int, billing_data: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Create a full Paymob checkout (order + iframe token)."""
    if settings.ENVIRONMENT == "test":
        order_id = f"paymob-order-{reservation_id}"
        token = f"paymob-token-{order_id}"
        iframe_id = settings.PAYMOB_IFRAME_ID or settings.PAYMOB_INTEGRATION_ID or 1
        return {
            "provider": "paymob",
            "order_id": order_id,
            "payment_token": token,
            "iframe_url": f"https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={token}",
        }

    auth_token = await paymob_auth_token()
    order = await paymob_create_order(auth_token, reservation_id, amount_egp)
    raw_order_id = order.get("id")
    if not raw_order_id:
        raise PaymentError("Paymob order id missing")
    order_id = str(raw_order_id)

    default_billing = {
        "first_name": "Guest",
        "last_name": "StayOS",
        "email": "guest@stayos.co",
        "phone_number": "+20",
        "city": "Cairo",
        "country": "EG",
        "street": "N/A",
        "building": "N/A",
        "floor": "N/A",
        "apartment": "N/A",
    }
    billing = billing_data or default_billing
    key = await paymob_create_payment_key(auth_token, order_id, amount_egp, billing)
    payment_token = key.get("token")
    if not payment_token:
        raise PaymentError("Paymob payment token missing")

    live_iframe_id: int | None = settings.PAYMOB_IFRAME_ID or settings.PAYMOB_INTEGRATION_ID
    iframe_url: str | None = None
    if live_iframe_id:
        iframe_url = f"https://accept.paymob.com/api/acceptance/iframes/{live_iframe_id}?payment_token={payment_token}"

    return {
        "provider": "paymob",
        "order_id": order_id,
        "payment_token": payment_token,
        "iframe_url": iframe_url,
    }


async def _stripe_post(
    client: httpx.AsyncClient, path: str, payload: dict[str, Any]
) -> dict[str, Any]:
    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.post(
                f"{_STRIPE_BASE}{path}",
                data=payload,
                auth=(settings.STRIPE_SECRET_KEY, ""),
                timeout=30.0,
            )
            response.raise_for_status()
            return cast(dict[str, Any], response.json())
        except httpx.TimeoutException as exc:
            if attempt == _MAX_RETRIES - 1:
                raise PaymentError(f"Stripe request timed out: {exc}") from exc
            await asyncio.sleep(_BACKOFF_SECONDS**attempt)
        except httpx.HTTPError as exc:
            if attempt == _MAX_RETRIES - 1:
                raise PaymentError(f"Stripe request failed: {exc}") from exc
            await asyncio.sleep(_BACKOFF_SECONDS**attempt)
    raise PaymentError("Stripe request exhausted retries")


async def create_stripe_payment_intent(
    reservation_id: str, amount_egp: int
) -> dict[str, Any]:
    """Create a Stripe PaymentIntent for a reservation."""
    if settings.ENVIRONMENT == "test":
        return {
            "provider": "stripe",
            "payment_intent_id": f"pi_test_{reservation_id}",
            "client_secret": f"pi_test_{reservation_id}_secret",
            "status": "requires_confirmation",
        }
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentError("Stripe secret key not configured")

    payload = {
        "amount": str(amount_egp * 100),
        "currency": "egp",
        "automatic_payment_methods[enabled]": "true",
        "metadata[reservation_id]": reservation_id,
    }
    async with httpx.AsyncClient() as client:
        data = await _stripe_post(client, "/payment_intents", payload)
        return {
            "provider": "stripe",
            "payment_intent_id": data.get("id"),
            "client_secret": data.get("client_secret"),
            "status": data.get("status"),
        }


async def capture_stripe_payment_intent(payment_intent_id: str) -> dict[str, Any]:
    """Capture an authorized Stripe PaymentIntent."""
    if settings.ENVIRONMENT == "test":
        return {"id": payment_intent_id, "status": "succeeded"}
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentError("Stripe secret key not configured")

    async with httpx.AsyncClient() as client:
        return await _stripe_post(
            client, f"/payment_intents/{payment_intent_id}/capture", {}
        )


async def refund_stripe_payment(
    payment_intent_id: str, amount_egp: int | None = None
) -> dict[str, Any]:
    """Refund (or partially refund) a Stripe PaymentIntent."""
    if settings.ENVIRONMENT == "test":
        return {"id": f"re_test_{payment_intent_id}", "status": "succeeded"}
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentError("Stripe secret key not configured")

    payload: dict[str, Any] = {"payment_intent": payment_intent_id}
    if amount_egp is not None:
        payload["amount"] = str(amount_egp * 100)
    async with httpx.AsyncClient() as client:
        return await _stripe_post(client, "/refunds", payload)


async def paymob_payout(
    host_id: str, amount_egp: int, bank_info: dict[str, Any]
) -> tuple[bool, str, int]:
    """Request a disbursement through Paymob.

    Returns (success, provider_ref_or_error, payout_fee_egp).
    """
    if not settings.PAYMOB_API_KEY:
        return False, "Paymob API key not configured", 0

    if settings.ENVIRONMENT == "test":
        return True, f"paymob-payout-{host_id}-{amount_egp}", 0

    try:
        # Paymob auth token step (simplified; real flow is two-step token then payout).
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://accept.paymob.com/api/auth/tokens",
                json={"api_key": settings.PAYMOB_API_KEY},
            )
            token_response.raise_for_status()
            auth_token = token_response.json().get("token")
            if not auth_token:
                return False, "Paymob token missing", 0

            payout_response = await client.post(
                "https://accept.paymob.com/api/acceptance/disburse/",
                json={
                    "auth_token": auth_token,
                    "amount": amount_egp * 100,  # Paymob expects piastres/cents.
                    "currency": "EGP",
                    "wallet_msisdn": bank_info.get("wallet_number")
                    or bank_info.get("account_number"),
                    "integration_id": settings.PAYMOB_INTEGRATION_ID,
                },
            )
            payout_response.raise_for_status()
            data = payout_response.json()
            return True, str(data.get("id", data.get("transaction_id", ""))), 0
    except httpx.HTTPError as exc:
        return False, f"Paymob payout HTTP error: {exc}", 0
    except Exception as exc:  # pragma: no cover - defensive fallback
        return False, f"Paymob payout error: {exc}", 0


async def stripe_payout(
    host_id: str, amount_egp: int, bank_info: dict[str, Any]
) -> tuple[bool, str, int]:
    """Request a Stripe Connect payout (placeholder for Phase 1).

    Stripe Connect requires connected accounts and recipient onboarding which
    are not yet wired. The function validates input and returns a reference.
    """
    if not settings.STRIPE_SECRET_KEY:
        return False, "Stripe secret key not configured", 0

    if settings.ENVIRONMENT == "test":
        return True, f"stripe-payout-{host_id}-{amount_egp}", 0

    # Production Stripe Connect payouts would use the Transfer/Payout API here.
    return False, "Stripe Connect payout not implemented", 0


def extract_paymob_provider_ref(payload: dict[str, Any]) -> str | None:
    obj = payload.get("obj", {})
    transaction_id = obj.get("id")
    if isinstance(transaction_id, str):
        return transaction_id
    order_id = (
        payload.get("order")
        or obj.get("order", {}).get("id")
        or obj.get("order_id")
    )
    if isinstance(order_id, str):
        return order_id
    return None


def extract_stripe_provider_ref(payload: dict[str, Any]) -> str | None:
    ref = payload.get("data", {}).get("object", {}).get("id")
    if isinstance(ref, str):
        return ref
    return None


def extract_paymob_reservation_id(payload: dict[str, Any]) -> str | None:
    obj = payload.get("obj", {})
    reservation_id = (
        payload.get("reservation_id")
        or payload.get("merchant_order_id")
        or obj.get("merchant_order_id")
        or obj.get("order", {}).get("merchant_order_id")
    )
    if isinstance(reservation_id, str):
        return reservation_id
    return None


def extract_stripe_reservation_id(payload: dict[str, Any]) -> str | None:
    obj = payload.get("data", {}).get("object", {})
    value = obj.get("metadata", {}).get("reservation_id")
    if isinstance(value, str):
        return value
    return None


def extract_paymob_amount(payload: dict[str, Any]) -> int | None:
    amount = payload.get("amount_cents") or payload.get("obj", {}).get("amount_cents")
    if amount is not None:
        return int(str(amount)) // 100
    return None


def extract_stripe_amount(payload: dict[str, Any]) -> int | None:
    obj = payload.get("data", {}).get("object", {})
    amount = obj.get("amount")
    if amount is None:
        amount = obj.get("amount_received")
    if amount is not None:
        # Stripe amounts are in the smallest currency unit (piastres for EGP).
        return int(str(amount)) // 100
    return None


def extract_paymob_status(payload: dict[str, Any]) -> str | None:
    value = payload.get("success") or payload.get("obj", {}).get("success")
    if value is None:
        return None
    return str(value)


def extract_stripe_status(payload: dict[str, Any]) -> str | None:
    obj = payload.get("data", {}).get("object", {})
    value = obj.get("status")
    if value is None:
        return None
    return str(value)
