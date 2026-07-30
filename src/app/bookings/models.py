from datetime import date, datetime

from app.listings.models import Unit
from app.shared.models import Base, TimestampMixin, UUIDMixin
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
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
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    unit: Mapped[Unit] = relationship("Unit")
