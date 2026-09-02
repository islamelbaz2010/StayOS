"""Targeted coverage tests for small, honest gaps remaining after the main
reconciliation and test-expansion work. These exercise edge branches in
foundational/security/listing/auth code and a few router error handlers."""

import base64
import json
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import Request
from fastapi.exceptions import RequestValidationError

from app.auth import dependencies as auth_dependencies
from app.auth import repository as auth_repository
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.availability.schemas import AvailabilityRule, AvailabilityStatus
from app.bookings.schemas import BookingCreate
from app.database import get_session
from app.host import constants as host_constants
from app.host import permissions as host_permissions
from app.listings.pricing import get_day_price
from app.main import (
    _generic_exception_handler,
    _validation_error_handler,
    user_context_middleware,
)
from app.reservations.schemas import ReservationCreate, ReservationListFilters
from app.security.audit import _safe_payload, _write_audit_record
from app.security.middleware import security_headers_middleware
from app.security.pii import _mask_email
from app.security.sentry import init_sentry
from app.shared.exceptions import (
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    PaymentError,
    RateLimitError,
    ValidationError,
    to_http_exception,
)


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
    is_active: bool = True,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or "user-1",
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=is_active,
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session):
    async def _override():
        yield fake_session

    return _override


# ============================================================
# app.security.audit
# ============================================================

def test_safe_payload_non_json_falls_back_to_mask_pii() -> None:
    with patch("app.security.audit.mask_pii", return_value="masked") as mock_mask:
        with patch("app.security.audit.logger.debug") as mock_debug:
            result = _safe_payload("not valid json {")
    assert result == "masked"
    mock_mask.assert_called_once_with("not valid json {")
    mock_debug.assert_called_once()


@pytest.mark.asyncio
async def test_write_audit_record_extracts_user_id_and_role() -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)

    request = MagicMock(spec=Request)
    request.url.path = "/api/v1/bookings"
    request.method = "GET"
    request.client = MagicMock(host="127.0.0.1")
    request.headers = {}
    request.state.request_id = "req-123"
    request.state.user = user

    response = MagicMock()
    response.status_code = 200
    response.headers = {}

    mock_session = AsyncMock()
    with patch("app.security.audit.AsyncSessionLocal") as mock_session_class:
        mock_session_class.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_class.return_value.__aexit__ = AsyncMock(return_value=None)
        await _write_audit_record(request, response, user)

    assert mock_session.add.called
    args = mock_session.add.call_args[0][0]
    assert args.user_id == "guest-1"
    assert args.role == str(UserRole.GUEST)


# ============================================================
# app.security.pii / middleware / sentry
# ============================================================

def test_mask_email_short_local() -> None:
    assert _mask_email("a@example.com") == "*@example.com"
    assert _mask_email("ab@example.com") == "**@example.com"


@pytest.mark.asyncio
async def test_security_headers_middleware_adds_hsts_in_production() -> None:
    async def call_next(request: Request) -> MagicMock:
        response = MagicMock()
        response.headers = {}
        return response

    request = MagicMock(spec=Request)
    request.state.request_id = "req-123"

    with patch("app.security.middleware.settings.ENVIRONMENT", "production"):
        response = await security_headers_middleware(request, call_next)  # type: ignore[arg-type]
    assert response.headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"


def test_init_sentry_logs_on_failure(monkeypatch) -> None:
    monkeypatch.setattr("app.security.sentry.settings.SENTRY_DSN", "https://x@sentry.io/1")
    with patch("sentry_sdk.init", side_effect=Exception("sentry boom")):
        with patch("app.security.sentry.logger.exception") as mock_log:
            init_sentry()
    mock_log.assert_called_once()


# ============================================================
# app.shared.exceptions
# ============================================================

def test_to_http_exception_rate_limit_and_payment() -> None:
    rate = to_http_exception(RateLimitError("too fast"))
    assert rate.status_code == 429
    payment = to_http_exception(PaymentError("card failed"))
    assert payment.status_code == 422


# ============================================================
# app.main exception / middleware branches
# ============================================================

