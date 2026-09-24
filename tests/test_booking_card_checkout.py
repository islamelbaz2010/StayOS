"""Regression tests for the manual-acceptance fix batch.

Covers: Paymob hosted checkout on the canonical booking payment path
(session creation, provider confirmation/failure, webhook resolution),
phone-OTP password recovery, and the profile-avatar upload contract.
"""

import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.auth import repository as auth_repository
from app.auth import schemas as auth_schemas
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.database import get_session
from app.main import app
from app.payments import repository as payments_repository
from app.payments import services as payment_services
from app.payments.constants import PaymentMethod, PaymentStatus
from app.payments.models import Payment
from app.shared.exceptions import (
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+201000000001",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_booking(guest: User) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=str(uuid.uuid4()),
        guest_id=guest.id,
        status=str(BookingStatus.ACCEPTED),
        check_in=date(2026, 10, 1),
        check_out=date(2026, 10, 4),
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        accepted_at=now,
        created_at=now,
        updated_at=now,
    )


def _make_payment(
    booking: Booking,
    guest: User,
    status: PaymentStatus = PaymentStatus.PENDING,
    provider: str | None = None,
) -> Payment:
    now = datetime.now(UTC)
    return Payment(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        guest_id=guest.id,
        host_id=str(uuid.uuid4()),
        unit_id=booking.unit_id,
        status=str(status),
        method=str(PaymentMethod.MANUAL),
        amount_egp=2050,
        nights=3,
        reference_number="STY-ABCDEFGH",
        provider=provider,
        provider_ref=None,
        transaction_ref=None,
        checkout_url=None,
        provider_metadata=None,
        instructions="Transfer instructions",
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


# ---------------------------------------------------------------------------
# Card checkout session
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_checkout_session_stores_provider_refs(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest)
    monkeypatch.setattr(
        payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    updated: dict[str, object] = {}

    async def _update(session, p, **kwargs):
        updated.update(kwargs)
        for k, v in kwargs.items():
            setattr(p, k, v)
        return p

    monkeypatch.setattr(
        payments_repository, "update_payment", AsyncMock(side_effect=_update)
    )
    create_paymob = AsyncMock(
        return_value={
            "provider": "paymob",
            "order_id": "paymob-order-1",
            "payment_token": "tok-1",
            "iframe_url": "https://accept.paymob.com/iframes/1?payment_token=tok-1",
        }
    )
    monkeypatch.setattr(
        "app.finance.providers.create_paymob_payment", create_paymob
    )

    response = await payment_services.create_card_checkout_session(
        fake_session, guest, payment.id
    )

    # Server-authoritative amount — never client input. No WEB_BASE_URL in
    # the test env → no per-intention redirection override.
    create_paymob.assert_awaited_once_with(
        booking.id, 2050, redirection_url=None
    )
    assert updated["provider"] == "paymob"
    assert updated["provider_ref"] == "paymob-order-1"
    assert "paymob.com" in updated["checkout_url"]
    assert response.checkout_url == updated["checkout_url"]


@pytest.mark.asyncio
async def test_checkout_session_only_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    other = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest)
    monkeypatch.setattr(
        payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(AuthorizationError):
        await payment_services.create_card_checkout_session(
            fake_session, other, payment.id
        )


@pytest.mark.asyncio
async def test_checkout_session_rejects_verified_payment(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest, status=PaymentStatus.VERIFIED)
    monkeypatch.setattr(
        payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(ValidationError):
        await payment_services.create_card_checkout_session(
            fake_session, guest, payment.id
        )


@pytest.mark.asyncio
async def test_checkout_session_provider_failure_fails_closed(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest)
    monkeypatch.setattr(
        payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        "app.finance.providers.create_paymob_payment",
        AsyncMock(side_effect=Exception("paymob down")),
    )
    with pytest.raises(ServiceUnavailableError):
        await payment_services.create_card_checkout_session(
            fake_session, guest, payment.id
        )


# ---------------------------------------------------------------------------
# Provider confirmation / failure on the booking payment
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_confirm_payment_by_provider_confirms_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest, provider="paymob")
    monkeypatch.setattr(
        payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )

    async def _update(session, p, **kwargs):
        for k, v in kwargs.items():
            setattr(p, k, v)
        return p

    monkeypatch.setattr(
        payments_repository,
        "update_payment",
        AsyncMock(side_effect=_update),
    )
    monkeypatch.setattr(
        bookings_repository,
        "get_booking",
        AsyncMock(return_value=booking),
    )
    booking_update = AsyncMock(side_effect=lambda s, b, **kw: b)
    monkeypatch.setattr(
        bookings_repository, "update_booking", booking_update
    )
    fake_session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: guest)
    )
    outbox = AsyncMock()
    monkeypatch.setattr(payment_services, "_emit_outbox_event", outbox)

    applied = await payment_services.confirm_payment_by_provider(
        fake_session, booking.id, "paymob-txn-1", 2050
    )

    assert applied is True
    assert payment.status == str(PaymentStatus.VERIFIED)
    assert payment.transaction_ref == "paymob-txn-1"
    booking_update.assert_awaited_once()
    assert booking_update.await_args.kwargs["status"] == BookingStatus.CONFIRMED
    event_types = [c.kwargs["event_type"] for c in outbox.await_args_list]
    assert "payment.verified" in event_types
    assert "booking.payment_confirmed" in event_types


