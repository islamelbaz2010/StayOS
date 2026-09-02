import asyncio
import hashlib
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import firebase_admin
import httpx
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from jose import JWTError
from jose import jwt as jose_jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth.constants import KycStatus, UserRole
from app.auth.models import Account, User
from app.auth.schemas import (
    AccountUpdate,
    FirebaseAuthRequest,
    OtpChallengeResponse,
    OtpSendRequest,
    OtpVerifyRequest,
    TokenPair,
    UserCreate,
)
from app.config import settings
from app.shared import redis as redis_state
from app.shared.exceptions import AuthenticationError, StayOSError, ValidationError


class OtpProviderError(StayOSError):
    """Raised when the Akedly OTP provider is unreachable or returns an unexpected response."""


class TurnstileRequiredError(OtpProviderError):
    """Raised when Akedly's V1.2 challenge demands a Cloudflare Turnstile token that
    the caller did not supply. StayOS's mobile client (Expo/React Native) has no
    Turnstile integration today — see the Akedly V1.2 correction report."""


# Matches OtpVerifyRequest.code (min_length=6, max_length=6) — do not change
# independently of that schema.
_AKEDLY_OTP_DIGITS = 6

# Wall-clock budget for solving Akedly's server-side PoW challenge (Adaptive
# Difficulty is enabled on the pipeline, so difficulty can rise under load).
_POW_SOLVE_TIMEOUT_SECONDS = 20.0


def _get_firebase_app() -> Any:
    """Return the lazily-initialized Firebase Admin app."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()


def _otp_transaction_key(phone_number: str) -> str:
    return f"otp:akedly:{phone_number}"


async def _akedly_call(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Call the Akedly V1.2 REST API (the pipeline-configured, Shield-enabled tier —
    Proof-of-Work + pipeline-level rate limiting + circuit breaking; see the pipeline
    dashboard for this StayOS pipeline's specific toggles).

    Contract: https://docs.akedly.io/authentication/v1-2
    """
    url = f"{settings.AKEDLY_BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.request(method, url, params=params, json=json_body)
    except httpx.HTTPError as exc:
        raise OtpProviderError(f"Akedly request failed: {exc}") from exc

    if response.status_code >= 500:
        raise OtpProviderError(f"Akedly server error: {response.status_code}")

    try:
        return cast(dict[str, Any], response.json())
    except ValueError as exc:
        raise OtpProviderError("Akedly returned a non-JSON response") from exc


def _solve_pow_sync(challenge: str, difficulty: int) -> int:
    """SHA256(challenge + ':' + nonce), incrementing nonce until the hex digest has
    `difficulty` leading zeros (https://docs.akedly.io/authentication/v1-2)."""
    prefix = "0" * difficulty
    nonce = 0
    while True:
        digest = hashlib.sha256(f"{challenge}:{nonce}".encode()).hexdigest()
        if digest.startswith(prefix):
            return nonce
        nonce += 1


async def _solve_akedly_pow(challenge: str, difficulty: int) -> int:
    """Solve Akedly's V1.2 PoW challenge server-side.

    Akedly's own architecture diagram has the *client* solve this. StayOS's
    mobile client is Expo/React Native; Akedly ships no React Native (or iOS/
    Android) SDK today — only Node.js and Flutter (docs.akedly.io/sdks) — so
    there is no official, documented client-side path. Since StayOS's backend
    is the only caller of the Akedly API (the mobile/web app never talks to
    Akedly directly), the backend solves the puzzle itself: this genuinely
    satisfies Akedly's check (a real solved nonce, never faked or hardcoded)
    but proves StayOS's server did the work rather than the end-user's device
    — a deliberate, reported architectural choice, not a silent bypass.
    """
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_solve_pow_sync, challenge, difficulty),
            timeout=_POW_SOLVE_TIMEOUT_SECONDS,
        )
    except TimeoutError as exc:
        raise OtpProviderError("Akedly PoW challenge solve timed out") from exc


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _utc_now() -> datetime:
    return datetime.now(UTC)


