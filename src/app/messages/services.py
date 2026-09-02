from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import repository as auth_repository
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.listings.models import Unit
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.shared.outbox import write_event

from . import repository as messages_repository
from .constants import (
    ConversationStatus,
    MessageAutomationType,
    MessageStatus,
    ParticipantRole,
)
from .models import Conversation
from .schemas import (
    ConversationDetailResponse,
    ConversationListItem,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    MessageTemplateResponse,
    ParticipantResponse,
    UnreadCountResponse,
)
from .templates import list_quick_reply_templates, render_automated

MAX_MESSAGE_LENGTH = 4000


def _participant_role_for_user(user: User, conversation: Conversation) -> str:
    for participant in conversation.participants:
        if participant.user_id == user.id:
            return participant.role
    raise AuthorizationError("Not a participant in this conversation")


async def _notify_message_recipients(
    session: AsyncSession,
    conversation: Conversation,
    sender: User,
    message: Any,
) -> None:
    recipients: list[dict[str, Any]] = []
    for participant in conversation.participants:
        if participant.user_id == sender.id:
            continue
        recipient_user = await auth_repository.get_user_by_id(session, participant.user_id)
        if recipient_user is None:
            continue
        recipients.append(
            {
                "user_id": recipient_user.id,
                "email": recipient_user.email,
                "phone_number": recipient_user.phone_number,
                "locale": recipient_user.locale or "ar",
                "name": recipient_user.display_name or "Guest",
                "role": participant.role,
            }
        )

    if not recipients:
        return

    await write_event(
        session,
        aggregate_type="Conversation",
        aggregate_id=UUID(conversation.id),
        event_type="message.received",
        payload={
            "conversation_id": conversation.id,
            "booking_id": conversation.booking_id,
            "unit_id": conversation.unit_id,
            "message_id": message.id,
            "sender_id": sender.id,
            "sender_name": sender.display_name or "Guest",
            "recipients": recipients,
        },
    )


async def send_message(
    session: AsyncSession,
    user: User,
    conversation_id: str,
    request: MessageCreate,
) -> MessageResponse:
    if len(request.content) > MAX_MESSAGE_LENGTH:
        raise ValidationError("Message is too long")

    conversation = await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if conversation.status != ConversationStatus.ACTIVE:
        raise ValidationError("Conversation is not active")

    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        raise AuthorizationError("Not authorized to send messages in this conversation")

    role = _participant_role_for_user(user, conversation)

    message = await messages_repository.create_message(
        session,
        conversation_id=conversation.id,
        sender_id=user.id,
        sender_role=role,
        content=request.content,
        status=MessageStatus.SENT,
    )

    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await _notify_message_recipients(session, conversation, user, message)

    return MessageResponse.model_validate(message)


async def get_conversation_detail(
    session: AsyncSession, user: User, conversation_id: str
) -> ConversationDetailResponse:
    conversation = await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        raise AuthorizationError("Not authorized to view this conversation")

    messages = await messages_repository.list_messages_for_conversation(session, conversation_id)
    return ConversationDetailResponse(
        id=conversation.id,
        booking_id=conversation.booking_id,
        unit_id=conversation.unit_id,
        type=conversation.type,
        status=conversation.status,
        participants=[
            ParticipantResponse.model_validate(p) for p in conversation.participants
        ],
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[MessageResponse.model_validate(m) for m in messages],
    )


async def list_messages(
    session: AsyncSession,
    user: User,
    conversation_id: str,
    limit: int = 100,
    offset: int = 0,
) -> list[MessageResponse]:
    # Fetch conversation to verify it exists (raises NotFoundError)
    await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        raise AuthorizationError("Not authorized to view this conversation")

    messages = await messages_repository.list_messages_for_conversation(
        session, conversation_id, limit, offset
    )
    return [MessageResponse.model_validate(m) for m in messages]


async def mark_conversation_read(
    session: AsyncSession, user: User, conversation_id: str
) -> None:
    # Fetch conversation to verify it exists (raises NotFoundError)
    await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        raise AuthorizationError("Not authorized to view this conversation")

    await messages_repository.mark_conversation_read(
        session, conversation_id, user.id, datetime.now(UTC)
    )


