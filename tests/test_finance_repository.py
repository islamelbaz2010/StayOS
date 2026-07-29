from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.finance import repository as finance_repository
from app.finance.constants import EscrowStatus, PayoutStatus, TransactionStatus, WalletType
from app.finance.models import (
    EscrowAccount,
    FinancialTransaction,
    LedgerEntry,
    PayoutRequest,
    Wallet,
)


def _make_result(scalar=None, scalars=None, unique=None):
    result = MagicMock()
    result.scalar_one_or_none.return_value = scalar
    if scalars is not None:
        result.scalars.return_value.all.return_value = scalars
    if unique is not None:
        result.unique.return_value.scalar_one_or_none.return_value = unique
    return result


def _make_wallet(wallet_id: str | None = None) -> Wallet:
    return Wallet(
        id=wallet_id or "wallet-1",
        wallet_type=str(WalletType.HOST),
        owner_id="host-1",
        currency="EGP",
        balance_egp=0,
        available_balance_egp=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _make_escrow(escrow_id: str | None = None) -> EscrowAccount:
    return EscrowAccount(
        id=escrow_id or "escrow-1",
        reservation_id="res-1",
        host_id="host-1",
        amount_egp=4500,
        status=EscrowStatus.CREATED,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _make_tx(tx_id: str | None = None) -> FinancialTransaction:
    return FinancialTransaction(
        id=tx_id or "tx-1",
        transaction_type="escrow_create",
        amount_egp=4500,
        status=TransactionStatus.COMPLETED,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _make_payout(payout_id: str | None = None) -> PayoutRequest:
    return PayoutRequest(
        id=payout_id or "payout-1",
        wallet_id="wallet-1",
        host_id="host-1",
        amount_egp=1000,
        status=PayoutStatus.PENDING,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_get_or_create_wallet_existing(fake_session: AsyncMock) -> None:
    wallet = _make_wallet()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=wallet))

    result = await finance_repository.get_or_create_wallet(
        fake_session, str(WalletType.HOST), "host-1"
    )
    assert result == wallet


@pytest.mark.asyncio
async def test_get_or_create_wallet_new(fake_session: AsyncMock) -> None:
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=None))

    result = await finance_repository.get_or_create_wallet(
        fake_session, str(WalletType.HOST), "host-1"
    )
    assert result.wallet_type == str(WalletType.HOST)
    assert result.owner_id == "host-1"


@pytest.mark.asyncio
async def test_get_wallet_by_id(fake_session: AsyncMock) -> None:
    wallet = _make_wallet()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=wallet))

    result = await finance_repository.get_wallet_by_id(fake_session, wallet.id)
    assert result == wallet


@pytest.mark.asyncio
async def test_create_escrow_account(fake_session: AsyncMock) -> None:
    escrow = await finance_repository.create_escrow_account(
        fake_session,
        reservation_id="res-1",
        host_id="host-1",
        amount_egp=4500,
    )
    assert escrow.reservation_id == "res-1"
    assert escrow.amount_egp == 4500


@pytest.mark.asyncio
async def test_get_escrow_by_id(fake_session: AsyncMock) -> None:
    escrow = _make_escrow()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=escrow))

    result = await finance_repository.get_escrow_by_id(fake_session, escrow.id)
    assert result == escrow


@pytest.mark.asyncio
async def test_get_escrow_by_reservation(fake_session: AsyncMock) -> None:
    escrow = _make_escrow()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=escrow))

    result = await finance_repository.get_escrow_by_reservation(fake_session, "res-1")
    assert result == escrow


@pytest.mark.asyncio
async def test_list_escrows(fake_session: AsyncMock) -> None:
    escrow = _make_escrow()
    fake_session.execute = AsyncMock(return_value=_make_result(scalars=[escrow]))

    result = await finance_repository.list_escrows(fake_session)
    assert result == [escrow]


@pytest.mark.asyncio
async def test_create_financial_transaction(fake_session: AsyncMock) -> None:
    tx = await finance_repository.create_financial_transaction(
        fake_session,
        transaction_type="escrow_create",
        amount_egp=4500,
        idempotency_key="idem-1",
    )
    assert tx.transaction_type == "escrow_create"
    assert tx.idempotency_key == "idem-1"


@pytest.mark.asyncio
async def test_get_transaction_by_idempotency_key(fake_session: AsyncMock) -> None:
    tx = _make_tx()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=tx))

    result = await finance_repository.get_transaction_by_idempotency_key(
        fake_session, tx.idempotency_key or "idem-1"
    )
    assert result == tx


@pytest.mark.asyncio
async def test_count_ledger_entries(fake_session: AsyncMock) -> None:
    fake_session.scalar = AsyncMock(return_value=7)

    result = await finance_repository.count_ledger_entries(fake_session, wallet_id="wallet-1")
    assert result == 7


@pytest.mark.asyncio
async def test_list_ledger_entries(fake_session: AsyncMock) -> None:
    entry = LedgerEntry(
        id="le-1",
        transaction_id="tx-1",
        ledger_account="host_payable",
        account_type="liability",
        entry_type="credit",
        amount_egp=500,
        balance_after=500,
        created_at=datetime.now(UTC),
    )
    fake_session.execute = AsyncMock(return_value=_make_result(scalars=[entry]))

    result = await finance_repository.list_ledger_entries(fake_session, wallet_id="wallet-1")
    assert result == [entry]


@pytest.mark.asyncio
async def test_create_payout_request(fake_session: AsyncMock) -> None:
    payout = await finance_repository.create_payout_request(
        fake_session,
        wallet_id="wallet-1",
        host_id="host-1",
        amount_egp=1000,
        bank_account_info={"iban": "EG123"},
    )
    assert payout.wallet_id == "wallet-1"
    assert payout.amount_egp == 1000


@pytest.mark.asyncio
async def test_get_payout_request_by_id(fake_session: AsyncMock) -> None:
    payout = _make_payout()
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=payout))

    result = await finance_repository.get_payout_request_by_id(fake_session, payout.id)
    assert result == payout


@pytest.mark.asyncio
async def test_count_payout_requests(fake_session: AsyncMock) -> None:
    fake_session.scalar = AsyncMock(return_value=3)

    result = await finance_repository.count_payout_requests(fake_session)
    assert result == 3


@pytest.mark.asyncio
async def test_list_payout_requests(fake_session: AsyncMock) -> None:
    payout = _make_payout()
    fake_session.execute = AsyncMock(return_value=_make_result(scalars=[payout]))

    result = await finance_repository.list_payout_requests(fake_session)
    assert result == [payout]


@pytest.mark.asyncio
async def test_count_escrows(fake_session: AsyncMock) -> None:
    fake_session.scalar = AsyncMock(return_value=2)

    result = await finance_repository.count_escrows(fake_session, host_id="host-1")
    assert result == 2


@pytest.mark.asyncio
async def test_get_platform_wallet(fake_session: AsyncMock) -> None:
    wallet = _make_wallet("platform-wallet")
    wallet.wallet_type = str(WalletType.PLATFORM)
    fake_session.execute = AsyncMock(return_value=_make_result(scalar=wallet))

    result = await finance_repository.get_platform_wallet(fake_session)
    assert result == wallet


@pytest.mark.asyncio
async def test_update_payout_status(fake_session: AsyncMock) -> None:
    payout = _make_payout()
    await finance_repository.update_payout_status(
        fake_session, payout, PayoutStatus.COMPLETED, provider_ref="ref-1"
    )
    assert payout.status == PayoutStatus.COMPLETED
    assert payout.provider_ref == "ref-1"