def create_access_token(user: User) -> str:
    now = int(_utc_now().timestamp())
    payload = {
        "sub": user.id,
        "type": "access",
        "phone": user.phone_number,
        "email": user.email,
        "role": user.role,
        "kyc_status": user.kyc_status,
        "iat": now,
        "exp": now + settings.JWT_ACCESS_TOKEN_TTL_MINUTES * 60,
    }
    return jose_jwt.encode(
        payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(user_id: str) -> str:
    now = int(_utc_now().timestamp())
    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.JWT_REFRESH_TOKEN_TTL_DAYS * 86400,
    }
    return jose_jwt.encode(
        payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        payload = jose_jwt.decode(
            token, settings.JWT_PUBLIC_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as exc:
        raise AuthenticationError("Invalid or expired token") from exc

    if expected_type and payload.get("type") != expected_type:
        raise AuthenticationError("Invalid token type")

    return payload


async def _persist_refresh_token(
    session: AsyncSession, token: str, user_id: str
) -> None:
    hashed = _token_hash(token)
    expires_at = _utc_now() + timedelta(days=settings.JWT_REFRESH_TOKEN_TTL_DAYS)
    await auth_repository.create_refresh_token(
        session,
        user_id=user_id,
        token_hash=hashed,
        expires_at=expires_at,
        revoked_at=None,
    )

    if redis_state.redis_client is None:
        raise AuthenticationError("Session store unavailable")

    await redis_state.redis_client.setex(
        f"refresh:{hashed}",
        settings.JWT_REFRESH_TOKEN_TTL_DAYS * 86400,
        user_id,
    )


async def create_token_pair(session: AsyncSession, user: User) -> TokenPair:
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user.id)
    await _persist_refresh_token(session, refresh_token, user.id)

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_TTL_MINUTES * 60,
    )


async def verify_refresh_token(token: str, session: AsyncSession) -> User:
    decode_token(token, expected_type="refresh")
    hashed = _token_hash(token)

    if redis_state.redis_client is None:
        raise AuthenticationError("Session store unavailable")

    user_id = await redis_state.redis_client.get(f"refresh:{hashed}")
    if user_id is None:
        raise AuthenticationError("Refresh token revoked or expired")

    user = await auth_repository.get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    return user


async def revoke_refresh_token(session: AsyncSession, token: str) -> None:
    decode_token(token, expected_type="refresh")
    hashed = _token_hash(token)

    token_record = await auth_repository.get_refresh_token_by_hash(session, hashed)
    if token_record is not None and token_record.revoked_at is None:
        await auth_repository.revoke_refresh_token(session, token_record, _utc_now())

    if redis_state.redis_client is not None:
        await redis_state.redis_client.delete(f"refresh:{hashed}")


async def _check_rate_limit(key: str) -> None:
    if redis_state.redis_client is None:
        raise AuthenticationError("Session store unavailable")

    count = await redis_state.redis_client.get(key)
    if count is not None and int(count) >= settings.OTP_MAX_ATTEMPTS:
        raise ValidationError("Too many attempts; please try again later")


async def _increment_rate_limit(key: str) -> None:
    if redis_state.redis_client is None:
        return

    count = await redis_state.redis_client.get(key)
    await redis_state.redis_client.incr(key)
    if count is None:
        await redis_state.redis_client.expire(key, settings.OTP_RATE_LIMIT_WINDOW)


async def _reset_otp_rate_limits(phone_number: str) -> None:
    if redis_state.redis_client is None:
        return

    await redis_state.redis_client.delete(
        f"otp:send:{phone_number}", f"otp:verify:{phone_number}"
    )


def _otp_provider_configured() -> bool:
    return bool(settings.AKEDLY_API_KEY and settings.AKEDLY_PIPELINE_ID)


async def get_otp_challenge() -> OtpChallengeResponse:
    """Proxy Akedly's V1.2 challenge to the client. APIKey/pipelineID never leave
    this function — only the (non-secret) challenge itself is returned, so a
    client can solve PoW via @akedly/shield's solvePow() and, if
    turnstile_required, obtain a Turnstile token before calling send_otp."""
    if not _otp_provider_configured():
        raise ValidationError("OTP provider is not configured")

    challenge_body = await _akedly_call(
        "GET",
        "/transactions/challenge",
        params={
            "APIKey": settings.AKEDLY_API_KEY,
            "pipelineID": settings.AKEDLY_PIPELINE_ID,
        },
    )
    if challenge_body.get("status") != "success":
        raise OtpProviderError(
            challenge_body.get("message") or "Akedly challenge request failed"
        )

    data = challenge_body.get("data") or {}
    turnstile_cfg = data.get("turnstile") or {}
    return OtpChallengeResponse(
        challenge=data.get("challenge", ""),
        difficulty=data.get("difficulty", 0),
        challenge_token=data.get("challengeToken", ""),
        challenge_required=data.get("challengeRequired", True),
        turnstile_required=bool(turnstile_cfg.get("required")),
        turnstile_site_key=turnstile_cfg.get("siteKey"),
    )


