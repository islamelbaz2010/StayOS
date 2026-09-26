import hmac
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.database import get_session
from app.finance import providers
from app.finance import services as finance_services
from app.finance.constants import (
    EscrowStatus,
    LedgerAccount,
    PayoutStatus,
    TransactionStatus,
    TransactionType,
    WalletType,
)
from app.finance.models import EscrowAccount, FinancialTransaction, PayoutRequest, Wallet
from app.main import app
from app.shared.exceptions import PaymentError
from fastapi.testclient import TestClient


class _FakeResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return

    def json(self) -> dict[str, object]:
        return self._payload


class _FakeClient:
    responses: list[_FakeResponse] = []

    async def __aenter__(self) -> "_FakeClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, *args: object, **kwargs: object) -> _FakeResponse:
        return self.responses.pop(0)


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.HOST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def finance_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _make_reservation(
    reservation_id: str | None = None,
    host_id: str | None = None,
    total: int = 4500,
    host_amount: int = 3800,
) -> MagicMock:
    reservation = MagicMock()
    reservation.id = reservation_id or str(uuid.uuid4())
    reservation.unit_id = str(uuid.uuid4())
    reservation.guest_id = str(uuid.uuid4())
    reservation.total_amount_egp = total
    reservation.host_amount_egp = host_amount
    reservation.guest_fee_egp = 500
    reservation.platform_fee_egp = 200
    return reservation


def _make_wallet(
    wallet_id: str | None = None,
    owner_id: str | None = None,
    wallet_type: WalletType = WalletType.HOST,
) -> Wallet:
    return Wallet(
        id=wallet_id or str(uuid.uuid4()),
        wallet_type=str(wallet_type),
        owner_id=owner_id,
        currency="EGP",
        balance_egp=0,
        available_balance_egp=0,
    )


def _make_escrow(
    escrow_id: str | None = None,
    reservation_id: str | None = None,
    host_id: str | None = None,
    amount: int = 4500,
    status: str = EscrowStatus.CREATED,
) -> EscrowAccount:
    now = datetime.now(UTC)
    return EscrowAccount(
        id=escrow_id or str(uuid.uuid4()),
        reservation_id=reservation_id or str(uuid.uuid4()),
        host_id=host_id or str(uuid.uuid4()),
        amount_egp=amount,
        status=status,
        created_at=now,
        updated_at=now,
    )


def _make_transaction(
    tx_id: str | None = None,
    transaction_type: TransactionType = TransactionType.ESCROW_CREATE,
) -> FinancialTransaction:
    now = datetime.now(UTC)
    return FinancialTransaction(
        id=tx_id or str(uuid.uuid4()),
        transaction_type=str(transaction_type),
        amount_egp=4500,
        status=TransactionStatus.COMPLETED,
        created_at=now,
        updated_at=now,
    )


def _make_payout(
    payout_id: str | None = None,
    wallet_id: str | None = None,
    host_id: str | None = None,
    amount: int = 1000,
) -> PayoutRequest:
    now = datetime.now(UTC)
    return PayoutRequest(
        id=payout_id or str(uuid.uuid4()),
        wallet_id=wallet_id or str(uuid.uuid4()),
        host_id=host_id or str(uuid.uuid4()),
        amount_egp=amount,
        status=PayoutStatus.PENDING,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_create_ledger_entry_updates_wallet_balance(fake_session: AsyncMock) -> None:
    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    tx = _make_transaction()
    entry = await finance_repository.create_ledger_entry(
        fake_session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type="liability",
        entry_type="credit",
        amount_egp=500,
        wallet=wallet,
        description="test",
    )
    assert entry.balance_after == 500
    assert wallet.balance_egp == 500


@pytest.mark.asyncio
async def test_handle_payment_confirmed_creates_escrow(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    escrow = _make_escrow()
    tx = _make_transaction()

    monkeypatch.setattr(
        finance_repository, "get_or_create_wallet", AsyncMock(return_value=wallet)
    )
    monkeypatch.setattr(
        finance_repository, "get_escrow_by_reservation", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        finance_repository, "create_escrow_account", AsyncMock(return_value=escrow)
    )
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", AsyncMock(return_value=MagicMock())
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())

    reservation_id = str(uuid.uuid4())
    host_id = str(uuid.uuid4())
    payload = {
        "reservation_id": reservation_id,
        "host_id": host_id,
        "amount_egp": 4500,
        "host_amount_egp": 3800,
        "provider": "paymob",
    }

    result = await finance_services.handle_payment_confirmed(fake_session, payload)
    assert result == escrow
    finance_repository.create_escrow_account.assert_awaited_once()
    finance_repository.create_financial_transaction.assert_awaited_once()
    assert finance_repository.create_ledger_entry.await_count == 2


@pytest.mark.asyncio
async def test_handle_payment_confirmed_is_idempotent(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository

    existing_tx = _make_transaction()
    escrow = _make_escrow()

    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=existing_tx),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_escrow_by_reservation",
        AsyncMock(return_value=escrow),
    )

    payload = {
        "reservation_id": escrow.reservation_id,
        "host_id": escrow.host_id,
        "amount_egp": 4500,
        "host_amount_egp": 3800,
    }
    result = await finance_services.handle_payment_confirmed(fake_session, payload)
    assert result == escrow


