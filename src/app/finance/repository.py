from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import (
    AccountType,
    EscrowStatus,
    LedgerEntryType,
    PayoutStatus,
    TransactionStatus,
    WalletType,
)
from .models import EscrowAccount, FinancialTransaction, LedgerEntry, PayoutRequest, Wallet


async def get_or_create_wallet(
    session: AsyncSession, wallet_type: str, owner_id: str | None = None
) -> Wallet:
    result = await session.execute(
        select(Wallet).where(
            Wallet.wallet_type == wallet_type,
            Wallet.owner_id == owner_id,
        )
    )
    wallet = result.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(
            id=str(uuid4()),
            wallet_type=wallet_type,
            owner_id=owner_id,
            balance_egp=0,
            available_balance_egp=0,
        )
        session.add(wallet)
        await session.flush()
    return wallet


async def get_platform_wallet(session: AsyncSession) -> Wallet:
    return await get_or_create_wallet(session, WalletType.PLATFORM, None)


async def get_host_wallet(session: AsyncSession, host_id: str) -> Wallet:
    return await get_or_create_wallet(session, WalletType.HOST, host_id)


async def get_wallet_by_id(session: AsyncSession, wallet_id: str) -> Wallet | None:
    result = await session.execute(
        select(Wallet).where(Wallet.id == wallet_id)
    )
    return result.scalar_one_or_none()


async def get_escrow_by_reservation(
    session: AsyncSession, reservation_id: str
) -> EscrowAccount | None:
    result = await session.execute(
        select(EscrowAccount).where(EscrowAccount.reservation_id == reservation_id)
    )
    return result.scalar_one_or_none()


async def create_escrow_account(
    session: AsyncSession,
    reservation_id: str,
    host_id: str,
    amount_egp: int,
) -> EscrowAccount:
    escrow = EscrowAccount(
        id=str(uuid4()),
        reservation_id=reservation_id,
        host_id=host_id,
        amount_egp=amount_egp,
        status=EscrowStatus.CREATED,
    )
    session.add(escrow)
    await session.flush()
    return escrow


async def get_escrow_by_id(
    session: AsyncSession, escrow_id: str
) -> EscrowAccount | None:
    result = await session.execute(
        select(EscrowAccount).where(EscrowAccount.id == escrow_id)
    )
    return result.scalar_one_or_none()


async def create_financial_transaction(
    session: AsyncSession,
    transaction_type: str,
    amount_egp: int,
    reservation_id: str | None = None,
    provider: str | None = None,
    provider_ref: str | None = None,
    idempotency_key: str | None = None,
    provider_metadata: dict[str, Any] | None = None,
    status: str = TransactionStatus.COMPLETED,
) -> FinancialTransaction:
    tx = FinancialTransaction(
        id=str(uuid4()),
        reservation_id=reservation_id,
        transaction_type=transaction_type,
        amount_egp=amount_egp,
        status=status,
        provider=provider,
        provider_ref=provider_ref,
        idempotency_key=idempotency_key,
        provider_metadata=provider_metadata,
    )
    session.add(tx)
    await session.flush()
    return tx


async def get_transaction_by_idempotency_key(
    session: AsyncSession, idempotency_key: str
) -> FinancialTransaction | None:
    result = await session.execute(
        select(FinancialTransaction).where(
            FinancialTransaction.idempotency_key == idempotency_key
        )
    )
    return result.scalar_one_or_none()


async def _update_balance(
    session: AsyncSession,
    account_type: str,
    entry_type: str,
    amount: int,
    wallet: Wallet | None = None,
    escrow: EscrowAccount | None = None,
) -> int:
    if wallet is not None:
        current = wallet.balance_egp
        if account_type == AccountType.ASSET:
            new_balance = current + amount if entry_type == LedgerEntryType.DEBIT else current - amount
        else:  # LIABILITY
            new_balance = current - amount if entry_type == LedgerEntryType.DEBIT else current + amount
        wallet.balance_egp = new_balance
        wallet.available_balance_egp = new_balance
        session.add(wallet)
        return new_balance

    if escrow is not None:
        current = escrow.amount_egp
        # Escrow is a liability account.
        new_balance = current - amount if entry_type == LedgerEntryType.DEBIT else current + amount
        escrow.amount_egp = new_balance
        session.add(escrow)
        return new_balance

    return 0


