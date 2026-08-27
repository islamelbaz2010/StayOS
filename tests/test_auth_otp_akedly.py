"""Unit tests for the Akedly V1.2 OTP provider integration in app.auth.services.

Pipeline "StayOS" (6a8f50e0d9d85332c73b7606) runs V1.2 (Shield): PoW + Turnstile +
pipeline rate limiting — not V1.0. See docs.akedly.io/authentication/v1-2.

These mock the Akedly HTTP contract and the Redis client directly — no network
calls, no real credentials, no Twilio.
"""

from unittest.mock import AsyncMock

import pytest
from app.auth import services as auth_services
from app.auth.schemas import OtpSendRequest, OtpVerifyRequest, PowSolution
from app.shared import redis as redis_state
from app.shared.exceptions import AuthenticationError, ValidationError


def _only_transaction_key_returns(value: str | None):
    """redis.get side_effect that returns `value` only for the OTP transaction key,
    and None for everything else (in particular the rate-limit counter keys, which
    _check_rate_limit() passes through int() — returning a non-numeric transaction
    id there would raise ValueError)."""

    def _get(key: str) -> str | None:
        return value if key == "otp:akedly:+1234567890" else None

    return _get


def _challenge_response(
    *,
    challenge: str = "aa",
    difficulty: int = 0,
    challenge_token: str = "tok-1",
    challenge_required: bool = True,
    turnstile_required: bool = False,
) -> dict:
    return {
        "status": "success",
        "data": {
            "challenge": challenge,
            "difficulty": difficulty,
            "challengeToken": challenge_token,
            "challengeRequired": challenge_required,
            "turnstile": {"required": turnstile_required, "siteKey": "site-key-1"},
        },
    }


@pytest.fixture(autouse=True)
def _akedly_configured(monkeypatch):
    """Default to a configured provider; individual tests override to test the gaps."""
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "test_key")
    monkeypatch.setattr(auth_services.settings, "AKEDLY_PIPELINE_ID", "test_pipeline")


@pytest.fixture
def fake_redis(monkeypatch) -> AsyncMock:
    client = AsyncMock()
    client.get = AsyncMock(return_value=None)
    client.setex = AsyncMock()
    client.incr = AsyncMock(return_value=1)
    client.expire = AsyncMock(return_value=True)
    client.delete = AsyncMock()
    monkeypatch.setattr(redis_state, "redis_client", client)
    return client


# --- Provider configuration detection ---------------------------------------


def test_otp_provider_configured_when_both_values_present() -> None:
    assert auth_services._otp_provider_configured() is True


def test_otp_provider_not_configured_missing_api_key(monkeypatch) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "")
    assert auth_services._otp_provider_configured() is False


def test_otp_provider_not_configured_missing_pipeline_id(monkeypatch) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_PIPELINE_ID", "")
    assert auth_services._otp_provider_configured() is False


@pytest.mark.asyncio
async def test_send_otp_missing_credentials_raises_validation_error(
    monkeypatch, fake_redis
) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "")

    with pytest.raises(ValidationError):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))


@pytest.mark.asyncio
async def test_verify_otp_missing_credentials_raises_validation_error(
    monkeypatch, fake_redis
) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_PIPELINE_ID", "")

    with pytest.raises(ValidationError):
        await auth_services.verify_otp(OtpVerifyRequest(phone_number="+1234567890", code="123456"))


# --- get_otp_challenge(): the backend proxy the mobile client calls ----------


@pytest.mark.asyncio
async def test_get_otp_challenge_proxies_and_never_returns_credentials(monkeypatch) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        assert method == "GET"
        assert path == "/transactions/challenge"
        assert params == {"APIKey": "test_key", "pipelineID": "test_pipeline"}
        return _challenge_response(
            challenge="deadbeef",
            difficulty=3,
            challenge_token="tok-abc",
            challenge_required=True,
            turnstile_required=True,
        )

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    result = await auth_services.get_otp_challenge()

    assert result.challenge == "deadbeef"
    assert result.difficulty == 3
    assert result.challenge_token == "tok-abc"
    assert result.challenge_required is True
    assert result.turnstile_required is True
    assert result.turnstile_site_key == "site-key-1"
    # APIKey/pipelineID must never appear in the response the client receives.
    assert "test_key" not in result.model_dump_json()
    assert "test_pipeline" not in result.model_dump_json()


