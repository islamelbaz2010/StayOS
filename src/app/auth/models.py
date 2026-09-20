from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    ARRAY,
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    phone_number: Mapped[str | None] = mapped_column(
        String(20), unique=True, nullable=True, index=True
    )
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    firebase_uid: Mapped[str | None] = mapped_column(
        String(128), unique=True, nullable=True, index=True
    )
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # bcrypt hash for email+password sign-in; NULL for OTP/Firebase-only accounts.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Free-text host bio shown on the public host profile (Airbnb parity).
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    locale: Mapped[str] = mapped_column(String(10), default="ar")
    role: Mapped[str] = mapped_column(String(20), default="guest")
    kyc_status: Mapped[str] = mapped_column(String(20), default="unverified")
    # Languages the user speaks, as ISO 639-1 codes (DEC-019). Surfaced on
    # host profiles and filterable in search; empty for most guests.
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # StayOS Local Fit (FD-24): guest stay preferences used by the
    # rule-based, explainable matching — a list of preference keys.
    guest_preferences: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )

    account: Mapped["Account | None"] = relationship(
        "Account", back_populates="user", uselist=False
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user"
    )
    device_tokens: Mapped[list["DeviceToken"]] = relationship(
        "DeviceToken", back_populates="user"
    )


class Account(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "accounts"
    __table_args__ = {"schema": "auth"}

    user_id: Mapped[str] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    national_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    # Host payout preference (FD-26): collection only — actual payout
    # execution stays blocked until provider/legal prerequisites exist.
    payout_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payout_bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payout_account_number: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    payout_wallet_msisdn: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    payout_holder_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="account")


class RefreshToken(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = {"schema": "auth"}

    user_id: Mapped[str] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


class DeviceToken(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "device_tokens"
    __table_args__ = {"schema": "auth"}

    user_id: Mapped[str] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(512), unique=True, nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    app_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="device_tokens")


class StaffPermission(UUIDMixin, Base):
    """A scoped operational permission granted to a staff account.

    One row per (user_id, permission). Rows are never deleted — access is
    revoked via ``is_active = False`` so grants remain auditable.
    """

    __tablename__ = "staff_permissions"
    __table_args__ = (
        UniqueConstraint("user_id", "permission", name="uq_staff_permission"),
        Index("idx_staff_permissions_user", "user_id"),
        {"schema": "auth"},
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission: Mapped[str] = mapped_column(String(50), nullable=False)
    granted_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
