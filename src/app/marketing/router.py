from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.security.client_ip import client_ip
from app.security.rate_limit import rate_limit
from app.shared.exceptions import NotFoundError, StayOSError, to_http_exception

from . import services
from .constants import LeadKind
from .schemas import (
    EventCreate,
    GuestLeadCreate,
    HostLeadCreate,
    LeadNoteCreate,
    LeadStatusUpdate,
)

public_router = APIRouter(prefix="/public", tags=["public-marketing"])
admin_router = APIRouter(prefix="/admin/leads", tags=["admin-leads"])


async def leads_rate_limit(request: Request) -> None:
    await rate_limit(request, key_prefix="leads", limit=10, window_seconds=300)


async def events_rate_limit(request: Request) -> None:
    # analytics events get their own, looser bucket — browsing activity
    # must never exhaust the lead-submission quota
    await rate_limit(request, key_prefix="events", limit=60, window_seconds=300)


@public_router.post("/leads/host", status_code=201, dependencies=[Depends(leads_rate_limit)])
async def submit_host_lead(
    payload: HostLeadCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    if payload.website:  # honeypot — pretend success, store nothing
        return {"id": None, "status": "received"}
    try:
        lead, created = await services.create_host_lead(session, payload, client_ip(request))
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return {"id": lead.id, "status": lead.status, "created": created}


@public_router.post("/leads/guest", status_code=201, dependencies=[Depends(leads_rate_limit)])
async def submit_guest_lead(
    payload: GuestLeadCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    if payload.website:
        return {"id": None, "status": "received"}
    try:
        lead, created = await services.create_guest_lead(session, payload, client_ip(request))
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
    return {"id": lead.id, "status": lead.status, "created": created}


@public_router.post("/events", status_code=202, dependencies=[Depends(events_rate_limit)])
async def track_event(
    payload: EventCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    ev = await services.record_event(session, payload, client_ip(request))
    return {"id": ev.id}


# ── Admin (RBAC: admin role only — no new staff permissions) ─────────

_admin = Depends(auth_dependencies.require_role("admin"))


@admin_router.get("")
async def list_leads(
    kind: str | None = Query(None, pattern="^(HOST|GUEST)$"),
    status: str | None = None,
    city: str | None = None,
    q: str | None = None,
    property_type: str | None = None,
    readiness: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = Query(200, le=1000),
    offset: int = 0,
    _admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    return await services.list_leads(
        session, kind, status, city, q, property_type,
        readiness, date_from, date_to, limit, offset,
    )


@admin_router.get("/{kind}/{lead_id}")
async def get_lead_detail(
    kind: str,
    lead_id: str,
    _admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    if kind not in (LeadKind.HOST, LeadKind.GUEST):
        raise to_http_exception(NotFoundError("lead not found"))
    detail = await services.lead_detail(session, kind, lead_id)
    if not detail:
        raise to_http_exception(NotFoundError("lead not found"))
    return detail


@admin_router.patch("/{kind}/{lead_id}/status")
async def set_lead_status(
    kind: str,
    lead_id: str,
    payload: LeadStatusUpdate,
    _admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    if kind not in (LeadKind.HOST, LeadKind.GUEST):
        raise to_http_exception(NotFoundError("lead not found"))
    ok = await services.update_lead_status(session, kind, lead_id, payload.status)
    if not ok:
        raise to_http_exception(NotFoundError("lead not found"))
    return {"id": lead_id, "status": payload.status}


@admin_router.post("/{kind}/{lead_id}/notes", status_code=201)
async def add_lead_note(
    kind: str,
    lead_id: str,
    payload: LeadNoteCreate,
    admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    n = await services.add_note(session, kind, lead_id, str(admin.id), payload.note)
    if not n:
        raise to_http_exception(NotFoundError("lead not found"))
    return {"id": n.id}


@admin_router.get("/export.csv")
async def export_leads_csv(
    kind: str | None = Query(None, pattern="^(HOST|GUEST)$"),
    status: str | None = None,
    city: str | None = None,
    q: str | None = None,
    property_type: str | None = None,
    readiness: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    _admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> Response:
    body = await services.export_csv(
        session, kind, status, city, q, property_type,
        readiness, date_from, date_to,
    )
    # UTF-8 BOM so Excel renders Arabic cells correctly on open.
    return Response(
        content="\ufeff" + body,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="makazoh-leads.csv"'
        },
    )


@admin_router.get("/summary")
async def leads_summary(
    _admin: User = _admin,
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await services.marketing_summary(session)
