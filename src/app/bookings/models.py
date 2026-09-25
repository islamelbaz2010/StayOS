# ruff: noqa: I001
# Import ordering differs between local Ruff (0.1.8: ``app`` sorts with
# third-party) and CI Ruff (0.16.1: ``app`` is first-party). No single
# ordering satisfies both, so I001 is suppressed for this file only.
from datetime import date, datetime
from decimal import Decimal

from app.listings.models import Unit
from app.shared.models import Base, TimestampMixin, UUIDMixin
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .constants import BookingStatus


class Booking(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="chk_booking_date_range"),
        CheckConstraint("adults >= 1", name="chk_booking_adults"),
        CheckConstraint("children >= 0", name="chk_booking_children"),
        CheckConstraint("infants >= 0", name="chk_booking_infants"),
        Index("idx_bookings_unit_id", "unit_id"),
        Index("idx_bookings_guest_id", "guest_id"),
        Index("idx_bookings_status", "status"),
        Index("idx_bookings_check_in", "check_in"),
        Index("idx_bookings_check_out", "check_out"),
        {"schema": "booking"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    guest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=BookingStatus.REQUESTED
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    adults: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    children: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    infants: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checked_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Host custom offer (FD-07): when set, this all-inclusive total
    # overrides listing pricing for the booking's payment.
    custom_total_egp: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    offer_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    unit: Mapped[Unit] = relationship("Unit")
    guest: Mapped["User"] = relationship(
        "User",
        primaryjoin="Booking.guest_id == User.id",
        foreign_keys=[guest_id],
        lazy="raise",
    )


class BookingOffer(UUIDMixin, TimestampMixin, Base):
    """Host custom offer attached to an inquiry conversation (FD-07).

    The host proposes an all-inclusive total for a date range; the guest
    can accept — which creates a booking priced at the offer — or decline.
    One active (pending) offer per conversation keeps the flow simple.
    """

    __tablename__ = "booking_offers"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="chk_offer_date_range"),
        CheckConstraint("total_price_egp > 0", name="chk_offer_price_positive"),
        Index("idx_booking_offers_conversation", "conversation_id"),
        {"schema": "booking"},
    )

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("messaging.conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    guest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    # All-inclusive guest price for the whole stay (EGP). Economics are
    # derived by the canonical engine — never supplied by the client.
    total_price_egp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | accepted | declined | expired | superseded
    booking_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
