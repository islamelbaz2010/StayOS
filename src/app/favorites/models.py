from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, UUIDMixin


class UserFavorite(UUIDMixin, Base):
    __tablename__ = "user_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "unit_id", name="uq_user_favorite"),
        Index("idx_user_favorites_user_id", "user_id"),
        Index("idx_user_favorites_unit_id", "unit_id"),
        {"schema": "pms"},
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pms.units.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class LocationAlias(UUIDMixin, Base):
    __tablename__ = "location_aliases"
    __table_args__ = (
        Index("idx_location_aliases_alias", "alias"),
        Index("idx_location_aliases_canonical", "canonical_name_en"),
        {"schema": "pms"},
    )

    canonical_name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    canonical_name_ar: Mapped[str] = mapped_column(String(100), nullable=False)
    alias: Mapped[str] = mapped_column(String(100), nullable=False)
    alias_type: Mapped[str] = mapped_column(String(20), nullable=False, default="exact")
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    governorate: Mapped[str] = mapped_column(String(100), nullable=False)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