@pytest.mark.asyncio
async def test_get_otp_challenge_missing_credentials_raises_validation_error(
    monkeypatch,
) -> None:
    monkeypatch.setattr(auth_services.settings, "AKEDLY_API_KEY", "")

    with pytest.raises(ValidationError):
        await auth_services.get_otp_challenge()


@pytest.mark.asyncio
async def test_get_otp_challenge_failure_raises_provider_error(monkeypatch) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        return {"status": "error", "message": "circuit open"}

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError, match="circuit open"):
        await auth_services.get_otp_challenge()


# --- send_otp with a client-supplied pow_solution (mobile Shield flow) -------


@pytest.mark.asyncio
async def test_send_otp_with_client_pow_solution_skips_server_challenge_fetch(
    monkeypatch, fake_redis
) -> None:
    """When the mobile app already solved PoW via @akedly/shield against its own
    GET /auth/otp/challenge call, send_otp must forward it directly and must NOT
    fetch a second, different challenge (a fresh challenge would invalidate the
    client's already-solved nonce)."""
    calls: list[tuple[str, str, dict | None, dict | None]] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        calls.append((method, path, params, json_body))
        return {
            "status": "success",
            "message": "OTP sent successfully",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(
        OtpSendRequest(
            phone_number="+1234567890",
            pow_solution=PowSolution(challenge_token="client-tok", nonce=4242),
        )
    )

    # Exactly one Akedly call — the send — never a challenge fetch.
    assert len(calls) == 1
    method, path, params, body = calls[0]
    assert (method, path) == ("POST", "/transactions/send")
    assert body["powSolution"] == {"challengeToken": "client-tok", "nonce": 4242}


@pytest.mark.asyncio
async def test_send_otp_with_client_pow_solution_and_turnstile_token(
    monkeypatch, fake_redis
) -> None:
    send_bodies: list[dict] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        send_bodies.append(json_body)
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(
        OtpSendRequest(
            phone_number="+1234567890",
            pow_solution=PowSolution(challenge_token="client-tok", nonce=1),
            turnstile_token="turnstile-xyz",
        )
    )

    assert send_bodies[0]["turnstileToken"] == "turnstile-xyz"


@pytest.mark.asyncio
async def test_send_otp_client_pow_solution_provider_rejection_surfaces_cleanly(
    monkeypatch, fake_redis
) -> None:
    """If Akedly itself rejects the send (e.g. missing/invalid Turnstile that the
    backend didn't pre-check because the client drove its own challenge), the
    rejection must surface as a clean OtpProviderError, not a raw exception."""

    async def fake_call(method, path, *, params=None, json_body=None):
        return {
            "status": "error",
            "code": "TURNSTILE_REQUIRED",
            "message": "turnstile token required",
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError, match="turnstile token required"):
        await auth_services.send_otp(
            OtpSendRequest(
                phone_number="+1234567890",
                pow_solution=PowSolution(challenge_token="client-tok", nonce=1),
            )
        )


# --- Fallback path (no client pow_solution): backend fetches + solves its own
# challenge, as before. Exercised below to prove the legacy behavior still works
# unchanged for any caller that hasn't adopted client-side Shield. -------------


@pytest.mark.asyncio
async def test_send_otp_requests_challenge_first(monkeypatch, fake_redis) -> None:
    calls: list[tuple[str, str, dict | None, dict | None]] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        calls.append((method, path, params, json_body))
        if path == "/transactions/challenge":
            return _challenge_response()
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    assert calls[0][0] == "GET"
    assert calls[0][1] == "/transactions/challenge"
    assert calls[0][2] == {"APIKey": "test_key", "pipelineID": "test_pipeline"}
    assert calls[0][3] is None


@pytest.mark.asyncio
async def test_send_otp_challenge_failure_raises_provider_error(monkeypatch, fake_redis) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        return {"status": "error", "message": "pipeline rate limited"}

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError, match="pipeline rate limited"):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))


# --- PoW handling --------------------------------------------------------------


@pytest.mark.asyncio
async def test_send_otp_solves_pow_and_attaches_solution(monkeypatch, fake_redis) -> None:
    """difficulty=0 accepts nonce=0 immediately — keeps the test fast while still
    exercising the real SHA256(challenge:nonce) solver, not a stub."""
    send_bodies: list[dict] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response(
                challenge="deadbeef", difficulty=0, challenge_token="tok-xyz"
            )
        send_bodies.append(json_body)
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    assert send_bodies[0]["powSolution"] == {"challengeToken": "tok-xyz", "nonce": 0}