async def create_ledger_entry(
    session: AsyncSession,
    transaction_id: str,
    ledger_account: str,
    account_type: str,
    entry_type: str,
    amount_egp: int,
    wallet: Wallet | None = None,
    escrow: EscrowAccount | None = None,
    description: str | None = None,
) -> LedgerEntry:
    balance_after = await _update_balance(
        session, account_type, entry_type, amount_egp, wallet=wallet, escrow=escrow
    )
    entry = LedgerEntry(
        id=str(uuid4()),
        transaction_id=transaction_id,
        wallet_id=wallet.id if wallet else None,
        escrow_id=escrow.id if escrow else None,
        ledger_account=ledger_account,
        account_type=account_type,
        entry_type=entry_type,
        amount_egp=amount_egp,
        balance_after=balance_after,
        description=description,
    )
    session.add(entry)
    await session.flush()
    return entry


async def list_ledger_entries(
    session: AsyncSession,
    wallet_id: str | None = None,
    escrow_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[LedgerEntry]:
    stmt = select(LedgerEntry).order_by(LedgerEntry.created_at.desc())
    if wallet_id:
        stmt = stmt.where(LedgerEntry.wallet_id == wallet_id)
    if escrow_id:
        stmt = stmt.where(LedgerEntry.escrow_id == escrow_id)
    result = await session.execute(stmt.limit(limit).offset(offset))
    return list(result.scalars().all())


async def count_ledger_entries(
    session: AsyncSession,
    wallet_id: str | None = None,
    escrow_id: str | None = None,
) -> int:
    stmt = select(func.count(LedgerEntry.id))
    if wallet_id:
        stmt = stmt.where(LedgerEntry.wallet_id == wallet_id)
    if escrow_id:
        stmt = stmt.where(LedgerEntry.escrow_id == escrow_id)
    result = await session.scalar(stmt)
    return result or 0


async def list_escrows(
    session: AsyncSession,
    host_id: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[EscrowAccount]:
    stmt = select(EscrowAccount).order_by(EscrowAccount.created_at.desc())
    if host_id:
        stmt = stmt.where(EscrowAccount.host_id == host_id)
    if status:
        stmt = stmt.where(EscrowAccount.status == status)
    result = await session.execute(stmt.limit(limit).offset(offset))
    return list(result.scalars().all())


async def count_escrows(
    session: AsyncSession,
    host_id: str | None = None,
    status: str | None = None,
) -> int:
    stmt = select(func.count(EscrowAccount.id))
    if host_id:
        stmt = stmt.where(EscrowAccount.host_id == host_id)
    if status:
        stmt = stmt.where(EscrowAccount.status == status)
    result = await session.scalar(stmt)
    return result or 0


async def create_payout_request(
    session: AsyncSession,
    wallet_id: str,
    host_id: str,
    amount_egp: int,
    bank_account_info: dict[str, Any],
    provider: str | None = None,
) -> PayoutRequest:
    payout = PayoutRequest(
        id=str(uuid4()),
        wallet_id=wallet_id,
        host_id=host_id,
        amount_egp=amount_egp,
        status=PayoutStatus.PENDING,
        provider=provider,
        bank_account_info=bank_account_info,
    )
    session.add(payout)
    await session.flush()
    return payout


async def get_payout_request_by_id(
    session: AsyncSession, payout_id: str
) -> PayoutRequest | None:
    result = await session.execute(
        select(PayoutRequest).where(PayoutRequest.id == payout_id)
    )
    return result.scalar_one_or_none()


async def list_payout_requests(
    session: AsyncSession,
    host_id: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[PayoutRequest]:
    stmt = select(PayoutRequest).order_by(PayoutRequest.created_at.desc())
    if host_id:
        stmt = stmt.where(PayoutRequest.host_id == host_id)
    if status:
        stmt = stmt.where(PayoutRequest.status == status)
    result = await session.execute(stmt.limit(limit).offset(offset))
    return list(result.scalars().all())


async def count_payout_requests(
    session: AsyncSession,
    host_id: str | None = None,
    status: str | None = None,
) -> int:
    stmt = select(func.count(PayoutRequest.id))
    if host_id:
        stmt = stmt.where(PayoutRequest.host_id == host_id)
    if status:
        stmt = stmt.where(PayoutRequest.status == status)
    result = await session.scalar(stmt)
    return result or 0


async def update_payout_status(
    session: AsyncSession,
    payout: PayoutRequest,
    status: str,
    provider_ref: str | None = None,
    failure_reason: str | None = None,
) -> None:
    payout.status = status
    payout.provider_ref = provider_ref or payout.provider_ref
    payout.failure_reason = failure_reason
    if status in (PayoutStatus.COMPLETED.value, PayoutStatus.FAILED.value):
        payout.processed_at = datetime.now(UTC)
    session.add(payout)
    await session.flush()
