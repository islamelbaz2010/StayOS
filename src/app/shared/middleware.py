import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.config import settings

_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
_ALLOWED_HEADERS = [
    "Authorization",
    "Content-Type",
    "Accept",
    "Accept-Language",
    "X-Request-ID",
    "X-Idempotency-Key",
]


def setup_cors(app: FastAPI) -> None:
    kwargs: dict[str, Any] = dict(
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=_ALLOWED_METHODS,
        allow_headers=_ALLOWED_HEADERS,
    )
    if settings.CORS_ORIGIN_REGEX:
        kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX
    app.add_middleware(CORSMiddleware, **kwargs)


async def add_request_id(
    request: Request[Any],
    call_next: Callable[[Request[Any]], Awaitable[Response]],
) -> Response:
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id

    return response