async def list_conversations(
    session: AsyncSession,
    user: User,
    limit: int = 50,
    offset: int = 0,
) -> list[ConversationListItem]:
    conversations = await messages_repository.list_user_conversations(
        session, user.id, limit, offset
    )
    items: list[ConversationListItem] = []
    for conversation in conversations:
        participant = await messages_repository.get_participant(
            session, conversation.id, user.id
        )
        last_read_at = participant.last_read_at if participant else None
        unread_count = await messages_repository.count_unread_messages(
            session, conversation.id, user.id, last_read_at
        )
        last_message = None
        if conversation.messages:
            last_message = MessageResponse.model_validate(conversation.messages[-1])
        items.append(
            ConversationListItem(
                id=conversation.id,
                booking_id=conversation.booking_id,
                unit_id=conversation.unit_id,
                type=conversation.type,
                status=conversation.status,
                unread_count=unread_count,
                last_message=last_message,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
            )
        )
    return items


async def get_unread_count(session: AsyncSession, user: User) -> UnreadCountResponse:
    conversations = await messages_repository.list_user_conversations(
        session, user.id, limit=1000
    )
    total = 0
    for conversation in conversations:
        participant = await messages_repository.get_participant(
            session, conversation.id, user.id
        )
        last_read_at = participant.last_read_at if participant else None
        total += await messages_repository.count_unread_messages(
            session, conversation.id, user.id, last_read_at
        )
    return UnreadCountResponse(total_unread=total)


