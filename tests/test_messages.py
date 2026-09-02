import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth import repository as auth_repository
from app.auth import services as auth_services
from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.database import get_session
from app.messages import constants as message_constants
from app.messages import repository as messages_repository
from app.messages import router as messages_router
from app.messages import schemas as message_schemas
from app.messages import services as messages_services
from app.messages import tasks as messages_tasks
from app.messages import templates as message_templates
from app.messages.constants import MessageStatus
from app.messages.models import Message, MessageTemplate
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    display_name: str | None = "Test User",
    locale: str = "ar",
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name=display_name,
        locale=locale,
        role=str(role),
        kyc_status="verified",
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_booking(guest_id: str, host_id: str, status: str = BookingStatus.CONFIRMED):
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.guest_id = guest_id
    booking.unit_id = "unit-1"
    booking.unit = MagicMock()
    booking.unit.id = "unit-1"
    booking.unit.host_id = host_id
    booking.status = status
    booking.check_in = datetime.now(UTC).date()
    booking.check_out = datetime.now(UTC).date() + timedelta(days=2)
    booking.checked_in_at = None
    booking.checked_out_at = None
    return booking


def _make_conversation(
    participants: list[MagicMock] | None = None,
    status: str = message_constants.ConversationStatus.ACTIVE,
):
    conversation = MagicMock()
    conversation.id = str(uuid.uuid4())
    conversation.booking_id = "booking-1"
    conversation.unit_id = "unit-1"
    conversation.type = message_constants.ConversationType.RESERVATION
    conversation.status = status
    conversation.created_at = datetime.now(UTC)
    conversation.updated_at = datetime.now(UTC)
    if participants is None:
        guest_p = MagicMock()
        guest_p.user_id = "guest-1"
        guest_p.role = message_constants.ParticipantRole.GUEST
        guest_p.last_read_at = None
        host_p = MagicMock()
        host_p.user_id = "host-1"
        host_p.role = message_constants.ParticipantRole.HOST
        host_p.last_read_at = None
        conversation.participants = [guest_p, host_p]
    else:
        conversation.participants = participants
    conversation.messages = []
    return conversation


def _make_message(
    sender_id: str | None = "guest-1",
    sender_role: str = message_constants.ParticipantRole.GUEST,
    automation_type: str | None = None,
):
    message = MagicMock()
    message.id = str(uuid.uuid4())
    message.conversation_id = "conv-1"
    message.sender_id = sender_id
    message.sender_role = sender_role
    message.content = "Hello"
    message.status = MessageStatus.SENT
    message.automation_type = automation_type
    message.created_at = datetime.now(UTC)
    message.updated_at = datetime.now(UTC)
    return message


# ============================================================
# PHASE 1 — AUTHORIZATION
# ============================================================

@pytest.mark.asyncio
async def test_ensure_conversation_for_booking(fake_session: AsyncMock) -> None:
    conversation = _make_conversation()
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )
    result = await messages_services.ensure_conversation_for_booking(
        fake_session, "booking-1", "unit-1", "guest-1", "host-1"
    )
    assert result.id == conversation.id
    monkeypatch.undo()


@pytest.mark.asyncio
async def test_send_message_authorized(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        messages_repository,
        "create_message",
        AsyncMock(return_value=message),
    )
    monkeypatch.setattr(
        "app.messages.services.write_event", AsyncMock()
    )

    request = message_schemas.MessageCreate(content="Hello host")
    response = await messages_services.send_message(fake_session, guest, conversation.id, request)
    assert response.content == "Hello"


@pytest.mark.asyncio
async def test_send_message_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    conversation = _make_conversation()

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=False),
    )

    request = message_schemas.MessageCreate(content="Hello")
    with pytest.raises(AuthorizationError):
        await messages_services.send_message(fake_session, other, conversation.id, request)


@pytest.mark.asyncio
async def test_get_conversation_detail_unauthorized(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Guest B cannot retrieve Guest A's conversation."""
    guest_b = _make_user(user_id="guest-b", role=UserRole.GUEST)
    conversation = _make_conversation()

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=False),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.get_conversation_detail(fake_session, guest_b, conversation.id)


@pytest.mark.asyncio
async def test_list_messages_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    """Unauthorized user cannot list messages in a conversation."""
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    conversation = _make_conversation()

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=False),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.list_messages(fake_session, other, conversation.id)


@pytest.mark.asyncio
async def test_mark_read_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    """Unauthorized user cannot mark messages read."""
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    conversation = _make_conversation()

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=False),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.mark_conversation_read(fake_session, other, conversation.id)


@pytest.mark.asyncio
async def test_get_conversation_for_booking_guest(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    booking = _make_booking(guest.id, host.id)
    conversation = _make_conversation()

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )

    response = await messages_services.get_conversation_for_booking(fake_session, guest, booking.id)
    assert response.id == conversation.id


