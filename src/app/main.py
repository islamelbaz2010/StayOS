import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any, cast

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import router as auth_router
from app.auth import services as auth_services
from app.availability import router as availability_router
from app.bookings import router as bookings_router
from app.config import settings
from app.database import get_session
from app.discovery import router as discovery_router
from app.favorites import router as favorites_router
from app.finance import router as finance_router
from app.importer import router as import_router
from app.kyc import router as kyc_router
from app.listings import router as listings_router
from app.operations import metrics as ops_metrics
from app.operations import router as operations_router
from app.payments import router as payments_router
from app.reservations import router as reservations_router
from app.security import audit_middleware, security_headers_middleware
from app.security.logging import setup_logging
from app.security.sentry import init_sentry
from app.shared import redis as redis_state
from app.shared.exceptions import StayOSError, to_http_exception
from app.shared.middleware import add_request_id, setup_cors
from app.shared.schemas import HealthResponse, RootResponse, VersionResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging(settings.LOG_LEVEL, json_output=settings.ENVIRONMENT != "development")
    init_sentry()
    redis_state.redis_client = await aioredis.from_url(
        str(settings.REDIS_URL), decode_responses=True
    )
    try:
        yield
    finally:
        if redis_state.redis_client:
            await redis_state.redis_client.close()
            redis_state.redis_client = None


app = FastAPI(
    title="StayOS API",
    description="AI-powered accommodation marketplace for MENA",
    version="0.1.0",
    lifespan=lifespan,
)


_ERROR_CODES = {
    "NotFoundError": "NOT_FOUND",
    "ValidationError": "VALIDATION_ERROR",
    "AuthenticationError": "AUTHENTICATION_ERROR",
    "AuthorizationError": "AUTHORIZATION_ERROR",
    "ConflictError": "CONFLICT_ERROR",
    "PaymentError": "PAYMENT_ERROR",
}

_ARABIC_MESSAGES = {
    "NOT_FOUND": "غير موجود",
    "VALIDATION_ERROR": "فشل التحقق من البيانات",
    "AUTHENTICATION_ERROR": "لم يتم التحقق من الهوية",
    "AUTHORIZATION_ERROR": "غير مصرح بالدخول",
    "CONFLICT_ERROR": "تعارض في البيانات",
    "PAYMENT_ERROR": "فشلت عملية الدفع",
    "NOT_AUTHENTICATED": "لم يتم التحقق من الهوية",
    "FORBIDDEN": "غير مصرح بالدخول",
    "INTERNAL_ERROR": "خطأ داخلي في الخادم",
    "BAD_REQUEST": "طلب غير صالح",
}

_HTTP_STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "NOT_AUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_ERROR",
}


def _arabic_message(code: str) -> str:
    return _ARABIC_MESSAGES.get(code, "حدث خطأ ما")


def _error_response(
    code: str,
    message: str,
    status_code: int,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "message_ar": _arabic_message(code),
                "details": details or {},
            }
        },
    )


def _stayos_error_handler(request: Request[Any], exc: Exception) -> JSONResponse:
    stayos_exc = cast(StayOSError, exc)
    http_exc = to_http_exception(stayos_exc)
    code = _ERROR_CODES.get(type(stayos_exc).__name__, "INTERNAL_ERROR")
    return _error_response(code, http_exc.detail, http_exc.status_code)


def _http_exception_handler(request: Request[Any], exc: Exception) -> JSONResponse:
    http_exc = cast(HTTPException, exc)
    code = _HTTP_STATUS_CODES.get(http_exc.status_code, "INTERNAL_ERROR")
    return _error_response(code, str(http_exc.detail), http_exc.status_code)


def _validation_error_handler(request: Request[Any], exc: Exception) -> JSONResponse:
    validation_exc = cast(RequestValidationError, exc)
    return _error_response(
        "VALIDATION_ERROR",
        "Request validation failed",
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        {"errors": validation_exc.errors()},
    )


def _generic_exception_handler(request: Request[Any], exc: Exception) -> JSONResponse:
    return _error_response(
        "INTERNAL_ERROR",
        "Internal server error",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


app.add_exception_handler(StayOSError, _stayos_error_handler)
app.add_exception_handler(HTTPException, _http_exception_handler)
app.add_exception_handler(RequestValidationError, _validation_error_handler)
app.add_exception_handler(Exception, _generic_exception_handler)


async def user_context_middleware(
    request: Request[Any],
    call_next: Callable[[Request[Any]], Awaitable[Response]],
) -> Response:
    request.state.user = None
    auth = request.headers.get("authorization")
    if auth and auth.startswith("Bearer "):
        try:
            payload = auth_services.decode_token(auth[7:])
            request.state.user = payload
        except Exception as exc:
            logger.debug("Token decode failed, continuing as anonymous: %s", exc)
    return await call_next(request)


setup_cors(app)
app.middleware("http")(ops_metrics.metrics_middleware)
app.middleware("http")(add_request_id)
app.middleware("http")(user_context_middleware)
app.middleware("http")(audit_middleware)
app.middleware("http")(security_headers_middleware)
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(kyc_router.router, prefix="/api/v1")
app.include_router(listings_router.router, prefix="/api/v1")
app.include_router(availability_router.router, prefix="/api/v1")
app.include_router(operations_router.router, prefix="/api/v1")
app.include_router(reservations_router.router, prefix="/api/v1")
app.include_router(bookings_router.router, prefix="/api/v1")
app.include_router(payments_router.router, prefix="/api/v1")
app.include_router(import_router.router, prefix="/api/v1")
app.include_router(finance_router.router, prefix="/api/v1")
app.include_router(discovery_router.router, prefix="/api/v1")
app.include_router(favorites_router.router, prefix="/api/v1")


async def _db_status(session: AsyncSession) -> str:
    try:
        await session.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        return "error"


async def _redis_status() -> str:
    try:
        if redis_state.redis_client:
            await redis_state.redis_client.ping()
        return "ok"
    except Exception:
        return "error"


@app.get("/health", response_model=HealthResponse)
async def health_check(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    db_status = await _db_status(session)
    redis_status = await _redis_status()
    overall_status = "ok" if db_status == "ok" and redis_status == "ok" else "error"
    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
    )


@app.get("/health/live", response_model=HealthResponse)
async def liveness_check() -> HealthResponse:
    return HealthResponse(status="ok", database="ok", redis="ok")


@app.get("/health/ready", response_model=HealthResponse)
async def readiness_check(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    db_status = await _db_status(session)
    redis_status = await _redis_status()
    overall_status = "ok" if db_status == "ok" and redis_status == "ok" else "error"
    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
    )


@app.get("/health/deep", response_model=HealthResponse)
async def deep_health_check(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    db_status = await _db_status(session)
    redis_status = await _redis_status()
    overall_status = "ok" if db_status == "ok" and redis_status == "ok" else "error"
    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
    )


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics() -> str:
    return ops_metrics.collector.render_prometheus()


@app.get("/version", response_model=VersionResponse)
async def version() -> VersionResponse:
    return VersionResponse(
        name="StayOS API",
        version="0.1.0",
        environment=settings.ENVIRONMENT,
    )


@app.get("/", response_model=RootResponse)
async def root() -> RootResponse:
    return RootResponse(message="StayOS API", version="0.1.0")
