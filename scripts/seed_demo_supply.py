#!/usr/bin/env python3
"""Controlled demo supply seeder.

Creates a deterministic set of LISTED demo units across Egyptian tourist
destinations (Cairo, Giza, Alexandria, North Coast, Hurghada, El Gouna,
Sharm, Dahab, Luxor, Aswan, Ain Sokhna) so that search, map, price-range
histogram and admin/supply surfaces have realistic data to exercise.

Every row uses a `demo-*` ID prefix and descriptions end with a
"(StayOS demo listing)" marker, so demo supply is always identifiable
and never confused with real host inventory. Safe to re-run (upserts).

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_demo_supply.py
"""

import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # noqa: E402

from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://stayos:stayos@localhost:5432/stayos",
)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Demo supply is attached to the existing seed host (Omar Hassan).
HOST_ID = "seed-host-0000-0000-000000000002"

# Unsplash images — the dev/preview IMAGE_HOST_ALLOWLIST includes
# images.unsplash.com. Each listing gets 2 photos; the first is the cover.
PHOTO_POOL = [
    "photo-1522708323590-d24dbb6b0267",  # apartment interior
    "photo-1560448204-e02f11c3d0e2",  # apartment interior
    "photo-1502672260266-1c1ef2d93688",  # living room
    "photo-1493809842364-78817add7ffb",  # living room
    "photo-1560185127-6ed189bf02f4",  # bedroom
    "photo-1560185009-5bf9f2849488",  # bedroom
    "photo-1600596542815-ffad4c1539a9",  # villa exterior
    "photo-1512917774080-9991f1c4c750",  # villa pool
    "photo-1580587771525-78b9dba3b914",  # house exterior
    "photo-1600607687939-ce8a6c25118c",  # interior
    "photo-1600585154340-be6161a56a0c",  # interior
    "photo-1568605114967-8130f3a36994",  # house
    "photo-1520250497591-112f2f40a3f4",  # resort
    "photo-1571896349842-33c89424de2d",  # hotel pool
    "photo-1540541338287-41700207dee6",  # resort pool
    "photo-1582719478250-c89cae4dc85b",  # hotel room
    "photo-1564013799919-ab600027d6c1",  # garden
    "photo-1620626011761-996317b8d101",  # bathroom
    "photo-1567538096630-e0c55bd6374c",  # dining
    "photo-1571003123894-1f0594d2b5d9",  # apartment
]