async def get_conversation_for_booking(
    session: AsyncSession, user: User, booking_id: str
) -> ConversationResponse:
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    is_guest = booking.guest_id == user.id
    is_host = booking.unit is not None and booking.unit.host_id == user.id
    is_admin = user.role == "admin"
    if not (is_guest or is_host or is_admin):
        raise AuthorizationError("Not authorized to view this conversation")

    if booking.unit is None:
        raise NotFoundError("Unit not found")

    conversation = await messages_repository.get_or_create_conversation_for_booking(
        session, booking.id, booking.unit_id, booking.guest_id, booking.unit.host_id
    )
    return ConversationResponse(
        id=conversation.id,
        booking_id=conversation.booking_id,
        unit_id=conversation.unit_id,
        type=conversation.type,
        status=conversation.status,
        participants=[
            ParticipantResponse.model_validate(p) for p in conversation.participants
        ],
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


async def list_message_templates(
    locale: str = "ar",
) -> list[MessageTemplateResponse]:
    templates = list_quick_reply_templates(locale)
    return [
        MessageTemplateResponse(
            id=f"static-{t['key']}",
            key=t["key"],
            name=t["name"],
            body="",
            variables=t["variables"],
            category="host_quick_reply",
            locale=locale,
        )
        for t in templates
    ]


async def send_automated_message(
    session: AsyncSession,
    conversation_id: str,
    automation_type: str,
    template_key: str,
    variables: dict[str, Any],
    locale: str = "ar",
) -> MessageResponse | None:
    conversation = await messages_repository.get_conversation_by_id_or_raise(
        session, conversation_id
    )
    if conversation.status != ConversationStatus.ACTIVE:
        return None

    # Application-level guard: check if this automation type was already sent.
    if await messages_repository.get_automated_message_exists(
        session, conversation.id, automation_type
    ):
        return None

    content = render_automated(template_key, locale, variables)
    try:
        message = await messages_repository.create_message(
            session,
            conversation_id=conversation.id,
            sender_id=None,
            sender_role=ParticipantRole.SYSTEM,
            content=content,
            status=MessageStatus.SENT,
            automation_type=automation_type,
        )
    except IntegrityError:
        # DB-level partial unique constraint caught a concurrent insert.
        # Another worker already sent this automation type — safe to skip.
        await session.rollback()
        return None

    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()
    return MessageResponse.model_validate(message)


async def send_booking_confirmed(
    session: AsyncSession,
    booking: Any,
    listing: Any | None,
    host_id: str,
) -> MessageResponse | None:
    conversation = await messages_repository.get_conversation_by_booking(
        session, booking.id
    )
    if conversation is None:
        conversation = await messages_repository.get_or_create_conversation_for_booking(
            session, booking.id, booking.unit_id, booking.guest_id, host_id
        )

    property_name = (listing.title_en or listing.title_ar) if listing is not None else None
    return await send_automated_message(
        session,
        conversation_id=conversation.id,
        automation_type=str(MessageAutomationType.BOOKING_CONFIRMED),
        template_key="booking_confirmed",
        variables={
            "property_name": property_name or "your stay",
            "check_in": str(booking.check_in),
            "check_out": str(booking.check_out),
        },
        locale="ar",
    )


async def ensure_conversation_for_booking(
    session: AsyncSession,
    booking_id: str,
    unit_id: str,
    guest_id: str,
    host_id: str,
) -> Conversation:
    return await messages_repository.get_or_create_conversation_for_booking(
        session, booking_id, unit_id, guest_id, host_id
    )


async def process_scheduled_messages(session: AsyncSession) -> int:
    """Send idempotent automated messages for lifecycle events.

    Designed to be called once per day. It scans active bookings and sends
    pre-arrival, check-in, checkout, and review reminders exactly once per
    conversation thanks to the automation_type duplicate guard.
    """
    today = datetime.now(UTC).date()

    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.unit).selectinload(Unit.listing))
        .where(
            Booking.status.in_(
                [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.ACCEPTED]
            )
        )
        .order_by(Booking.check_in)
    )
    bookings = list(result.scalars().all())
    sent = 0

    for booking in bookings:
        if booking.unit is None:
            continue

        # Re-check status — a booking may have been cancelled between the
        # bulk SELECT above and this iteration. Skip cancelled/rejected
        # bookings entirely; they should not receive lifecycle automation.
        if BookingStatus(booking.status) in (BookingStatus.CANCELLED, BookingStatus.REJECTED):
            continue

        listing = booking.unit.listing if booking.unit is not None else None
        host_id = booking.unit.host_id

        conversation = await messages_repository.get_conversation_by_booking(
            session, booking.id
        )
        if conversation is None:
            conversation = await messages_repository.get_or_create_conversation_for_booking(
                session, booking.id, booking.unit_id, booking.guest_id, host_id
            )

        guest = await session.get(User, booking.guest_id)
        guest_name = guest.display_name if guest is not None else "Guest"

        check_in_time = settings.DEFAULT_CHECK_IN_TIME
        check_out_time = settings.DEFAULT_CHECK_OUT_TIME
        if listing is not None:
            if listing.check_in_time:
                check_in_time = listing.check_in_time
            if listing.check_out_time:
                check_out_time = listing.check_out_time

        property_name = (listing.title_en or listing.title_ar) if listing is not None else None
        variables = {
            "guest_name": guest_name,
            "property_name": property_name or "your stay",
            "check_in_time": check_in_time,
            "check_out_time": check_out_time,
        }

        # Pre-arrival: one day before check-in (confirmed, not yet checked in)
        if (
            BookingStatus(booking.status) in (BookingStatus.CONFIRMED, BookingStatus.ACCEPTED)
            and booking.checked_in_at is None
            and today == booking.check_in - timedelta(days=1)
        ):
            msg = await send_automated_message(
                session,
                conversation.id,
                str(MessageAutomationType.PRE_ARRIVAL),
                "pre_arrival",
                variables,
                locale=guest.locale if guest is not None else "ar",
            )
            if msg is not None:
                sent += 1

        # Check-in reminder: on check-in day, not yet checked in
        if (
            BookingStatus(booking.status) in (BookingStatus.CONFIRMED, BookingStatus.ACCEPTED)
            and booking.checked_in_at is None
            and today == booking.check_in
        ):
            msg = await send_automated_message(
                session,
                conversation.id,
                str(MessageAutomationType.CHECK_IN_REMINDER),
                "check_in_reminder",
                variables,
                locale=guest.locale if guest is not None else "ar",
            )
            if msg is not None:
                sent += 1

        # Checkout reminder: day before checkout, already checked in
        if (
            BookingStatus(booking.status) == BookingStatus.CONFIRMED
            and booking.checked_in_at is not None
            and booking.checked_out_at is None
            and today == booking.check_out - timedelta(days=1)
        ):
            msg = await send_automated_message(
                session,
                conversation.id,
                str(MessageAutomationType.CHECKOUT_REMINDER),
                "checkout_reminder",
                variables,
                locale=guest.locale if guest is not None else "ar",
            )
            if msg is not None:
                sent += 1

        # Review reminder: day after checkout
        stay_finished = (
            BookingStatus(booking.status) == BookingStatus.COMPLETED
            or booking.checked_out_at is not None
        )
        if stay_finished and today == booking.check_out + timedelta(days=1):
            msg = await send_automated_message(
                session,
                conversation.id,
                str(MessageAutomationType.REVIEW_REMINDER),
                "review_reminder",
                variables,
                locale=guest.locale if guest is not None else "ar",
            )
            if msg is not None:
                sent += 1

    return sent