def test_validation_error_handler_returns_422() -> None:
    exc = RequestValidationError(
        errors=[{"loc": ("body",), "msg": "field required", "type": "value_error.missing"}]
    )
    request = MagicMock(spec=Request)
    response = _validation_error_handler(request, exc)
    assert response.status_code == 422


def test_generic_exception_handler_returns_500() -> None:
    request = MagicMock(spec=Request)
    response = _generic_exception_handler(request, ValueError("boom"))
    assert response.status_code == 500


@pytest.mark.asyncio
async def test_user_context_middleware_continues_on_token_decode_failure(monkeypatch) -> None:
    monkeypatch.setattr(
        auth_services,
        "decode_token",
        MagicMock(side_effect=Exception("bad token")),
    )

    async def call_next(request: Request) -> MagicMock:
        response = MagicMock()
        response.headers = {}
        return response

    request = MagicMock(spec=Request)
    request.headers = {"authorization": "Bearer invalid-token"}
    request.state.user = None

    response = await user_context_middleware(request, call_next)  # type: ignore[arg-type]
    assert response is not None
    assert request.state.user is None


# ============================================================
# app.auth.dependencies direct branches
# ============================================================

@pytest.mark.asyncio
async def test_get_current_user_rejects_missing_sub(monkeypatch) -> None:
    monkeypatch.setattr(auth_services, "decode_token", MagicMock(return_value={"sub": ""}))
    fake_session = AsyncMock()
    token = MagicMock()
    token.credentials = "Bearer token"
    with pytest.raises(AuthenticationError):
        await auth_dependencies.get_current_user(fake_session, token)


@pytest.mark.asyncio
async def test_get_current_user_rejects_unknown_user(monkeypatch) -> None:
    monkeypatch.setattr(
        auth_services, "decode_token", MagicMock(return_value={"sub": "missing"})
    )
    monkeypatch.setattr(auth_repository, "get_user_by_id", AsyncMock(return_value=None))
    fake_session = AsyncMock()
    token = MagicMock()
    token.credentials = "Bearer token"
    with pytest.raises(AuthenticationError):
        await auth_dependencies.get_current_user(fake_session, token)


@pytest.mark.asyncio
async def test_get_current_user_rejects_disabled_account(monkeypatch) -> None:
    user = _make_user(is_active=False)
    monkeypatch.setattr(
        auth_services, "decode_token", MagicMock(return_value={"sub": user.id})
    )
    monkeypatch.setattr(auth_repository, "get_user_by_id", AsyncMock(return_value=user))
    fake_session = AsyncMock()
    token = MagicMock()
    token.credentials = "Bearer token"
    with pytest.raises(AuthenticationError):
        await auth_dependencies.get_current_user(fake_session, token)


@pytest.mark.asyncio
async def test_get_current_user_rejects_stale_kyc_status(monkeypatch) -> None:
    user = _make_user(kyc_status=KycStatus.VERIFIED)
    monkeypatch.setattr(
        auth_services,
        "decode_token",
        MagicMock(return_value={"sub": user.id, "kyc_status": "rejected"}),
    )
    monkeypatch.setattr(auth_repository, "get_user_by_id", AsyncMock(return_value=user))
    fake_session = AsyncMock()
    token = MagicMock()
    token.credentials = "Bearer token"
    with pytest.raises(AuthenticationError):
        await auth_dependencies.get_current_user(fake_session, token)


@pytest.mark.asyncio
async def test_require_kyc_verified_rejects_unverified() -> None:
    user = _make_user(kyc_status=KycStatus.UNVERIFIED)
    with pytest.raises(ValidationError):
        await auth_dependencies.require_kyc_verified(user)


# ============================================================
# app.bookings / app.availability / app.listings.pricing schemas
# ============================================================

def test_booking_create_check_out_must_be_after_check_in() -> None:
    today = date.today()
    with pytest.raises(ValueError):
        BookingCreate(
            unit_id="unit-1",
            check_in=today,
            check_out=today,
            adults=1,
            children=0,
            infants=0,
        )


def test_availability_rule_invalid_date_range() -> None:
    with pytest.raises(ValueError):
        AvailabilityRule(
            date_from=date(2026, 1, 5),
            date_to=date(2026, 1, 1),
            status=AvailabilityStatus.AVAILABLE,
        )


