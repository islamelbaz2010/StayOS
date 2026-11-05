import csv
import hashlib
import hmac
import io
import re
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

from .constants import LeadKind, LeadStatus
from .models import GuestLead, HostLead, LeadEvent, LeadNote
from .schemas import EventCreate, GuestLeadCreate, HostLeadCreate, UtmMixin


def hash_ip(ip: str | None) -> str | None:
    """Keyed HMAC-SHA256 pseudonym — never a reversible/lookup-able hash.

    Returns None when LEADS_IP_HMAC_KEY is unset (safe-degrades rather
    than storing a predictable plain-SHA256 of the IP).
    """
    if not ip or not settings.LEADS_IP_HMAC_KEY:
        return None
    return hmac.new(
        settings.LEADS_IP_HMAC_KEY.encode(), ip.encode(), hashlib.sha256
    ).hexdigest()[:32]


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("+"):
        return "+" + digits
    return digits


def normalize_email(raw: str) -> str:
    return raw.strip().lower()


def _utm(obj: UtmMixin) -> dict[str, str | None]:
    return {
        "utm_source": obj.utm_source, "utm_medium": obj.utm_medium,
        "utm_campaign": obj.utm_campaign, "utm_content": obj.utm_content,
        "lang": obj.lang,
    }


async def create_host_lead(
    session: AsyncSession, payload: HostLeadCreate, ip: str | None
) -> tuple[HostLead, bool]:
    """Returns (lead, created). Duplicate phone → existing lead, created=False."""
    phone_n = normalize_phone(payload.phone)
    existing = await session.scalar(
        select(HostLead).where(HostLead.phone_normalized == phone_n)
    )
    if existing:
        return existing, False
    lead = HostLead(
        id=str(uuid.uuid4()),
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip(),
        phone_normalized=phone_n,
        email=normalize_email(payload.email) if payload.email else None,
        city=payload.city.strip(),
        property_type=payload.property_type,
        units_count=payload.units_count,
        property_readiness=payload.property_readiness,
        preferred_contact=payload.preferred_contact,
        management_company=payload.management_company,
        message=payload.message,
        consent=True,
        status=LeadStatus.NEW,
        ip_hash=hash_ip(ip),
        **_utm(payload),
    )
    session.add(lead)
    try:
        await session.commit()
    except IntegrityError:
        # concurrent duplicate — the unique constraint is the authority
        await session.rollback()
        row = await session.scalar(
            select(HostLead).where(HostLead.phone_normalized == phone_n)
        )
        if row is None:
            raise
        return row, False
    return lead, True


async def create_guest_lead(
    session: AsyncSession, payload: GuestLeadCreate, ip: str | None
) -> tuple[GuestLead, bool]:
    # normalized dedup key: trimmed, lowercased email or normalized phone
    key = normalize_email(payload.email) if payload.email else normalize_phone(payload.phone or "")
    existing = await session.scalar(
        select(GuestLead).where(GuestLead.contact_key == key)
    )
    if existing:
        return existing, False
    lead = GuestLead(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        email=normalize_email(payload.email) if payload.email else None,
        phone=payload.phone.strip() if payload.phone else None,
        contact_key=key,
        preferred_city=payload.preferred_city,
        accommodation_type=payload.accommodation_type,
        consent=True,
        status=LeadStatus.NEW,
        ip_hash=hash_ip(ip),
        **_utm(payload),
    )
    session.add(lead)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        row = await session.scalar(
            select(GuestLead).where(GuestLead.contact_key == key)
        )
        if row is None:
            raise
        return row, False
    return lead, True


async def record_event(
    session: AsyncSession, payload: EventCreate, ip: str | None
) -> LeadEvent:
    ev = LeadEvent(
        id=str(uuid.uuid4()),
        event=payload.event,
        session_id=payload.session_id,
        ip_hash=hash_ip(ip),
        **_utm(payload),
    )
    session.add(ev)
    await session.commit()
    return ev


def _model(kind: str) -> type[HostLead] | type[GuestLead]:
    return HostLead if kind == LeadKind.HOST else GuestLead


