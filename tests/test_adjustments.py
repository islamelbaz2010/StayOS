"""Admin commercial adjustments — the canonical replacement for the
removed launch waiver: every exceptional commercial treatment is an
explicit, audited record that posts its own ledger pair on apply."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.finance import adjustments as adj
from app.finance.constants import (
    AccountType,
    AdjustmentStatus,
    AdjustmentType,
    LedgerAccount,
    LedgerEntryType,
    TransactionType,
)
from app.finance.models import CommercialAdjustment
from app.shared.exceptions import ConflictError, NotFoundError, ValidationError


def _session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session


def _adjustment(**over) -> CommercialAdjustment:
    a = CommercialAdjustment(
        id=str(uuid4()),
        booking_id="b1",
        user_id="h1",
        listing_id=None,
        adjustment_type=AdjustmentType.HOST_CREDIT,
        category="compensation",
        amount_egp=Decimal("90.00"),
        reason="case note",
        internal_note=None,
        customer_note=None,
        status=AdjustmentStatus.APPROVED,
        requested_by_id=None,
        created_by_id="admin-1",
        decided_by_id="admin-1",
        decided_at=None,
        applied_at=None,
        financial_transaction_id=None,
    )
    for k, v in over.items():
        setattr(a, k, v)
    return a


@pytest.mark.asyncio
async def test_admin_created_adjustment_is_approved() -> None:
    session = _session()
    session.scalar = AsyncMock(return_value="x")  # all targets exist

    a = await adj.create_adjustment(
        session,
        actor_id="admin-1",
        adjustment_type="host_credit",
        category="compensation",
        amount_egp="90",
        reason="waived-era booking honored",
        booking_id="b1",
        user_id="h1",
    )

    assert a.status == AdjustmentStatus.APPROVED
    assert a.created_by_id == "admin-1"
    assert a.decided_by_id == "admin-1"
    assert a.decided_at is not None
    session.add.assert_called_with(a)


@pytest.mark.asyncio
async def test_user_requested_adjustment_enters_pending() -> None:
    session = _session()
    session.scalar = AsyncMock(return_value="x")

    a = await adj.create_adjustment(
        session,
        actor_id="admin-1",
        adjustment_type="guest_credit",
        category="compensation",
        amount_egp="100",
        reason="guest escalated",
        booking_id="b1",
        requested_by_id="guest-1",
    )

    assert a.status == AdjustmentStatus.PENDING
    assert a.decided_by_id is None


@pytest.mark.asyncio
async def test_create_validates_amount_reason_and_type() -> None:
    session = _session()
    session.scalar = AsyncMock(return_value="x")

    with pytest.raises(ValidationError):
        await adj.create_adjustment(
            session,
            actor_id="a",
            adjustment_type="host_credit",
            category="adjustment",
            amount_egp="0",
            reason="x",
            booking_id="b1",
        )
    with pytest.raises(ValidationError):
        await adj.create_adjustment(
            session,
            actor_id="a",
            adjustment_type="host_credit",
            category="adjustment",
            amount_egp="10",
            reason="  ",
            booking_id="b1",
        )
    with pytest.raises(ValidationError):
        await adj.create_adjustment(
            session,
            actor_id="a",
            adjustment_type="bogus",
            category="adjustment",
            amount_egp="10",
            reason="x",
            booking_id="b1",
        )
    # Host/guest adjustments need a target to settle against.
    with pytest.raises(ValidationError):
        await adj.create_adjustment(
            session,
            actor_id="a",
            adjustment_type="host_credit",
            category="adjustment",
            amount_egp="10",
            reason="x",
        )


@pytest.mark.asyncio
async def test_create_rejects_unknown_targets() -> None:
    session = _session()
    session.scalar = AsyncMock(return_value=None)  # booking lookup → None

    with pytest.raises(NotFoundError):
        await adj.create_adjustment(
            session,
            actor_id="a",
            adjustment_type="host_credit",
            category="adjustment",
            amount_egp="10",
            reason="x",
            booking_id="ghost",
        )


@pytest.mark.asyncio
async def test_decide_transitions_pending_only() -> None:
    session = _session()
    a = _adjustment(status=AdjustmentStatus.PENDING, decided_by_id=None)
    session.get = AsyncMock(return_value=a)

    decided = await adj.decide_adjustment(
        session, a.id, actor_id="admin-2", approve=True
    )
    assert decided.status == AdjustmentStatus.APPROVED
    assert decided.decided_by_id == "admin-2"
    assert decided.decided_at is not None

    a2 = _adjustment(status=AdjustmentStatus.PENDING)
    session.get = AsyncMock(return_value=a2)
    rejected = await adj.decide_adjustment(
        session, a2.id, actor_id="admin-2", approve=False
    )
    assert rejected.status == AdjustmentStatus.REJECTED

    a3 = _adjustment(status=AdjustmentStatus.APPLIED)
    session.get = AsyncMock(return_value=a3)
    with pytest.raises(ConflictError):
        await adj.decide_adjustment(
            session, a3.id, actor_id="admin-2", approve=True
        )


@pytest.mark.asyncio
async def test_apply_host_credit_posts_balanced_ledger_pair() -> None:
    session = _session()
    a = _adjustment()
    session.get = AsyncMock(return_value=a)
    wallet = MagicMock()
    wallet.id = "w1"

    with patch.object(adj, "finance_repository") as fr:
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.get_host_wallet = AsyncMock(return_value=wallet)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id="tx-1")
        )
        fr.create_ledger_entry = AsyncMock()

        result = await adj.apply_adjustment(session, a.id)

    assert result.status == AdjustmentStatus.APPLIED
    assert result.financial_transaction_id == "tx-1"
    assert result.applied_at is not None

    tx_kwargs = fr.create_financial_transaction.call_args.kwargs
    assert tx_kwargs["transaction_type"] == TransactionType.ADJUSTMENT
    assert tx_kwargs["amount_egp"] == Decimal("90.00")
    assert tx_kwargs["reservation_id"] == "b1"
    assert tx_kwargs["idempotency_key"] == f"adjustment:{a.id}"

    entries = fr.create_ledger_entry.call_args_list
    assert len(entries) == 2
    debit, credit = entries
    assert debit.kwargs["ledger_account"] == LedgerAccount.PLATFORM_REVENUE
    assert debit.kwargs["account_type"] == AccountType.REVENUE
    assert debit.kwargs["entry_type"] == LedgerEntryType.DEBIT
    assert credit.kwargs["ledger_account"] == LedgerAccount.HOST_PAYABLE
    assert credit.kwargs["account_type"] == AccountType.LIABILITY
    assert credit.kwargs["wallet"] is wallet
    assert debit.kwargs["amount_egp"] == credit.kwargs["amount_egp"] == Decimal(
        "90.00"
    )


@pytest.mark.asyncio
async def test_apply_guest_credit_posts_refund_payable() -> None:
    session = _session()
    a = _adjustment(adjustment_type=AdjustmentType.GUEST_CREDIT)
    session.get = AsyncMock(return_value=a)

    with patch.object(adj, "finance_repository") as fr:
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id="tx-1")
        )
        fr.create_ledger_entry = AsyncMock()

        await adj.apply_adjustment(session, a.id)

    debit, credit = fr.create_ledger_entry.call_args_list
    assert debit.kwargs["ledger_account"] == LedgerAccount.PLATFORM_REVENUE
    assert credit.kwargs["ledger_account"] == LedgerAccount.GUEST_REFUND_PAYABLE
    assert credit.kwargs["account_type"] == AccountType.LIABILITY


@pytest.mark.asyncio
async def test_apply_debit_directions_reverse() -> None:
    session = _session()
    a = _adjustment(
        adjustment_type=AdjustmentType.HOST_DEBIT,
        booking_id="b1",
        user_id="h1",
    )
    session.get = AsyncMock(return_value=a)
    wallet = MagicMock()
    wallet.id = "w1"

    with patch.object(adj, "finance_repository") as fr:
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.get_host_wallet = AsyncMock(return_value=wallet)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id="tx-1")
        )
        fr.create_ledger_entry = AsyncMock()

        await adj.apply_adjustment(session, a.id)

    debit, credit = fr.create_ledger_entry.call_args_list
    assert debit.kwargs["ledger_account"] == LedgerAccount.HOST_PAYABLE
    assert debit.kwargs["wallet"] is wallet
    assert credit.kwargs["ledger_account"] == LedgerAccount.PLATFORM_REVENUE


@pytest.mark.asyncio
async def test_apply_is_idempotent_and_requires_approved() -> None:
    session = _session()
    pending = _adjustment(status=AdjustmentStatus.PENDING)
    session.get = AsyncMock(return_value=pending)
    with pytest.raises(ConflictError):
        await adj.apply_adjustment(session, pending.id)

    # A second apply against an already-posted key relinks, never
    # double-posts.
    a = _adjustment()
    session.get = AsyncMock(return_value=a)
    with patch.object(adj, "finance_repository") as fr:
        fr.get_transaction_by_idempotency_key = AsyncMock(
            return_value=MagicMock(id="tx-existing")
        )
        fr.create_ledger_entry = AsyncMock()
        result = await adj.apply_adjustment(session, a.id)

    assert result.status == AdjustmentStatus.APPLIED
    assert result.financial_transaction_id == "tx-existing"
    fr.create_ledger_entry.assert_not_called()


@pytest.mark.asyncio
async def test_cancel_blocks_applied() -> None:
    session = _session()
    a = _adjustment(status=AdjustmentStatus.APPLIED)
    session.get = AsyncMock(return_value=a)
    with pytest.raises(ConflictError):
        await adj.cancel_adjustment(session, a.id)

    b = _adjustment(status=AdjustmentStatus.APPROVED)
    session.get = AsyncMock(return_value=b)
    cancelled = await adj.cancel_adjustment(session, b.id)
    assert cancelled.status == AdjustmentStatus.CANCELLED