@pytest.mark.asyncio
async def test_get_conversation_for_booking_host(fake_session: AsyncMock, monkeypatch) -> None:
    """Host can access conversation for their own listing's booking."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    booking = _make_booking(guest.id, host.id)
    conversation = _make_conversation()

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )

    response = await messages_services.get_conversation_for_booking(fake_session, host, booking.id)
    assert response.id == conversation.id


@pytest.mark.asyncio
async def test_get_conversation_for_booking_unauthorized(
    fake_session: AsyncMock, monkeypatch
) -> None:
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    booking = _make_booking(guest.id, host.id)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.get_conversation_for_booking(fake_session, other, booking.id)


@pytest.mark.asyncio
async def test_get_conversation_for_booking_wrong_host(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Host A cannot access Host B's conversation."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    host_a = _make_user(user_id="host-a", role=UserRole.HOST)
    host_b = _make_user(user_id="host-b", role=UserRole.HOST)
    booking = _make_booking(guest.id, host_b.id)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    with pytest.raises(AuthorizationError):
        await messages_services.get_conversation_for_booking(fake_session, host_a, booking.id)


# ============================================================
# PHASE 2 — LIFECYCLE
# ============================================================

@pytest.mark.asyncio
async def test_send_message_to_archived_conversation_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Cannot send to a non-active conversation."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation(status=message_constants.ConversationStatus.ARCHIVED)

    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=True),
    )

    request = message_schemas.MessageCreate(content="Hello")
    with pytest.raises(ValidationError, match="not active"):
        await messages_services.send_message(fake_session, guest, conversation.id, request)


# ============================================================
# PHASE 3 — CONVERSATION IDEMPOTENCY
# ============================================================

@pytest.mark.asyncio
async def test_get_or_create_returns_existing_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Repeated calls return the same conversation, no duplicates."""
    conversation = _make_conversation()

    create_mock = AsyncMock(return_value=conversation)
    get_mock = AsyncMock(return_value=conversation)

    monkeypatch.setattr(messages_repository, "get_conversation_by_booking", get_mock)
    monkeypatch.setattr(messages_repository, "create_conversation_for_booking", create_mock)

    result = await messages_repository.get_or_create_conversation_for_booking(
        fake_session, "booking-1", "unit-1", "guest-1", "host-1"
    )
    assert result.id == conversation.id
    create_mock.assert_not_called()


@pytest.mark.asyncio
async def test_get_or_create_handles_integrity_error(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """If a concurrent insert wins, we catch IntegrityError and re-read."""
    from sqlalchemy.exc import IntegrityError

    conversation = _make_conversation()
    create_mock = AsyncMock(side_effect=IntegrityError("stmt", "params", Exception()))
    call_count = 0

    async def _get_mock(session, booking_id):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return None  # First SELECT: nothing exists yet
        return conversation  # Second SELECT: concurrent insert won

    monkeypatch.setattr(messages_repository, "get_conversation_by_booking", _get_mock)
    monkeypatch.setattr(messages_repository, "create_conversation_for_booking", create_mock)
    monkeypatch.setattr(fake_session, "rollback", AsyncMock())

    result = await messages_repository.get_or_create_conversation_for_booking(
        fake_session, "booking-1", "unit-1", "guest-1", "host-1"
    )
    assert result.id == conversation.id


# ============================================================
# PHASE 4 — MESSAGE SEND VALIDATION
# ============================================================

@pytest.mark.asyncio
async def test_send_message_empty_rejected() -> None:
    """Empty messages are rejected by schema validation."""
    with pytest.raises(Exception):
        message_schemas.MessageCreate(content="")


@pytest.mark.asyncio
async def test_send_message_too_long_rejected() -> None:
    """Messages over 4000 chars are rejected by schema validation."""
    with pytest.raises(Exception):
        message_schemas.MessageCreate(content="x" * 4001)


# ============================================================
# PHASE 5 — READ / UNREAD
# ============================================================

@pytest.mark.asyncio
async def test_count_unread_excludes_own_messages(monkeypatch) -> None:
    """Sender's own messages are not counted as unread for them."""
    from app.messages.repository import count_unread_messages

    session = AsyncMock()
    # Simulate: 3 messages total, 2 from others, 1 from self
    # The query filters sender_id != user_id, so only 2 should count
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 2
    session.execute = AsyncMock(return_value=mock_result)

    count = await count_unread_messages(session, "conv-1", "guest-1", None)
    assert count == 2


@pytest.mark.asyncio
async def test_mark_read_idempotent(monkeypatch) -> None:
    """Marking read twice is safe — just updates last_read_at."""
    from app.messages.repository import mark_conversation_read

    session = AsyncMock()
    participant = MagicMock()
    participant.last_read_at = None
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = participant
    session.execute = AsyncMock(return_value=mock_result)

    read_at = datetime.now(UTC)
    await mark_conversation_read(session, "conv-1", "guest-1", read_at)
    assert participant.last_read_at == read_at

    # Second call — just updates again
    read_at_2 = datetime.now(UTC)
    await mark_conversation_read(session, "conv-1", "guest-1", read_at_2)
    assert participant.last_read_at == read_at_2


@pytest.mark.asyncio
async def test_count_unread_with_last_read_at(monkeypatch) -> None:
    """Messages before last_read_at are not counted as unread."""
    from app.messages.repository import count_unread_messages

    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 1
    session.execute = AsyncMock(return_value=mock_result)

    count = await count_unread_messages(
        session, "conv-1", "guest-1", datetime.now(UTC)
    )
    assert count == 1


# ============================================================
# PHASE 7 — AUTOMATED MESSAGE IDEMPOTENCY
# ============================================================

@pytest.mark.asyncio
async def test_send_automated_message_duplicate_guard(
    fake_session: AsyncMock, monkeypatch
) -> None:
    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_automated_message_exists",
        AsyncMock(return_value=True),
    )

    result = await messages_services.send_automated_message(
        fake_session,
        conversation.id,
        "booking_confirmed",
        "booking_confirmed",
        {"property_name": "Test", "check_in": "2026-01-01", "check_out": "2026-01-05"},
    )
    assert result is None