# (n, governorate, city, district, lat, lng, property_type, category,
#  price_egp, guests, bedrooms, beds, bathrooms, title_ar, title_en, amenities)
DEMO_UNITS = [
    (
        1, "Cairo", "New Cairo", "Fifth Settlement",
        30.0100, 31.4300, "APARTMENT", "ENTIRE_PLACE",
        1200, 4, 2, 3, 1,
        "شقة حديثة في التجمع الخامس", "Modern Apartment in New Cairo",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "parking"],
    ),
    (
        2, "Giza", "Sheikh Zayed", "Beverly Hills",
        30.0400, 30.9800, "VILLA", "ENTIRE_PLACE",
        4500, 8, 4, 5, 3,
        "فيلا عائلية واسعة في الشيخ زايد", "Spacious Family Villa in Sheikh Zayed",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "pool", "parking", "garden"],
    ),
    (
        3, "Giza", "Pyramids Area", "Haram",
        29.9773, 31.1325, "APARTMENT", "ENTIRE_PLACE",
        900, 3, 1, 2, 1,
        "شقة بإطلالة على الأهرامات", "Apartment with Pyramids View",
        ["wifi", "air_conditioning", "kitchen", "tv"],
    ),
    (
        4, "Alexandria", "Smouha", None,
        31.2156, 29.9553, "APARTMENT", "ENTIRE_PLACE",
        1100, 4, 2, 2, 1,
        "شقة مريحة في سموحة", "Comfortable Apartment in Smouha",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "elevator"],
    ),
    (
        5, "Alexandria", "Stanley", None,
        31.2357, 29.9500, "APARTMENT", "ENTIRE_PLACE",
        1800, 5, 3, 4, 2,
        "شقة بإطلالة بحرية في ستانلي", "Sea View Apartment in Stanley",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "heating", "elevator"],
    ),
    (
        6, "Matrouh", "North Coast", "Marina",
        30.8300, 28.9500, "CHALET", "ENTIRE_PLACE",
        3500, 6, 3, 4, 2,
        "شاليه على البحر في الساحل الشمالي", "Beachfront Chalet on the North Coast",
        ["wifi", "air_conditioning", "kitchen", "tv", "pool", "parking"],
    ),
    (
        7, "Matrouh", "North Coast", "Marassi",
        30.7900, 28.8200, "VILLA", "ENTIRE_PLACE",
        8000, 10, 5, 6, 4,
        "فيلا فاخرة في مراسي", "Luxury Villa in Marassi",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "pool", "parking", "garden", "gym"],
    ),
    (
        8, "Red Sea", "Hurghada", "Sakkala",
        27.2579, 33.8116, "STUDIO", "ENTIRE_PLACE",
        650, 2, 0, 1, 1,
        "ستوديو قريب من البحر في الغردقة", "Studio near the Beach in Hurghada",
        ["wifi", "air_conditioning", "tv"],
    ),
    (
        9, "Red Sea", "El Gouna", None,
        27.3942, 33.6782, "APARTMENT", "ENTIRE_PLACE",
        2800, 4, 2, 3, 2,
        "شقة على اللاجون في الجونة", "Lagoon-side Apartment in El Gouna",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "pool"],
    ),
    (
        10, "South Sinai", "Sharm El Sheikh", "Naama Bay",
        27.9158, 34.3300, "CHALET", "ENTIRE_PLACE",
        2200, 4, 2, 3, 1,
        "شاليه في خليج نعمة", "Chalet in Naama Bay",
        ["wifi", "air_conditioning", "kitchen", "tv", "pool"],
    ),
    (
        11, "South Sinai", "Dahab", None,
        28.5092, 34.5136, "APARTMENT", "PRIVATE_ROOM",
        600, 2, 1, 1, 1,
        "غرفة هادئة في دهب", "Quiet Room in Dahab",
        ["wifi", "air_conditioning"],
    ),
    (
        12, "Luxor", "Luxor", "East Bank",
        25.6872, 32.6396, "APARTMENT", "ENTIRE_PLACE",
        800, 4, 2, 2, 1,
        "شقة قريبة من معبد الأقصر", "Apartment near Luxor Temple",
        ["wifi", "air_conditioning", "kitchen", "tv"],
    ),
    (
        13, "Aswan", "Aswan", "Corniche",
        24.0889, 32.8998, "APARTMENT", "ENTIRE_PLACE",
        1000, 4, 2, 3, 1,
        "شقة على الكورنيش في أسوان", "Corniche Apartment in Aswan",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv"],
    ),
    (
        14, "Suez", "Ain Sokhna", "Porto Sokhna",
        29.6000, 32.3167, "CHALET", "ENTIRE_PLACE",
        1500, 5, 2, 3, 1,
        "شاليه في بورتو السخنة", "Chalet in Porto Sokhna",
        ["wifi", "air_conditioning", "kitchen", "tv", "pool", "parking"],
    ),
    (
        15, "Port Said", "Port Said", None,
        31.2653, 32.3019, "APARTMENT", "ENTIRE_PLACE",
        750, 3, 1, 2, 1,
        "شقة في بورسعيد قريبة من الكورنيش", "Apartment in Port Said near the Corniche",
        ["wifi", "air_conditioning", "kitchen", "tv"],
    ),
    (
        16, "Cairo", "Heliopolis", "Korba",
        30.0910, 31.3260, "APARTMENT", "ENTIRE_PLACE",
        1400, 4, 2, 3, 1,
        "شقة أنيقة في كوربا", "Elegant Apartment in Korba",
        ["wifi", "air_conditioning", "kitchen", "washer", "tv", "elevator"],
    ),
]


def unit_id(n: int) -> str:
    return f"demo-unit-{n:04d}-0000-0000000000{n:02d}"