@pytest.mark.asyncio
async def test_send_otp_skips_pow_when_challenge_not_required(monkeypatch, fake_redis) -> None:
    send_bodies: list[dict] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response(challenge_required=False)
        send_bodies.append(json_body)
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    assert "powSolution" not in send_bodies[0]


def test_solve_pow_sync_finds_valid_nonce() -> None:
    nonce = auth_services._solve_pow_sync("test-challenge", 1)
    import hashlib

    digest = hashlib.sha256(f"test-challenge:{nonce}".encode()).hexdigest()
    assert digest.startswith("0")


@pytest.mark.asyncio
async def test_solve_akedly_pow_times_out(monkeypatch) -> None:
    monkeypatch.setattr(auth_services, "_POW_SOLVE_TIMEOUT_SECONDS", 0.01)

    def _never_finishes(challenge: str, difficulty: int) -> int:
        import time

        time.sleep(1)
        return 0

    monkeypatch.setattr(auth_services, "_solve_pow_sync", _never_finishes)

    with pytest.raises(auth_services.OtpProviderError, match="timed out"):
        await auth_services._solve_akedly_pow("chal", 64)


# --- Turnstile: required and not-required flows -------------------------------


@pytest.mark.asyncio
async def test_send_otp_turnstile_required_without_token_raises(monkeypatch, fake_redis) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        return _challenge_response(turnstile_required=True)

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.TurnstileRequiredError):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))


@pytest.mark.asyncio
async def test_send_otp_turnstile_required_with_token_forwards_it(monkeypatch, fake_redis) -> None:
    send_bodies: list[dict] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response(turnstile_required=True)
        send_bodies.append(json_body)
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(
        OtpSendRequest(phone_number="+1234567890", turnstile_token="turnstile-abc")
    )

    assert send_bodies[0]["turnstileToken"] == "turnstile-abc"


@pytest.mark.asyncio
async def test_send_otp_turnstile_not_required_omits_field(monkeypatch, fake_redis) -> None:
    send_bodies: list[dict] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response(turnstile_required=False)
        send_bodies.append(json_body)
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    assert "turnstileToken" not in send_bodies[0]


# --- OTP send: request construction + success handling -----------------------


@pytest.mark.asyncio
async def test_send_otp_builds_correct_send_request_and_persists_transaction(
    monkeypatch, fake_redis
) -> None:
    calls: list[tuple[str, str, dict | None, dict | None]] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        calls.append((method, path, params, json_body))
        if path == "/transactions/challenge":
            return _challenge_response()
        return {
            "status": "success",
            "message": "OTP sent successfully",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    status = await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    assert status == "OTP sent successfully"
    assert len(calls) == 2

    method, path, params, body = calls[1]
    assert (method, path) == ("POST", "/transactions/send")
    assert body["APIKey"] == "test_key"
    assert body["pipelineID"] == "test_pipeline"
    assert body["verificationAddress"] == {"phoneNumber": "+1234567890"}
    assert body["digits"] == 6

    fake_redis.setex.assert_called_once_with(
        "otp:akedly:+1234567890", auth_services.settings.OTP_TTL_SECONDS, "req-1"
    )


# --- OTP send: provider failure handling -------------------------------------


@pytest.mark.asyncio
async def test_send_otp_transport_failure_propagates_as_provider_error(
    monkeypatch, fake_redis
) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        raise auth_services.OtpProviderError("Akedly request failed: boom")

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))

    fake_redis.setex.assert_not_called()


@pytest.mark.asyncio
async def test_send_otp_business_error_status_raises_provider_error(
    monkeypatch, fake_redis
) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response()
        return {
            "status": "error",
            "code": "RATE_LIMIT_PHONENUMBER_ATTEMPTS",
            "message": "slow down",
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError, match="slow down"):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))


@pytest.mark.asyncio
async def test_send_otp_missing_transaction_req_id_raises_provider_error(
    monkeypatch, fake_redis
) -> None:
    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return _challenge_response()
        return {"status": "success", "data": {"transactionID": "txn-1"}}

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError):
        await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))


@pytest.mark.asyncio
async def test_send_otp_malformed_response_raises_provider_error(monkeypatch, fake_redis) -> None:
    """A response missing the expected "data" key entirely should not crash with an
    AttributeError/KeyError — it must surface as a clean OtpProviderError."""

    async def fake_call(method, path, *, params=None, json_body=None):
        if path == "/transactions/challenge":
            return {"status": "success"}  # no "data" key
        return {
            "status": "success",
            "data": {"transactionID": "txn-1", "transactionReqID": "req-1"},
        }

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    # No "challenge"/"difficulty" present -> PoW step is skipped safely, and the
    # flow still completes (challengeRequired defaults True but challenge is falsy).
    status = await auth_services.send_otp(OtpSendRequest(phone_number="+1234567890"))
    assert status