@pytest.mark.asyncio
async def test_send_automated_message_to_archived_returns_none(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Automated messages are not sent to archived conversations."""
    conversation = _make_conversation(status=message_constants.ConversationStatus.ARCHIVED)
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )

    result = await messages_services.send_automated_message(
        fake_session,
        conversation.id,
        "booking_confirmed",
        "booking_confirmed",
        {"property_name": "Test", "check_in": "2026-01-01", "check_out": "2026-01-05"},
    )
    assert result is None


@pytest.mark.asyncio
async def test_send_automated_message_integrity_error_returns_none(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """If DB unique constraint catches a concurrent insert, return None."""
    from sqlalchemy.exc import IntegrityError

    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_automated_message_exists",
        AsyncMock(return_value=False),
    )
    monkeypatch.setattr(
        messages_repository,
        "create_message",
        AsyncMock(side_effect=IntegrityError("stmt", "params", Exception())),
    )
    monkeypatch.setattr(fake_session, "rollback", AsyncMock())

    result = await messages_services.send_automated_message(
        fake_session,
        conversation.id,
        "booking_confirmed",
        "booking_confirmed",
        {"property_name": "Test", "check_in": "2026-01-01", "check_out": "2026-01-05"},
    )
    assert result is None


# ============================================================
# PHASE 8 — SCHEDULER / CANCELLATION HANDLING
# ============================================================

@pytest.mark.asyncio
async def test_process_scheduled_messages_skips_cancelled(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Cancelled bookings should not receive scheduled messages."""
    cancelled_booking = _make_booking(
        "guest-1", "host-1", status=BookingStatus.CANCELLED
    )
    cancelled_booking.check_in = datetime.now(UTC).date() + timedelta(days=1)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [cancelled_booking]
    fake_session.execute = AsyncMock(return_value=mock_result)

    send_mock = AsyncMock()
    monkeypatch.setattr(messages_services, "send_automated_message", send_mock)

    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 0
    send_mock.assert_not_called()


# ============================================================
# PHASE 9 — TEMPLATE INTERPOLATION
# ============================================================

def test_render_automated_template_populates_variables() -> None:
    from app.messages import templates

    body = templates.render_automated(
        "booking_confirmed", "en", {"property_name": "Villa", "check_in": "2026-01-01"}
    )
    assert "Villa" in body
    assert "2026-01-01" in body
    assert "{{" not in body


def test_render_automated_missing_variable_does_not_crash() -> None:
    """Missing optional variables default to empty string, not an error."""
    from app.messages import templates

    body = templates.render_automated(
        "booking_confirmed", "en", {}
    )
    assert "{{" not in body
    assert body  # Non-empty template body


def test_render_automated_unknown_locale_falls_back_to_ar() -> None:
    """Unknown locale falls back to Arabic."""
    from app.messages import templates

    body = templates.render_automated(
        "booking_confirmed", "fr", {"property_name": "Test"}
    )
    assert "Test" in body
    assert "{{" not in body


def test_render_automated_unknown_template_raises() -> None:
    """Unknown template key raises ValueError."""
    from app.messages import templates

    with pytest.raises(ValueError, match="Unknown automated template"):
        templates.render_automated("nonexistent", "en", {})


def test_render_quick_reply_populates_variables() -> None:
    from app.messages import templates

    body = templates.render_quick_reply(
        "wifi", "en", {"wifi_name": "MyNet", "wifi_password": "secret123"}
    )
    assert "MyNet" in body
    assert "secret123" in body


def test_all_automated_templates_exist_in_both_locales() -> None:
    """Every automation template must exist in both ar and en."""
    from app.messages import templates

    expected = {
        "booking_confirmed", "pre_arrival", "check_in_reminder",
        "checkout_reminder", "review_reminder",
    }
    ar_keys = set(templates._AUTOMATED_TEMPLATES.get("ar", {}).keys())
    en_keys = set(templates._AUTOMATED_TEMPLATES.get("en", {}).keys())
    assert ar_keys == expected, f"Missing ar templates: {expected - ar_keys}"
    assert en_keys == expected, f"Missing en templates: {expected - en_keys}"


# ============================================================
# PHASE 14 — LISTING-SPECIFIC CONFIG
# ============================================================

def test_arrival_info_eligible_uses_listing_specific_release_hours() -> None:
    """Listing-specific pre_arrival_info_release_hours overrides global default."""
    from app.bookings.services import _arrival_info_eligible

    booking = MagicMock()
    booking.status = BookingStatus.CONFIRMED
    booking.checked_in_at = None
    booking.check_in = datetime.now(UTC).date()

    listing = MagicMock()
    listing.pre_arrival_info_release_hours = 48  # 48 hours instead of global default

    # With 48-hour window, the booking should be eligible now (check_in is today)
    assert _arrival_info_eligible(booking, listing) is True

    # Test with check_in far in the future
    booking.check_in = datetime.now(UTC).date() + timedelta(days=10)
    assert _arrival_info_eligible(booking, listing) is False


def test_arrival_info_eligible_falls_back_to_global_default() -> None:
    """When listing has no override, global default is used."""
    from app.bookings.services import _arrival_info_eligible

    booking = MagicMock()
    booking.status = BookingStatus.CONFIRMED
    booking.checked_in_at = None
    booking.check_in = datetime.now(UTC).date()

    listing = MagicMock()
    listing.pre_arrival_info_release_hours = None

    # Check-in is today, so within any reasonable release window
    assert _arrival_info_eligible(booking, listing) is True


def test_arrival_info_eligible_rejects_non_confirmed() -> None:
    """Only CONFIRMED bookings are eligible for arrival info."""
    from app.bookings.services import _arrival_info_eligible

    booking = MagicMock()
    booking.status = BookingStatus.REQUESTED
    booking.checked_in_at = None
    booking.check_in = datetime.now(UTC).date()

    assert _arrival_info_eligible(booking, None) is False


def test_arrival_info_eligible_checked_in_always_eligible() -> None:
    """Already checked-in bookings are always eligible."""
    from app.bookings.services import _arrival_info_eligible

    booking = MagicMock()
    booking.status = BookingStatus.CONFIRMED
    booking.checked_in_at = datetime.now(UTC)
    booking.check_in = datetime.now(UTC).date() + timedelta(days=10)

    assert _arrival_info_eligible(booking, None) is True


# ============================================================
# PHASE 18 — TEMPLATES LIST
# ============================================================

@pytest.mark.asyncio
async def test_list_message_templates_returns_quick_replies() -> None:
    templates = await messages_services.list_message_templates("en")
    keys = {t.key for t in templates}
    assert "welcome" in keys
    assert "wifi" in keys


@pytest.mark.asyncio
async def test_list_message_templates_ar_locale() -> None:
    templates = await messages_services.list_message_templates("ar")
    assert len(templates) > 0
    # Arabic templates should have Arabic names
    assert any(t.name for t in templates)


# ============================================================
# COVERAGE GAP HELPERS AND FIXTURES
# ============================================================

def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override():
        yield fake_session

    return _override


@pytest.fixture
def messages_client(client, fake_session):
    from app.main import app

    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _make_message_response() -> message_schemas.MessageResponse:
    now = datetime.now(UTC)
    return message_schemas.MessageResponse(
        id=str(uuid.uuid4()),
        conversation_id="conv-1",
        sender_id="guest-1",
        sender_role="guest",
        content="Hello",
        status="sent",
        automation_type=None,
        created_at=now,
        updated_at=now,
    )


def _make_participant_response(user_id: str = "guest-1", role: str = "guest") -> message_schemas.ParticipantResponse:
    return message_schemas.ParticipantResponse(user_id=user_id, role=role, last_read_at=None)


def _make_conversation_response() -> message_schemas.ConversationResponse:
    now = datetime.now(UTC)
    return message_schemas.ConversationResponse(
        id="conv-1",
        booking_id="booking-1",
        unit_id="unit-1",
        type="reservation",
        status="active",
        participants=[_make_participant_response("guest-1", "guest"), _make_participant_response("host-1", "host")],
        created_at=now,
        updated_at=now,
    )


def _make_conversation_detail_response() -> message_schemas.ConversationDetailResponse:
    base = _make_conversation_response()
    return message_schemas.ConversationDetailResponse(
        **base.model_dump(),
        messages=[_make_message_response()],
    )


def _make_conversation_list_item() -> message_schemas.ConversationListItem:
    now = datetime.now(UTC)
    return message_schemas.ConversationListItem(
        id="conv-1",
        booking_id="booking-1",
        unit_id="unit-1",
        type="reservation",
        status="active",
        unread_count=0,
        last_message=_make_message_response(),
        created_at=now,
        updated_at=now,
    )


def _make_message_template_response() -> message_schemas.MessageTemplateResponse:
    return message_schemas.MessageTemplateResponse(
        id="static-welcome",
        key="welcome",
        name="Welcome",
        body="",
        variables=["guest_name", "property_name"],
        category="host_quick_reply",
        locale="ar",
    )


def _make_process_booking(
    status,
    check_in,
    check_out,
    checked_in_at=None,
    checked_out_at=None,
    unit=None,
):
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.guest_id = "guest-1"
    booking.status = status
    booking.check_in = check_in
    booking.check_out = check_out
    booking.checked_in_at = checked_in_at
    booking.checked_out_at = checked_out_at
    booking.unit = unit
    if unit is None:
        booking.unit = MagicMock()
        booking.unit.id = "unit-1"
        booking.unit.host_id = "host-1"
        listing = MagicMock()
        listing.title_en = "Test Villa"
        listing.title_ar = "فيلا"
        listing.check_in_time = "15:00"
        listing.check_out_time = "11:00"
        booking.unit.listing = listing
    return booking


class _FakeBeginCM:
    async def __aenter__(self) -> None:
        return None

    async def __aexit__(self, *args: object) -> bool:
        return False


def _fake_session_cm_factory(session: AsyncMock):
    class _FakeSessionCM:
        async def __aenter__(self) -> AsyncMock:
            return session

        async def __aexit__(self, *args: object) -> bool:
            return False

    return _FakeSessionCM


# ============================================================
# REPOSITORY COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_create_conversation_for_booking(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    fake_session.add_all = MagicMock()
    conversation = await messages_repository.create_conversation_for_booking(
        fake_session, "booking-1", "unit-1", "guest-1", "host-1"
    )
    assert conversation.booking_id == "booking-1"
    assert conversation.unit_id == "unit-1"
    participants = fake_session.add_all.call_args[0][0]
    assert len(participants) == 2
    assert fake_session.add.called
    assert fake_session.flush.await_count == 2


@pytest.mark.asyncio
async def test_get_conversation_by_id(fake_session: AsyncMock) -> None:
    conversation = _make_conversation()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = conversation
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.get_conversation_by_id(fake_session, conversation.id)
    assert result == conversation


@pytest.mark.asyncio
async def test_get_conversation_by_id_or_raise_not_found(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    fake_session.execute = AsyncMock(return_value=mock_result)
    with pytest.raises(NotFoundError):
        await messages_repository.get_conversation_by_id_or_raise(fake_session, "missing")


@pytest.mark.asyncio
async def test_get_conversation_by_booking(fake_session: AsyncMock) -> None:
    conversation = _make_conversation()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = conversation
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.get_conversation_by_booking(fake_session, "booking-1")
    assert result == conversation


@pytest.mark.asyncio
async def test_is_conversation_participant(fake_session: AsyncMock) -> None:
    participant = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = participant
    fake_session.execute = AsyncMock(return_value=mock_result)
    assert await messages_repository.is_conversation_participant(fake_session, "conv-1", "guest-1")


@pytest.mark.asyncio
async def test_create_message(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    message = await messages_repository.create_message(
        fake_session, "conv-1", "guest-1", "guest", "Hello"
    )
    assert message.conversation_id == "conv-1"
    assert message.sender_id == "guest-1"
    assert message.status == MessageStatus.SENT
    assert fake_session.add.called
    assert fake_session.flush.await_count == 1


@pytest.mark.asyncio
async def test_list_messages_for_conversation(fake_session: AsyncMock) -> None:
    message = _make_message()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [message]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.list_messages_for_conversation(fake_session, "conv-1")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_list_user_conversations(fake_session: AsyncMock) -> None:
    conversation = _make_conversation()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [conversation]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.list_user_conversations(fake_session, "guest-1")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_participant(fake_session: AsyncMock) -> None:
    participant = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = participant
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.get_participant(fake_session, "conv-1", "guest-1")
    assert result == participant


@pytest.mark.asyncio
async def test_get_automated_message_exists(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 1
    fake_session.execute = AsyncMock(return_value=mock_result)
    assert await messages_repository.get_automated_message_exists(fake_session, "conv-1", "booking_confirmed")


@pytest.mark.asyncio
async def test_list_message_templates(fake_session: AsyncMock) -> None:
    template = MessageTemplate(
        key="welcome",
        name="Welcome",
        body="Hi {{guest_name}}",
        variables=["guest_name"],
        category="host_quick_reply",
        locale="en",
    )
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [template]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.list_message_templates(fake_session, category="host_quick_reply", locale="en")
    assert len(result) == 1
    assert result[0].key == "welcome"


@pytest.mark.asyncio
async def test_get_message_template_by_key(fake_session: AsyncMock) -> None:
    template = MessageTemplate(
        key="welcome",
        name="Welcome",
        body="Hi {{guest_name}}",
        variables=["guest_name"],
        category="host_quick_reply",
        locale="en",
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = template
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await messages_repository.get_message_template_by_key(fake_session, "welcome", locale="en")
    assert result == template


# ============================================================
# SERVICES COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_notify_message_recipients(monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    conversation = _make_conversation()
    message = _make_message()
    write_event_mock = AsyncMock()
    monkeypatch.setattr(messages_services, "write_event", write_event_mock)
    monkeypatch.setattr(
        auth_repository, "get_user_by_id", AsyncMock(return_value=host)
    )
    await messages_services._notify_message_recipients(MagicMock(), conversation, guest, message)
    assert write_event_mock.called
    payload = write_event_mock.call_args.kwargs["payload"]
    assert payload["recipients"][0]["user_id"] == host.id


@pytest.mark.asyncio
async def test_notify_message_recipients_skips_missing_user(monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    write_event_mock = AsyncMock()
    monkeypatch.setattr(messages_services, "write_event", write_event_mock)
    monkeypatch.setattr(
        auth_repository, "get_user_by_id", AsyncMock(return_value=None)
    )
    await messages_services._notify_message_recipients(MagicMock(), conversation, guest, message)
    assert not write_event_mock.called


@pytest.mark.asyncio
async def test_notify_message_recipients_no_other_participants(monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    conversation.participants = [p for p in conversation.participants if p.user_id == guest.id]
    message = _make_message()
    write_event_mock = AsyncMock()
    monkeypatch.setattr(messages_services, "write_event", write_event_mock)
    await messages_services._notify_message_recipients(MagicMock(), conversation, guest, message)
    assert not write_event_mock.called


@pytest.mark.asyncio
async def test_send_message_too_long(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository, "get_conversation_by_id_or_raise", AsyncMock(return_value=conversation)
    )
    monkeypatch.setattr(
        messages_repository, "is_conversation_participant", AsyncMock(return_value=True)
    )
    request = type("R", (), {"content": "x" * 4001})()
    with pytest.raises(ValidationError):
        await messages_services.send_message(fake_session, guest, conversation.id, request)


@pytest.mark.asyncio
async def test_participant_role_for_user_unauthorized(fake_session: AsyncMock, monkeypatch) -> None:
    _guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    other = _make_user(user_id="other-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository, "get_conversation_by_id_or_raise", AsyncMock(return_value=conversation)
    )
    monkeypatch.setattr(
        messages_repository, "is_conversation_participant", AsyncMock(return_value=True)
    )
    request = message_schemas.MessageCreate(content="Hello")
    with pytest.raises(AuthorizationError):
        await messages_services.send_message(fake_session, other, conversation.id, request)


@pytest.mark.asyncio
async def test_list_conversations(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    conversation.messages = [_make_message()]
    participant = MagicMock()
    participant.last_read_at = None
    monkeypatch.setattr(
        messages_repository, "list_user_conversations", AsyncMock(return_value=[conversation])
    )
    monkeypatch.setattr(
        messages_repository, "get_participant", AsyncMock(return_value=participant)
    )
    monkeypatch.setattr(
        messages_repository, "count_unread_messages", AsyncMock(return_value=2)
    )
    result = await messages_services.list_conversations(fake_session, guest)
    assert len(result) == 1
    assert result[0].unread_count == 2


@pytest.mark.asyncio
async def test_get_unread_count(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    participant = MagicMock()
    participant.last_read_at = None
    monkeypatch.setattr(
        messages_repository, "list_user_conversations", AsyncMock(return_value=[conversation])
    )
    monkeypatch.setattr(
        messages_repository, "get_participant", AsyncMock(return_value=participant)
    )
    monkeypatch.setattr(
        messages_repository, "count_unread_messages", AsyncMock(return_value=3)
    )
    result = await messages_services.get_unread_count(fake_session, guest)
    assert result.total_unread == 3


@pytest.mark.asyncio
async def test_get_conversation_for_booking_unit_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    booking = _make_booking(guest.id, "host-1")
    booking.unit = None
    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    with pytest.raises(NotFoundError):
        await messages_services.get_conversation_for_booking(fake_session, guest, booking.id)


@pytest.mark.asyncio
async def test_send_booking_confirmed(fake_session: AsyncMock, monkeypatch) -> None:
    conversation = _make_conversation()
    send_mock = AsyncMock(return_value=_make_message())
    monkeypatch.setattr(messages_repository, "get_conversation_by_booking", AsyncMock(return_value=conversation))
    monkeypatch.setattr(messages_services, "send_automated_message", send_mock)
    booking = _make_booking("guest-1", "host-1", status=BookingStatus.CONFIRMED)
    listing = MagicMock()
    listing.title_en = "Villa"
    listing.title_ar = None
    result = await messages_services.send_booking_confirmed(fake_session, booking, listing, "host-1")
    assert result is not None
    send_mock.assert_awaited_once()
    variables = send_mock.call_args.kwargs["variables"]
    assert variables["property_name"] == "Villa"


@pytest.mark.asyncio
async def test_send_automated_message_success(fake_session: AsyncMock, monkeypatch) -> None:
    fake_session.add = MagicMock()
    now = datetime.now(UTC)
    conversation = _make_conversation()
    message = Message(
        id="msg-1",
        conversation_id=conversation.id,
        sender_id=None,
        sender_role="system",
        content="Your booking is confirmed.",
        status="sent",
        automation_type="booking_confirmed",
        created_at=now,
        updated_at=now,
    )
    monkeypatch.setattr(
        messages_repository, "get_conversation_by_id_or_raise", AsyncMock(return_value=conversation)
    )
    monkeypatch.setattr(
        messages_repository, "get_automated_message_exists", AsyncMock(return_value=False)
    )
    monkeypatch.setattr(
        messages_repository, "create_message", AsyncMock(return_value=message)
    )
    result = await messages_services.send_automated_message(
        fake_session,
        conversation.id,
        "booking_confirmed",
        "booking_confirmed",
        {"property_name": "Villa"},
        locale="en",
    )
    assert isinstance(result, message_schemas.MessageResponse)
    assert result.content == "Your booking is confirmed."
    assert fake_session.add.called
    assert fake_session.flush.await_count >= 1


@pytest.mark.asyncio
async def test_process_scheduled_messages_pre_arrival(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.CONFIRMED),
        today + timedelta(days=1),
        today + timedelta(days=3),
    )
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 1


@pytest.mark.asyncio
async def test_process_scheduled_messages_check_in(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.CONFIRMED),
        today,
        today + timedelta(days=2),
    )
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 1


@pytest.mark.asyncio
async def test_process_scheduled_messages_checkout(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.CONFIRMED),
        today - timedelta(days=2),
        today + timedelta(days=1),
        checked_in_at=datetime.now(UTC),
    )
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 1


@pytest.mark.asyncio
async def test_process_scheduled_messages_review(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.COMPLETED),
        today - timedelta(days=5),
        today - timedelta(days=1),
        checked_in_at=datetime.now(UTC),
        checked_out_at=datetime.now(UTC),
    )
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 1


@pytest.mark.asyncio
async def test_process_scheduled_messages_no_eligible(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.CONFIRMED),
        today + timedelta(days=10),
        today + timedelta(days=12),
    )
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 0


@pytest.mark.asyncio
async def test_process_scheduled_messages_skips_missing_unit(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        str(BookingStatus.CONFIRMED),
        today + timedelta(days=1),
        today + timedelta(days=3),
    )
    booking.unit = None
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    conversation = _make_conversation()
    message = _make_message()
    _patch_process_scheduled_mocks(fake_session, monkeypatch, [booking], guest, conversation, message)
    count = await messages_services.process_scheduled_messages(fake_session)
    assert count == 0


def _patch_process_scheduled_mocks(fake_session, monkeypatch, bookings, guest, conversation, message):
    mock_result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = bookings
    mock_result.scalars.return_value = scalars_mock
    fake_session.execute = AsyncMock(return_value=mock_result)
    fake_session.get = AsyncMock(return_value=guest)
    monkeypatch.setattr(
        messages_repository, "get_conversation_by_booking", AsyncMock(return_value=conversation)
    )
    monkeypatch.setattr(
        messages_repository, "get_or_create_conversation_for_booking", AsyncMock(return_value=conversation)
    )
    monkeypatch.setattr(
        messages_services, "send_automated_message", AsyncMock(return_value=message)
    )


# ============================================================
# ROUTER COVERAGE
# ============================================================

def test_get_conversations_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "list_conversations",
        AsyncMock(return_value=[_make_conversation_list_item()]),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/conversations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_unread_count_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "get_unread_count",
        AsyncMock(return_value=message_schemas.UnreadCountResponse(total_unread=5)),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/conversations/unread",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["total_unread"] == 5


def test_get_conversation_detail_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "get_conversation_detail",
        AsyncMock(return_value=_make_conversation_detail_response()),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/conversations/conv-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "conv-1"


def test_get_messages_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "list_messages",
        AsyncMock(return_value=[_make_message_response()]),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/conversations/conv-1/messages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_post_message_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "send_message",
        AsyncMock(return_value=_make_message_response()),
    )
    token = _token_for(user)
    response = messages_client.post(
        "/api/v1/messages/conversations/conv-1/messages",
        json={"content": "Hello host"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Hello"


def test_post_mark_read_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "mark_conversation_read",
        AsyncMock(),
    )
    token = _token_for(user)
    response = messages_client.post(
        "/api/v1/messages/conversations/conv-1/read",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_conversation_for_booking_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "get_conversation_for_booking",
        AsyncMock(return_value=_make_conversation_response()),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/bookings/booking-1/conversation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "conv-1"


def test_get_message_templates_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="guest-1", role=UserRole.GUEST)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "list_message_templates",
        AsyncMock(return_value=[_make_message_template_response()]),
    )
    token = _token_for(user)
    response = messages_client.get(
        "/api/v1/messages/templates?locale=en",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_post_automated_message_route(messages_client, monkeypatch) -> None:
    user = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services, "send_automated_message",
        AsyncMock(return_value=_make_message_response()),
    )
    token = _token_for(user)
    response = messages_client.post(
        "/api/v1/messages/conversations/conv-1/automated",
        json={"template_key": "booking_confirmed", "variables": {"property_name": "Villa"}},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


# ============================================================
# TASKS COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_run_process_scheduled_messages_lock_acquired(fake_session: AsyncMock, monkeypatch) -> None:
    redis_client = AsyncMock()
    redis_client.set = AsyncMock(return_value=True)
    redis_client.delete = AsyncMock()
    monkeypatch.setattr(messages_tasks.redis_state, "redis_client", redis_client)
    fake_session.begin = MagicMock(return_value=_FakeBeginCM())
    monkeypatch.setattr(messages_tasks, "AsyncSessionLocal", _fake_session_cm_factory(fake_session))
    monkeypatch.setattr(messages_services, "process_scheduled_messages", AsyncMock(return_value=7))
    result = await messages_tasks._run_process_scheduled_messages()
    assert result == 7
    redis_client.set.assert_awaited_once()
    redis_client.delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_process_scheduled_messages_lock_not_acquired(fake_session: AsyncMock, monkeypatch) -> None:
    redis_client = AsyncMock()
    redis_client.set = AsyncMock(return_value=False)
    redis_client.delete = AsyncMock()
    monkeypatch.setattr(messages_tasks.redis_state, "redis_client", redis_client)
    fake_session.begin = MagicMock(return_value=_FakeBeginCM())
    monkeypatch.setattr(messages_tasks, "AsyncSessionLocal", _fake_session_cm_factory(fake_session))
    result = await messages_tasks._run_process_scheduled_messages()
    assert result == 0
    redis_client.delete.assert_not_awaited()


@pytest.mark.asyncio
async def test_run_process_scheduled_messages_releases_lock_on_error(fake_session: AsyncMock, monkeypatch) -> None:
    redis_client = AsyncMock()
    redis_client.set = AsyncMock(return_value=True)
    redis_client.delete = AsyncMock()
    monkeypatch.setattr(messages_tasks.redis_state, "redis_client", redis_client)
    fake_session.begin = MagicMock(return_value=_FakeBeginCM())
    monkeypatch.setattr(messages_tasks, "AsyncSessionLocal", _fake_session_cm_factory(fake_session))
    monkeypatch.setattr(messages_services, "process_scheduled_messages", AsyncMock(side_effect=RuntimeError("boom")))
    with pytest.raises(RuntimeError):
        await messages_tasks._run_process_scheduled_messages()
    redis_client.delete.assert_awaited_once()


def test_process_scheduled_messages_task_runs(monkeypatch) -> None:
    async def _fake_run():
        return 5

    monkeypatch.setattr(messages_tasks, "_run_process_scheduled_messages", _fake_run)
    result = messages_tasks.process_scheduled_messages.run()
    assert result == 5


def test_render_quick_reply_unknown_template_raises() -> None:
    with pytest.raises(ValueError):
        message_templates.render_quick_reply("unknown_key", "ar", {})


# ============================================================
# SERVICES & ROUTER EXCEPTION COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_get_conversation_detail_success(fake_session: AsyncMock, monkeypatch) -> None:
    conversation = _make_conversation()
    message = _make_message()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        messages_repository,
        "list_messages_for_conversation",
        AsyncMock(return_value=[message]),
    )
    user = _make_user()
    result = await messages_services.get_conversation_detail(fake_session, user, conversation.id)
    assert result.id == conversation.id


@pytest.mark.asyncio
async def test_list_messages_success(fake_session: AsyncMock, monkeypatch) -> None:
    message = _make_message()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=_make_conversation()),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        messages_repository,
        "list_messages_for_conversation",
        AsyncMock(return_value=[message]),
    )
    user = _make_user()
    result = await messages_services.list_messages(fake_session, user, "conv-1")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_mark_conversation_read_success(fake_session: AsyncMock, monkeypatch) -> None:
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_id_or_raise",
        AsyncMock(return_value=_make_conversation()),
    )
    monkeypatch.setattr(
        messages_repository,
        "is_conversation_participant",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        messages_repository,
        "mark_conversation_read",
        AsyncMock(),
    )
    user = _make_user()
    await messages_services.mark_conversation_read(fake_session, user, "conv-1")
    messages_repository.mark_conversation_read.assert_awaited_once()