def test_get_day_price_uses_override_and_weekend_multiplier() -> None:
    listing = MagicMock(base_price_egp=100, weekend_mult=1.5)
    rule = MagicMock(price_override=200)
    weekday = date(2026, 1, 5)  # Monday
    weekend = date(2026, 1, 9)  # Friday
    assert get_day_price(listing, rule, weekday) == 200
    assert get_day_price(listing, rule, weekend) == 300


# ============================================================
# app.reservations schemas
# ============================================================

def test_reservation_create_check_out_must_be_after_check_in() -> None:
    today = date.today()
    from app.reservations.constants import PaymentMethod

    with pytest.raises(ValueError):
        ReservationCreate(
            unit_id="unit-1",
            check_in=today,
            check_out=today,
            adults=1,
            children=0,
            infants=0,
            payment_method=PaymentMethod.CARD,
        )


def test_reservation_list_filters_invalid_cursor_ignored() -> None:
    filters = ReservationListFilters(cursor="not-valid-base64", limit=20)
    assert filters.get_offset() == 0


def test_reservation_list_filters_encode_cursor() -> None:
    cursor = ReservationListFilters.encode_cursor(42)
    decoded = json.loads(base64.b64decode(cursor).decode("utf-8"))
    assert decoded["offset"] == 42


# ============================================================
# app.reservations.router error handler
# ============================================================

@pytest.fixture
def reservations_client(client, fake_session):
    client.app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    client.app.dependency_overrides.pop(get_session, None)


