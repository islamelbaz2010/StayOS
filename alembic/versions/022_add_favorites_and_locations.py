"""Add user favorites table and location aliases table

Revision ID: 022_add_favorites_and_locations
Revises: 021_add_candidate_type
Create Date: 2026-08-14 00:00:00.000000

Creates:
- pms.user_favorites: user ↔ unit favorite relationship
- pms.location_aliases: canonical Cairo area names with Arabic/English aliases

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "022_add_favorites_and_locations"
down_revision: str | None = "021_add_candidate_type"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- Favorites ---
    op.create_table(
        "user_favorites",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "unit_id", name="uq_user_favorite"),
        sa.Index("idx_user_favorites_user_id", "user_id"),
        sa.Index("idx_user_favorites_unit_id", "unit_id"),
        schema="pms",
    )

    # --- Location aliases ---
    op.create_table(
        "location_aliases",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("canonical_name_en", sa.String(100), nullable=False),
        sa.Column("canonical_name_ar", sa.String(100), nullable=False),
        sa.Column("alias", sa.String(100), nullable=False),
        sa.Column("alias_type", sa.String(20), nullable=False, server_default="exact"),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("governorate", sa.String(100), nullable=False),
        sa.Column("lat", sa.Float, nullable=True),
        sa.Column("lng", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Index("idx_location_aliases_alias", "alias"),
        sa.Index("idx_location_aliases_canonical", "canonical_name_en"),
        schema="pms",
    )

    # Seed Cairo area aliases
    areas = [
        ("Maadi", "المعادي", "Cairo", "Cairo", 29.9602, 31.2569),
        ("Zamalek", "الزمالك", "Cairo", "Cairo", 30.0588, 31.2205),
        ("New Cairo", "القاهرة الجديدة", "Cairo", "Cairo", 30.0286, 31.4913),
        ("Downtown", "وسط البلد", "Cairo", "Cairo", 30.0444, 31.2357),
        ("Dokki", "الدقي", "Cairo", "Cairo", 30.0378, 31.2089),
        ("Nasr City", "مدينة نصر", "Cairo", "Cairo", 30.0562, 31.3656),
        ("Heliopolis", "مصر الجديدة", "Cairo", "Cairo", 30.0808, 31.3312),
        ("Sheikh Zayed", "الشيخ زايد", "Giza", "Giza", 30.0310, 30.9758),
        ("6th of October", "6 أكتوبر", "Giza", "Giza", 29.9345, 30.9758),
        ("Madinaty", "مدينتي", "Cairo", "Cairo", 30.1179, 31.6497),
        ("Rehab", "الرحاب", "Cairo", "Cairo", 30.1368, 31.6497),
        ("Garden City", "جاردن سيتي", "Cairo", "Cairo", 30.0395, 31.2299),
        ("Mohandessin", "المهندسين", "Giza", "Giza", 30.0635, 31.2008),
        ("Haram", "الهرم", "Giza", "Giza", 29.9760, 31.1386),
    ]

    import uuid

    for en_name, ar_name, city, gov, lat, lng in areas:
        # English canonical
        op.execute(
            f"INSERT INTO pms.location_aliases (id, canonical_name_en, canonical_name_ar, alias, alias_type, city, governorate, lat, lng) "
            f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', '{en_name.lower()}', 'exact', '{city}', '{gov}', {lat}, {lng})"
        )
        # Arabic canonical
        op.execute(
            f"INSERT INTO pms.location_aliases (id, canonical_name_en, canonical_name_ar, alias, alias_type, city, governorate, lat, lng) "
            f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', '{ar_name}', 'exact', '{city}', '{gov}', {lat}, {lng})"
        )
        # Common variants
        variants_en: list[str] = []
        variants_ar: list[str] = []

        if en_name == "Maadi":
            variants_en = ["el maadi", "el-maadi", "maad"]
            variants_ar = ["المعادى", "المعادي"]
        elif en_name == "Zamalek":
            variants_en = ["zam", "el zamalek", "el-zamalek"]
            variants_ar = ["الزمالك"]
        elif en_name == "New Cairo":
            variants_en = ["new cairo", "el tagamoa", "tagamoa", "fifth settlement", "5th settlement"]
            variants_ar = ["التجمع", "التجمع الخامس", "القاهره الجديده"]
        elif en_name == "Downtown":
            variants_en = ["downtown cairo", "wist el balad", "wist el-balad"]
            variants_ar = ["وسط البلد"]
        elif en_name == "Dokki":
            variants_en = ["el dokki", "el-dokki", "dokki"]
            variants_ar = ["الدقي"]
        elif en_name == "Nasr City":
            variants_en = ["nasr", "nasr-city", "el nasr city"]
            variants_ar = ["مدينه نصر", "مدينة نصر"]
        elif en_name == "Heliopolis":
            variants_en = ["heliopolis", "masr el gedida", "masr el-gedida"]
            variants_ar = ["مصر الجديده", "مصر الجديدة"]
        elif en_name == "Sheikh Zayed":
            variants_en = ["sheikh zayed city", "el sheikh zayed", "shiekh zayed"]
            variants_ar = ["الشيخ زايد"]
        elif en_name == "6th of October":
            variants_en = ["october", "6 october", "october city", "sixth of october"]
            variants_ar = ["6 اكتوبر", "أكتوبر"]
        elif en_name == "Madinaty":
            variants_en = ["madinati", "my city"]
            variants_ar = ["مدينتي"]
        elif en_name == "Rehab":
            variants_en = ["el rehab", "el-rehab", "al rehab"]
            variants_ar = ["الرحاب"]
        elif en_name == "Garden City":
            variants_en = ["garden city cairo"]
            variants_ar = ["جاردن سيتي"]
        elif en_name == "Mohandessin":
            variants_en = ["mohandiseen", "el mohandessin", "al mohandessin"]
            variants_ar = ["المهندسين"]
        elif en_name == "Haram":
            variants_en = ["el haram", "el-haram", "pyramids area"]
            variants_ar = ["الهرم"]

        for v in variants_en:
            op.execute(
                f"INSERT INTO pms.location_aliases (id, canonical_name_en, canonical_name_ar, alias, alias_type, city, governorate, lat, lng) "
                f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', '{v}', 'variant', '{city}', '{gov}', {lat}, {lng})"
            )
        for v in variants_ar:
            op.execute(
                f"INSERT INTO pms.location_aliases (id, canonical_name_en, canonical_name_ar, alias, alias_type, city, governorate, lat, lng) "
                f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', '{v}', 'variant', '{city}', '{gov}', {lat}, {lng})"
            )


def downgrade() -> None:
    op.drop_table("location_aliases", schema="pms")
    op.drop_table("user_favorites", schema="pms")