@pytest.mark.asyncio
async def test_send_booking_confirmed_creates_conversation(fake_session: AsyncMock, monkeypatch) -> None:
    booking = _make_process_booking(
        BookingStatus.CONFIRMED,
        datetime.now(UTC).date(),
        datetime.now(UTC).date() + timedelta(days=2),
    )
    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_booking",
        AsyncMock(side_effect=[None, conversation]),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_services,
        "send_automated_message",
        AsyncMock(return_value=_make_message()),
    )
    await messages_services.send_booking_confirmed(fake_session, booking, booking.unit.listing, "host-1")
    messages_repository.get_or_create_conversation_for_booking.assert_awaited_once()


@pytest.mark.asyncio
async def test_process_scheduled_messages_creates_conversation(fake_session: AsyncMock, monkeypatch) -> None:
    today = datetime.now(UTC).date()
    booking = _make_process_booking(
        BookingStatus.CONFIRMED,
        today,
        today + timedelta(days=2),
    )
    conversation = _make_conversation()
    monkeypatch.setattr(
        messages_repository,
        "get_conversation_by_booking",
        AsyncMock(side_effect=[None, conversation]),
    )
    monkeypatch.setattr(
        messages_repository,
        "get_or_create_conversation_for_booking",
        AsyncMock(return_value=conversation),
    )
    monkeypatch.setattr(
        messages_services,
        "send_automated_message",
        AsyncMock(return_value=_make_message()),
    )
    guest = _make_user()
    session_get_mock = AsyncMock(return_value=guest)
    fake_session.get = session_get_mock
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [booking]
    fake_session.execute = AsyncMock(return_value=mock_result)
    await messages_services.process_scheduled_messages(fake_session)
    messages_repository.get_or_create_conversation_for_booking.assert_awaited()


