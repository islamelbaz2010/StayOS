from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin, UUIDMixin


class Review(UUIDMixin, TimestampMixin, Base):
    """A review of a completed stay.

    Guest reviews review the listing/host experience. Host reviews review
    the guest. One review per booking per reviewer role — a guest and a
    host can each leave one review for the same booking. The listing's
    average rating and review count are derived from guest reviews only.
    """

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        UniqueConstraint("booking_id", "reviewer_role", name="uq_review_booking_role"),
        Index("idx_reviews_unit_id", "unit_id"),
        Index("idx_reviews_guest_id", "guest_id"),
        Index("idx_reviews_reviewer_id", "reviewer_id"),
        {"schema": "pms"},
    )

    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("booking.bookings.id", ondelete="CASCADE"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id", ondelete="CASCADE"), nullable=False
    )
    guest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False
    )
    reviewer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False
    )
    reviewer_role: Mapped[str] = mapped_column(String(20), nullable=False, default="guest")
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