@pytest.mark.asyncio
async def test_confirm_payment_by_provider_amount_mismatch(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest, provider="paymob")
    monkeypatch.setattr(
        payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )
    with pytest.raises(ValidationError):
        await payment_services.confirm_payment_by_provider(
            fake_session, booking.id, "paymob-txn-1", 9999
        )


@pytest.mark.asyncio
async def test_confirm_payment_by_provider_idempotent(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(
        booking, guest, status=PaymentStatus.VERIFIED, provider="paymob"
    )
    monkeypatch.setattr(
        payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )
    applied = await payment_services.confirm_payment_by_provider(
        fake_session, booking.id, "paymob-txn-1", 2050
    )
    assert applied is True


@pytest.mark.asyncio
async def test_confirm_payment_by_provider_not_a_card_payment(
    fake_session: AsyncMock, monkeypatch
) -> None:
    # A manual-proof payment must never be confirmed by a provider callback.
    monkeypatch.setattr(
        payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    assert (
        await payment_services.confirm_payment_by_provider(
            fake_session, "booking-x", "ref", 100
        )
        is False
    )


@pytest.mark.asyncio
async def test_fail_payment_by_provider_keeps_pending(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest, provider="paymob")
    monkeypatch.setattr(
        payments_repository,
        "get_payment_by_booking",
        AsyncMock(return_value=payment),
    )
    async def _update(session, p, **kwargs):
        for k, v in kwargs.items():
            setattr(p, k, v)
        return p

    monkeypatch.setattr(
        payments_repository,
        "update_payment",
        AsyncMock(side_effect=_update),
    )

    applied = await payment_services.fail_payment_by_provider(
        fake_session, booking.id, "paymob-txn-1", "declined"
    )

    assert applied is True
    # A declined card never cancels the accepted booking — stays PENDING.
    assert payment.status == str(PaymentStatus.PENDING)
    assert payment.provider_metadata["last_failure"]["reason"] == "declined"


# ---------------------------------------------------------------------------
# Webhook resolution: merchant order id = booking id
# ---------------------------------------------------------------------------


def test_paymob_webhook_resolves_booking_payment(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    booking_id = str(uuid.uuid4())
    provider_ref = f"paymob-txn-{booking_id}"
    payload = {
        "reservation_id": booking_id,
        "order": provider_ref,
        "success": "true",
        "amount_cents": 205000,
    }

    monkeypatch.setattr(
        finance_providers, "verify_paymob_hmac", lambda p, s: True
    )
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        reservations_services,
        "confirm_reservation_by_provider",
        AsyncMock(side_effect=NotFoundError("Reservation not found")),
    )
    confirm_payment = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.payments.services.confirm_payment_by_provider", confirm_payment
    )

    app.dependency_overrides[get_session] = _make_get_session_override(
        fake_session
    )
    try:
        with TestClient(app) as test_client:
            response = test_client.post(
                "/api/v1/finance/webhooks/paymob",
                json=payload,
                headers={"x-paymob-hmac": "sig"},
            )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 200
    assert response.json()["message"] == "processed"
    confirm_payment.assert_awaited_once()


def test_paymob_webhook_booking_failure_path(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    booking_id = str(uuid.uuid4())
    payload = {
        "reservation_id": booking_id,
        "order": "order-1",
        "success": "false",
    }

    monkeypatch.setattr(
        finance_providers, "verify_paymob_hmac", lambda p, s: True
    )
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    # Reservation miss returns None → falls through to the booking payment.
    monkeypatch.setattr(
        reservations_services,
        "fail_reservation_by_provider",
        AsyncMock(return_value=None),
    )
    fail_payment = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.payments.services.fail_payment_by_provider", fail_payment
    )

    app.dependency_overrides[get_session] = _make_get_session_override(
        fake_session
    )
    try:
        with TestClient(app) as test_client:
            response = test_client.post(
                "/api/v1/finance/webhooks/paymob",
                json=payload,
                headers={"x-paymob-hmac": "sig"},
            )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 200
    assert response.json()["message"] == "failed"
    fail_payment.assert_awaited_once()


# ---------------------------------------------------------------------------
# Password recovery (phone OTP)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_password_forgot_unknown_identifier_silent(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """No user enumeration: unknown identifiers return silently."""
    monkeypatch.setattr(
        auth_repository, "get_user_by_email", AsyncMock(return_value=None)
    )
    send_otp = AsyncMock()
    monkeypatch.setattr(auth_services, "send_otp", send_otp)

    await auth_services.request_password_reset(
        fake_session,
        auth_schemas.PasswordForgotRequest(identifier="nobody@example.com"),
    )
    send_otp.assert_not_awaited()


@pytest.mark.asyncio
async def test_password_forgot_sends_otp_to_phone_on_file(
    fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        auth_repository, "get_user_by_email", AsyncMock(return_value=user)
    )
    send_otp = AsyncMock()
    monkeypatch.setattr(auth_services, "send_otp", send_otp)

    await auth_services.request_password_reset(
        fake_session,
        auth_schemas.PasswordForgotRequest(identifier="User@Example.com"),
    )
    send_otp.assert_awaited_once()
    assert send_otp.await_args.args[0].phone_number == user.phone_number


@pytest.mark.asyncio
async def test_password_reset_rejects_bad_code(
    fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user()
    monkeypatch.setattr(
        auth_repository, "get_user_by_email", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        auth_services, "verify_otp", AsyncMock(return_value=False)
    )
    with pytest.raises(AuthenticationError):
        await auth_services.reset_password(
            fake_session,
            auth_schemas.PasswordResetRequest(
                identifier="user@example.com",
                code="000000",
                new_password="newpass123",
            ),
        )


@pytest.mark.asyncio
async def test_password_reset_rotates_password_and_revokes_sessions(
    fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user()
    token = MagicMock(revoked_at=None)
    monkeypatch.setattr(
        auth_repository, "get_user_by_email", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        auth_services, "verify_otp", AsyncMock(return_value=True)
    )
    update_user = AsyncMock()
    monkeypatch.setattr(auth_repository, "update_user", update_user)
    fake_session.execute = AsyncMock(
        return_value=MagicMock(
            scalars=lambda: MagicMock(all=lambda: [token])
        )
    )

    await auth_services.reset_password(
        fake_session,
        auth_schemas.PasswordResetRequest(
            identifier="user@example.com",
            code="123456",
            new_password="newpass123",
        ),
    )

    assert update_user.await_args.kwargs["password_hash"]
    assert token.revoked_at is not None


# ---------------------------------------------------------------------------
# Avatar upload contract
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_avatar_presign_fails_closed_without_s3(
    fake_session: AsyncMock, monkeypatch
) -> None:
    monkeypatch.setattr(auth_services.settings, "S3_LISTINGS_BUCKET", "")
    with pytest.raises(ServiceUnavailableError):
        await auth_services.presign_avatar_upload(
            _make_user(),
            auth_schemas.AvatarPresignRequest(
                filename="me.jpg", content_type="image/jpeg"
            ),
        )


@pytest.mark.asyncio
async def test_avatar_presign_rejects_non_image(
    fake_session: AsyncMock,
) -> None:
    with pytest.raises(ValidationError):
        await auth_services.presign_avatar_upload(
            _make_user(),
            auth_schemas.AvatarPresignRequest(
                filename="doc.pdf", content_type="application/pdf"
            ),
        )


@pytest.mark.asyncio
async def test_avatar_confirm_scoped_to_user(
    fake_session: AsyncMock, monkeypatch
) -> None:
    user = _make_user()
    update_user = AsyncMock()
    monkeypatch.setattr(auth_repository, "update_user", update_user)

    # Another user's key must be rejected.
    with pytest.raises(ValidationError):
        await auth_services.confirm_avatar(
            fake_session,
            user,
            auth_schemas.AvatarConfirmRequest(
                s3_key="avatars/other-user/avatar_1.jpg"
            ),
        )
    update_user.assert_not_awaited()

    await auth_services.confirm_avatar(
        fake_session,
        user,
        auth_schemas.AvatarConfirmRequest(
            s3_key=f"avatars/{user.id}/avatar_1.jpg"
        ),
    )
    assert update_user.await_args.kwargs["avatar_s3_key"].startswith(
        f"avatars/{user.id}/"
    )


def test_avatar_url_none_without_key() -> None:
    user = _make_user()
    user.avatar_s3_key = None
    assert auth_services.avatar_url(user) is None

    user.avatar_s3_key = "avatars/x/avatar_1.jpg"
    url = auth_services.avatar_url(user)
    assert url is None or url.endswith("avatars/x/avatar_1.jpg")


# ---------------------------------------------------------------------------
# Paymob return-to-checkout (redirection_url)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_checkout_session_builds_paymob_return_url(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """With WEB_BASE_URL configured, the intention carries a redirection_url
    back to the StayOS checkout page (navigation only — webhook stays
    authoritative)."""
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest)
    monkeypatch.setattr(
        payments_repository,
        "get_payment_or_raise",
        AsyncMock(return_value=payment),
    )
    monkeypatch.setattr(
        payments_repository,
        "update_payment",
        AsyncMock(side_effect=lambda s, p, **kw: p),
    )
    create_paymob = AsyncMock(
        return_value={
            "provider": "paymob",
            "order_id": "paymob-order-1",
            "payment_token": "tok-1",
            "iframe_url": "https://accept.paymob.com/x",
        }
    )
    monkeypatch.setattr(
        "app.finance.providers.create_paymob_payment", create_paymob
    )
    monkeypatch.setattr(
        payment_services.settings, "WEB_BASE_URL", "https://app.stayos.com/"
    )

    await payment_services.create_card_checkout_session(
        fake_session, guest, payment.id
    )

    redirect = create_paymob.await_args.kwargs["redirection_url"]
    assert redirect == (
        f"https://app.stayos.com/checkout/{booking.id}?from=paymob"
    )


@pytest.mark.asyncio
async def test_paymob_intention_sends_redirection_url(monkeypatch) -> None:
    """The intention payload includes redirection_url when provided."""
    from app.finance import providers

    monkeypatch.setattr(providers.settings, "ENVIRONMENT", "staging")
    monkeypatch.setattr(
        providers.settings, "PAYMOB_SECRET_KEY", "egy_sk_test_abc"
    )
    monkeypatch.setattr(providers.settings, "PAYMOB_INTEGRATION_ID", 123)
    monkeypatch.setattr(providers.settings, "PAYMOB_PUBLIC_KEY", "")
    monkeypatch.setattr(providers.settings, "PAYMOB_NOTIFICATION_URL", "")

    posted: dict[str, object] = {}

    async def _post(payload):
        posted.update(payload)
        return {"id": "int-1", "client_secret": "sec-1"}

    monkeypatch.setattr(providers, "_paymob_intention_post", _post)

    await providers.paymob_create_intention(
        "booking-1",
        2050,
        redirection_url="https://app.stayos.com/checkout/booking-1?from=paymob",
    )

    assert posted["redirection_url"] == (
        "https://app.stayos.com/checkout/booking-1?from=paymob"
    )
    assert posted["special_reference"] == "booking-1"
    assert posted["amount"] == 205000


# ---------------------------------------------------------------------------
# Payout state derivation (escrow lifecycle → payout status)
# ---------------------------------------------------------------------------


def _make_escrow(status: str, hold_until=None, released_at=None):
    from app.finance.models import EscrowAccount

    return EscrowAccount(
        id=str(uuid.uuid4()),
        reservation_id=str(uuid.uuid4()),
        host_id=str(uuid.uuid4()),
        amount_egp=2050,
        status=status,
        hold_until=hold_until,
        released_at=released_at,
    )


def test_derive_payout_state_none() -> None:
    from app.finance import services as finance_services

    assert finance_services.derive_payout_state(None) is None


def test_derive_payout_state_lifecycle() -> None:
    from app.finance import services as finance_services
    from app.finance.constants import EscrowStatus

    now = datetime.now(UTC)

    created = _make_escrow(EscrowStatus.CREATED)
    state = finance_services.derive_payout_state(created, now)
    assert state["payout_status"] == "waiting_checkin"
    assert state["funds_held_egp"] == 2050

    from datetime import timedelta

    held = _make_escrow(EscrowStatus.HELD, hold_until=now + timedelta(hours=5))
    assert finance_services.derive_payout_state(held, now)[
        "payout_status"
    ] == "held"

    ready = _make_escrow(EscrowStatus.HELD, hold_until=now - timedelta(hours=1))
    ready_state = finance_services.derive_payout_state(ready, now)
    assert ready_state["payout_status"] == "ready"
    assert ready_state["expected_payout_at"] is not None

    released = _make_escrow(EscrowStatus.RELEASED, released_at=now)
    released_state = finance_services.derive_payout_state(released, now)
    assert released_state["payout_status"] == "paid"
    assert released_state["paid_at"] is not None
    assert released_state["funds_held_egp"] is None

    refunded = _make_escrow(EscrowStatus.REFUNDED)
    assert finance_services.derive_payout_state(refunded, now)[
        "payout_status"
    ] == "refunded"


# ---------------------------------------------------------------------------
# Host earnings fields on the payment activity list
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_host_payments_attach_earnings(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import services as finance_services
    from app.finance import commercial

    host = _make_user(role=UserRole.HOST)
    guest = _make_user()
    booking = _make_booking(guest)
    payment = _make_payment(booking, guest)
    payment.host_id = host.id
    payment.accommodation_amount_egp = 2000
    payment.cleaning_fee_egp = 50
    escrow = _make_escrow("held", hold_until=datetime.now(UTC))
    escrow.reservation_id = booking.id  # escrow keys off booking.id

    monkeypatch.setattr(
        payments_repository,
        "list_host_payments",
        AsyncMock(return_value=[payment]),
    )

    escrow_result = MagicMock()
    escrow_result.scalars.return_value.all.return_value = [escrow]
    fake_session.execute = AsyncMock(return_value=escrow_result)

    monkeypatch.setattr(
        finance_services,
        "booking_economics",
        AsyncMock(
            return_value=(
                commercial.compute_booking_economics(1950, 50),
                False,
            )
        ),
    )

    items = await payment_services.list_host_payments(fake_session, host)

    item = items[0]
    assert item.amount_egp == 2050
    assert item.host_net_egp == 2000 - round(1950 * 0.12)  # 2000 - 234
    assert item.platform_fee_egp == round(1950 * 0.12)
    assert item.platform_share_waived is False
    assert item.funds_status == "held"
    assert item.funds_held_egp == 2050
    assert item.payout_status == "ready"


# ---------------------------------------------------------------------------
# Storage errors must not leak infrastructure detail
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_storage_error_message_is_sanitized(monkeypatch) -> None:
    monkeypatch.setattr(
        payment_services.settings, "S3_PAYMENT_PROOF_BUCKET", ""
    )
    with pytest.raises(ServiceUnavailableError) as exc_info:
        payment_services._require_storage_config()
    message = str(exc_info.value)
    assert "S3_" not in message
    assert "AWS_" not in message
    assert "temporarily unavailable" in message
