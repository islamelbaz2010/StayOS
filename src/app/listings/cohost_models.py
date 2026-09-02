"""Co-host and listing readiness models for the Host Operating System.

These live in the ``pms`` schema alongside the rest of the listing
domain. They are kept in a separate module from ``listings.models`` to
avoid importing co-host concerns into the core listing model graph.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin, UUIDMixin


class UnitCoHost(UUIDMixin, TimestampMixin, Base):
    """A non-owner user delegated to help operate a unit.

    The unit owner remains the authoritative host. A co-host row grants
    scoped operational access — the permission_scope field controls what
    the co-host can do. This is the foundation for granular permissions;
    enforcement is in ``app.host.permissions``.
    """

    __tablename__ = "unit_co_hosts"
    __table_args__ = (
        Index("idx_unit_co_hosts_unit_id", "unit_id"),
        Index("idx_unit_co_hosts_user_id", "co_host_user_id"),
        {"schema": "pms"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id", ondelete="CASCADE"), nullable=False
    )
    co_host_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False
    )
    permission_scope: Mapped[str] = mapped_column(
        String(30), nullable=False, default="calendar_only"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    invited_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )


class ListingReadinessCheck(UUIDMixin, Base):
    """Materialised readiness checklist for a unit listing.

    Computed by the backend so the UI never guesses whether a listing is
    ready to publish. The ``status`` field is the overall verdict; the
    ``missing_items`` field is a JSON array of missing-item keys.
    """

    __tablename__ = "listing_readiness_checks"
    __table_args__ = ({"schema": "pms"},)

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="action_required")
    missing_items: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