def test_get_reservation_detail_maps_stayos_error(fake_session, monkeypatch, reservations_client):
    user = _make_user()
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )
    monkeypatch.setattr(
        "app.reservations.router.get_reservation",
        AsyncMock(side_effect=NotFoundError("not found")),
    )

    token = auth_services.create_access_token(user)
    response = reservations_client.get(
        "/api/v1/reservations/res-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


# ============================================================
# app.notifications.tasks retry branch
# ============================================================

def test_process_pending_notifications_retries_on_failure(monkeypatch) -> None:
    from app.notifications import services as notifications_services
    from app.notifications import tasks as notifications_tasks

    monkeypatch.setattr(
        notifications_services,
        "process_pending_notifications",
        AsyncMock(side_effect=Exception("boom")),
    )

    # Celery's retry behavior in a test context re-raises the original exception.
    with pytest.raises(Exception, match="boom"):
        notifications_tasks.process_pending_notifications.run()


# ============================================================
# app.auth.dependencies success branches
# ============================================================

@pytest.mark.asyncio
async def test_require_kyc_verified_accepts_verified_user() -> None:
    user = _make_user(kyc_status=KycStatus.VERIFIED)
    result = await auth_dependencies.require_kyc_verified(user)
    assert result is user


# ============================================================
# app.host.permissions
# ============================================================


def _make_simple_user(user_id: str = "user-1", role: str = str(UserRole.GUEST)):
    from types import SimpleNamespace
    return SimpleNamespace(id=user_id, role=role, kyc_status="VERIFIED", is_active=True)


def _make_simple_unit(unit_id: str = "unit-1", host_id: str = "user-1"):
    from types import SimpleNamespace
    return SimpleNamespace(id=unit_id, host_id=host_id)


@pytest.mark.asyncio
async def test_get_managed_unit_ids_owner_and_cohost() -> None:
    user = _make_simple_user("owner-1", role=str(UserRole.GUEST))
    # The first select is owned units, the second is co-hosted units.
    session = AsyncMock()
    owned_result = MagicMock()
    owned_result.all.return_value = [("owned-1",)]
    cohost_result = MagicMock()
    cohost_result.all.return_value = [("cohost-1",)]
    session.execute.side_effect = [owned_result, cohost_result]

    unit_ids = await host_permissions.get_managed_unit_ids(session, user)
    assert sorted(unit_ids) == ["cohost-1", "owned-1"]


@pytest.mark.asyncio
async def test_get_managed_unit_ids_admin_sees_all_units() -> None:
    user = _make_simple_user("admin-1", role=str(UserRole.ADMIN))
    session = AsyncMock()
    owned_result = MagicMock()
    owned_result.all.return_value = []
    all_result = MagicMock()
    all_result.all.return_value = [("admin-u1",), ("admin-u2",)]
    cohost_result = MagicMock()
    cohost_result.all.return_value = []
    session.execute.side_effect = [owned_result, all_result, cohost_result]

    unit_ids = await host_permissions.get_managed_unit_ids(session, user)
    assert sorted(unit_ids) == ["admin-u1", "admin-u2"]


def _cohost_session(scope: str) -> AsyncMock:
    session = AsyncMock()
    session.execute.return_value = MagicMock(
        scalar_one_or_none=MagicMock(return_value=scope)
    )
    return session


@pytest.mark.asyncio
async def test_get_unit_permission_scope_owner() -> None:
    user = _make_simple_user("owner-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")

    scope = await host_permissions.get_unit_permission_scope(AsyncMock(), user, unit)
    assert scope == "owner"


@pytest.mark.asyncio
async def test_get_unit_permission_scope_admin() -> None:
    user = _make_simple_user("admin-1", role=str(UserRole.ADMIN))
    unit = _make_simple_unit("unit-1", host_id="owner-1")

    scope = await host_permissions.get_unit_permission_scope(AsyncMock(), user, unit)
    assert scope == "admin"


@pytest.mark.asyncio
async def test_get_unit_permission_scope_cohost() -> None:
    user = _make_simple_user("cohost-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    session = _cohost_session(host_constants.CoHostPermissionScope.CALENDAR_MESSAGING)

    scope = await host_permissions.get_unit_permission_scope(session, user, unit)
    assert scope == host_constants.CoHostPermissionScope.CALENDAR_MESSAGING


@pytest.mark.asyncio
async def test_assert_can_access_unit_and_manage_unit() -> None:
    user = _make_simple_user("owner-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")

    scope = await host_permissions.assert_can_access_unit(AsyncMock(), user, unit)
    assert scope == "owner"

    manage_scope = await host_permissions.assert_can_manage_unit(AsyncMock(), user, unit)
    assert manage_scope == "owner"


@pytest.mark.asyncio
async def test_assert_can_access_unit_denies_unauthorized() -> None:
    user = _make_simple_user("stranger-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    session = AsyncMock()
    session.execute.return_value = MagicMock(
        scalar_one_or_none=MagicMock(return_value=None)
    )

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_access_unit(session, user, unit)


@pytest.mark.asyncio
async def test_assert_can_edit_listing_and_message_permissions() -> None:
    user = _make_simple_user("owner-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")

    # Owner can edit and message
    await host_permissions.assert_can_edit_listing(AsyncMock(), user, unit)
    await host_permissions.assert_can_message(AsyncMock(), user, unit)


@pytest.mark.asyncio
async def test_assert_can_edit_listing_denies_calendar_messaging_cohost() -> None:
    user = _make_simple_user("cohost-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    session = _cohost_session(host_constants.CoHostPermissionScope.CALENDAR_MESSAGING)

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_edit_listing(session, user, unit)

    # Same co-host can message
    await host_permissions.assert_can_message(session, user, unit)


@pytest.mark.asyncio
async def test_assert_can_message_denies_calendar_only_cohost() -> None:
    user = _make_simple_user("cohost-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    session = _cohost_session(host_constants.CoHostPermissionScope.CALENDAR_ONLY)

    with pytest.raises(AuthorizationError):
        await host_permissions.assert_can_message(session, user, unit)


@pytest.mark.asyncio
async def test_assert_owner_or_admin_allows_owner_and_admin() -> None:
    user = _make_simple_user("owner-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    await host_permissions.assert_owner_or_admin(user, unit)

    user = _make_simple_user("admin-1", role=str(UserRole.ADMIN))
    await host_permissions.assert_owner_or_admin(user, unit)


@pytest.mark.asyncio
async def test_assert_owner_or_admin_denies_cohost() -> None:
    user = _make_simple_user("cohost-1")
    unit = _make_simple_unit("unit-1", host_id="owner-1")
    with pytest.raises(AuthorizationError):
        await host_permissions.assert_owner_or_admin(user, unit)
