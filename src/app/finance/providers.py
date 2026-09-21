import asyncio
import hashlib
import hmac
import time
from typing import Any, cast

import httpx

from app.config import settings
from app.shared.exceptions import PaymentError

# Paymob's documented transaction-callback HMAC field order. The signed
# string is the concatenation of these values (nested lookups dotted),
# booleans rendered as "true"/"false", hashed with HMAC-SHA512 keyed by
# the merchant HMAC secret from the Paymob dashboard.
_PAYMOB_HMAC_FIELDS: tuple[str, ...] = (
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "success",
)


def _paymob_hmac_field(obj: dict[str, Any], dotted: str) -> str:
    value: Any = obj
    for key in dotted.split("."):
        if not isinstance(value, dict):
            value = None
            break
        value = value.get(key)
    if isinstance(value, dict):
        value = value.get("id")
    if isinstance(value, bool):
        return "true" if value else "false"
    return "" if value is None else str(value)


def compute_paymob_hmac(payload: dict[str, Any]) -> str:
    """Compute the Paymob transaction-callback HMAC for a payload."""
    obj = payload.get("obj", payload)
    signed = "".join(
        _paymob_hmac_field(obj, field) for field in _PAYMOB_HMAC_FIELDS
    )
    return hmac.new(
        settings.PAYMOB_HMAC_SECRET.encode(), signed.encode(), hashlib.sha512
    ).hexdigest()


def compute_paymob_signature(payload: dict[str, Any]) -> str:
    """Backward-compatible alias for compute_paymob_hmac."""
    return compute_paymob_hmac(payload)


def verify_paymob_hmac(
    payload: dict[str, Any], signature_header: str | None
) -> bool:
    """Verify a Paymob callback HMAC.

    Paymob sends ``hmac`` as a query parameter on transaction processed
    callbacks and checkout redirects; the value is an HMAC-SHA512 over the
    concatenated ordered transaction fields (see _PAYMOB_HMAC_FIELDS).
    """
    if not signature_header or not settings.PAYMOB_HMAC_SECRET:
        return False
    return hmac.compare_digest(compute_paymob_hmac(payload), signature_header)


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
_PAYMOB_INTENTION_BASE = "https://accept.paymob.com/v1"
_PAYMOB_UNIFIED_CHECKOUT = "https://accept.paymob.com/unifiedcheckout/"
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


