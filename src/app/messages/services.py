from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import repository as auth_repository
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.shared.outbox import write_event

from . import repository as messages_repository
from .constants import (
    ConversationStatus,
    ConversationType,
    MessageAutomationType,
    MessageStatus,
    ParticipantRole,
    SupportStatus,
)
from .models import Conversation, ConversationParticipant
from .schemas import (
    ConversationDetailResponse,
    ConversationListItem,
    ConversationResponse,
    InquiryCreate,
    MessageCreate,
    MessageResponse,
    MessageTemplateResponse,
    ParticipantResponse,
    SupportConversationCreate,
    UnreadCountResponse,
)
from .templates import list_quick_reply_templates, render_automated

MAX_MESSAGE_LENGTH = 4000


def _participant_role_for_user(user: User, conversation: Conversation) -> str:
    for participant in conversation.participants:
        if participant.user_id == user.id:
            return participant.role
    raise AuthorizationError("Not a participant in this conversation")


async def _participant_responses(
    session: AsyncSession, conversation: Conversation, viewer: User
) -> list[ParticipantResponse]:
    """Serialize participants for ``viewer``.

    Read receipts (R1 privacy): a participant whose ``read_receipts`` flag
    is off exposes ``last_read_at=None`` to everyone else — the flag hides
    the timestamp, not the viewer's own read state.
    """
    other_ids = [
        p.user_id for p in conversation.participants if p.user_id != viewer.id
    ]
    hidden: set[str] = set()
    if other_ids:
        result = await session.execute(
            select(User.id, User.read_receipts).where(User.id.in_(other_ids))
        )
        hidden = {row[0] for row in result.all() if row[1] is False}
    items: list[ParticipantResponse] = []
    for participant in conversation.participants:
        item = ParticipantResponse.model_validate(participant)
        if participant.user_id in hidden:
            item.last_read_at = None
        items.append(item)
    return items


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

    if conversation.type == ConversationType.SUPPORT:
        # A new/updated support thread has no staff participant yet —
        # notify the operations inbox (admins + staff with the
        # operations grant) so the queue sees it. Once a support agent
        # has joined, only actual participants are notified.
        sender_role = next(
            (p.role for p in conversation.participants if p.user_id == sender.id),
            None,
        )
        has_support_recipient = any(
            r["role"] == ParticipantRole.SUPPORT for r in recipients
        )
        if sender_role != ParticipantRole.SUPPORT and not has_support_recipient:
            recipients.extend(
                await _operations_staff_recipients(session, exclude_ids={sender.id})
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
        # Staff replying to a support thread join it on first reply —
        # same auto-join pattern as co-hosts on reservation threads.
        if conversation.type == ConversationType.SUPPORT and await _can_handle_support(
            session, user
        ):
            participant = await messages_repository.add_support_participant(
                session, conversation.id, user.id
            )
            conversation.participants.append(participant)
        else:
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

    if conversation.type == ConversationType.SUPPORT:
        conversation.support_status = (
            SupportStatus.WAITING_FOR_USER
            if role == ParticipantRole.SUPPORT
            else SupportStatus.WAITING_FOR_SUPPORT
        )
    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await _notify_message_recipients(session, conversation, user, message)

    return MessageResponse.model_validate(message)


async def _operations_staff_recipients(
    session: AsyncSession, exclude_ids: set[str] | None = None
) -> list[dict[str, Any]]:
    """Active admins + staff holding the `operations` grant — the shared
    support inbox used to fan out new SUPPORT thread notifications."""
    from app.auth.constants import StaffPermission, UserRole
    from app.auth.models import StaffPermission as StaffPermissionRow

    excluded = exclude_ids or set()
    rows = await session.execute(
        select(
            User.id, User.email, User.phone_number, User.locale, User.display_name
        )
        .outerjoin(StaffPermissionRow, StaffPermissionRow.user_id == User.id)
        .where(
            User.is_active.is_(True),
            User.id.notin_(excluded) if excluded else True,
            or_(
                User.role == UserRole.ADMIN,
                and_(
                    User.role == UserRole.STAFF,
                    StaffPermissionRow.permission == StaffPermission.OPERATIONS,
                    StaffPermissionRow.is_active.is_(True),
                ),
            ),
        )
        .distinct()
    )
    return [
        {
            "user_id": row[0],
            "email": row[1],
            "phone_number": row[2],
            "locale": row[3] or "ar",
            "name": row[4] or "StayOS Support",
            "role": ParticipantRole.SUPPORT,
        }
        for row in rows.all()
    ]


async def _can_handle_support(session: AsyncSession, user: User) -> bool:
    """Admins always; staff need an active `operations` grant."""
    from app.auth.constants import UserRole
    from app.auth.models import StaffPermission

    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.STAFF:
        return False
    result = await session.execute(
        select(StaffPermission.id).where(
            StaffPermission.user_id == user.id,
            StaffPermission.permission == "operations",
            StaffPermission.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


def _user_participant_role(user: User) -> str:
    """The role a marketplace user takes inside a support thread."""
    if user.role == "host":
        return ParticipantRole.HOST
    if user.role == "admin" or user.role == "staff":
        return ParticipantRole.SUPPORT
    return ParticipantRole.GUEST


async def start_support_conversation(
    session: AsyncSession,
    user: User,
    request: SupportConversationCreate,
) -> ConversationResponse:
    """User-initiated StayOS Support thread.

    Optional `booking_id` is stored as context only — support threads
    never claim the reservation conversation's booking link. Booking
    context is validated so a user cannot attach a reservation they have
    no relationship to.
    """
    context_booking_id = None
    unit_id = None
    if request.booking_id:
        booking = await bookings_repository.get_booking_or_raise(
            session, request.booking_id
        )
        is_guest = booking.guest_id == user.id
        is_unit_host = booking.unit is not None and booking.unit.host_id == user.id
        if not (is_guest or is_unit_host or user.role == "admin"):
            raise AuthorizationError(
                "Not authorized to reference this booking"
            )
        context_booking_id = booking.id
        unit_id = booking.unit_id

    conversation = await messages_repository.get_or_create_user_support_conversation(
        session,
        user_id=user.id,
        user_role=_user_participant_role(user),
        context_booking_id=context_booking_id,
        unit_id=unit_id,
        subject=request.subject,
    )
    # A fresh subject only sticks to a brand-new thread; keep the
    # original subject on reuse so history stays coherent.
    if not conversation.subject and request.subject:
        conversation.subject = request.subject
        session.add(conversation)

    message = await messages_repository.create_message(
        session,
        conversation_id=conversation.id,
        sender_id=user.id,
        sender_role=_user_participant_role(user),
        content=request.content,
        status=MessageStatus.SENT,
    )

    conversation.support_status = SupportStatus.WAITING_FOR_SUPPORT
    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await _notify_message_recipients(session, conversation, user, message)
    return ConversationResponse.model_validate(conversation)


async def list_support_queue(
    session: AsyncSession,
    user: User,
    support_status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[ConversationListItem]:
    """Staff triage view over every SUPPORT conversation."""
    if not await _can_handle_support(session, user):
        raise AuthorizationError("Insufficient permissions")

    conversations = await messages_repository.list_support_queue(
        session, support_status=support_status, limit=limit, offset=offset
    )

    user_ids = {
        p.user_id for c in conversations for p in c.participants
    }
    names: dict[str, str | None] = {}
    if user_ids:
        rows = await session.execute(
            select(User.id, User.display_name).where(User.id.in_(user_ids))
        )
        names = {row[0]: row[1] for row in rows.all()}

    unit_ids = {c.unit_id for c in conversations if c.unit_id}
    titles: dict[str, str] = {}
    if unit_ids:
        title_rows = await session.execute(
            select(
                UnitListing.unit_id,
                UnitListing.title_ar,
                UnitListing.title_en,
            ).where(UnitListing.unit_id.in_(unit_ids))
        )
        titles = {
            row[0]: (row[1] or row[2])
            for row in title_rows.all()
            if row[1] or row[2]
        }

    items: list[ConversationListItem] = []
    for conversation in conversations:
        requester = next(
            (p for p in conversation.participants if p.role != ParticipantRole.SUPPORT),
            None,
        )
        last_message = (
            MessageResponse.model_validate(conversation.messages[-1])
            if conversation.messages
            else None
        )
        items.append(
            ConversationListItem(
                id=conversation.id,
                booking_id=conversation.booking_id,
                unit_id=conversation.unit_id,
                type=conversation.type,
                status=conversation.status,
                subject=conversation.subject,
                support_status=conversation.support_status,
                context_booking_id=conversation.context_booking_id,
                unread_count=0,
                counterparty_name=names.get(requester.user_id) if requester else None,
                unit_title=titles.get(conversation.unit_id) if conversation.unit_id else None,
                last_message=last_message,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
            )
        )
    return items


async def set_support_status(
    session: AsyncSession,
    user: User,
    conversation_id: str,
    status: str,
) -> ConversationResponse:
    """Transition a support thread's workflow state.

    Staff resolve/reopen threads; the thread's own user may also mark a
    thread resolved or reopen it (new messages always reopen it too).
    """
    conversation = await messages_repository.get_conversation_by_id_or_raise(
        session, conversation_id
    )
    if conversation.type != ConversationType.SUPPORT:
        raise ValidationError("Not a support conversation")

    is_participant = await messages_repository.is_conversation_participant(
        session, conversation_id, user.id
    )
    can_handle = await _can_handle_support(session, user)
    if not is_participant and not can_handle:
        raise AuthorizationError("Not authorized to update this conversation")

    if not can_handle and status not in (
        SupportStatus.OPEN,
        SupportStatus.WAITING_FOR_SUPPORT,
        SupportStatus.RESOLVED,
    ):
        # The thread's own user may reopen or resolve — staff-facing
        # triage states (e.g. waiting_for_user) belong to staff only.
        raise AuthorizationError("Not authorized to set this status")

    conversation.support_status = SupportStatus(status)
    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()
    return ConversationResponse.model_validate(conversation)


async def contact_host(
    session: AsyncSession,
    user: User,
    request: InquiryCreate,
) -> ConversationResponse:
    """Create or reuse an inquiry conversation and send the first message.

    Allows a guest to message a host before booking, mirroring Airbnb's
    "Contact host" feature. The conversation is not tied to a booking.
    Any authenticated marketplace role can contact a host — the sender is
    recorded as the guest-side participant of that conversation.
    """
    result = await session.execute(
        select(Unit).where(Unit.id == request.unit_id)
    )
    unit = result.scalar_one_or_none()
    if unit is None or unit.status != UnitStatus.LISTED:
        raise NotFoundError("Listing not found")

    if unit.host_id == user.id:
        raise ValidationError("Cannot contact your own listing")

    conversation = await messages_repository.get_or_create_inquiry_conversation(
        session, unit.id, user.id, unit.host_id
    )

    message = await messages_repository.create_message(
        session,
        conversation_id=conversation.id,
        sender_id=user.id,
        sender_role=ParticipantRole.GUEST,
        content=request.content,
        status=MessageStatus.SENT,
    )

    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await _notify_message_recipients(session, conversation, user, message)

    return ConversationResponse.model_validate(conversation)


async def get_conversation_detail(
    session: AsyncSession, user: User, conversation_id: str
) -> ConversationDetailResponse:
    conversation = await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        # Operations staff can read support threads before joining them.
        if conversation.type == ConversationType.SUPPORT and await _can_handle_support(
            session, user
        ):
            pass
        else:
            raise AuthorizationError("Not authorized to view this conversation")

    messages = await messages_repository.list_messages_for_conversation(session, conversation_id)
    return ConversationDetailResponse(
        id=conversation.id,
        booking_id=conversation.booking_id,
        unit_id=conversation.unit_id,
        type=conversation.type,
        status=conversation.status,
        subject=conversation.subject,
        support_status=conversation.support_status,
        context_booking_id=conversation.context_booking_id,
        participants=await _participant_responses(session, conversation, user),
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
    conversation = await messages_repository.get_conversation_by_id_or_raise(session, conversation_id)
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        if conversation.type == ConversationType.SUPPORT and await _can_handle_support(
            session, user
        ):
            pass
        else:
            raise AuthorizationError("Not authorized to view this conversation")

    messages = await messages_repository.list_messages_for_conversation(
        session, conversation_id, limit, offset
    )
    return [MessageResponse.model_validate(m) for m in messages]


async def mark_conversation_read(
    session: AsyncSession, user: User, conversation_id: str
) -> None:
    # Fetch conversation to verify it exists (raises NotFoundError)
    conversation = await messages_repository.get_conversation_by_id_or_raise(
        session, conversation_id
    )
    if not await messages_repository.is_conversation_participant(session, conversation_id, user.id):
        # Staff may read a thread before joining it (first reply joins).
        # Reading alone must not claim the thread, so the mark is a no-op
        # for staff who are not participants yet.
        if conversation.type == ConversationType.SUPPORT and await _can_handle_support(
            session, user
        ):
            return
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

    other_ids = {
        p.user_id
        for conversation in conversations
        for p in conversation.participants
        if p.user_id != user.id
    }
    names: dict[str, str | None] = {}
    if other_ids:
        name_rows = await session.execute(
            select(User.id, User.display_name).where(User.id.in_(other_ids))
        )
        names = {row[0]: row[1] for row in name_rows.all()}

    unit_ids = {c.unit_id for c in conversations if c.unit_id}
    titles: dict[str, str] = {}
    if unit_ids:
        title_rows = await session.execute(
            select(
                UnitListing.unit_id,
                UnitListing.title_ar,
                UnitListing.title_en,
            ).where(UnitListing.unit_id.in_(unit_ids))
        )
        titles = {
            row[0]: (row[1] or row[2]) for row in title_rows.all() if row[1] or row[2]
        }

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
        other = next(
            (p for p in conversation.participants if p.user_id != user.id), None
        )
        counterparty = names.get(other.user_id) if other else None
        if conversation.type == ConversationType.SUPPORT:
            # The support counterparty is the team, not one staff user.
            counterparty = "StayOS Support"
        items.append(
            ConversationListItem(
                id=conversation.id,
                booking_id=conversation.booking_id,
                unit_id=conversation.unit_id,
                type=conversation.type,
                status=conversation.status,
                subject=conversation.subject,
                support_status=conversation.support_status,
                context_booking_id=conversation.context_booking_id,
                unread_count=unread_count,
                counterparty_name=counterparty,
                unit_title=titles.get(conversation.unit_id) if conversation.unit_id else None,
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
    is_messaging_cohost = False
    if not (is_guest or is_host or is_admin):
        if booking.unit is None:
            raise NotFoundError("Unit not found")
        # Co-hosts with a messaging-capable scope may join the booking
        # conversation on the host's behalf.
        from app.host.constants import CoHostPermissionScope
        from app.host.permissions import get_unit_permission_scope

        scope = await get_unit_permission_scope(session, user, booking.unit)
        if scope in (
            CoHostPermissionScope.FULL_ACCESS,
            CoHostPermissionScope.CALENDAR_MESSAGING,
        ):
            is_messaging_cohost = True
        else:
            raise AuthorizationError("Not authorized to view this conversation")

    if booking.unit is None:
        raise NotFoundError("Unit not found")

    conversation = await messages_repository.get_or_create_conversation_for_booking(
        session, booking.id, booking.unit_id, booking.guest_id, booking.unit.host_id
    )

    if is_messaging_cohost:
        # Add the co-host as a host-side participant so send/read paths
        # (which all gate on participant rows) work uniformly.
        existing = await messages_repository.get_participant(
            session, conversation.id, user.id
        )
        if existing is None:
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user.id,
                role=ParticipantRole.CO_HOST,
            )
            session.add(participant)
            await session.flush()
            conversation.participants.append(participant)

    return ConversationResponse(
        id=conversation.id,
        booking_id=conversation.booking_id,
        unit_id=conversation.unit_id,
        type=conversation.type,
        status=conversation.status,
        participants=await _participant_responses(session, conversation, user),
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


async def admin_contact_participant(
    session: AsyncSession,
    staff_user: User,
    booking_id: str,
    target: str,
    content: str,
) -> ConversationResponse:
    """Admin/staff opens an operational SUPPORT thread with one side of a
    booking (guest or host). Uses the existing conversation contract — the
    target is a real participant and can reply; no private guest↔host
    conversation is exposed to staff.
    """
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)
    if target == "guest":
        target_user_id = booking.guest_id
        target_role = ParticipantRole.GUEST
    else:
        if booking.unit is None:
            raise NotFoundError("Unit not found")
        target_user_id = booking.unit.host_id
        target_role = ParticipantRole.HOST

    if target_user_id == staff_user.id:
        raise ValidationError("Cannot open a support conversation with yourself")

    conversation = await messages_repository.get_or_create_support_conversation(
        session,
        context_booking_id=booking.id,
        unit_id=booking.unit_id,
        staff_user_id=staff_user.id,
        target_user_id=target_user_id,
        target_role=target_role,
    )

    message = await messages_repository.create_message(
        session,
        conversation_id=conversation.id,
        sender_id=staff_user.id,
        sender_role=ParticipantRole.SUPPORT,
        content=content,
        status=MessageStatus.SENT,
    )

    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await _notify_message_recipients(session, conversation, staff_user, message)

    return ConversationResponse(
        id=conversation.id,
        booking_id=conversation.booking_id,
        unit_id=conversation.unit_id,
        type=conversation.type,
        status=conversation.status,
        participants=await _participant_responses(
            session, conversation, staff_user
        ),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )
