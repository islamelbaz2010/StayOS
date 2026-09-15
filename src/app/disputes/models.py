from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin, UUIDMixin


class Dispute(UUIDMixin, TimestampMixin, Base):
    """A guest/host complaint tied to an existing booking.

    Minimal operational workflow: reporter files -> admin reviews ->
    status moves open -> in_review -> resolved/closed. No refund or
    compensation policy is attached — outcomes stay manual.
    """

    __tablename__ = "disputes"
    __table_args__ = (
        Index("idx_disputes_reporter", "reporter_id"),
        Index("idx_disputes_booking", "booking_id"),
        Index("idx_disputes_status", "status"),
        {"schema": "support"},
    )

    reporter_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False
    )
    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("booking.bookings.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open")
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