async def list_leads(
    session: AsyncSession,
    kind: str | None = None,
    status: str | None = None,
    city: str | None = None,
    q: str | None = None,
    property_type: str | None = None,
    readiness: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 200,
    offset: int = 0,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    kinds = [kind] if kind else [LeadKind.HOST, LeadKind.GUEST]
    for k in kinds:
        model = _model(k)
        stmt: Any = select(model).order_by(model.created_at.desc()).limit(limit).offset(offset)
        if status:
            stmt = stmt.where(model.status == status)
        if date_from:
            stmt = stmt.where(model.created_at >= date_from)
        if date_to:
            stmt = stmt.where(model.created_at <= date_to)
        if k == LeadKind.HOST:
            if city:
                stmt = stmt.where(HostLead.city.ilike(f"%{city}%"))
            if property_type:
                stmt = stmt.where(HostLead.property_type == property_type)
            if readiness:
                stmt = stmt.where(HostLead.property_readiness == readiness)
            if q:
                stmt = stmt.where(
                    HostLead.full_name.ilike(f"%{q}%")
                    | HostLead.phone.contains(q)
                    | HostLead.email.ilike(f"%{q}%")
                )
        else:
            if city:
                stmt = stmt.where(GuestLead.preferred_city.ilike(f"%{city}%"))
            if q:
                stmt = stmt.where(
                    GuestLead.name.ilike(f"%{q}%")
                    | GuestLead.email.ilike(f"%{q}%")
                    | GuestLead.phone.contains(q)
                )
        for lead in (await session.scalars(stmt)).all():
            if k == LeadKind.HOST:
                name, city_v, detail = lead.full_name, lead.city, f"{lead.property_type}×{lead.units_count}"
                email, phone = lead.email, lead.phone
            else:
                name, city_v, detail = lead.name, lead.preferred_city, lead.accommodation_type
                email, phone = lead.email, lead.phone
            rows.append({
                "id": lead.id, "kind": k, "name": name, "phone": phone,
                "email": email, "city": city_v, "detail": detail,
                "status": lead.status, "consent_at": lead.consent_at,
                "utm_source": lead.utm_source, "utm_campaign": lead.utm_campaign,
                "created_at": lead.created_at,
            })
    rows.sort(key=lambda r: r["created_at"] or 0, reverse=True)
    return rows


async def update_lead_status(
    session: AsyncSession, kind: str, lead_id: str, status: str
) -> bool:
    model = _model(kind)
    lead: Any = await session.get(model, lead_id)
    if not lead:
        return False
    lead.status = status
    await session.commit()
    return True


async def add_note(
    session: AsyncSession, kind: str, lead_id: str, author_id: str, note: str
) -> LeadNote | None:
    model = _model(kind)
    if not await session.get(model, lead_id):
        return None
    n = LeadNote(
        id=str(uuid.uuid4()), lead_kind=kind, lead_id=lead_id,
        author_id=author_id, note=note,
    )
    session.add(n)
    await session.commit()
    return n


async def lead_detail(
    session: AsyncSession, kind: str, lead_id: str
) -> dict[str, Any] | None:
    model = _model(kind)
    lead: Any = await session.get(model, lead_id)
    if not lead:
        return None
    base: dict[str, Any] = {
        "id": lead.id, "kind": kind, "status": lead.status,
        "email": lead.email, "consent": lead.consent,
        "consent_at": lead.consent_at, "lang": lead.lang,
        "utm_source": lead.utm_source, "utm_medium": lead.utm_medium,
        "utm_campaign": lead.utm_campaign, "utm_content": lead.utm_content,
        "created_at": lead.created_at, "updated_at": lead.updated_at,
    }
    if kind == LeadKind.HOST:
        base.update({
            "full_name": lead.full_name, "phone": lead.phone,
            "city": lead.city, "property_type": lead.property_type,
            "units_count": lead.units_count,
            "property_readiness": lead.property_readiness,
            "preferred_contact": lead.preferred_contact,
            "management_company": lead.management_company,
            "message": lead.message,
        })
    else:
        base.update({
            "name": lead.name, "phone": lead.phone,
            "preferred_city": lead.preferred_city,
            "accommodation_type": lead.accommodation_type,
        })
    notes = (await session.scalars(
        select(LeadNote)
        .where(LeadNote.lead_kind == kind, LeadNote.lead_id == lead_id)
        .order_by(LeadNote.created_at.asc())
    )).all()
    base["notes"] = [
        {"id": n.id, "author_id": n.author_id, "note": n.note,
         "created_at": n.created_at}
        for n in notes
    ]
    return base


_CSV_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_safe(value: Any) -> Any:
    """Neutralize spreadsheet formula injection — a leading quote turns any
    formula-shaped cell into inert text for Excel/Sheets importers."""
    if isinstance(value, str) and value[:1] in _CSV_FORMULA_PREFIXES:
        return "'" + value
    return value


_HOST_CSV_COLS = [
    "id", "full_name", "phone", "email", "city", "property_type",
    "units_count", "property_readiness", "preferred_contact",
    "management_company", "message", "status", "lang",
    "utm_source", "utm_medium", "utm_campaign", "utm_content",
    "consent_at", "created_at",
]
_GUEST_CSV_COLS = [
    "id", "name", "email", "phone", "preferred_city", "accommodation_type",
    "status", "lang", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "consent_at", "created_at",
]


async def export_csv(
    session: AsyncSession,
    kind: str | None = None,
    status: str | None = None,
    city: str | None = None,
    q: str | None = None,
    property_type: str | None = None,
    readiness: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> str:
    """Canonical-record export. Column set is the union of both lead schemas
    when kind is unset; per-kind columns otherwise. Host-only fields stay
    blank on guest rows."""
    kinds = [kind] if kind else [LeadKind.HOST, LeadKind.GUEST]
    cols = (
        _HOST_CSV_COLS if kind == LeadKind.HOST
        else _GUEST_CSV_COLS if kind == LeadKind.GUEST
        else ["kind"] + sorted(set(_HOST_CSV_COLS) | set(_GUEST_CSV_COLS))
    )
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(cols)
    for k in kinds:
        model = _model(k)
        stmt: Any = select(model).order_by(model.created_at.desc()).limit(10000)
        if status:
            stmt = stmt.where(model.status == status)
        if date_from:
            stmt = stmt.where(model.created_at >= date_from)
        if date_to:
            stmt = stmt.where(model.created_at <= date_to)
        if k == LeadKind.HOST:
            if city:
                stmt = stmt.where(HostLead.city.ilike(f"%{city}%"))
            if property_type:
                stmt = stmt.where(HostLead.property_type == property_type)
            if readiness:
                stmt = stmt.where(HostLead.property_readiness == readiness)
            if q:
                stmt = stmt.where(
                    HostLead.full_name.ilike(f"%{q}%")
                    | HostLead.phone.contains(q)
                    | HostLead.email.ilike(f"%{q}%")
                )
        else:
            if city:
                stmt = stmt.where(GuestLead.preferred_city.ilike(f"%{city}%"))
            if q:
                stmt = stmt.where(
                    GuestLead.name.ilike(f"%{q}%")
                    | GuestLead.email.ilike(f"%{q}%")
                    | GuestLead.phone.contains(q)
                )
        for lead in (await session.scalars(stmt)).all():
            row: dict[str, Any] = {"kind": k}
            for c in cols:
                if c != "kind":
                    row[c] = getattr(lead, c, None)
            w.writerow([_csv_safe(row.get(c)) for c in cols])
    return buf.getvalue()


async def marketing_summary(session: AsyncSession) -> dict[str, object]:
    async def _count(
        table: type[HostLead] | type[GuestLead] | type[LeadEvent],
        col: Any = None,
        val: Any = None,
    ) -> int:
        stmt = select(func.count()).select_from(table)
        if col is not None:
            stmt = stmt.where(col == val)
        return await session.scalar(stmt) or 0

    views = await _count(LeadEvent, LeadEvent.event, "page_view")
    starts = await _count(LeadEvent, LeadEvent.event, "host_form_start")
    gstarts = await _count(LeadEvent, LeadEvent.event, "guest_form_start")
    gsubmits = await _count(LeadEvent, LeadEvent.event, "guest_waitlist_submit")
    hosts = await _count(HostLead)
    guests = await _count(GuestLead)

    top_src = await session.scalar(
        select(LeadEvent.utm_source, func.count())
        .where(LeadEvent.utm_source.isnot(None))
        .group_by(LeadEvent.utm_source).order_by(func.count().desc()).limit(1)
        .with_only_columns(LeadEvent.utm_source)
    )
    top_camp = await session.scalar(
        select(LeadEvent.utm_campaign)
        .where(LeadEvent.utm_campaign.isnot(None))
        .group_by(LeadEvent.utm_campaign).order_by(func.count().desc()).limit(1)
    )
    city_rows = (await session.execute(
        select(HostLead.city, func.count().label("n"))
        .group_by(HostLead.city).order_by(func.count().desc()).limit(5)
    )).all()
    ptype_rows = (await session.execute(
        select(HostLead.property_type, func.count().label("n"))
        .group_by(HostLead.property_type).order_by(func.count().desc())
    )).all()
    units_total = await session.scalar(
        select(func.coalesce(func.sum(HostLead.units_count), 0))
    )
    status_rows = {}
    for model, kind in ((HostLead, "host"), (GuestLead, "guest")):
        for status, n in (await session.execute(
            select(model.status, func.count()).group_by(model.status)
        )).all():
            status_rows[f"{kind}:{status}"] = n

    return {
        "page_views": views, "host_form_starts": starts,
        "guest_form_starts": gstarts, "guest_waitlist_submits": gsubmits,
        "host_submissions": hosts, "guest_submissions": guests,
        "host_conversion_rate": round(hosts / starts * 100, 2) if starts else 0.0,
        "guest_conversion_rate": round(gsubmits / gstarts * 100, 2) if gstarts else 0.0,
        "top_source": top_src, "top_campaign": top_camp,
        "top_cities": [{"city": c, "leads": n} for c, n in city_rows],
        "host_by_property_type": [
            {"property_type": p, "leads": n} for p, n in ptype_rows
        ],
        "host_units_total": int(units_total or 0),
        "leads_by_status": status_rows,
    }