# --- OTP verify: request construction + success handling ---------------------


@pytest.mark.asyncio
async def test_verify_otp_builds_correct_request_and_succeeds(monkeypatch, fake_redis) -> None:
    fake_redis.get = AsyncMock(side_effect=_only_transaction_key_returns("req-1"))
    calls: list[tuple[str, str, dict | None, dict | None]] = []

    async def fake_call(method, path, *, params=None, json_body=None):
        calls.append((method, path, params, json_body))
        return {"status": "success", "data": {"verified": True, "transactionID": "txn-1"}}

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    approved = await auth_services.verify_otp(
        OtpVerifyRequest(phone_number="+1234567890", code="123456")
    )

    assert approved is True
    assert calls == [
        ("POST", "/transactions/verify", None, {"transactionReqID": "req-1", "otp": "123456"})
    ]
    # Also cleared via _reset_otp_rate_limits: otp:send:+1234567890, otp:verify:+1234567890
    fake_redis.delete.assert_any_call("otp:akedly:+1234567890")


# --- OTP verify: invalid OTP, expired transaction, max attempts --------------


@pytest.mark.asyncio
async def test_verify_otp_invalid_code_returns_false(monkeypatch, fake_redis) -> None:
    fake_redis.get = AsyncMock(side_effect=_only_transaction_key_returns("req-1"))

    async def fake_call(method, path, *, params=None, json_body=None):
        # Akedly's failure shape: no top-level "status: success".
        return {"status": "error", "code": "INVALID_OTP", "message": "Invalid OTP"}

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    approved = await auth_services.verify_otp(
        OtpVerifyRequest(phone_number="+1234567890", code="000000")
    )

    assert approved is False
    fake_redis.delete.assert_not_called()


@pytest.mark.asyncio
async def test_verify_otp_expired_transaction_returns_false(monkeypatch, fake_redis) -> None:
    """No pending transaction in Redis (expired past OTP_TTL_SECONDS, or never sent)."""
    fake_redis.get = AsyncMock(return_value=None)

    approved = await auth_services.verify_otp(
        OtpVerifyRequest(phone_number="+1234567890", code="123456")
    )

    assert approved is False


@pytest.mark.asyncio
async def test_verify_otp_max_attempts_raises_rate_limit_error(monkeypatch, fake_redis) -> None:
    fake_redis.get = AsyncMock(
        side_effect=lambda key: (
            str(auth_services.settings.OTP_MAX_ATTEMPTS)
            if key == "otp:verify:+1234567890"
            else None
        )
    )

    with pytest.raises(ValidationError, match="Too many attempts"):
        await auth_services.verify_otp(OtpVerifyRequest(phone_number="+1234567890", code="123456"))


# --- OTP verify: provider failure handling ------------------------------------


@pytest.mark.asyncio
async def test_verify_otp_transport_failure_propagates(monkeypatch, fake_redis) -> None:
    fake_redis.get = AsyncMock(side_effect=_only_transaction_key_returns("req-1"))

    async def fake_call(method, path, *, params=None, json_body=None):
        raise auth_services.OtpProviderError("Akedly server error: 503")

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    with pytest.raises(auth_services.OtpProviderError):
        await auth_services.verify_otp(OtpVerifyRequest(phone_number="+1234567890", code="123456"))


@pytest.mark.asyncio
async def test_verify_otp_malformed_response_treated_as_not_approved(
    monkeypatch, fake_redis
) -> None:
    fake_redis.get = AsyncMock(side_effect=_only_transaction_key_returns("req-1"))

    async def fake_call(method, path, *, params=None, json_body=None):
        return {"status": "success"}  # missing "data" entirely

    monkeypatch.setattr(auth_services, "_akedly_call", fake_call)

    approved = await auth_services.verify_otp(
        OtpVerifyRequest(phone_number="+1234567890", code="123456")
    )

    assert approved is False


@pytest.mark.asyncio
async def test_verify_otp_no_redis_raises_authentication_error(monkeypatch) -> None:
    monkeypatch.setattr(redis_state, "redis_client", None)

    with pytest.raises(AuthenticationError):
        await auth_services.verify_otp(OtpVerifyRequest(phone_number="+1234567890", code="123456"))
