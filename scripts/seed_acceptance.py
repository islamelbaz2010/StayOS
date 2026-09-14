#!/usr/bin/env python3
"""Acceptance test data seeder.

Updates the existing seed users/listings with full realistic attributes
for founder acceptance testing. Creates:
- Updated host profile (bio, languages)
- Listing A: Request-to-Book (Zamalek) with full attributes + photos
- Listing B: Instant Book (Maadi) with full attributes + photos
- Additional photos for both listings

Safe to run multiple times — uses upsert/update logic.
Run ONLY against local/dev database.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_acceptance.py
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
    "postgresql+asyncpg://ahmed@localhost:5432/stayos",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

HOST_ID = "seed-host-0000-0000-000000000002"
GUEST_ID = "seed-guest-000-0000-000000000003"

UNIT_A_ID = "seed-unit-0001-0000-000000000001"  # Zamalek — Request-to-Book
UNIT_B_ID = "seed-unit-0002-0000-000000000002"  # Maadi — Instant Book


async def update_host_profile(session: AsyncSession) -> None:
    await session.execute(
        text("""
            UPDATE auth.users
            SET display_name = 'Omar Hassan',
                bio = 'Experienced host in Cairo with 5 years of welcoming guests from around the world. I love sharing the beauty of Egyptian culture and hospitality.',
                languages = ARRAY['ar', 'en', 'fr'],
                kyc_status = 'verified'
            WHERE id = :id
        """),
        {"id": HOST_ID},
    )


async def update_unit_a(session: AsyncSession) -> None:
    """Listing A — Request-to-Book (Zamalek)."""
    # Update unit with proper coordinates and address
    await session.execute(
        text("""
            UPDATE pms.units
            SET property_type = 'APARTMENT',
                status = 'LISTED',
                coordinates = ST_SetSRID(ST_MakePoint(31.0563, 30.0608), 4326),
                governorate = 'Cairo',
                city = 'Zamalek',
                district = 'Zamalek Island',
                address = '26th of July Corridor, Zamalek, Cairo',
                max_guests = 4,
                bedrooms = 2,
                bathrooms = 2,
                beds = 3
            WHERE id = :id
        """),
        {"id": UNIT_A_ID},
    )

    # Update listing with full attributes
    await session.execute(
        text("""
            UPDATE pms.unit_listings
            SET title_ar = 'شيك شقة بإطلالة على النيل في الزمالك',
                title_en = 'Chic Nile View Apartment in Zamalek',
                description_ar = 'استمتع بإقامة فاخرة في قلب الزمالك مع إطلالة خلابة على نهر النيل. هذه الشقة الحديثة تتميز بتصميم أنيق وتشمل غرفتين نوم ومطبخ مجهز بالكامل. تقع بالقرب من أفضل المطاعم والمقاهي والمعالم السياحية في القاهرة. مثالية للأزواج والعائلات الصغيرة.',
                description_en = 'Enjoy a luxurious stay in the heart of Zamalek with stunning Nile views. This modern apartment features elegant design, 2 bedrooms, and a fully equipped kitchen. Located near the best restaurants, cafes, and attractions in Cairo. Perfect for couples and small families.',
                amenities = ARRAY['wifi', 'air_conditioning', 'kitchen', 'washer', 'tv', 'heating', 'workspace', 'iron', 'hair_dryer', 'essentials'],
                cultural_tags = ARRAY['family_friendly', 'couples_welcome'],
                base_price_egp = 1500,
                cleaning_fee_egp = 200,
                min_nights = 1,
                max_nights = 14,
                house_rules = 'No smoking inside. No parties or events. Check-in after 2 PM. Please respect the neighbors. Pets allowed with prior notice.',
                check_in_instructions = 'Building entrance is on 26th of July Corridor. Apartment is on the 4th floor. Door code will be provided 24 hours before arrival.',
                policies = 'Guests must be 18+ to book. Valid ID required at check-in. Additional guests beyond 4 will incur extra charges.',
                cancellation_policy = 'MODERATE',
                check_in_time = '14:00',
                check_out_time = '12:00',
                pre_arrival_info_release_hours = 24,
                allows_pets = true,
                self_check_in = true,
                self_check_in_methods = ARRAY['smart_lock', 'keypad'],
                accessibility_features = ARRAY['step_free_access', 'wide_doorways'],
                sleeping_arrangements = '[{"bedroom": 1, "beds": [{"type": "queen", "count": 1}]}, {"bedroom": 2, "beds": [{"type": "single", "count": 2}]}]'::jsonb,
                instant_book = false
            WHERE unit_id = :id
        """),
        {"id": UNIT_A_ID},
    )


async def update_unit_b(session: AsyncSession) -> None:
    """Listing B — Instant Book (Maadi)."""
    await session.execute(
        text("""
            UPDATE pms.units
            SET property_type = 'APARTMENT',
                status = 'LISTED',
                coordinates = ST_SetSRID(ST_MakePoint(31.2587, 29.9602), 4326),
                governorate = 'Cairo',
                city = 'Maadi',
                district = 'Maadi Degla',
                address = 'Road 9, Maadi, Cairo',
                max_guests = 6,
                bedrooms = 3,
                bathrooms = 2,
                beds = 4
            WHERE id = :id
        """),
        {"id": UNIT_B_ID},
    )

    await session.execute(
        text("""
            UPDATE pms.unit_listings
            SET title_ar = 'شقة عصرية بحديقة في المعادي',
                title_en = 'Modern Garden Apartment in Maadi',
                description_ar = 'شقة أنيقة ومريحة في حي المعادي الهادئ. تتميز بحديقة خاصة ومساحة واسعة للعائلات. قريبة من المتاجر والمطاعم ومحطة المترو. مثالية للعائلات والمسافرين الباحثين عن الهدوء بعيداً عن صوت المدينة.',
                description_en = 'Elegant and comfortable apartment in the quiet Maadi neighborhood. Features a private garden and spacious layout for families. Close to shops, restaurants, and the metro station. Perfect for families and travelers seeking tranquility away from the city noise.',
                amenities = ARRAY['wifi', 'air_conditioning', 'kitchen', 'washer', 'tv', 'pool', 'gym', 'parking', 'heating', 'workspace', 'iron', 'hair_dryer', 'essentials', 'coffee_maker'],
                cultural_tags = ARRAY['family_friendly', 'halal_certified'],
                base_price_egp = 2000,
                cleaning_fee_egp = 300,
                min_nights = 2,
                max_nights = 30,
                house_rules = 'No smoking inside. No parties or events. Quiet hours after 10 PM. Pets welcome. Garden access available.',
                check_in_instructions = 'Building entrance on Road 9. Apartment is on the ground floor with garden access. Smart lock code will be sent 48 hours before arrival.',
                policies = 'Guests must be 18+ to book. Valid ID required. Garden maintenance is included. Maximum 6 guests.',
                cancellation_policy = 'FLEXIBLE',
                check_in_time = '15:00',
                check_out_time = '11:00',
                pre_arrival_info_release_hours = 48,
                allows_pets = true,
                self_check_in = true,
                self_check_in_methods = ARRAY['smart_lock'],
                accessibility_features = ARRAY['step_free_access', 'wide_doorways', 'accessible_parking'],
                sleeping_arrangements = '[{"bedroom": 1, "beds": [{"type": "king", "count": 1}]}, {"bedroom": 2, "beds": [{"type": "queen", "count": 1}]}, {"bedroom": 3, "beds": [{"type": "single", "count": 2}]}]'::jsonb,
                instant_book = true
            WHERE unit_id = :id
        """),
        {"id": UNIT_B_ID},
    )


async def add_photos(session: AsyncSession) -> None:
    """Add additional photos to both listings for a richer gallery."""
    unit_a_photos = [
        ("demo/zamalek-balcony.jpg", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", "شرفة بإطلالة على النيل", "Balcony with Nile view", 3),
        ("demo/zamalek-bathroom.jpg", "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80", "حمام حديث", "Modern bathroom", 4),
    ]
    unit_b_photos = [
        ("demo/maadi-garden.jpg", "https://images.unsplash.com/photo-1564013799919-ab600027d6c1?w=1200&q=80", "حديقة خاصة", "Private garden", 3),
        ("demo/maadi-dining.jpg", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80", "غرفة طعام", "Dining area", 4),
    ]

    for s3_key, url, caption_ar, caption_en, order in unit_a_photos:
        photo_id = str(uuid.uuid4())
        await session.execute(
            text("""
                INSERT INTO pms.unit_photos (id, unit_id, s3_key, url, display_order, is_cover, caption_ar, caption_en)
                VALUES (:id, :unit_id, :s3_key, :url, :order, false, :caption_ar, :caption_en)
                ON CONFLICT DO NOTHING
            """),
            {"id": photo_id, "unit_id": UNIT_A_ID, "s3_key": s3_key, "url": url, "order": order, "caption_ar": caption_ar, "caption_en": caption_en},
        )

    for s3_key, url, caption_ar, caption_en, order in unit_b_photos:
        photo_id = str(uuid.uuid4())
        await session.execute(
            text("""
                INSERT INTO pms.unit_photos (id, unit_id, s3_key, url, display_order, is_cover, caption_ar, caption_en)
                VALUES (:id, :unit_id, :s3_key, :url, :order, false, :caption_ar, :caption_en)
                ON CONFLICT DO NOTHING
            """),
            {"id": photo_id, "unit_id": UNIT_B_ID, "s3_key": s3_key, "url": url, "order": order, "caption_ar": caption_ar, "caption_en": caption_en},
        )


async def update_guest_profile(session: AsyncSession) -> None:
    await session.execute(
        text("""
            UPDATE auth.users
            SET display_name = 'Layla Ibrahim',
                kyc_status = 'verified',
                languages = ARRAY['ar', 'en']
            WHERE id = :id
        """),
        {"id": GUEST_ID},
    )


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Updating host profile...")
            await update_host_profile(session)

            print("Updating guest profile...")
            await update_guest_profile(session)

            print("Updating Listing A (Request-to-Book, Zamalek)...")
            await update_unit_a(session)

            print("Updating Listing B (Instant Book, Maadi)...")
            await update_unit_b(session)

            print("Adding photos...")
            await add_photos(session)

    print("\n✓ Acceptance seed complete!")
    print(f"  Host:  {HOST_ID} (Omar Hassan)")
    print(f"  Guest: {GUEST_ID} (Layla Ibrahim)")
    print(f"  Listing A (Request-to-Book): {UNIT_A_ID} (Zamalek Nile View)")
    print(f"  Listing B (Instant Book):     {UNIT_B_ID} (Maadi Garden)")
    print("\n  Dev login: use the Admin/Host/Guest buttons on the login page")
    print("  (visible when Firebase is not configured)")


if __name__ == "__main__":
    asyncio.run(seed())