@pytest.mark.asyncio
async def test_handle_payment_confirmed_normalizes_json_float_amounts(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: outbox payloads serialize Decimal as float, so ledger
    entry amounts arrived as floats and crashed Numeric column arithmetic
    (Decimal + float TypeError) — leaving every payment_confirmed event
    unprocessed. Amounts must be re-normalized at the consumer boundary."""
    from decimal import Decimal

    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    escrow = _make_escrow()
    tx = _make_transaction()

    monkeypatch.setattr(
        finance_repository, "get_or_create_wallet", AsyncMock(return_value=wallet)
    )
    monkeypatch.setattr(
        finance_repository, "get_escrow_by_reservation", AsyncMock(return_value=None)
    )
    create_escrow = AsyncMock(return_value=escrow)
    monkeypatch.setattr(finance_repository, "create_escrow_account", create_escrow)
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    entry_amounts: list[object] = []

    async def _entry(session, **kwargs):
        entry_amounts.append(kwargs["amount_egp"])
        return MagicMock()

    monkeypatch.setattr(finance_repository, "create_ledger_entry", _entry)
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())

    payload = {
        "reservation_id": str(uuid.uuid4()),
        "host_id": str(uuid.uuid4()),
        "amount_egp": 991.8,
        "host_amount_egp": 780.0,
        "vat_egp": 121.8,
        "provider": "paymob",
    }

    await finance_services.handle_payment_confirmed(fake_session, payload)

    assert entry_amounts == [Decimal("991.80"), Decimal("991.80")]
    assert all(isinstance(amount, Decimal) for amount in entry_amounts)
    assert create_escrow.await_args.args[3] == Decimal("991.80")


@pytest.mark.asyncio
async def test_handle_checkin_event_schedules_release(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository

    escrow = _make_escrow()
    monkeypatch.setattr(
        finance_repository,
        "get_escrow_by_reservation",
        AsyncMock(return_value=escrow),
    )
    send_task_mock = MagicMock()
    monkeypatch.setattr("app.finance.services.celery_app.send_task", send_task_mock)

    checked_in_at = datetime.now(UTC).isoformat()
    payload = {
        "reservation_id": escrow.reservation_id,
        "host_id": escrow.host_id,
        "checked_in_at": checked_in_at,
    }

    await finance_services.handle_checkin_event(fake_session, payload)
    assert escrow.status == EscrowStatus.HELD
    assert escrow.hold_until is not None
    send_task_mock.assert_called_once()


@pytest.mark.asyncio
async def test_release_escrow(fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import repository as finance_repository
    from app.reservations import repository as reservations_repository

    escrow = _make_escrow(status=EscrowStatus.HELD)
    host_wallet = _make_wallet()
    tx = _make_transaction(transaction_type=TransactionType.ESCROW_RELEASE)

    monkeypatch.setattr(
        finance_repository, "get_escrow_by_id", AsyncMock(return_value=escrow)
    )
    monkeypatch.setattr(
        reservations_repository,
        "get_reservation_with_relations",
        AsyncMock(return_value=_make_reservation(host_id=escrow.host_id)),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(side_effect=[_make_wallet(wallet_type="platform"), host_wallet]),
    )
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", AsyncMock(return_value=MagicMock())
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())

    await finance_services.release_escrow(fake_session, escrow.id, force=True)
    assert escrow.status == EscrowStatus.RELEASED
    assert escrow.released_at is not None
    finance_repository.create_financial_transaction.assert_awaited_once()
    # ESCROW debit + HOST_PAYABLE + PLATFORM_REVENUE (net) + VAT_PAYABLE —
    # the platform share posts as net revenue and VAT liability, not gross.
    calls = finance_repository.create_ledger_entry.await_args_list
    accounts = {c.kwargs["ledger_account"] for c in calls}
    assert len(calls) == 4
    assert LedgerAccount.VAT_PAYABLE in accounts
    assert LedgerAccount.PLATFORM_REVENUE in accounts


@pytest.mark.asyncio
async def test_handle_cancel_event_refund(fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import repository as finance_repository

    escrow = _make_escrow()
    platform_wallet = _make_wallet(wallet_type="platform")
    tx = _make_transaction(transaction_type=TransactionType.ESCROW_REFUND)

    monkeypatch.setattr(
        finance_repository,
        "get_escrow_by_reservation",
        AsyncMock(return_value=escrow),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(return_value=platform_wallet),
    )
    monkeypatch.setattr(
        "app.finance.services._reservation_or_none",
        AsyncMock(return_value=_make_reservation(host_id=escrow.host_id)),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", AsyncMock(return_value=MagicMock())
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())

    payload = {
        "reservation_id": escrow.reservation_id,
        "refund_amount_egp": 3500,
        "guest_id": str(uuid.uuid4()),
    }
    await finance_services.handle_cancel_event(fake_session, payload)
    assert escrow.status == EscrowStatus.REFUNDED


@pytest.mark.asyncio
async def test_process_payout(fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers
    from app.finance import repository as finance_repository

    payout = _make_payout()
    host_wallet = _make_wallet(wallet_id=payout.wallet_id, owner_id=payout.host_id)
    host_wallet.balance_egp = 2000
    host_wallet.available_balance_egp = 2000
    platform_wallet = _make_wallet(wallet_type="platform")
    tx = _make_transaction(transaction_type=TransactionType.PAYOUT)

    monkeypatch.setattr(
        finance_repository,
        "get_payout_request_by_id",
        AsyncMock(return_value=payout),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_wallet_by_id_for_update",
        AsyncMock(return_value=host_wallet),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_platform_wallet",
        AsyncMock(return_value=platform_wallet),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", AsyncMock(return_value=MagicMock())
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())
    monkeypatch.setattr(
        finance_providers,
        "paymob_payout",
        AsyncMock(return_value=(True, "paymob-ref-123", 0)),
    )

    result = await finance_services.process_payout(fake_session, payout.id, "paymob")
    assert result.status == PayoutStatus.COMPLETED
    assert result.provider_ref == "paymob-ref-123"


@pytest.mark.asyncio
async def test_process_payout_provider_failure_persists_failed_state(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: a failed provider payout must return the FAILED payout so
    the caller's transaction commits — raising rolled back the failure
    bookkeeping and left the request pending with the wallet locked."""
    from app.finance import providers as finance_providers
    from app.finance import repository as finance_repository

    payout = _make_payout()
    host_wallet = _make_wallet(wallet_id=payout.wallet_id, owner_id=payout.host_id)
    host_wallet.balance_egp = 2000
    host_wallet.available_balance_egp = 0

    monkeypatch.setattr(
        finance_repository,
        "get_payout_request_by_id",
        AsyncMock(return_value=payout),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_wallet_by_id_for_update",
        AsyncMock(return_value=host_wallet),
    )
    monkeypatch.setattr(
        finance_providers,
        "paymob_payout",
        AsyncMock(return_value=(False, "Paymob API key not configured", 0)),
    )

    result = await finance_services.process_payout(fake_session, payout.id, "paymob")

    assert result.status == PayoutStatus.FAILED
    assert result.failure_reason == "Paymob API key not configured"
    assert result.processed_at is not None
    # request_payout reserved amount_egp (1000) from available; failure
    # must release the reservation back to the wallet.
    assert host_wallet.available_balance_egp == 1000


def test_verify_paymob_hmac() -> None:
    payload = {"reservation_id": str(uuid.uuid4()), "amount_cents": "450000"}
    signature = providers.compute_paymob_signature(payload)
    assert providers.verify_paymob_hmac(payload, signature) is True
    assert providers.verify_paymob_hmac(payload, "bad-sig") is False


def test_verify_stripe_signature() -> None:
    import time as _time

    secret = "whsec_test"
    payload = b'{"type":"payment_intent.succeeded"}'
    timestamp = str(int(_time.time()))
    signed = f"{timestamp}.{payload.decode()}"
    signature = hmac.new(secret.encode(), signed.encode(), "sha256").hexdigest()
    header = f"t={timestamp},v1={signature}"
    assert providers.verify_stripe_signature(payload, header, secret) is True
    assert providers.verify_stripe_signature(payload, "t=1,v1=bad", secret) is False


def test_get_my_wallet(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import repository as finance_repository

    host = _make_user(role=UserRole.HOST)
    _patch_auth_user(monkeypatch, host)
    wallet = _make_wallet(owner_id=host.id)
    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(return_value=wallet),
    )

    token = auth_services.create_access_token(host)
    response = finance_client.get(
        "/api/v1/finance/wallets/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == wallet.id


def test_create_payout_request(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import repository as finance_repository
    from app.finance import services as finance_services

    host = _make_user(role=UserRole.HOST)
    _patch_auth_user(monkeypatch, host)
    wallet = _make_wallet(owner_id=host.id)
    wallet.available_balance_egp = 5000
    payout = _make_payout(wallet_id=wallet.id, host_id=host.id)

    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(return_value=wallet),
    )
    monkeypatch.setattr(
        finance_services,
        "request_payout",
        AsyncMock(return_value=payout),
    )

    token = auth_services.create_access_token(host)
    response = finance_client.post(
        "/api/v1/finance/payouts",
        json={"amount_egp": 1000, "bank_account_info": {"iban": "EG123456789"}},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "pending"


def test_paymob_webhook(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    reservation_id = str(uuid.uuid4())
    provider_ref = f"paymob-txn-{reservation_id}"
    payload = {
        "reservation_id": reservation_id,
        "order": provider_ref,
        "success": "true",
    }
    signature = providers.compute_paymob_signature(payload)

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        reservations_services,
        "confirm_reservation_by_provider",
        AsyncMock(return_value=MagicMock()),
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json=payload,
        headers={"x-paymob-hmac": signature},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "processed"
    reservations_services.confirm_reservation_by_provider.assert_awaited_once()


def test_stripe_webhook(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    reservation_id = str(uuid.uuid4())
    provider_ref = f"pi_test_{reservation_id}"
    payload = {
        "id": "evt_123",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": provider_ref,
                "metadata": {"reservation_id": reservation_id},
            }
        },
    }

    monkeypatch.setattr(finance_providers, "verify_stripe_signature", lambda b, s, sec: True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        reservations_services,
        "confirm_reservation_by_provider",
        AsyncMock(return_value=MagicMock()),
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/stripe",
        json=payload,
        headers={"stripe-signature": "t=1,v1=abc"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "processed"
    reservations_services.confirm_reservation_by_provider.assert_awaited_once()


def test_paymob_webhook_invalid_signature(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: False)

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json={"reservation_id": str(uuid.uuid4()), "order": "order-1", "success": "true"},
        headers={"x-paymob-hmac": "bad-sig"},
    )
    assert response.status_code == 401


def test_paymob_webhook_duplicate(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers

    reservation_id = str(uuid.uuid4())
    payload = {
        "reservation_id": reservation_id,
        "order": "order-1",
        "success": "true",
    }
    signature = providers.compute_paymob_signature(payload)

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=False),
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json=payload,
        headers={"x-paymob-hmac": signature},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "already processed"


def test_paymob_webhook_failed_payment(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    reservation_id = str(uuid.uuid4())
    provider_ref = f"paymob-txn-{reservation_id}"
    payload = {
        "reservation_id": reservation_id,
        "order": provider_ref,
        "success": "false",
    }
    signature = providers.compute_paymob_signature(payload)

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        reservations_services,
        "fail_reservation_by_provider",
        AsyncMock(return_value=MagicMock()),
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json=payload,
        headers={"x-paymob-hmac": signature},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "failed"
    reservations_services.fail_reservation_by_provider.assert_awaited_once()


def test_stripe_webhook_failure(finance_client: TestClient, fake_session: AsyncMock, monkeypatch) -> None:
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    reservation_id = str(uuid.uuid4())
    provider_ref = f"pi_test_{reservation_id}"
    payload = {
        "id": "evt_123",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": provider_ref,
                "metadata": {"reservation_id": reservation_id},
                "last_payment_error": {"message": "card declined"},
            }
        },
    }

    monkeypatch.setattr(finance_providers, "verify_stripe_signature", lambda b, s, sec: True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        reservations_services,
        "fail_reservation_by_provider",
        AsyncMock(return_value=MagicMock()),
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/stripe",
        json=payload,
        headers={"stripe-signature": "t=1,v1=abc"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "failed"
    reservations_services.fail_reservation_by_provider.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_paymob_payment_returns_checkout_url() -> None:
    result = await providers.create_paymob_payment("res-123", 4500)
    assert result["provider"] == "paymob"
    assert result["order_id"]
    assert result["payment_token"]
    assert result["iframe_url"]


@pytest.mark.asyncio
async def test_create_stripe_payment_intent_returns_client_secret() -> None:
    result = await providers.create_stripe_payment_intent("res-123", 4500)
    assert result["provider"] == "stripe"
    assert result["payment_intent_id"]
    assert result["client_secret"]


@pytest.mark.asyncio
async def test_paymob_post_retries_on_timeout(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    response_mock = MagicMock()
    response_mock.raise_for_status = MagicMock()
    response_mock.json = MagicMock(return_value={"id": "order-1"})

    client = AsyncMock()
    client.post = AsyncMock(
        side_effect=[httpx.ReadTimeout("timeout"), response_mock]
    )

    result = await finance_providers._paymob_post(client, "/test", {})
    assert result == {"id": "order-1"}
    assert client.post.await_count == 2


@pytest.mark.asyncio
async def test_stripe_post_retries_on_timeout(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    response_mock = MagicMock()
    response_mock.raise_for_status = MagicMock()
    response_mock.json = MagicMock(return_value={"id": "pi-1"})

    client = AsyncMock()
    client.post = AsyncMock(
        side_effect=[httpx.ReadTimeout("timeout"), response_mock]
    )

    result = await finance_providers._stripe_post(client, "/test", {})
    assert result == {"id": "pi-1"}
    assert client.post.await_count == 2


@pytest.mark.asyncio
async def test_refund_stripe_payment_returns_refund_object() -> None:
    result = await providers.refund_stripe_payment("pi_test_res-123", 4500)
    assert result["status"] == "succeeded"


def test_verify_paymob_hmac_missing_secret(monkeypatch) -> None:
    monkeypatch.setattr(providers.settings, "PAYMOB_HMAC_SECRET", "")
    assert providers.verify_paymob_hmac({"x": 1}, "sig") is False


def test_verify_stripe_signature_invalid_format() -> None:
    assert providers.verify_stripe_signature(b"body", None, "secret") is False
    assert providers.verify_stripe_signature(b"body", "no-equals", "secret") is False
    assert providers.verify_stripe_signature(b"body", "t=abc,v1=sig", "secret") is False


@pytest.mark.asyncio
async def test_create_paymob_payment_production(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_API_KEY", "test-key")
    # Force the legacy flow — the Intention API is preferred when a secret
    # key is configured.
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_SECRET_KEY", "")
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_INTEGRATION_ID", 12345)
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_IFRAME_ID", 67890)

    _FakeClient.responses = [
        _FakeResponse({"token": "auth-token"}),
        _FakeResponse({"id": "order-1"}),
        _FakeResponse({"token": "payment-key-token"}),
    ]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _FakeClient)

    result = await finance_providers.create_paymob_payment("res-123", 4500)
    assert result["provider"] == "paymob"
    assert result["order_id"] == "order-1"
    assert result["payment_token"] == "payment-key-token"
    assert result["iframe_url"]


@pytest.mark.asyncio
async def test_paymob_auth_token_missing_key(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_API_KEY", "")
    with pytest.raises(PaymentError):
        await finance_providers.paymob_auth_token()


@pytest.mark.asyncio
async def test_create_stripe_payment_intent_production(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(finance_providers.settings, "STRIPE_SECRET_KEY", "sk_test")

    _FakeClient.responses = [
        _FakeResponse(
            {"id": "pi_1", "client_secret": "pi_1_secret", "status": "requires_confirmation"}
        )
    ]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _FakeClient)

    result = await finance_providers.create_stripe_payment_intent("res-123", 4500)
    assert result["payment_intent_id"] == "pi_1"
    assert result["client_secret"] == "pi_1_secret"


@pytest.mark.asyncio
async def test_capture_stripe_payment_intent_production(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(finance_providers.settings, "STRIPE_SECRET_KEY", "sk_test")

    _FakeClient.responses = [_FakeResponse({"id": "pi_1", "status": "succeeded"})]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _FakeClient)

    result = await finance_providers.capture_stripe_payment_intent("pi_1")
    assert result["status"] == "succeeded"


@pytest.mark.asyncio
async def test_refund_stripe_payment_production(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(finance_providers.settings, "STRIPE_SECRET_KEY", "sk_test")

    _FakeClient.responses = [_FakeResponse({"id": "re_1", "status": "succeeded"})]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _FakeClient)

    result = await finance_providers.refund_stripe_payment("pi_1", 4500)
    assert result["status"] == "succeeded"


class _StatusResponse:
    def __init__(self, status_code: int, payload: object) -> None:
        self.status_code = status_code
        self._payload = payload

    def raise_for_status(self) -> None:
        return

    def json(self) -> object:
        return self._payload


class _StatusClient:
    responses: list[_StatusResponse] = []
    last_request: dict[str, object] = {}

    def __init__(self, *args: object, **kwargs: object) -> None:
        return

    async def __aenter__(self) -> "_StatusClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, url: str, **kwargs: object) -> _StatusResponse:
        _StatusClient.last_request = {"url": url, **kwargs}
        return self.responses.pop(0)


@pytest.mark.asyncio
async def test_paymob_refund_success(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(
        finance_providers.settings, "PAYMOB_SECRET_KEY", "sk_test_x"
    )
    _StatusClient.responses = [
        _StatusResponse(201, {"id": 540324238, "success": True, "is_refund": True})
    ]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _StatusClient)

    result = await finance_providers.paymob_refund("538949212", 150000)

    assert result["success"] is True
    req = _StatusClient.last_request
    assert req["url"].endswith("/api/acceptance/void_refund/refund")
    assert req["headers"]["Authorization"] == "Token sk_test_x"
    assert req["json"] == {"transaction_id": 538949212, "amount_cents": 150000}


@pytest.mark.asyncio
async def test_paymob_refund_already_refunded_is_reconciled(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(
        finance_providers.settings, "PAYMOB_SECRET_KEY", "sk_test_x"
    )
    _StatusClient.responses = [
        _StatusResponse(400, {"message": "Full Amount has been already refunded"})
    ]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _StatusClient)

    result = await finance_providers.paymob_refund("538949212", 150000)

    assert result["success"] is True
    assert result["already_refunded"] is True


@pytest.mark.asyncio
async def test_paymob_refund_rejection_raises(monkeypatch) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(
        finance_providers.settings, "PAYMOB_SECRET_KEY", "sk_test_x"
    )
    _StatusClient.responses = [
        _StatusResponse(422, {"message": "Transaction ID does not exist in our system."})
    ]
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", _StatusClient)

    with pytest.raises(PaymentError):
        await finance_providers.paymob_refund("999999999", 1000)


@pytest.mark.asyncio
async def test_paymob_payout_fails_closed_without_payout_credentials(
    monkeypatch,
) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers.settings, "ENVIRONMENT", "staging")
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_PAYOUT_CLIENT_ID", "")
    monkeypatch.setattr(
        finance_providers.settings, "PAYMOB_PAYOUT_CLIENT_SECRET", ""
    )
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_PAYOUT_USERNAME", "")
    monkeypatch.setattr(finance_providers.settings, "PAYMOB_PAYOUT_PASSWORD", "")
    client_mock = MagicMock()
    monkeypatch.setattr(finance_providers.httpx, "AsyncClient", client_mock)

    ok, ref, fee = await finance_providers.paymob_payout(
        "host-1", 2640, {"wallet_number": "01000000000"}
    )

    assert ok is False
    assert "credentials not configured" in ref
    assert fee == 0
    client_mock.assert_not_called()


@pytest.mark.asyncio
async def test_ledger_credit_preserves_locked_payout_funds(
    fake_session: AsyncMock,
) -> None:
    """Regression: posting new earnings must not erase funds locked by an
    in-flight payout — available is balance minus locked, not balance."""
    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    wallet.balance_egp = 3640
    wallet.available_balance_egp = 0  # 3640 locked by a pending payout
    tx = _make_transaction()

    await finance_repository.create_ledger_entry(
        fake_session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type="liability",
        entry_type="credit",
        amount_egp=1000,
        wallet=wallet,
        description="new earnings",
    )
    assert wallet.balance_egp == 4640
    assert wallet.available_balance_egp == 1000


@pytest.mark.asyncio
async def test_ledger_payout_settlement_consumes_lock(
    fake_session: AsyncMock,
) -> None:
    """The payout-completion debit consumes the locked amount — available
    must not be decremented a second time."""
    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    wallet.balance_egp = 2640
    wallet.available_balance_egp = 0  # locked by the payout being settled
    tx = _make_transaction()

    await finance_repository.create_ledger_entry(
        fake_session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type="liability",
        entry_type="debit",
        amount_egp=2640,
        wallet=wallet,
        description="Host payout",
    )
    assert wallet.balance_egp == 0
    assert wallet.available_balance_egp == 0


def _posted_ledger_accounts(mock: AsyncMock) -> list[str]:
    return [c.kwargs["ledger_account"] for c in mock.await_args_list]


@pytest.mark.asyncio
async def test_handle_cancel_event_posts_payable_when_provider_unconfirmed(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: a refund that the provider has NOT confirmed is a
    payable liability — never a platform_cash outflow."""
    from app.finance import repository as finance_repository

    escrow = _make_escrow()
    platform_wallet = _make_wallet(wallet_type="platform")
    tx = _make_transaction(transaction_type=TransactionType.ESCROW_REFUND)

    # No REFUNDED intent; no refunded manual payment.
    fake_session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: None)
    )
    monkeypatch.setattr(
        finance_repository,
        "get_escrow_by_reservation",
        AsyncMock(return_value=escrow),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(return_value=platform_wallet),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    ledger_mock = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", ledger_mock
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())
    monkeypatch.setattr(
        "app.payments.repository.get_payment_by_booking",
        AsyncMock(return_value=None),
    )

    await finance_services.handle_cancel_event(
        fake_session,
        {"reservation_id": escrow.reservation_id, "refund_amount_egp": 3500},
    )

    accounts = _posted_ledger_accounts(ledger_mock)
    assert escrow.status == EscrowStatus.REFUNDED
    assert LedgerAccount.GUEST_REFUND_PAYABLE in accounts
    assert LedgerAccount.PLATFORM_CASH not in accounts


@pytest.mark.asyncio
async def test_handle_cancel_event_posts_cash_when_provider_confirmed(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """When the provider refund already succeeded at cancel time the
    ledger records the cash outflow directly — no payable."""
    from app.finance import repository as finance_repository

    escrow = _make_escrow()
    platform_wallet = _make_wallet(wallet_type="platform")
    tx = _make_transaction(transaction_type=TransactionType.ESCROW_REFUND)

    fake_session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: "intent-id")
    )
    monkeypatch.setattr(
        finance_repository,
        "get_escrow_by_reservation",
        AsyncMock(return_value=escrow),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_or_create_wallet",
        AsyncMock(return_value=platform_wallet),
    )
    monkeypatch.setattr(
        "app.finance.services._reservation_or_none",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        "app.payments.repository.get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=tx),
    )
    ledger_mock = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", ledger_mock
    )
    monkeypatch.setattr("app.finance.services.write_event", AsyncMock())

    await finance_services.handle_cancel_event(
        fake_session,
        {"reservation_id": escrow.reservation_id, "refund_amount_egp": 3500},
    )

    accounts = _posted_ledger_accounts(ledger_mock)
    assert LedgerAccount.PLATFORM_CASH in accounts
    assert LedgerAccount.GUEST_REFUND_PAYABLE not in accounts


@pytest.mark.asyncio
async def test_settle_guest_refund_converts_payable_to_cash(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository
    from app.finance.models import LedgerEntry

    refund_tx = _make_transaction(
        transaction_type=TransactionType.ESCROW_REFUND
    )
    refund_tx.reservation_id = "res-1"
    payable_entry = LedgerEntry(
        id=str(uuid.uuid4()),
        transaction_id=refund_tx.id,
        ledger_account=str(LedgerAccount.GUEST_REFUND_PAYABLE),
        account_type="liability",
        entry_type="credit",
        amount_egp=1500,
        balance_after=1500,
    )
    platform_wallet = _make_wallet(wallet_type="platform")

    keys = {
        f"finance-refund-settle-{refund_tx.reservation_id}": None,
        f"finance-escrow-refund-{refund_tx.reservation_id}": refund_tx,
    }
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(side_effect=lambda session, key: keys.get(key)),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_ledger_entries_for_transaction",
        AsyncMock(return_value=[payable_entry]),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_platform_wallet",
        AsyncMock(return_value=platform_wallet),
    )
    settle_tx = _make_transaction(transaction_type=TransactionType.REFUND)
    monkeypatch.setattr(
        finance_repository,
        "create_financial_transaction",
        AsyncMock(return_value=settle_tx),
    )
    ledger_mock = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr(
        finance_repository, "create_ledger_entry", ledger_mock
    )

    await finance_services.settle_guest_refund(
        fake_session, refund_tx.reservation_id
    )

    calls = ledger_mock.await_args_list
    assert len(calls) == 2
    assert calls[0].kwargs["ledger_account"] == LedgerAccount.GUEST_REFUND_PAYABLE
    assert calls[0].kwargs["entry_type"] == "debit"
    assert calls[1].kwargs["ledger_account"] == LedgerAccount.PLATFORM_CASH
    assert calls[1].kwargs["entry_type"] == "credit"


@pytest.mark.asyncio
async def test_settle_guest_refund_idempotent(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository

    existing = _make_transaction(transaction_type=TransactionType.REFUND)
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(return_value=existing),
    )

    await finance_services.settle_guest_refund(fake_session, "res-1")
    fake_session.add.assert_not_called()


@pytest.mark.asyncio
async def test_settle_guest_refund_noop_without_payable(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import repository as finance_repository

    refund_tx = _make_transaction(
        transaction_type=TransactionType.ESCROW_REFUND
    )
    refund_tx.reservation_id = "res-1"
    keys = {
        f"finance-refund-settle-{refund_tx.reservation_id}": None,
        f"finance-escrow-refund-{refund_tx.reservation_id}": refund_tx,
    }
    monkeypatch.setattr(
        finance_repository,
        "get_transaction_by_idempotency_key",
        AsyncMock(side_effect=lambda session, key: keys.get(key)),
    )
    monkeypatch.setattr(
        finance_repository,
        "get_ledger_entries_for_transaction",
        AsyncMock(return_value=[]),
    )
    create_mock = AsyncMock()
    monkeypatch.setattr(
        finance_repository, "create_financial_transaction", create_mock
    )

    await finance_services.settle_guest_refund(
        fake_session, refund_tx.reservation_id
    )
    create_mock.assert_not_awaited()


def test_paymob_webhook_pending_callback_not_confirmed(
    finance_client: TestClient, fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: a pending transaction has not settled — it must be
    acknowledged WITHOUT confirming the reservation and WITHOUT consuming
    the transaction idempotency key (the final callback must still land)."""
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    reservation_id = str(uuid.uuid4())
    payload = {
        "reservation_id": reservation_id,
        "order": "order-1",
        "success": "true",
        "pending": True,
    }
    signature = providers.compute_paymob_signature(payload)

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)
    idem_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.finance.router._acquire_webhook_idempotency", idem_mock
    )
    confirm_mock = AsyncMock()
    monkeypatch.setattr(
        reservations_services, "confirm_reservation_by_provider", confirm_mock
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json=payload,
        headers={"x-paymob-hmac": signature},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "pending"
    confirm_mock.assert_not_awaited()
    idem_mock.assert_not_awaited()


def test_paymob_webhook_refund_callback_ignored(
    finance_client: TestClient, fake_session: AsyncMock, monkeypatch
) -> None:
    """Refund/void transactions describe money leaving — they must never
    reach the confirmation path."""
    from app.finance import providers as finance_providers
    from app.reservations import services as reservations_services

    payload = {
        "obj": {
            "id": 540324238,
            "is_refund": True,
            "success": True,
            "order": {"id": 614601490},
        }
    }
    signature = providers.compute_paymob_signature(payload)

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)
    confirm_mock = AsyncMock()
    monkeypatch.setattr(
        reservations_services, "confirm_reservation_by_provider", confirm_mock
    )

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        json=payload,
        headers={"x-paymob-hmac": signature},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "ignored"
    confirm_mock.assert_not_awaited()


def test_paymob_webhook_malformed_json_rejected(
    finance_client: TestClient, fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import providers as finance_providers

    monkeypatch.setattr(finance_providers, "verify_paymob_hmac", lambda p, s: True)

    response = finance_client.post(
        "/api/v1/finance/webhooks/paymob",
        content=b"{not-json",
        headers={
            "x-paymob-hmac": "sig",
            "content-type": "application/json",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_request_payout_uses_locked_wallet(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Regression: the available-balance check must run under a row lock —
    without it, concurrent requests double-spend the wallet."""
    from app.finance import repository as finance_repository

    wallet = _make_wallet()
    wallet.balance_egp = 2640
    wallet.available_balance_egp = 2640
    locked_fetch = AsyncMock(return_value=wallet)
    monkeypatch.setattr(
        finance_repository, "get_wallet_by_id_for_update", locked_fetch
    )
    monkeypatch.setattr(
        finance_repository,
        "create_payout_request",
        AsyncMock(return_value=_make_payout()),
    )

    await finance_services.request_payout(
        fake_session,
        host_id=wallet.owner_id,
        wallet_id=wallet.id,
        amount_egp=1000,
        bank_account_info={"account_number": "1234"},
    )

    locked_fetch.assert_awaited_once()
    assert wallet.available_balance_egp == 1640
