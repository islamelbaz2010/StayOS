from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import Account, User
from app.shared.models import Base, TimestampMixin, UUIDMixin


class KycDocument(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "kyc_documents"
    __table_args__ = {"schema": "auth"}

    user_id: Mapped[str] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[str | None] = mapped_column(
        ForeignKey("auth.accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    document_type: Mapped[str] = mapped_column(String(20), nullable=False)
    document_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="unverified", nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    front_image_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    back_image_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    selfie_image_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    verification_payload: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship("User")
    account: Mapped["Account | None"] = relationship("Account")
