"""Sumsub adapter — global document coverage (14,000+ document types,
220+ countries incl. Egypt/MENA), Web SDK live capture with
quality/authenticity checks, liveness + face match, HMAC-signed webhooks,
and retryable vs final rejection semantics.

API reference: https://docs.sumsub.com — request signing uses
``X-App-Token`` + ``X-App-Access-Ts`` + ``X-App-Access-Sig``
(HMAC-SHA256 hex of ``ts + METHOD + path + body``). Webhooks carry
``x-payload-digest`` computed with the per-webhook secret and the
algorithm named by ``x-payload-digest-alg``.
"""

import asyncio
import hashlib
import hmac
import json
import time
from datetime import UTC, datetime
from typing import Any

import httpx

from app.config import settings

from .base import (
    IdentityVerificationProvider,
    ProviderEvent,
    ProviderOutcome,
    ProviderUnavailableError,
    VerificationProviderError,
    VerificationSession,
)

_MAX_RETRIES = 2
_BACKOFF_SECONDS = 0.5
_ACCESS_TOKEN_TTL_SECONDS = 600

_DIGEST_ALGORITHMS = {
    "HMAC_SHA256_HEX": hashlib.sha256,
    "HMAC_SHA512_HEX": hashlib.sha512,
    "HMAC_SHA1_HEX": hashlib.sha1,  # legacy — still accepted on the wire
}


