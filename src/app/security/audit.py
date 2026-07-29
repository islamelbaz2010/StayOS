import logging
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request
from starlette.responses import Response

from app.database import AsyncSessionLocal
from app.security.pii import mask_pii

from .models import AuditLog

logger = logging.getLogger(__name__)

_EXCLUDED_PATHS = {"/health", "/metrics", "/ready"}
_SENSITIVE_KEYS = {"password", "token", "private_key", "secret", "authorization"}


def _safe_payload(payload: str) -> str:
    try:
        import json

        data = json.loads(payload)
        if isinstance(data, dict):
            for key in data:
                if any(s in key.lower() for s in _SENSITIVE_KEYS):
                    data[key] = "***"
            return json.dumps(data, ensure_ascii=False)
    except Exception:
        pass
    return mask_pii(payload)


async def _write_audit_record(request: Request[Any], response: Response, user: Any) -> None:
    path = request.url.path
    if path in _EXCLUDED_PATHS:
        return

    body = ""
    try:
        if request.method in ("POST", "PUT", "PATCH"):
            body_bytes = await request.body()
            body = body_bytes.decode("utf-8", errors="replace")
            # Replace consumed body so downstream can still read it.
            request._body = body_bytes
    except Exception:
        pass

    user_id = None
    role = None
    if user is not None:
        user_id = getattr(user, "id", None)
        role = getattr(user, "role", None)

    log = AuditLog(
        user_id=user_id,
        role=role,
        ip_address=request.client.host if request.client else None,
        request_id=getattr(request.state, "request_id", None),
        method=request.method,
        path=path[:2048],
        status_code=response.status_code,
        payload=_safe_payload(body)[:4000] if body else None,
    )

    try:
        async with AsyncSessionLocal() as session:
            session.add(log)
            await session.commit()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to write audit log: %s", exc)


async def audit_middleware(
    request: Request[Any],
    call_next: Callable[[Request[Any]], Awaitable[Response]],
) -> Response:
    user = None
    try:
        user = request.state.user
    except AttributeError:
        pass

    response = await call_next(request)
    # Run audit write in the background to avoid blocking response.
    await _write_audit_record(request, response, user)
    return response
