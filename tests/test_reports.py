"""Admin Reports — registry integrity, RBAC, endpoint behavior.

Route tests use the shared ``client``/``fake_session`` fixtures: admin users
short-circuit the permission check; staff permission lookups hit the mocked
session's ``scalar_one_or_none``.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth import services as auth_services
from app.auth.constants import KycStatus
from app.auth.models import User
from app.database import get_session
from app.reports.queries import EXPORT_MAX, ReportParams, _BUILDERS, _finalize
from app.reports.registry import BY_KEY, CATALOG


def _make_user(user_id: str = "admin-1", role: str = "admin") -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+201000000000",
        email=f"{user_id}@example.com",
        firebase_uid=None,
        display_name=user_id,
        locale="ar",
        role=role,
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


@pytest.fixture
def reports_client(client, fake_session):
    client.app.dependency_overrides[get_session] = _session_override(fake_session)
    yield client
    client.app.dependency_overrides.pop(get_session, None)


def _session_override(fake_session):
    async def _override():
        yield fake_session

    return _override


def _deny_permission(fake_session) -> None:
    """Make the staff-permission lookup return no grant."""
    result = MagicMock()
    result.scalar_one_or_none = MagicMock(return_value=None)
    fake_session.execute = AsyncMock(return_value=result)


def _empty_result_session(fake_session) -> None:
    """Session where every query returns empty: ``.all()`` and
    ``.scalars().all()`` → [], ``scalar()`` → 0."""
    result = MagicMock()
    result.all = MagicMock(return_value=[])
    result.scalars = MagicMock(return_value=result)
    result.scalar_one_or_none = MagicMock(return_value=None)
    fake_session.execute = AsyncMock(return_value=result)
    fake_session.scalar = AsyncMock(return_value=0)


# ---------------------------------------------------------------------------
# Registry integrity
# ---------------------------------------------------------------------------


def test_every_implemented_report_has_a_builder() -> None:
    for report in CATALOG:
        if report.implemented:
            assert report.builder in _BUILDERS, report.key


def test_sortable_columns_are_declared_columns() -> None:
    for report in CATALOG:
        assert set(report.sortable) <= set(report.columns), report.key


def test_filters_are_known_param_fields() -> None:
    known = set(ReportParams.__dataclass_fields__) - {
        "page",
        "page_size",
        "sort",
        "order",
        "export",
    }
    for report in CATALOG:
        assert set(report.filters) <= known, f"{report.key}: {report.filters}"


def test_catalog_keys_are_unique() -> None:
    keys = [r.key for r in CATALOG]
    assert len(keys) == len(set(keys))
    assert len(keys) == len(BY_KEY)


def test_rebooked_bookings_is_honestly_unimplemented() -> None:
    r = BY_KEY["rebooked_bookings"]
    assert not r.implemented
    assert r.unavailable_reason == "no_rebooking_linkage"


# ---------------------------------------------------------------------------
# _finalize: pagination, sorting, totals
# ---------------------------------------------------------------------------


async def test_finalize_paginates_and_sums_totals_over_full_set() -> None:
    report = BY_KEY["payouts"]
    params = ReportParams(page=2, page_size=1)
    rows = [
        {"payout_id": "a", "amount_egp": 10.0},
        {"payout_id": "b", "amount_egp": 20.0},
        {"payout_id": "c", "amount_egp": 30.0},
    ]
    result = await _finalize(report, params, rows)
    assert result.total == 3
    assert result.page == 2
    assert result.page_size == 1
    assert result.totals["amount_egp"] == 60.0
    assert len(result.rows) == 1


async def test_finalize_export_returns_bounded_full_set() -> None:
    report = BY_KEY["users"]
    params = ReportParams(page=5, page_size=10, export=True)
    rows = [{"user_id": str(i)} for i in range(120)]
    result = await _finalize(report, params, rows)
    assert result.page == 1
    assert result.page_size == EXPORT_MAX
    assert len(result.rows) == 120


async def test_finalize_ignores_unlisted_sort_key() -> None:
    report = BY_KEY["payouts"]
    params = ReportParams(sort="; DROP TABLE users; --")
    rows = [{"payout_id": "b"}, {"payout_id": "a"}]
    result = await _finalize(report, params, rows)
    assert [r["payout_id"] for r in result.rows] == ["b", "a"]


async def test_finalize_sorts_declared_sortable_key_desc() -> None:
    report = BY_KEY["payouts"]
    params = ReportParams(sort="amount_egp", order="desc")
    rows = [
        {"amount_egp": 5.0},
        {"amount_egp": 50.0},
        {"amount_egp": 1.0},
    ]
    result = await _finalize(report, params, rows)
    assert [r["amount_egp"] for r in result.rows] == [50.0, 5.0, 1.0]


# ---------------------------------------------------------------------------
# Endpoint auth + behavior
# ---------------------------------------------------------------------------


def test_catalog_requires_auth(reports_client) -> None:
    response = reports_client.get("/api/v1/admin/reports/catalog")
    assert response.status_code in (401, 403)


def test_catalog_admin_ok(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/catalog",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    reports = response.json()["reports"]
    assert len(reports) == len(CATALOG)
    assert {r["key"] for r in reports} == {r.key for r in CATALOG}


def test_catalog_guest_forbidden(reports_client, monkeypatch) -> None:
    user = _make_user("guest-1", role="guest")
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/catalog",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 403


def test_catalog_host_forbidden(reports_client, monkeypatch) -> None:
    user = _make_user("host-1", role="host")
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/catalog",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 403


def test_catalog_staff_without_reports_perm_forbidden(
    reports_client, fake_session, monkeypatch
) -> None:
    user = _make_user("staff-1", role="staff")
    _patch_auth_user(monkeypatch, user)
    _deny_permission(fake_session)
    response = reports_client.get(
        "/api/v1/admin/reports/catalog",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 403


def test_report_unknown_key_404(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/does_not_exist",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 404


def test_report_unimplemented_key_404(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/rebooked_bookings",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 404


def test_bookings_report_admin_empty_ok(reports_client, monkeypatch) -> None:
    """Empty DB result → valid empty page, not an error."""
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/bookings",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "bookings"
    assert data["total"] == 0
    assert data["rows"] == []
    assert "booking_id" in data["columns"]
    assert data["date_basis"] == "booking_created"


def test_report_guest_forbidden(reports_client, monkeypatch) -> None:
    user = _make_user("guest-2", role="guest")
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/booking_financials",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 403


def test_export_csv_admin(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/booking_summary/export?format=csv",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    body = response.text
    assert "report,booking_summary" in body
    assert "status,count" in body


def test_export_xlsx_admin(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/booking_summary/export?format=xlsx",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert response.content[:2] == b"PK"


def test_export_guest_forbidden(reports_client, monkeypatch) -> None:
    user = _make_user("guest-3", role="guest")
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/booking_summary/export",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 403


def test_export_rejects_bad_format(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/booking_summary/export?format=pdf",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 422


def test_report_order_param_validated(reports_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/bookings?order=sideways",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 422


def test_report_filters_passed_through(reports_client, monkeypatch) -> None:
    """Filter params are accepted and echoed in filters_applied."""
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    response = reports_client.get(
        "/api/v1/admin/reports/bookings"
        "?status=confirmed&governorate=Cairo&date_from=2025-01-01",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    applied = response.json()["filters_applied"]
    assert applied["status"] == "confirmed"
    assert applied["governorate"] == "Cairo"
    assert applied["date_from"] == "2025-01-01"


# ---------------------------------------------------------------------------
# Builder smoke tests — every implemented report executes its query path
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "report_key", [r.key for r in CATALOG if r.implemented]
)
def test_every_implemented_report_returns_200(
    reports_client, fake_session, monkeypatch, report_key
) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    _empty_result_session(fake_session)
    response = reports_client.get(
        f"/api/v1/admin/reports/{report_key}",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200, f"{report_key}: {response.text}"
    data = response.json()
    assert data["key"] == report_key
    assert isinstance(data["rows"], list)
    if report_key != "marketplace_overview":
        # KPI snapshot rows are emitted unconditionally; all other reports
        # read the (empty) mocked session.
        assert data["rows"] == []
        assert data["total"] == 0


@pytest.mark.parametrize(
    "report_key", [r.key for r in CATALOG if r.implemented]
)
def test_every_implemented_report_exports_csv(
    reports_client, fake_session, monkeypatch, report_key
) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    _empty_result_session(fake_session)
    response = reports_client.get(
        f"/api/v1/admin/reports/{report_key}/export",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200, f"{report_key}: {response.text}"
    assert "text/csv" in response.headers["content-type"]
    assert f"report,{report_key}" in response.text


def test_marketplace_overview_metrics_shape(
    reports_client, fake_session, monkeypatch
) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    _empty_result_session(fake_session)
    response = reports_client.get(
        "/api/v1/admin/reports/marketplace_overview",
        headers={"Authorization": f"Bearer {_token_for(user)}"},
    )
    assert response.status_code == 200
    data = response.json()
    metrics = {r["metric"] for r in data["rows"]}
    assert {
        "users_total",
        "listings_total",
        "bookings_total",
        "collected_egp",
        "stayos_revenue_egp",
        "vat_payable_egp",
        "funds_held_egp",
        "host_payable_egp",
        "payouts_paid_egp",
        "refunded_egp",
    } <= metrics
