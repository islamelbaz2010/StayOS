from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import PaymentMethod, PaymentStatus


class Payment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("idx_payments_booking_id", "booking_id"),
        Index("idx_payments_status", "status"),
        Index("idx_payments_guest_id", "guest_id"),
        {"schema": "payment"},
    )

    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("booking.bookings.id"), nullable=False, unique=True
    )
    guest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=PaymentStatus.PENDING
    )
    method: Mapped[str] = mapped_column(
        String(50), nullable=False, default=PaymentMethod.MANUAL
    )
    amount_egp: Mapped[int] = mapped_column(Integer, nullable=False)
    nights: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    reference_number: Mapped[str] = mapped_column(String(36), nullable=False)
    proof_s3_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    proof_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    proof_uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    refund_amount_egp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    refunded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    instructions: Mapped[str] = mapped_column(Text, nullable=False, default="")