async def upsert_demo_unit(session: AsyncSession, row: tuple) -> None:
    (
        n, governorate, city, district, lat, lng, ptype, category,
        price, guests, bedrooms, beds, bathrooms,
        title_ar, title_en, amenities,
    ) = row
    uid = unit_id(n)

    await session.execute(
        text("""
            INSERT INTO pms.units
                (id, host_id, property_type, status, coordinates,
                 governorate, city, district, max_guests, bedrooms,
                 bathrooms, beds, created_at, updated_at)
            VALUES
                (:id, :host_id, :ptype, 'LISTED',
                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                 :gov, :city, :district, :guests, :bedrooms,
                 :bathrooms, :beds, now(), now())
            ON CONFLICT (id) DO UPDATE SET
                coordinates = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                status = 'LISTED', updated_at = now()
        """),
        {
            "id": uid, "host_id": HOST_ID, "ptype": ptype,
            "lng": lng, "lat": lat, "gov": governorate, "city": city,
            "district": district, "guests": guests, "bedrooms": bedrooms,
            "bathrooms": bathrooms, "beds": beds,
        },
    )

    await session.execute(
        text("""
            INSERT INTO pms.unit_listings
                (id, unit_id, title_ar, title_en, description_ar,
                 description_en, amenities, cultural_tags, category,
                 base_price_egp, cleaning_fee_egp, min_nights, max_nights,
                 cancellation_policy, instant_book, updated_at)
            VALUES
                (:lid, :uid, :title_ar, :title_en, :desc_ar, :desc_en,
                 :amenities, :tags, :category, :price, :cleaning,
                 1, 30, 'MODERATE', :instant, now())
            ON CONFLICT (unit_id) DO UPDATE SET
                title_ar = :title_ar, title_en = :title_en,
                base_price_egp = :price, updated_at = now()
        """),
        {
            "lid": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"stayos-demo-{uid}")),
            "uid": uid,
            "title_ar": title_ar,
            "title_en": title_en,
            "desc_ar": f"{title_ar}. إقامة مريحة بموقع مميز. (StayOS demo listing)",
            "desc_en": f"{title_en}. A comfortable stay in a prime location. (StayOS demo listing)",
            "amenities": "{" + ",".join(amenities) + "}",
            "tags": "{family_friendly}",
            "category": category,
            "price": price,
            "cleaning": price // 10,
            "instant": n % 3 == 0,
        },
    )

    # Two deterministic photos per unit (first = cover).
    for order in range(2):
        photo_id = PHOTO_POOL[(n * 2 + order) % len(PHOTO_POOL)]
        s3_key = f"demo/{uid}-{order}.jpg"
        url = f"https://images.unsplash.com/{photo_id}?w=1200&q=80"
        existing = await session.execute(
            text(
                "SELECT id FROM pms.unit_photos "
                "WHERE unit_id = :uid AND s3_key = :key"
            ),
            {"uid": uid, "key": s3_key},
        )
        if existing.scalar_one_or_none() is not None:
            continue
        await session.execute(
            text("""
                INSERT INTO pms.unit_photos
                    (id, unit_id, s3_key, url, display_order, is_cover,
                     caption_ar, caption_en)
                VALUES
                    (:id, :uid, :key, :url, :ord, :cover, :cap_ar, :cap_en)
            """),
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"stayos-demo-photo-{s3_key}")),
                "uid": uid, "key": s3_key, "url": url, "ord": order,
                "cover": order == 0,
                "cap_ar": title_ar, "cap_en": title_en,
            },
        )


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            host = await session.execute(
                text("SELECT id FROM auth.users WHERE id = :id"),
                {"id": HOST_ID},
            )
            if host.scalar_one_or_none() is None:
                print(
                    f"Seed host {HOST_ID} not found — run "
                    "scripts/seed_staging.py first."
                )
                return

            for row in DEMO_UNITS:
                await upsert_demo_unit(session, row)
                print(f"  {row[6]:10} {row[2]:<16} {row[3] or '':<18} "
                      f"{row[8]:>5} EGP  {row[14]}")

    print(f"\nDone — {len(DEMO_UNITS)} demo units under host {HOST_ID}.")


if __name__ == "__main__":
    asyncio.run(seed())
