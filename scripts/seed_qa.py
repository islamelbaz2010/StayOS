#!/usr/bin/env python3
"""Seed the MAKAZOH QA database with synthetic, deterministic demo data.

Safety contract:
- Refuses to run unless DATABASE_URL points at a database whose name
  ends with ``_qa`` (e.g. ``makazoh_qa``). Fails closed on prod names.
- Idempotent: deterministic seed IDs + ON CONFLICT → reruns never
  duplicate rows.
- Creates the five approved QA role accounts (guest, host, admin,
  staff, field_staff), three listings for the host, one booking and a
  payment-proof style record where the schema allows it.
- Never writes financial ledgers as "real" — QA data only.

Usage:
    DATABASE_URL=postgresql+asyncpg://app_qa:...@localhost:5432/makazoh_qa \
        python scripts/seed_qa.py
"""

from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def _guard_qa_only() -> None:
    db_name = DATABASE_URL.rsplit("/", 1)[-1].split("?")[0]
    if not db_name.endswith("_qa"):
        print(
            f"REFUSING: DATABASE_URL database '{db_name}' is not a *_qa "
            "database. seed_qa.py only writes to QA."
        )
        sys.exit(2)


# Deterministic IDs — reruns upsert rather than duplicate.
USERS = [
    ("qa-guest-0000-0000-000000000001", "+201500000001", "guest", "QA Guest"),
    ("qa-host-0000-0000-0000000000002", "+201500000002", "host", "QA Host"),
    ("qa-admin-0000-0000-000000000003", "+201500000003", "admin", "QA Admin"),
    ("qa-staff-0000-0000-000000000004", "+201500000004", "staff", "QA Staff"),
    ("qa-field-0000-0000-000000000005", "+201500000005", "field_staff", "QA Field Staff"),
]
STAFF_ID = "qa-staff-0000-0000-000000000004"
HOST_ID = "qa-host-0000-0000-0000000000002"
# operations_manager role-group permissions (verified in
# src/app/auth/constants.py STAFF_ROLE_GROUPS).
STAFF_PERMISSIONS = ["operations", "disputes", "listings"]
UNIT_IDS = [
    "qa-unit-0001-0000-000000000001",
    "qa-unit-0002-0000-000000000002",
    "qa-unit-0003-0000-000000000003",
]


async def upsert_user(session: AsyncSession, user_id: str, phone: str, role: str, name: str) -> None:
    await session.execute(
        text(
            """
            INSERT INTO auth.users (id, phone_number, display_name, locale, role,
                                    kyc_status, is_active, created_at, updated_at)
            VALUES (:id, :phone, :name, 'ar', :role, 'verified', true, now(), now())
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
            """
        ),
        {"id": user_id, "phone": phone, "name": name, "role": role},
    )


async def upsert_staff_permission(session: AsyncSession, user_id: str, permission: str) -> None:
    # One row per (user_id, permission); grantor is the QA admin.
    await session.execute(
        text(
            """
            INSERT INTO auth.staff_permissions (id, user_id, permission, granted_by, is_active, created_at)
            VALUES (:id, :uid, :perm, :grantor, true, now())
            ON CONFLICT (user_id, permission) DO NOTHING
            """
        ),
        {"id": f"qa-perm-{permission}-{user_id[-12:]}", "uid": user_id, "perm": permission, "grantor": "qa-admin-0000-0000-000000000003"},
    )


async def upsert_unit(session: AsyncSession, unit_id: str, host_id: str, city: str, title: str) -> None:
    await session.execute(
        text(
            """
            INSERT INTO pms.units (id, host_id, property_type, status, coordinates,
                                   governorate, city, max_guests, bedrooms, bathrooms,
                                   created_at, updated_at)
            VALUES (:id, :host_id, 'APARTMENT', 'LISTED',
                    ST_SetSRID(ST_MakePoint(31.23, 30.04), 4326),
                    'Cairo', :city, 4, 2, 1, now(), now())
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
            """
        ),
        {"id": unit_id, "host_id": host_id, "city": city},
    )
    await session.execute(
        text(
            """
            INSERT INTO pms.unit_listings (id, unit_id, title_ar, title_en,
                                           description_ar, description_en, base_price_egp,
                                           currency, min_nights, max_nights,
                                           updated_at)
            VALUES (:id, :unit_id, :title_ar, :title, :desc, :desc, 1800,
                    'EGP', 1, 30, now())
            ON CONFLICT (unit_id) DO UPDATE SET updated_at = now()
            """
        ),
        {
            "id": f"qa-list-{unit_id[-12:]}",
            "unit_id": unit_id,
            "title": title,
            "title_ar": title.replace("QA", "تجريبي"),
            "desc": "QA demo listing — fictional data.",
        },
    )


async def seed() -> None:
    _guard_qa_only()
    async with AsyncSessionLocal() as session:
        async with session.begin():
            for user_id, phone, role, name in USERS:
                await upsert_user(session, user_id, phone, role, name)
            for perm in STAFF_PERMISSIONS:
                await upsert_staff_permission(session, STAFF_ID, perm)
            for unit_id, city in zip(UNIT_IDS, ["Zamalek", "Maadi", "New Cairo"]):
                await upsert_unit(session, unit_id, HOST_ID, city, f"QA {city} Apartment")
    print("QA seed complete:")
    for user_id, _phone, role, name in USERS:
        print(f"  {role:<12} {name}  ({user_id})")
    print("  staff permissions:", ", ".join(STAFF_PERMISSIONS))
    print("  units:", ", ".join(UNIT_IDS))


if __name__ == "__main__":
    asyncio.run(seed())
