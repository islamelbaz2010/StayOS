import csv
import hashlib
import io
import re
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import LeadKind, LeadStatus
from .models import GuestLead, HostLead, LeadEvent, LeadNote
from .schemas import EventCreate, GuestLeadCreate, HostLeadCreate


def hash_ip(ip: str | None) -> str | None:
    return hashlib.sha256(ip.encode()).hexdigest()[:32] if ip else None


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("+"):
        return "+" + digits
    return digits


def _utm(obj) -> dict:
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
        email=str(payload.email) if payload.email else None,
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
    await session.commit()
    return lead, True


async def create_guest_lead(
    session: AsyncSession, payload: GuestLeadCreate, ip: str | None
) -> tuple[GuestLead, bool]:
    key = payload.contact_key()
    existing = await session.scalar(
        select(GuestLead).where(GuestLead.contact_key == key)
    )
    if existing:
        return existing, False
    lead = GuestLead(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        email=str(payload.email) if payload.email else None,
        phone=payload.phone,
        contact_key=key,
        preferred_city=payload.preferred_city,
        accommodation_type=payload.accommodation_type,
        consent=True,
        status=LeadStatus.NEW,
        ip_hash=hash_ip(ip),
        **_utm(payload),
    )
    session.add(lead)
    await session.commit()
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


def _model(kind: str):
    return HostLead if kind == LeadKind.HOST else GuestLead


async def list_leads(
    session: AsyncSession,
    kind: str | None = None,
    status: str | None = None,
    city: str | None = None,
    q: str | None = None,
    limit: int = 200,
    offset: int = 0,
) -> list[dict]:
    rows: list[dict] = []
    kinds = [kind] if kind else [LeadKind.HOST, LeadKind.GUEST]
    for k in kinds:
        model = _model(k)
        stmt = select(model).order_by(model.created_at.desc()).limit(limit).offset(offset)
        if status:
            stmt = stmt.where(model.status == status)
        if k == LeadKind.HOST:
            if city:
                stmt = stmt.where(HostLead.city.ilike(f"%{city}%"))
            if q:
                stmt = stmt.where(
                    HostLead.full_name.ilike(f"%{q}%")
                    | HostLead.phone.contains(q)
                    | (HostLead.email.ilike(f"%{q}%") if q else False)
                )
        else:
            if city:
                stmt = stmt.where(GuestLead.preferred_city.ilike(f"%{city}%"))
            if q:
                stmt = stmt.where(
                    GuestLead.name.ilike(f"%{q}%")
                    | (GuestLead.email.ilike(f"%{q}%") if q else False)
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
    lead = await session.get(model, lead_id)
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


async def export_csv(session: AsyncSession, kind: str | None = None) -> str:
    rows = await list_leads(session, kind=kind, limit=10000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "kind", "name", "phone", "email", "city", "detail",
                "status", "utm_source", "utm_campaign", "consent_at", "created_at"])
    for r in rows:
        w.writerow([r["id"], r["kind"], r["name"], r["phone"], r["email"],
                    r["city"], r["detail"], r["status"], r["utm_source"],
                    r["utm_campaign"], r["consent_at"], r["created_at"]])
    return buf.getvalue()


async def marketing_summary(session: AsyncSession) -> dict:
    async def _count(table, col=None, val=None):
        stmt = select(func.count()).select_from(table)
        if col is not None:
            stmt = stmt.where(col == val)
        return await session.scalar(stmt) or 0

    views = await _count(LeadEvent, LeadEvent.event, "page_view")
    starts = await _count(LeadEvent, LeadEvent.event, "host_form_start")
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
    status_rows = {}
    for model, kind in ((HostLead, "host"), (GuestLead, "guest")):
        for status, n in (await session.execute(
            select(model.status, func.count()).group_by(model.status)
        )).all():
            status_rows[f"{kind}:{status}"] = n

    return {
        "page_views": views, "host_form_starts": starts,
        "host_submissions": hosts, "guest_submissions": guests,
        "host_conversion_rate": round(hosts / views * 100, 2) if views else 0.0,
        "top_source": top_src, "top_campaign": top_camp,
        "top_cities": [{"city": c, "leads": n} for c, n in city_rows],
        "leads_by_status": status_rows,
    }
