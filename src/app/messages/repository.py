from datetime import datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.shared.exceptions import NotFoundError

from .constants import ConversationStatus, ConversationType, MessageStatus, ParticipantRole
from .models import Conversation, ConversationParticipant, Message, MessageTemplate


async def create_conversation_for_booking(
    session: AsyncSession,
    booking_id: str,
    unit_id: str,
    guest_id: str,
    host_id: str,
) -> Conversation:
    conversation = Conversation(
        id=str(uuid4()),
        booking_id=booking_id,
        unit_id=unit_id,
        type=ConversationType.RESERVATION,
        status=ConversationStatus.ACTIVE,
    )
    session.add(conversation)
    await session.flush()
    await session.refresh(conversation)

    session.add_all(
        [
            ConversationParticipant(
                conversation_id=conversation.id,
                user_id=guest_id,
                role=ParticipantRole.GUEST,
            ),
            ConversationParticipant(
                conversation_id=conversation.id,
                user_id=host_id,
                role=ParticipantRole.HOST,
            ),
        ]
    )
    await session.flush()
    return conversation


async def get_conversation_by_id(
    session: AsyncSession, conversation_id: str
) -> Conversation | None:
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants), selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    return result.scalar_one_or_none()


async def get_conversation_by_id_or_raise(
    session: AsyncSession, conversation_id: str
) -> Conversation:
    conversation = await get_conversation_by_id(session, conversation_id)
    if conversation is None:
        raise NotFoundError("Conversation not found")
    return conversation


async def get_conversation_by_booking(
    session: AsyncSession, booking_id: str
) -> Conversation | None:
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants), selectinload(Conversation.messages))
        .where(Conversation.booking_id == booking_id)
    )
    return result.scalar_one_or_none()


async def get_or_create_conversation_for_booking(
    session: AsyncSession,
    booking_id: str,
    unit_id: str,
    guest_id: str,
    host_id: str,
) -> Conversation:
    conversation = await get_conversation_by_booking(session, booking_id)
    if conversation is not None:
        return conversation
    try:
        return await create_conversation_for_booking(
            session, booking_id, unit_id, guest_id, host_id
        )
    except IntegrityError:
        # Another concurrent request created the conversation between our
        # SELECT and INSERT. The unique constraint on booking_id caught it.
        # Roll back the failed flush and re-read the winning row.
        await session.rollback()
        conversation = await get_conversation_by_booking(session, booking_id)
        if conversation is None:
            raise
        return conversation


async def is_conversation_participant(
    session: AsyncSession, conversation_id: str, user_id: str
) -> bool:
    result = await session.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def create_message(
    session: AsyncSession,
    conversation_id: str,
    sender_id: str | None,
    sender_role: str,
    content: str,
    status: str = MessageStatus.SENT,
    automation_type: str | None = None,
) -> Message:
    message = Message(
        id=str(uuid4()),
        conversation_id=conversation_id,
        sender_id=sender_id,
        sender_role=sender_role,
        content=content,
        status=status,
        automation_type=automation_type,
    )
    session.add(message)
    await session.flush()
    await session.refresh(message)
    return message


async def list_messages_for_conversation(
    session: AsyncSession,
    conversation_id: str,
    limit: int = 100,
    offset: int = 0,
) -> list[Message]:
    result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_unread_messages(
    session: AsyncSession,
    conversation_id: str,
    user_id: str,
    last_read_at: datetime | None,
) -> int:
    stmt = (
        select(func.count(Message.id))
        .where(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
        )
    )
    if last_read_at is not None:
        stmt = stmt.where(Message.created_at > last_read_at)
    result = await session.execute(stmt)
    return result.scalar_one() or 0


async def mark_conversation_read(
    session: AsyncSession,
    conversation_id: str,
    user_id: str,
    read_at: datetime,
) -> None:
    result = await session.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        return
    participant.last_read_at = read_at
    session.add(participant)
    await session.flush()


async def list_user_conversations(
    session: AsyncSession, user_id: str, limit: int = 50, offset: int = 0
) -> list[Conversation]:
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants), selectinload(Conversation.messages))
        .join(ConversationParticipant)
        .where(
            ConversationParticipant.user_id == user_id,
            Conversation.status == ConversationStatus.ACTIVE,
        )
        .order_by(Conversation.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_participant(
    session: AsyncSession, conversation_id: str, user_id: str
) -> ConversationParticipant | None:
    result = await session.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_automated_message_exists(
    session: AsyncSession, conversation_id: str, automation_type: str
) -> bool:
    result = await session.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id,
            Message.automation_type == automation_type,
        )
    )
    return (result.scalar_one() or 0) > 0


async def list_message_templates(
    session: AsyncSession,
    category: str | None = None,
    locale: str = "ar",
) -> list[MessageTemplate]:
    stmt = select(MessageTemplate).where(
        MessageTemplate.locale == locale,
        MessageTemplate.is_active.is_(True),
    )
    if category is not None:
        stmt = stmt.where(MessageTemplate.category == category)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_message_template_by_key(
    session: AsyncSession, key: str, locale: str = "ar"
) -> MessageTemplate | None:
    result = await session.execute(
        select(MessageTemplate).where(
            MessageTemplate.key == key,
            MessageTemplate.locale == locale,
            MessageTemplate.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()
