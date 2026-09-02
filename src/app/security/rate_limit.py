import time

from fastapi import Request

from app.config import settings
from app.shared import redis as redis_state
from app.shared.exceptions import RateLimitError

# Atomic Lua script: removes expired entries, checks count, adds new entry.
# Returns 0 if allowed, or current count if rate limit exceeded.
_RATE_LIMIT_LUA = """
local key     = KEYS[1]
local now     = tonumber(ARGV[1])
local window  = tonumber(ARGV[2])
local limit   = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, tostring(now) .. '-' .. redis.call('INCR', key .. ':seq'))
    redis.call('EXPIRE', key, window)
    return 0
end
return count
"""


async def rate_limit(
    request: Request,
    key_prefix: str = "rl",
    limit: int = 60,
    window_seconds: int = 60,
) -> None:
    """Rate limit by request client IP and key prefix using an atomic Lua script."""
    if settings.ENVIRONMENT == "test":
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"{key_prefix}:{client_ip}:{request.url.path}"

    if not redis_state.redis_client:
        raise RateLimitError("Rate limiter unavailable")

    now = int(time.time())
    result = await redis_state.redis_client.eval(
        _RATE_LIMIT_LUA,
        1,
        key,
        now,
        window_seconds,
        limit,
    )

    if result > 0:
        raise RateLimitError("Rate limit exceeded. Please try again later.")


async def listings_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="listings", limit=120, window_seconds=60)


async def login_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="login", limit=10, window_seconds=300)


async def otp_challenge_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="otp_challenge", limit=20, window_seconds=300)


async def otp_send_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="otp_send", limit=5, window_seconds=300)


async def otp_verify_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="otp_verify", limit=10, window_seconds=300)


async def refresh_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="refresh", limit=30, window_seconds=300)
