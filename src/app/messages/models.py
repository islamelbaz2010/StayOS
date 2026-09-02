from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import ConversationStatus, ConversationType, MessageStatus, ParticipantRole


class Conversation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_conversations_booking_id"),
        Index("idx_conversations_booking_id", "booking_id"),
        Index("idx_conversations_unit_id", "unit_id"),
        {"schema": "messaging"},
    )

    booking_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("booking.bookings.id"), nullable=True
    )
    unit_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False, default=ConversationType.RESERVATION)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=ConversationStatus.ACTIVE
    )

    participants: Mapped[list["ConversationParticipant"]] = relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
        lazy="selectin",
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    __table_args__ = (
        Index("idx_conversation_participants_user_id", "user_id"),
        {"schema": "messaging"},
    )

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("messaging.conversations.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False, default=ParticipantRole.GUEST)
    last_read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="participants")


class Message(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("idx_messages_conversation_id", "conversation_id"),
        Index("idx_messages_sender_id", "sender_id"),
        Index("idx_messages_created_at", "created_at"),
        # Partial unique index enforced at the DB level: only one automated
        # message of each type per conversation. Application-level guard in
        # send_automated_message() is the first line of defense; this is the
        # backstop for concurrent scheduler/worker races.
        Index(
            "uq_messages_conversation_automation",
            "conversation_id",
            "automation_type",
            unique=True,
            postgresql_where=text("automation_type IS NOT NULL"),
        ),
        {"schema": "messaging"},
    )

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("messaging.conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    sender_role: Mapped[str] = mapped_column(
        String(50), nullable=False, default=ParticipantRole.GUEST
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=MessageStatus.SENT
    )
    automation_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class MessageTemplate(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "message_templates"
    __table_args__ = (
        UniqueConstraint("key", "locale", name="uq_message_templates_key_locale"),
        Index("idx_message_templates_category", "category"),
        {"schema": "messaging"},
    )

    key: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="ar")
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
