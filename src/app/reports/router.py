"""Admin Reports endpoints — every route is gated by the ``reports``
staff permission (admins implicitly hold all permissions)."""

import csv
import io
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.constants import StaffPermission
from app.auth.models import User
from app.database import get_session
from app.reports.queries import EXPORT_MAX, ReportParams, run_report
from app.reports.registry import BY_KEY, CATALOG
from app.reports.schemas import (
    ReportCatalogEntry,
    ReportCatalogResponse,
    ReportResult,
)
from app.shared.exceptions import NotFoundError, to_http_exception

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])

_REPORTS_PERMISSION = auth_dependencies.require_staff_permission(
    StaffPermission.REPORTS.value, allow_roles=()
)


def _params(
    date_from: date | None,
    date_to: date | None,
    status: str | None,
    payment_status: str | None,
    payout_status: str | None,
    kyc_status: str | None,
    role: str | None,
    governorate: str | None,
    city: str | None,
    property_type: str | None,
    host_id: str | None,
    guest_id: str | None,
    unit_id: str | None,
    payment_method: str | None,
    cancel_reason: str | None,
    entry_type: str | None,
    stay_phase: str | None,
    stay_in_range: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    page: int,
    page_size: int,
    sort: str | None,
    order: str,
    export: bool = False,
) -> ReportParams:
    return ReportParams(
        date_from=date_from,
        date_to=date_to,
        status=status,
        payment_status=payment_status,
        payout_status=payout_status,
        kyc_status=kyc_status,
        role=role,
        governorate=governorate,
        city=city,
        property_type=property_type,
        host_id=host_id,
        guest_id=guest_id,
        unit_id=unit_id,
        payment_method=payment_method,
        cancel_reason=cancel_reason,
        entry_type=entry_type,
        stay_phase=stay_phase,
        stay_in_range=stay_in_range,
        min_amount=min_amount,
        max_amount=max_amount,
        page=page,
        page_size=page_size,
        sort=sort,
        order=order,
        export=export,
    )


@router.get("/catalog", response_model=ReportCatalogResponse)
async def get_catalog(
    user: User = Depends(_REPORTS_PERMISSION),
) -> ReportCatalogResponse:
    return ReportCatalogResponse(
        reports=[
            ReportCatalogEntry(
                key=r.key,
                category=r.category,
                columns=list(r.columns),
                date_basis=r.date_basis,
                filters=list(r.filters),
                sortable=list(r.sortable),
                money_columns=list(r.money_columns),
                implemented=r.implemented,
                unavailable_reason=r.unavailable_reason,
            )
            for r in CATALOG
        ]
    )


@router.get("/{report_key}", response_model=ReportResult)
async def get_report(
    report_key: str,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    payout_status: str | None = Query(default=None),
    kyc_status: str | None = Query(default=None),
    role: str | None = Query(default=None),
    governorate: str | None = Query(default=None),
    city: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    host_id: str | None = Query(default=None),
    guest_id: str | None = Query(default=None),
    unit_id: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    cancel_reason: str | None = Query(default=None),
    entry_type: str | None = Query(default=None),
    stay_phase: str | None = Query(default=None),
    stay_in_range: str | None = Query(default=None),
    min_amount: Decimal | None = Query(default=None),
    max_amount: Decimal | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    sort: str | None = Query(default=None),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    user: User = Depends(_REPORTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> ReportResult:
    report = BY_KEY.get(report_key)
    if report is None or not report.implemented:
        raise to_http_exception(NotFoundError("Report not found"))
    params = _params(
        date_from, date_to, status, payment_status, payout_status,
        kyc_status, role, governorate, city, property_type, host_id,
        guest_id, unit_id, payment_method, cancel_reason, entry_type,
        stay_phase, stay_in_range, min_amount, max_amount, page,
        page_size, sort, order,
    )
    return await run_report(session, report_key, params)


@router.get("/{report_key}/export")
async def export_report(
    report_key: str,
    format: str = Query(default="csv", pattern="^(csv|xlsx)$"),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    payout_status: str | None = Query(default=None),
    kyc_status: str | None = Query(default=None),
    role: str | None = Query(default=None),
    governorate: str | None = Query(default=None),
    city: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    host_id: str | None = Query(default=None),
    guest_id: str | None = Query(default=None),
    unit_id: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    cancel_reason: str | None = Query(default=None),
    entry_type: str | None = Query(default=None),
    stay_phase: str | None = Query(default=None),
    stay_in_range: str | None = Query(default=None),
    min_amount: Decimal | None = Query(default=None),
    max_amount: Decimal | None = Query(default=None),
    sort: str | None = Query(default=None),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    user: User = Depends(_REPORTS_PERMISSION),
    session: AsyncSession = Depends(get_session),
) -> Response:
    report = BY_KEY.get(report_key)
    if report is None or not report.implemented:
        raise to_http_exception(NotFoundError("Report not found"))
    params = _params(
        date_from, date_to, status, payment_status, payout_status,
        kyc_status, role, governorate, city, property_type, host_id,
        guest_id, unit_id, payment_method, cancel_reason, entry_type,
        stay_phase, stay_in_range, min_amount, max_amount,
        1, EXPORT_MAX, sort, order, export=True,
    )
    result = await run_report(session, report_key, params)
    meta = [
        ("report", result.key),
        ("generated_at", result.generated_at.isoformat()),
        ("date_basis", result.date_basis),
        ("filters", "; ".join(f"{k}={v}" for k, v in result.filters_applied.items())),
        ("rows", str(len(result.rows))),
        ("total", str(result.total)),
    ]
    if format == "xlsx":
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = result.key[:31]
        for k, v in meta:
            ws.append([k, v])
        ws.append([])
        ws.append(result.columns)
        for row in result.rows:
            ws.append([row.get(c) for c in result.columns])
        if result.totals:
            ws.append([])
            ws.append(["totals"] + [result.totals.get(c) for c in result.columns[1:]])
        buf = io.BytesIO()
        wb.save(buf)
        return Response(
            content=buf.getvalue(),
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{result.key}.xlsx"'
                )
            },
        )
    out = io.StringIO()
    writer = csv.writer(out)
    for k, v in meta:
        writer.writerow([k, v])
    writer.writerow([])
    writer.writerow(result.columns)
    for row in result.rows:
        writer.writerow([row.get(c) for c in result.columns])
    if result.totals:
        writer.writerow([])
        writer.writerow(["totals"] + [result.totals.get(c) for c in result.columns[1:]])
    return Response(
        content="﻿" + out.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{result.key}.csv"'
        },
    )