# router exception branches
def _assert_route_returns_404(messages_client, monkeypatch, route_func_name, method, url, json=None, role=UserRole.GUEST):
    user = _make_user(role=role)
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        messages_router.messages_services,
        route_func_name,
        AsyncMock(side_effect=NotFoundError("missing")),
    )
    token = _token_for(user)
    caller = getattr(messages_client, method)
    kwargs = {"headers": {"Authorization": f"Bearer {token}"}}
    if json is not None:
        kwargs["json"] = json
    response = caller(url, **kwargs)
    assert response.status_code == 404


def test_get_conversations_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client, monkeypatch, "list_conversations", "get", "/api/v1/messages/conversations"
    )


def test_get_unread_count_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client, monkeypatch, "get_unread_count", "get", "/api/v1/messages/conversations/unread"
    )


def test_get_conversation_detail_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client, monkeypatch, "get_conversation_detail", "get", "/api/v1/messages/conversations/conv-1"
    )


def test_get_messages_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client, monkeypatch, "list_messages", "get", "/api/v1/messages/conversations/conv-1/messages"
    )


def test_post_message_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client,
        monkeypatch,
        "send_message",
        "post",
        "/api/v1/messages/conversations/conv-1/messages",
        json={"content": "hi"},
    )


def test_post_mark_read_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client,
        monkeypatch,
        "mark_conversation_read",
        "post",
        "/api/v1/messages/conversations/conv-1/read",
        json={},
    )


def test_get_conversation_for_booking_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client,
        monkeypatch,
        "get_conversation_for_booking",
        "get",
        "/api/v1/messages/bookings/booking-1/conversation",
    )


def test_get_message_templates_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client,
        monkeypatch,
        "list_message_templates",
        "get",
        "/api/v1/messages/templates",
    )


def test_post_automated_message_route_not_found(messages_client, monkeypatch) -> None:
    _assert_route_returns_404(
        messages_client,
        monkeypatch,
        "send_automated_message",
        "post",
        "/api/v1/messages/conversations/conv-1/automated",
        json={"template_key": "welcome", "variables": {}},
        role=UserRole.ADMIN,
    )
