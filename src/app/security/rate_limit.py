import time

from fastapi import Request

from app.config import settings
from app.shared import redis as redis_state
from app.shared.exceptions import ValidationError


class RateLimitError(ValidationError):
    pass


async def rate_limit(
    request: Request,  # type: ignore[type-arg]
    key_prefix: str = "rl",
    limit: int = 60,
    window_seconds: int = 60,
) -> None:
    """Rate limit by request client IP and key prefix."""
    if settings.ENVIRONMENT == "test":
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"{key_prefix}:{client_ip}:{request.url.path}"

    if not redis_state.redis_client:
        raise RateLimitError("Rate limiter unavailable")

    now = int(time.time())
    pipe = redis_state.redis_client.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, window_seconds)
    _, current_count, _, _ = await pipe.execute()

    if current_count >= limit:
        raise RateLimitError("Rate limit exceeded. Please try again later.")


async def login_rate_limit(request: Request) -> None:  # type: ignore[type-arg]
    await rate_limit(request, key_prefix="login", limit=10, window_seconds=300)


async def otp_send_rate_limit(request: Request) -> None:  # type: ignore[type-arg]
    await rate_limit(request, key_prefix="otp_send", limit=5, window_seconds=300)


async def otp_verify_rate_limit(request: Request) -> None:  # type: ignore[type-arg]
    await rate_limit(request, key_prefix="otp_verify", limit=10, window_seconds=300)


async def refresh_rate_limit(request: Request) -> None:  # type: ignore[type-arg]
    await rate_limit(request, key_prefix="refresh", limit=30, window_seconds=300)