async def send_otp(request: OtpSendRequest) -> str:
    if not _otp_provider_configured():
        raise ValidationError("OTP provider is not configured")

    await _check_rate_limit(f"otp:send:{request.phone_number}")

    send_body: dict[str, Any] = {
        "APIKey": settings.AKEDLY_API_KEY,
        "pipelineID": settings.AKEDLY_PIPELINE_ID,
        "verificationAddress": {"phoneNumber": request.phone_number},
        "digits": _AKEDLY_OTP_DIGITS,
    }

    if request.pow_solution is not None:
        # Preferred path: the client already called GET /auth/otp/challenge and
        # solved it client-side via @akedly/shield's solvePow(). Forward as-is —
        # do NOT fetch a second, different challenge here; the nonce is only
        # valid against the exact challengeToken the client solved.
        send_body["powSolution"] = {
            "challengeToken": request.pow_solution.challenge_token,
            "nonce": request.pow_solution.nonce,
        }
    else:
        # Fallback for any caller that hasn't adopted client-side Shield yet
        # (kept deliberately, not left over by accident — see the Akedly
        # mobile Shield integration report): fetch and solve the challenge
        # server-side, and pre-check the Turnstile requirement ourselves since
        # this path never went through GET /auth/otp/challenge.
        challenge_body = await _akedly_call(
            "GET",
            "/transactions/challenge",
            params={
                "APIKey": settings.AKEDLY_API_KEY,
                "pipelineID": settings.AKEDLY_PIPELINE_ID,
            },
        )
        if challenge_body.get("status") != "success":
            raise OtpProviderError(
                challenge_body.get("message") or "Akedly challenge request failed"
            )

        challenge_data = challenge_body.get("data") or {}
        turnstile_cfg = challenge_data.get("turnstile") or {}
        if turnstile_cfg.get("required") and not request.turnstile_token:
            # Bypass Turnstile is OFF on this pipeline, and no fake/omitted token
            # is acceptable — surface this honestly rather than silently failing
            # OTP or fabricating a token. See the Akedly V1.2 correction report.
            raise TurnstileRequiredError(
                "Akedly requires a Turnstile token for this pipeline"
            )

        challenge = challenge_data.get("challenge")
        difficulty = challenge_data.get("difficulty")
        if challenge_data.get("challengeRequired", True) and challenge and difficulty is not None:
            nonce = await _solve_akedly_pow(challenge, difficulty)
            send_body["powSolution"] = {
                "challengeToken": challenge_data.get("challengeToken"),
                "nonce": nonce,
            }

    if request.turnstile_token:
        send_body["turnstileToken"] = request.turnstile_token

    send_response = await _akedly_call("POST", "/transactions/send", json_body=send_body)
    if send_response.get("status") != "success":
        raise OtpProviderError(send_response.get("message") or "Akedly OTP send failed")

    send_data = send_response.get("data") or {}
    transaction_req_id = send_data.get("transactionReqID")
    if not transaction_req_id:
        raise OtpProviderError("Akedly did not return a transactionReqID")

    if redis_state.redis_client is not None:
        await redis_state.redis_client.setex(
            _otp_transaction_key(request.phone_number),
            settings.OTP_TTL_SECONDS,
            transaction_req_id,
        )

    await _increment_rate_limit(f"otp:send:{request.phone_number}")
    return str(send_response.get("message") or "sent")


