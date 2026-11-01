"""Client-IP resolution for endpoints deployed behind the Caddy edge.

The edge proxy *appends* the real peer IP to any X-Forwarded-For chain
the requester supplied — it does not replace it. The rightmost entry is
therefore the only hop written by our infrastructure; the leftmost
("original client") value is attacker-controlled and must never be
trusted for attribution or rate limiting.
"""

from fastapi import Request

from app.config import settings


def client_ip(request: Request) -> str | None:
    if settings.TRUST_PROXY_HEADERS:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.rsplit(",", 1)[-1].strip() or None
    return request.client.host if request.client else None