class SumsubProvider(IdentityVerificationProvider):
    name = "sumsub"

    def is_configured(self) -> bool:
        return bool(
            settings.SUMSUB_APP_TOKEN
            and settings.SUMSUB_SECRET_KEY
            and settings.SUMSUB_LEVEL_NAME
        )

    # ---- request signing -------------------------------------------------

    def _signed_headers(
        self, method: str, path_with_query: str, body: bytes = b""
    ) -> dict[str, str]:
        ts = str(int(time.time()))
        sig = hmac.new(
            settings.SUMSUB_SECRET_KEY.encode(),
            (ts + method.upper() + path_with_query).encode() + body,
            hashlib.sha256,
        ).hexdigest()
        return {
            "X-App-Token": settings.SUMSUB_APP_TOKEN,
            "X-App-Access-Ts": ts,
            "X-App-Access-Sig": sig,
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.is_configured():
            raise ProviderUnavailableError("Sumsub is not configured")
        if settings.ENVIRONMENT == "test":
            raise ProviderUnavailableError("Sumsub disabled in test environment")

        import urllib.parse

        query = urllib.parse.urlencode(params or {})
        path_with_query = f"{path}?{query}" if query else path
        body = json.dumps(json_body).encode() if json_body is not None else b""
        headers = self._signed_headers(method, path_with_query, body)
        if json_body is not None:
            headers["Content-Type"] = "application/json"
        url = f"{settings.SUMSUB_BASE_URL}{path_with_query}"

        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(_MAX_RETRIES + 1):
                try:
                    response = await client.request(
                        method, url, headers=headers, content=body or None
                    )
                    if response.status_code >= 500:
                        raise VerificationProviderError(
                            f"Sumsub transient error {response.status_code}"
                        )
                    if response.status_code >= 400:
                        raise VerificationProviderError(
                            f"Sumsub rejected the request ({response.status_code})"
                        )
                    return response.json()
                except (httpx.HTTPError, VerificationProviderError) as exc:
                    last_exc = exc
                    if isinstance(exc, VerificationProviderError) and "rejected" in str(exc):
                        raise
                    if attempt < _MAX_RETRIES:
                        await asyncio.sleep(_BACKOFF_SECONDS * (2**attempt))
        raise ProviderUnavailableError("Sumsub request failed") from last_exc

    # ---- provider contract ------------------------------------------------

    async def create_session(
        self, user_id: str, applicant_id: str | None = None
    ) -> VerificationSession:
        """Mint a WebSDK access token.

        ``userId`` in the request body is the applicant's
        ``externalUserId`` — our stable user id. Sumsub binds the token
        (and the applicant the SDK creates) to it, so retry/resume of the
        same user continues the same applicant automatically; the Sumsub
        ``applicantId`` is never sent here. It arrives on the first
        webhook and is backfilled onto the KYC document then.
        """
        data = await self._request(
            "POST",
            "/resources/accessTokens/sdk",
            json_body={
                "userId": user_id,
                "levelName": settings.SUMSUB_LEVEL_NAME,
                "ttlInSecs": _ACCESS_TOKEN_TTL_SECONDS,
            },
        )
        token = data.get("token")
        if not token:
            raise VerificationProviderError("Sumsub returned no access token")
        return VerificationSession(
            provider=self.name,
            applicant_id=None,
            access_token=token,
            expires_at=datetime.fromtimestamp(
                int(time.time()) + _ACCESS_TOKEN_TTL_SECONDS, UTC
            ),
        )

    def verify_webhook_signature(
        self, headers: dict[str, str], body: bytes
    ) -> bool:
        secret = settings.SUMSUB_WEBHOOK_SECRET or settings.SUMSUB_SECRET_KEY
        if not secret:
            return False  # fail closed — unverifiable results are not trusted
        normalized = {k.lower(): v for k, v in headers.items()}
        digest = normalized.get("x-payload-digest")
        alg_name = normalized.get("x-payload-digest-alg", "HMAC_SHA256_HEX")
        algorithm = _DIGEST_ALGORITHMS.get(alg_name)
        if not digest or algorithm is None:
            return False
        expected = hmac.new(secret.encode(), body, algorithm).hexdigest()
        return hmac.compare_digest(digest.lower(), expected)

    def parse_webhook(self, body: dict[str, Any]) -> ProviderEvent | None:
        event_type = body.get("type") or ""
        applicant_id = body.get("applicantId") or ""
        if not applicant_id:
            return None

        outcome: ProviderOutcome | None = None
        reason: str | None = None

        if event_type == "applicantReviewed":
            result = body.get("reviewResult") or {}
            answer = result.get("reviewAnswer")
            if answer == "GREEN":
                outcome = ProviderOutcome.VERIFIED
            elif answer == "RED":
                reject_type = result.get("reviewRejectType")
                if reject_type == "FINAL":
                    outcome = ProviderOutcome.REJECTED
                    reason = "Identity verification failed"
                elif reject_type == "EXTERNAL":
                    outcome = ProviderOutcome.MANUAL_REVIEW
                else:  # RETRY — recoverable rejection; the user may retry
                    outcome = ProviderOutcome.RETRY_REQUIRED
                    reason = "Verification could not be completed — please retry"
            elif answer == "IGNORE":
                return None
            else:
                outcome = ProviderOutcome.IN_PROGRESS
        elif event_type == "applicantOnHold":
            outcome = ProviderOutcome.MANUAL_REVIEW
        elif event_type in (
            "applicantCreated",
            "applicantPending",
            "applicantPrechecked",
            "applicantAwaitingService",
            "applicantWorkflowPending",
            "applicantWorkflowCompleted",
        ):
            outcome = ProviderOutcome.IN_PROGRESS
        elif event_type in ("applicantAwaitingUser", "applicantReset"):
            outcome = ProviderOutcome.RETRY_REQUIRED
            reason = "Verification could not be completed — please retry"
        else:
            return None

        return ProviderEvent(
            provider=self.name,
            applicant_id=applicant_id,
            outcome=outcome,
            event_type=event_type,
            external_user_id=body.get("externalUserId") or "",
            reason=reason,
            raw=body,
        )

    async def get_status(self, applicant_id: str) -> ProviderOutcome:
        data = await self._request(
            "GET", f"/resources/applicants/{applicant_id}/status"
        )
        status = data.get("reviewStatus")
        if status == "completed":
            answer = (data.get("reviewResult") or {}).get("reviewAnswer")
            if answer == "GREEN":
                return ProviderOutcome.VERIFIED
            return ProviderOutcome.REJECTED
        if status == "onHold":
            return ProviderOutcome.MANUAL_REVIEW
        return ProviderOutcome.IN_PROGRESS

    async def get_applicant_legal_name(self, applicant_id: str) -> str | None:
        """Fetch the extracted legal name after a GREEN decision — webhook
        payloads deliberately carry no personal data, so the name is pulled
        server-side only when the result is verified."""
        data = await self._request(
            "GET", f"/resources/applicants/{applicant_id}/one"
        )
        info = data.get("info") or {}
        parts = [
            p
            for p in (
                info.get("firstName"),
                info.get("middleName"),
                info.get("lastName"),
            )
            if p
        ]
        return " ".join(parts) or None
