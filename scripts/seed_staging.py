#!/usr/bin/env python3
"""Staging data seeder.

Creates: 1 admin, 1 host, 1 guest user, 3 listings (units + unit_listings),
and 1 confirmed reservation. Safe to run multiple times — uses upsert logic
via unique constraints.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_staging.py
"""

import asyncio
import os
import sys
import uuid
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # noqa: E402

from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://stayos:stayos@localhost:5432/stayos",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def new_id() -> str:
    return str(uuid.uuid4())


ADMIN_ID = "seed-admin-0000-0000-000000000001"
HOST_ID = "seed-host-0000-0000-000000000002"
GUEST_ID = "seed-guest-000-0000-000000000003"

UNIT_IDS = [
    "seed-unit-0001-0000-000000000001",
    "seed-unit-0002-0000-000000000002",
    "seed-unit-0003-0000-000000000003",
]

RESERVATION_ID = "seed-rsrv-0001-0000-000000000001"


async def upsert_user(session: AsyncSession, user_id: str, phone: str, role: str, name: str) -> None:
    await session.execute(
        text("""
            INSERT INTO auth.users (id, phone_number, display_name, locale, role, kyc_status, is_active, created_at, updated_at)
            VALUES (:id, :phone, :name, 'ar', :role, 'verified', true, now(), now())
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
        """),
        {"id": user_id, "phone": phone, "name": name, "role": role},
    )


async def upsert_unit(session: AsyncSession, unit_id: str, host_id: str, city: str) -> None:
    await session.execute(
        text("""
            INSERT INTO pms.units (id, host_id, property_type, status, coordinates, governorate, city, max_guests, bedrooms, bathrooms, created_at, updated_at)
            VALUES (:id, :host_id, 'APARTMENT', 'LISTED',
                    ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326),
                    'Cairo', :city, 4, 2, 1, now(), now())
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
        """),
        {"id": unit_id, "host_id": host_id, "city": city},
    )

    await session.execute(
        text("""
            INSERT INTO pms.unit_listings (id, unit_id, title_ar, title_en, description_ar, description_en,
                amenities, cultural_tags, base_price_egp, min_nights, max_nights, updated_at)
            VALUES (:id, :unit_id, :title_ar, :title_en, 'شقة مريحة في القاهرة', 'Comfortable apartment in Cairo',
                    '{"wifi","air_conditioning","parking"}', '{"family_friendly"}',
                    80000, 1, 30, now())
            ON CONFLICT (unit_id) DO UPDATE SET updated_at = now()
        """),
        {
            "id": new_id(),
            "unit_id": unit_id,
            "title_ar": f"شقة {city}",
            "title_en": f"{city} Apartment",
        },
    )


async def upsert_reservation(session: AsyncSession) -> None:
    check_in = date.today() + timedelta(days=30)
    check_out = check_in + timedelta(days=3)

    await session.execute(
        text("""
            INSERT INTO reservation.reservations (
                id, unit_id, guest_id, status, check_in, check_out,
                adults, children, infants,
                total_amount_egp, host_amount_egp, platform_fee_egp, guest_fee_egp,
                currency, payment_method, created_at, updated_at
            ) VALUES (
                :id, :unit_id, :guest_id, 'confirmed', :check_in, :check_out,
                2, 0, 0,
                240000, 204000, 24000, 12000,
                'EGP', 'paymob', now(), now()
            )
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
        """),
        {
            "id": RESERVATION_ID,
            "unit_id": UNIT_IDS[0],
            "guest_id": GUEST_ID,
            "check_in": check_in,
            "check_out": check_out,
        },
    )

    await session.execute(
        text("""
            INSERT INTO pms.calendar_rules (
                id, unit_id, date_from, date_to, status, reservation_id, block_type, created_at, updated_at
            ) VALUES (
                :id, :unit_id, :check_in, :check_out, 'BOOKED', :reservation_id, NULL, now(), now()
            )
            ON CONFLICT (id) DO UPDATE SET updated_at = now()
        """),
        {
            "id": new_id(),
            "unit_id": UNIT_IDS[0],
            "check_in": check_in,
            "check_out": check_out,
            "reservation_id": RESERVATION_ID,
        },
    )


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Seeding users...")
            await upsert_user(session, ADMIN_ID, "+20100000001", "admin", "Admin Seed")
            await upsert_user(session, HOST_ID, "+20100000002", "host", "Host Seed")
            await upsert_user(session, GUEST_ID, "+20100000003", "guest", "Guest Seed")

            print("Seeding units and listings...")
            cities = ["Zamalek", "Maadi", "New Cairo"]
            for unit_id, city in zip(UNIT_IDS, cities):
                await upsert_unit(session, unit_id, HOST_ID, city)

            print("Seeding reservation...")
            await upsert_reservation(session)

    print("Done. Seed IDs:")
    print(f"  admin:       {ADMIN_ID}")
    print(f"  host:        {HOST_ID}")
    print(f"  guest:       {GUEST_ID}")
    print(f"  units:       {', '.join(UNIT_IDS)}")
    print(f"  reservation: {RESERVATION_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
