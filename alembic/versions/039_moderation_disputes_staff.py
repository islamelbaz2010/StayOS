"""Listing edit moderation, disputes, staff permissions, support conversations.

Revision ID: 039_moderation_disputes_staff
Revises: 038_instant_book
Create Date: 2026-09-15

Changes:
- pms.unit_listings.pending_changes: JSON change-set a host submits when
  editing an already LISTED listing. Applied on admin approval, discarded
  on rejection. NULL means no pending review.
- pms.unit_photos.moderation_state: 'live' | 'pending_add' |
  'pending_remove' so photo changes on published listings are moderated
  without losing the currently approved photo set.
- messaging.conversations.context_booking_id: lets SUPPORT conversations
  reference a booking without colliding with the unique per-booking
  reservation conversation.
- support schema + support.disputes: minimum guest/host complaint
  workflow (report a problem -> admin queue -> operational status).
- auth.staff_permissions: per-user operational permission grants so an
  admin can delegate scoped staff access without making staff admins.
- pms.location_aliases: extend canonical Egyptian areas beyond Cairo/Giza
  for structured governorate -> city -> district selection.
"""

from collections.abc import Sequence
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "039_moderation_disputes_staff"
down_revision: str | None = "038_instant_book"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS support")

    # --- Listing edit moderation ---
    op.add_column(
        "unit_listings",
        sa.Column("pending_changes", postgresql.JSONB(), nullable=True),
        schema="pms",
    )
    op.add_column(
        "unit_photos",
        sa.Column(
            "moderation_state",
            sa.String(20),
            nullable=False,
            server_default="live",
        ),
        schema="pms",
    )
    op.create_index(
        "idx_unit_listings_pending_changes",
        "unit_listings",
        ["unit_id"],
        schema="pms",
        postgresql_where=sa.text("pending_changes IS NOT NULL"),
    )

    # --- Support conversations can reference a booking ---
    op.add_column(
        "conversations",
        sa.Column("context_booking_id", sa.String(36), nullable=True),
        schema="messaging",
    )
    op.create_index(
        "idx_conversations_context_booking_id",
        "conversations",
        ["context_booking_id"],
        schema="messaging",
    )

    # --- Disputes ---
    op.create_table(
        "disputes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "reporter_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "booking_id",
            sa.String(36),
            sa.ForeignKey("booking.bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="open",
        ),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("resolved_by", sa.String(36), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Index("idx_disputes_reporter", "reporter_id"),
        sa.Index("idx_disputes_booking", "booking_id"),
        sa.Index("idx_disputes_status", "status"),
        schema="support",
    )

    # --- Staff permissions ---
    op.create_table(
        "staff_permissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("permission", sa.String(50), nullable=False),
        sa.Column("granted_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "permission", name="uq_staff_permission"),
        sa.Index("idx_staff_permissions_user", "user_id"),
        schema="auth",
    )

    # --- Extend canonical Egyptian areas ---
    # (canonical_en, canonical_ar, city_en, gov_en, lat, lng)
    areas = [
        # Alexandria
        ("Smouha", "سموحة", "Alexandria", "Alexandria", 31.2106, 29.9453),
        ("Stanley", "ستانلي", "Alexandria", "Alexandria", 31.2345, 29.9467),
        ("San Stefano", "سان ستيفانو", "Alexandria", "Alexandria", 31.2452, 29.9675),
        ("Sidi Gaber", "سيدي جابر", "Alexandria", "Alexandria", 31.2187, 29.9424),
        ("Montaza", "المنتزه", "Alexandria", "Alexandria", 31.2879, 30.0168),
        # Red Sea — Hurghada
        ("El Gouna", "الجونة", "Hurghada", "Red Sea", 27.3942, 33.6782),
        ("Sahl Hasheesh", "سهل حشيش", "Hurghada", "Red Sea", 27.0083, 33.8900),
        ("Dahar", "الدهار", "Hurghada", "Red Sea", 27.2579, 33.8316),
        ("Sakkala", "السقالة", "Hurghada", "Red Sea", 27.2229, 33.8426),
        # South Sinai — Sharm El Sheikh / Dahab
        ("Naama Bay", "خليج نعمة", "Sharm El Sheikh", "South Sinai", 27.9154, 34.3295),
        ("Hadaba", "الهضبة", "Sharm El Sheikh", "South Sinai", 27.8960, 34.3030),
        ("Sharks Bay", "خليج القرش", "Sharm El Sheikh", "South Sinai", 27.9595, 34.3635),
        ("Dahab", "دهب", "Dahab", "South Sinai", 28.5092, 34.5136),
        # North Coast — Marsa Matrouh
        ("Marsa Matrouh", "مرسى مطروح", "Marsa Matrouh", "Matrouh", 31.3543, 27.2373),
        ("Sahel", "الساحل الشمالي", "North Coast", "Matrouh", 30.8330, 28.9550),
        # Luxor / Aswan
        ("Luxor East Bank", "الأقصر - البر الشرقي", "Luxor", "Luxor", 25.6872, 32.6396),
        ("Luxor West Bank", "الأقصر - البر الغربي", "Luxor", "Luxor", 25.7207, 32.6104),
        ("Aswan Corniche", "كورنيش أسوان", "Aswan", "Aswan", 24.0889, 32.8998),
        # Port Said / Suez / Ismailia (canal cities)
        ("Port Fouad", "بور فؤاد", "Port Said", "Port Said", 31.2600, 32.3100),
        ("Ismailia", "الإسماعيلية", "Ismailia", "Ismailia", 30.5965, 32.2715),
    ]
    for en_name, ar_name, city, gov, lat, lng in areas:
        for alias, alias_type in (
            (en_name.lower(), "exact"),
            (ar_name, "exact"),
        ):
            op.execute(
                "INSERT INTO pms.location_aliases "
                "(id, canonical_name_en, canonical_name_ar, alias, alias_type, city, governorate, lat, lng) "
                f"VALUES ('{uuid.uuid4()}', '{en_name}', '{ar_name}', "
                f"'{alias}', '{alias_type}', '{city}', '{gov}', {lat}, {lng})"
            )


def downgrade() -> None:
    op.drop_table("staff_permissions", schema="auth")
    op.drop_table("disputes", schema="support")
    op.execute("DROP SCHEMA IF EXISTS support")
    op.drop_index(
        "idx_conversations_context_booking_id",
        table_name="conversations",
        schema="messaging",
    )
    op.drop_column("conversations", "context_booking_id", schema="messaging")
    op.drop_index(
        "idx_unit_listings_pending_changes",
        table_name="unit_listings",
        schema="pms",
    )
    op.drop_column("unit_photos", "moderation_state", schema="pms")
    op.drop_column("unit_listings", "pending_changes", schema="pms")
    op.execute(
        "DELETE FROM pms.location_aliases WHERE governorate IN "
        "('Alexandria', 'Red Sea', 'South Sinai', 'Matrouh', 'Luxor', "
        "'Aswan', 'Port Said', 'Ismailia')"
    )