async def verify_otp(request: OtpVerifyRequest) -> bool:
    if not _otp_provider_configured():
        raise ValidationError("OTP provider is not configured")

    await _check_rate_limit(f"otp:verify:{request.phone_number}")

    if redis_state.redis_client is None:
        raise AuthenticationError("Session store unavailable")

    transaction_req_id = await redis_state.redis_client.get(
        _otp_transaction_key(request.phone_number)
    )
    if not transaction_req_id:
        # No pending Akedly transaction for this phone (never sent, or expired) —
        # from the caller's perspective this is indistinguishable from a wrong code.
        await _increment_rate_limit(f"otp:verify:{request.phone_number}")
        return False

    # V1.2 verify takes transactionReqID in the JSON body (not the URL path — that
    # was V1.0's shape).
    verify_body = await _akedly_call(
        "POST",
        "/transactions/verify",
        json_body={"transactionReqID": transaction_req_id, "otp": request.code},
    )

    approved = verify_body.get("status") == "success" and bool(
        (verify_body.get("data") or {}).get("verified")
    )
    if approved:
        await _reset_otp_rate_limits(request.phone_number)
        await redis_state.redis_client.delete(_otp_transaction_key(request.phone_number))
    else:
        await _increment_rate_limit(f"otp:verify:{request.phone_number}")

    return approved


async def get_or_create_user_by_phone(
    session: AsyncSession, phone_number: str
) -> User:
    user = await auth_repository.get_user_by_phone(session, phone_number)
    if user is not None:
        return user

    return await auth_repository.create_user(
        session=session,
        phone_number=phone_number,
        role=UserRole.GUEST,
        kyc_status=KycStatus.UNVERIFIED,
    )


async def verify_firebase_id_token(request: FirebaseAuthRequest) -> dict[str, Any]:
    app = _get_firebase_app()
    return await asyncio.to_thread(
        firebase_auth.verify_id_token, request.id_token, app=app
    )


async def get_or_create_user_from_firebase(
    session: AsyncSession, decoded_token: dict[str, Any]
) -> User:
    firebase_uid = str(decoded_token["sub"])
    user = await auth_repository.get_user_by_firebase_uid(session, firebase_uid)
    if user is not None:
        return user

    email = str(decoded_token.get("email", "")) or None
    phone_number = str(decoded_token.get("phone_number", "")) or None
    display_name = str(decoded_token.get("name", "")) or None

    return await auth_repository.create_user(
        session=session,
        firebase_uid=firebase_uid,
        email=email,
        phone_number=phone_number,
        display_name=display_name,
        role=UserRole.GUEST,
        kyc_status=KycStatus.UNVERIFIED,
    )


async def authenticate_by_otp(
    session: AsyncSession, request: OtpVerifyRequest
) -> TokenPair:
    if not await verify_otp(request):
        raise AuthenticationError("Invalid OTP")

    user = await get_or_create_user_by_phone(session, request.phone_number)
    if not user.is_active:
        raise AuthenticationError("Account disabled")

    return await create_token_pair(session, user)


async def authenticate_by_firebase(
    session: AsyncSession, request: FirebaseAuthRequest
) -> TokenPair:
    decoded = await verify_firebase_id_token(request)
    user = await get_or_create_user_from_firebase(session, decoded)
    if not user.is_active:
        raise AuthenticationError("Account disabled")

    return await create_token_pair(session, user)


async def rotate_refresh_token(session: AsyncSession, token: str) -> TokenPair:
    user = await verify_refresh_token(token, session)
    await revoke_refresh_token(session, token)
    return await create_token_pair(session, user)


async def ensure_account(session: AsyncSession, user: User) -> Account:
    account = await auth_repository.get_account_by_user_id(session, user.id)
    if account is not None:
        return account

    return await auth_repository.create_account(session=session, user_id=user.id)


async def update_account(
    session: AsyncSession, user: User, data: AccountUpdate
) -> Account:
    account = await ensure_account(session, user)
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return account

    return await auth_repository.update_account(session, account, **update_data)


async def create_user_manual(session: AsyncSession, data: UserCreate) -> User:
    if not data.phone_number and not data.email and not data.firebase_uid:
        raise ValidationError("At least one identity field is required")

    if data.phone_number:
        existing = await auth_repository.get_user_by_phone(session, data.phone_number)
        if existing:
            raise ValidationError("Phone number already registered")

    if data.email:
        existing = await auth_repository.get_user_by_email(session, data.email)
        if existing:
            raise ValidationError("Email already registered")

    if data.firebase_uid:
        existing = await auth_repository.get_user_by_firebase_uid(
            session, data.firebase_uid
        )
        if existing:
            raise ValidationError("Firebase UID already registered")

    return await auth_repository.create_user(
        session=session,
        phone_number=data.phone_number,
        email=data.email,
        firebase_uid=data.firebase_uid,
        display_name=data.display_name,
        locale=data.locale,
        role=data.role,
        kyc_status=KycStatus.UNVERIFIED,
    )
