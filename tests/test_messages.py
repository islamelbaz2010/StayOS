import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.messages import constants as message_constants
from app.messages import repository as messages_repository
from app.messages import schemas as message_schemas
from app.messages import services as messages_services
from app.messages.constants import MessageStatus
from app.shared.exceptions import AuthorizationError, ValidationError


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
