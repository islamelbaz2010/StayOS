"""Create pms.unit_photos table

Revision ID: 011_create_unit_photos
Revises: 010_add_notifications_and_security
Create Date: 2026-07-30 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "011_create_unit_photos"
down_revision: str | None = "010_add_notifications_and_security"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "unit_photos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "unit_id",
            sa.String(36),
            sa.ForeignKey("pms.units.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("s3_key", sa.String(1024), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("display_order", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("is_cover", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("caption_ar", sa.String(500), nullable=True),
        sa.Column("caption_en", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("display_order >= 0", name="chk_photo_display_order"),
        schema="pms",
    )

    op.create_index(
        "idx_unit_photos_unit_id",
        "unit_photos",
        ["unit_id"],
        schema="pms",
    )


def downgrade() -> None:
    op.drop_index("idx_unit_photos_unit_id", table_name="unit_photos", schema="pms")
    op.drop_table("unit_photos", schema="pms")
