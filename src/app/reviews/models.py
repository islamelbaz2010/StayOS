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
    """A guest's review of a completed stay.

    One review per booking, written by the guest who stayed. The listing's
    average rating and review count are derived from this table rather than
    stored redundantly.
    """

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        UniqueConstraint("booking_id", name="uq_review_booking"),
        Index("idx_reviews_unit_id", "unit_id"),
        Index("idx_reviews_guest_id", "guest_id"),
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
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
