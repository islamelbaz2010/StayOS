from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import PaymentStatus, ReservationStatus


class Reservation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="chk_reservation_date_range"),
        {"schema": "reservation"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    guest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=ReservationStatus.PENDING_PAYMENT
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    adults: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    children: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    infants: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    total_amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    host_amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_fee_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    guest_fee_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checked_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    refund_amount_egp: Mapped[int | None] = mapped_column(Integer, nullable=True)

    payment_intents: Mapped[list["PaymentIntent"]] = relationship(
        "PaymentIntent", back_populates="reservation"
    )
    promo_applications: Mapped[list["PromoApplication"]] = relationship(
        "PromoApplication", back_populates="reservation"
    )


class PaymentIntent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payment_intents"
    __table_args__ = {"schema": "reservation"}

    reservation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("reservation.reservations.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=PaymentStatus.PENDING
    )
    provider_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, name="metadata", nullable=True
    )
    captured_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    reservation: Mapped["Reservation"] = relationship(
        "Reservation", back_populates="payment_intents"
    )


class PromoCode(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "promo_codes"
    __table_args__ = {"schema": "reservation"}

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    valid_from: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    valid_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class PromoApplication(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "promo_applications"
    __table_args__ = {"schema": "reservation"}

    reservation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("reservation.reservations.id", ondelete="CASCADE"),
        nullable=False,
    )
    promo_code_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reservation.promo_codes.id"), nullable=False
    )
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    discount_amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)

    promo_code: Mapped["PromoCode"] = relationship("PromoCode")
    reservation: Mapped["Reservation"] = relationship(
        "Reservation", back_populates="promo_applications"
    )
