"""City/governorate location aliases + Instant Book for live listings.

Revision ID: 047_alias_instant_book
Revises: 046_payment_vat
Create Date: 2026-10-03

Two data corrections:

1. ``pms.location_aliases`` previously contained only neighbourhood-level
   canonical entries (Cairo areas, then Alexandria/Red Sea/Sinai areas
   from 039). There was no city-level row for "Alexandria" — or for
   Cairo, Giza, Hurghada, etc. — so a free-text destination search such
   as ``q=Alexandria`` could never resolve to a structured location and
   fell back to title/description full-text search alone, which missed
   listings whose copy does not literally name the city. This seeds
   city- and governorate-level canonical rows (English + Arabic +
   common transliteration variants) plus a few missing Alexandria areas.

2. Founder decision: every live listing is Instant Book. 046 flipped the
   server default for *new* rows only; this backfills
   ``instant_book = TRUE`` on ``pms.unit_listings`` joined to
   ``pms.units`` where the unit is currently LISTED. Non-live units
   (draft, pending, unlisted, suspended, archived, rejected) keep their
   flag — no guest-visible behaviour changes for inventory that isn't
   bookable anyway.
"""

import uuid
from collections.abc import Sequence

from alembic import op

revision: str = "047_alias_instant_book"
down_revision: str | None = "046_payment_vat"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- City/governorate-level location aliases ---
    # (canonical_en, canonical_ar, city, gov, lat, lng, [en variants], [ar variants])
    locations = [
        # Alexandria — the missing city-level entry
        ("Alexandria", "الإسكندرية", "Alexandria", "Alexandria", 31.2001, 29.9187,
         ["alex", "iskandariya", "al iskandariya", "iskandaria", "alexandria city"],
         ["اسكندرية", "الاسكندرية", "الاسكندريه", "اسكندريه", "الإسكندريه"]),
        ("Cairo", "القاهرة", "Cairo", "Cairo", 30.0444, 31.2357,
         ["cairo city", "el cairo", "al qahira", "el qahira", "greater cairo"],
         ["القاهره", "كايرو"]),
        ("Giza", "الجيزة", "Giza", "Giza", 30.0131, 31.2089,
         ["giza city", "el giza", "al giza", "gizeh"],
         ["الجيزه", "جيزه"]),
        ("Hurghada", "الغردقة", "Hurghada", "Red Sea", 27.2579, 33.8116,
         ["hurgada", "el ghardaqa", "ghardaqa", "hurghada city"],
         ["الغردقه", "غردقه"]),
        ("Sharm El Sheikh", "شرم الشيخ", "Sharm El Sheikh", "South Sinai",
         27.9158, 34.3300,
         ["sharm", "sharm al sheikh", "sharm el-sheikh", "sharm el shiekh"],
         ["شرم"]),
        ("North Coast", "الساحل الشمالي", "North Coast", "Matrouh", 30.8330, 28.9550,
         ["sahel", "sahel el shamali", "al sahel", "north coast egypt"],
         ["الساحل", "الساحل الشمالى", "ساحل"]),
        ("Luxor", "الأقصر", "Luxor", "Luxor", 25.6872, 32.6396,
         ["luxor city", "el luxor", "al uqsur", "uqsur"],
         ["الاقصر", "اقصر"]),
        ("Aswan", "أسوان", "Aswan", "Aswan", 24.0889, 32.8998,
         ["aswan city", "asuan", "assuan", "assouan"],
         ["اسوان"]),
        ("Port Said", "بورسعيد", "Port Said", "Port Said", 31.2653, 32.3019,
         ["port saeed", "portsaid", "port said city", "bor said"],
         ["بور سعيد"]),
        ("Suez", "السويس", "Suez", "Suez", 29.9668, 32.5498,
         ["suez city", "el suez", "al suways"],
         []),
        ("Marsa Alam", "مرسى علم", "Marsa Alam", "Red Sea", 25.0677, 34.8790,
         ["marsa alam city"],
         ["مرسي علم"]),
        ("Fayoum", "الفيوم", "Fayoum", "Fayoum", 29.3084, 30.8428,
         ["fayyoum", "el fayoum", "faiyum", "fayoum city"],
         ["فيوم"]),
        ("Nuweiba", "نويبع", "Nuweiba", "South Sinai", 29.0468, 34.6634,
         ["nuweiba city", "nuwayba", "nueiba"],
         ["النويبع", "نويبعة"]),
        ("Taba", "طابا", "Taba", "South Sinai", 29.4919, 34.8957,
         ["taba city", "taba heights"],
         []),
        ("Ras Sedr", "راس سدر", "Ras Sedr", "South Sinai", 29.5921, 32.6413,
         ["ras sidr", "ras sudr", "ras sedr city"],
         ["رأس سدر"]),
        ("Damietta", "دمياط", "Damietta", "Damietta", 31.4165, 31.8133,
         ["dumyat", "damietta city"],
         []),
        ("El Alamein", "العلمين", "El Alamein", "Matrouh", 30.8308, 28.9547,
         ["new alamein", "alamein", "el alamein city", "al alamein"],
         ["العلمين الجديدة"]),
        # Governorate-level canonicals — a "red sea" or "south sinai"
        # search matches every listing in that governorate.
        ("Red Sea", "البحر الأحمر", "Hurghada", "Red Sea", 26.5, 34.0,
         ["red sea governorate", "al bahr al ahmar"],
         ["البحر الاحمر"]),
        ("South Sinai", "جنوب سيناء", "Sharm El Sheikh", "South Sinai", 28.5, 33.9,
         ["sinai"],
         ["جنوب سيناء", "سيناء"]),
        ("Matrouh", "مطروح", "Marsa Matrouh", "Matrouh", 30.5, 27.5,
         ["matrouh governorate", "marsa matrouh governorate"],
         ["مطروح"]),
        # Additional Alexandria areas missing from 039
        ("Agami", "العجمي", "Alexandria", "Alexandria", 31.0956, 29.7608,
         ["al agami", "agamy"],
         ["عجمي"]),
        ("Sidi Bishr", "سيدي بشر", "Alexandria", "Alexandria", 31.2531, 29.9878,
         ["sidi beshr", "sidi bishr city"],
         []),
        ("Borg El Arab", "برج العرب", "Borg El Arab", "Alexandria", 30.9177, 29.6964,
         ["borg al arab", "borg elarab", "borg el arab city"],
         []),
        # Ain Sokhna — resort strip on the Suez gulf, stored as an
        # area-level alias (coordinates) so units tagged with any city
        # string still surface.
        ("Ain Sokhna", "العين السخنة", "Suez", "Suez", 29.6074, 32.3167,
         ["ain el sokhna", "sokhna", "ein sokhna", "ain soukhna", "el sokhna"],
         ["العين السخنه", "السخنه", "السخنة", "عين السخنة", "عين سخنه"]),
    ]
    for en_name, ar_name, city, gov, lat, lng, variants_en, variants_ar in locations:
        for alias, alias_type in (
            (en_name.lower(), "exact"),
            (ar_name, "exact"),
            *((v, "variant") for v in variants_en + variants_ar),
        ):
            op.execute(
                "INSERT INTO pms.location_aliases "
                "(id, canonical_name_en, canonical_name_ar, alias, alias_type, "
                "city, governorate, lat, lng) "
                f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', "
                f"'{alias}', '{alias_type}', '{city}', '{gov}', {lat}, {lng})"
            )

    # --- Instant Book for every live listing ---
    op.execute(
        "UPDATE pms.unit_listings SET instant_book = true "
        "WHERE instant_book = false AND unit_id IN "
        "(SELECT id FROM pms.units WHERE status = 'LISTED')"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM pms.location_aliases WHERE canonical_name_en IN "
        "('Alexandria', 'Cairo', 'Giza', 'Hurghada', 'Sharm El Sheikh', "
        "'North Coast', 'Luxor', 'Aswan', 'Port Said', 'Suez', "
        "'Marsa Alam', 'Fayoum', 'Nuweiba', 'Taba', 'Ras Sedr', "
        "'Damietta', 'El Alamein', 'Red Sea', 'South Sinai', 'Matrouh', "
        "'Agami', 'Sidi Bishr', 'Borg El Arab', 'Ain Sokhna')"
    )
    # The instant_book backfill is intentionally not reversed: a host's
    # original request-to-book choice is not recoverable, and re-setting
    # flags to FALSE would silently change live listing behaviour.