async def _paymob_intention_post(payload: dict[str, Any]) -> dict[str, Any]:
    """POST to the Paymob Payment Intention API with the secret key.

    The secret key is backend-only — it is never returned to clients. The
    intention response contains a ``client_secret`` which, combined with
    the public key, builds the unified checkout URL the guest is sent to.
    """
    if not settings.PAYMOB_SECRET_KEY:
        raise PaymentError("Paymob secret key not configured")

    async with httpx.AsyncClient() as client:
        for attempt in range(_MAX_RETRIES):
            try:
                response = await client.post(
                    f"{_PAYMOB_INTENTION_BASE}/intention/",
                    json=payload,
                    headers={
                        "Authorization": f"Token {settings.PAYMOB_SECRET_KEY}"
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                return cast(dict[str, Any], response.json())
            except httpx.TimeoutException as exc:
                if attempt == _MAX_RETRIES - 1:
                    raise PaymentError(
                        f"Paymob intention request timed out: {exc}"
                    ) from exc
                await asyncio.sleep(_BACKOFF_SECONDS**attempt)
            except httpx.HTTPStatusError as exc:
                # 4xx is not retryable — surface immediately.
                if exc.response.status_code < 500 or attempt == _MAX_RETRIES - 1:
                    raise PaymentError(
                        f"Paymob intention rejected "
                        f"({exc.response.status_code})"
                    ) from exc
                await asyncio.sleep(_BACKOFF_SECONDS**attempt)
            except httpx.HTTPError as exc:
                if attempt == _MAX_RETRIES - 1:
                    raise PaymentError(
                        f"Paymob intention request failed: {exc}"
                    ) from exc
                await asyncio.sleep(_BACKOFF_SECONDS**attempt)
    raise PaymentError("Paymob intention request exhausted retries")


def _default_billing_data() -> dict[str, Any]:
    return {
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


async def paymob_create_intention(
    reservation_id: str,
    amount_egp: int,
    billing_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a Paymob Payment Intention (current Paymob API).

    Server-authoritative: the amount is the canonical guest total from
    StayOS, never a client-supplied value. ``special_reference`` carries
    the StayOS reservation id so callbacks can be correlated, and the
    configured TEST integration id is the only payment method offered.
    """
    integration_id = settings.PAYMOB_INTEGRATION_ID
    if not integration_id:
        raise PaymentError("Paymob integration id not configured")

    # Environment separation: a test key must never charge in production and
    # a live key must never run in non-production. Fail closed on mismatch.
    # Paymob regional keys carry markers inside the token (e.g.
    # "egy_sk_test_…"), not only at position zero — match the marker
    # anywhere in the key.
    key = settings.PAYMOB_SECRET_KEY
    is_live_key = "sk_live" in key
    if settings.ENVIRONMENT == "production" and not is_live_key:
        raise PaymentError(
            "Paymob test credentials cannot be used in production"
        )
    if settings.ENVIRONMENT != "production" and is_live_key:
        raise PaymentError(
            "Paymob live credentials cannot be used outside production"
        )

    payload = {
        "amount": amount_egp * 100,  # Paymob uses minor units (piastres)
        "currency": "EGP",
        "payment_methods": [integration_id],
        "billing_data": billing_data or _default_billing_data(),
        "special_reference": reservation_id,
        "extras": {"reservation_id": reservation_id},
        "expiration": 3600,
    }
    if settings.PAYMOB_NOTIFICATION_URL:
        payload["notification_url"] = settings.PAYMOB_NOTIFICATION_URL
    data = await _paymob_intention_post(payload)

    intention_id = data.get("id")
    client_secret = data.get("client_secret")
    if not intention_id or not client_secret:
        raise PaymentError("Paymob intention response missing id/client_secret")

    checkout_url = None
    if settings.PAYMOB_PUBLIC_KEY:
        checkout_url = (
            f"{_PAYMOB_UNIFIED_CHECKOUT}?publicKey={settings.PAYMOB_PUBLIC_KEY}"
            f"&clientSecret={client_secret}"
        )

    return {
        "provider": "paymob",
        "order_id": str(intention_id),
        "payment_token": client_secret,
        "iframe_url": checkout_url,
    }


async def create_paymob_payment(
    reservation_id: str, amount_egp: int, billing_data: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Create a Paymob checkout for a reservation.

    Prefers the Payment Intention API (current Paymob architecture) when
    ``PAYMOB_SECRET_KEY`` is configured; falls back to the legacy
    auth-token → order → payment-key → iframe flow when only the legacy
    ``PAYMOB_API_KEY`` is present.
    """
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

    if settings.PAYMOB_SECRET_KEY:
        return await paymob_create_intention(
            reservation_id, amount_egp, billing_data
        )

    auth_token = await paymob_auth_token()
    order = await paymob_create_order(auth_token, reservation_id, amount_egp)
    raw_order_id = order.get("id")
    if not raw_order_id:
        raise PaymentError("Paymob order id missing")
    order_id = str(raw_order_id)

    billing = billing_data or _default_billing_data()
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


def _as_str(value: Any) -> str | None:
    if isinstance(value, (str, int)):
        return str(value)
    return None


def extract_paymob_provider_ref(payload: dict[str, Any]) -> str | None:
    """Transaction id — the stable per-attempt idempotency key."""
    obj = payload.get("obj", payload)
    transaction_id = _as_str(obj.get("id"))
    if transaction_id:
        return transaction_id
    order = obj.get("order")
    order_id = (
        _as_str(payload.get("order"))
        or _as_str(order.get("id") if isinstance(order, dict) else order)
        or _as_str(obj.get("order_id"))
    )
    return order_id


def extract_paymob_order_ref(payload: dict[str, Any]) -> str | None:
    """Order id — correlates the callback to the PaymentIntent's
    provider_ref when intentions are used (provider_ref = intention id,
    but the transaction callback carries the order id)."""
    obj = payload.get("obj", payload)
    order = obj.get("order")
    if isinstance(order, dict):
        return _as_str(order.get("id")) or _as_str(order.get("merchant_order_id"))
    return _as_str(order) or _as_str(obj.get("order_id"))


def extract_paymob_integration_id(payload: dict[str, Any]) -> str | None:
    obj = payload.get("obj", payload)
    return _as_str(obj.get("integration_id"))


def extract_paymob_currency(payload: dict[str, Any]) -> str | None:
    obj = payload.get("obj", payload)
    return _as_str(obj.get("currency"))


def extract_paymob_pending(payload: dict[str, Any]) -> bool:
    obj = payload.get("obj", payload)
    return bool(obj.get("pending"))


def extract_stripe_provider_ref(payload: dict[str, Any]) -> str | None:
    ref = payload.get("data", {}).get("object", {}).get("id")
    if isinstance(ref, str):
        return ref
    return None


def extract_paymob_reservation_id(payload: dict[str, Any]) -> str | None:
    obj = payload.get("obj", payload)
    order = obj.get("order")
    extras = obj.get("payment_key_claims", {}).get("extra", {})
    reservation_id = (
        _as_str(payload.get("reservation_id"))
        or _as_str(payload.get("merchant_order_id"))
        or _as_str(obj.get("merchant_order_id"))
        or _as_str(extras.get("reservation_id") if isinstance(extras, dict) else None)
        or _as_str(order.get("merchant_order_id") if isinstance(order, dict) else None)
    )
    return reservation_id


def extract_stripe_reservation_id(payload: dict[str, Any]) -> str | None:
    obj = payload.get("data", {}).get("object", {})
    value = obj.get("metadata", {}).get("reservation_id")
    if isinstance(value, str):
        return value
    return None


def extract_paymob_amount(payload: dict[str, Any]) -> int | None:
    obj = payload.get("obj", payload)
    amount = obj.get("amount_cents")
    if amount is not None:
        return int(str(amount)) // 100
    return None


def extract_paymob_amount_cents(payload: dict[str, Any]) -> int | None:
    """Raw minor-unit amount — compared against the stored intent amount
    before any conversion can hide a mismatch."""
    obj = payload.get("obj", payload)
    amount = obj.get("amount_cents")
    if amount is not None:
        return int(str(amount))
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
    obj = payload.get("obj", payload)
    value = obj.get("success")
    if value is None:
        value = payload.get("success")
    if value is None:
        return None
    return str(value)


def extract_stripe_status(payload: dict[str, Any]) -> str | None:
    obj = payload.get("data", {}).get("object", {})
    value = obj.get("status")
    if value is None:
        return None
    return str(value)
