from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import celery_app
from app.listings import repository as listings_repository
from app.reservations import repository as reservations_repository
from app.reservations.models import Reservation
from app.shared.exceptions import ConflictError, NotFoundError, ValidationError
from app.shared.outbox import write_event

from . import providers
from . import repository as finance_repository
from .constants import (
    AccountType,
    EscrowStatus,
    LedgerAccount,
    LedgerEntryType,
    PaymentProvider,
    PayoutStatus,
    TransactionStatus,
    TransactionType,
    WalletType,
)
from .models import EscrowAccount, FinancialTransaction, PayoutRequest, Wallet

ESCROW_RELEASE_HOURS = 24


def _idempotency_key(transaction_type: str, reservation_id: str) -> str:
    return f"finance-{transaction_type}-{reservation_id}"


async def _get_or_create_wallets(
    session: AsyncSession, host_id: str
) -> tuple[Wallet, Wallet]:
    platform_wallet = await finance_repository.get_or_create_wallet(
        session, WalletType.PLATFORM
    )
    host_wallet = await finance_repository.get_or_create_wallet(
        session, WalletType.HOST, host_id
    )
    return platform_wallet, host_wallet


async def _reservation_or_none(
    session: AsyncSession, reservation_id: str
) -> Reservation | None:
    return await reservations_repository.get_reservation_with_relations(
        session, reservation_id
    )


async def _ensure_reservation_amounts(
    session: AsyncSession,
    reservation_id: str,
    payload: dict[str, Any],
) -> tuple[int, int, str]:
    total = payload.get("amount_egp")
    host_amount = payload.get("host_amount_egp")
    host_id = payload.get("host_id")

    if total is None or host_amount is None or host_id is None:
        reservation = await _reservation_or_none(session, reservation_id)
        if reservation is None:
            raise NotFoundError("Reservation not found")
        total = total if total is not None else reservation.total_amount_egp
        host_amount = (
            host_amount if host_amount is not None else reservation.host_amount_egp
        )
        unit = await listings_repository.get_unit_with_listing(
            session, reservation.unit_id
        )
        host_id = (
            host_id
            if host_id is not None
            else (unit.host_id if unit is not None else None)
        )

    if host_id is None:
        raise ValidationError("Host id is required for finance processing")

    return total, host_amount, host_id


async def _post_ledger_for_escrow_create(
    session: AsyncSession,
    tx: FinancialTransaction,
    platform_wallet: Wallet,
    escrow: EscrowAccount,
    total: int,
) -> None:
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.PLATFORM_CASH,
        account_type=AccountType.ASSET,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=total,
        wallet=platform_wallet,
        description="Guest payment received",
    )
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.ESCROW,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.CREDIT,
        amount_egp=total,
        escrow=escrow,
        description="Funds held in escrow",
    )


async def _post_ledger_for_escrow_release(
    session: AsyncSession,
    tx: FinancialTransaction,
    escrow: EscrowAccount,
    host_wallet: Wallet,
    host_amount: int,
    platform_revenue: int,
) -> None:
    total = host_amount + platform_revenue
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.ESCROW,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=total,
        escrow=escrow,
        description="Escrow released to host",
    )
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.CREDIT,
        amount_egp=host_amount,
        wallet=host_wallet,
        description="Host payout owed",
    )
    if platform_revenue > 0:
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PLATFORM_REVENUE,
            account_type=AccountType.REVENUE,
            entry_type=LedgerEntryType.CREDIT,
            amount_egp=platform_revenue,
            description="Platform fees and guest service fee",
        )


async def _post_ledger_for_escrow_refund(
    session: AsyncSession,
    tx: FinancialTransaction,
    escrow: EscrowAccount,
    platform_wallet: Wallet,
    refund_amount: int,
    retained: int,
) -> None:
    total = refund_amount + retained
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.ESCROW,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=total,
        escrow=escrow,
        description="Escrow voided for cancellation",
    )
    if refund_amount > 0:
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PLATFORM_CASH,
            account_type=AccountType.ASSET,
            entry_type=LedgerEntryType.CREDIT,
            amount_egp=refund_amount,
            wallet=platform_wallet,
            description="Refund to guest",
        )
    if retained > 0:
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PLATFORM_REVENUE,
            account_type=AccountType.REVENUE,
            entry_type=LedgerEntryType.CREDIT,
            amount_egp=retained,
            description="Retained cancellation fees",
        )


async def _post_ledger_for_payout(
    session: AsyncSession,
    tx: FinancialTransaction,
    host_wallet: Wallet,
    platform_wallet: Wallet,
    amount: int,
    payout_fee: int,
) -> None:
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=amount,
        wallet=host_wallet,
        description="Host payout",
    )
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.PLATFORM_CASH,
        account_type=AccountType.ASSET,
        entry_type=LedgerEntryType.CREDIT,
        amount_egp=amount,
        wallet=platform_wallet,
        description="Cash disbursed to host",
    )
    if payout_fee > 0:
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PAYOUT_FEE_EXPENSE,
            account_type=AccountType.EXPENSE,
            entry_type=LedgerEntryType.DEBIT,
            amount_egp=payout_fee,
            description="Payout processing fee",
        )
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PLATFORM_CASH,
            account_type=AccountType.ASSET,
            entry_type=LedgerEntryType.CREDIT,
            amount_egp=payout_fee,
            wallet=platform_wallet,
            description="Payout fee paid",
        )


async def handle_payment_confirmed(
    session: AsyncSession, payload: dict[str, Any]
) -> EscrowAccount | None:
    reservation_id = payload.get("reservation_id")
    if not reservation_id:
        return None

    total, host_amount, host_id = await _ensure_reservation_amounts(
        session, reservation_id, payload
    )

    key = _idempotency_key("escrow-create", reservation_id)
    existing = await finance_repository.get_transaction_by_idempotency_key(
        session, key
    )
    if existing is not None:
        return await finance_repository.get_escrow_by_reservation(session, reservation_id)

    platform_wallet, _ = await _get_or_create_wallets(session, host_id)
    escrow = await finance_repository.get_escrow_by_reservation(session, reservation_id)
    if escrow is None:
        escrow = await finance_repository.create_escrow_account(
            session, reservation_id, host_id, total
        )
    else:
        escrow.amount_egp = total
        escrow.host_id = host_id
        session.add(escrow)
        await session.flush()

    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.ESCROW_CREATE,
        amount_egp=total,
        reservation_id=reservation_id,
        provider=payload.get("provider"),
        provider_ref=payload.get("payment_intent_id"),
        idempotency_key=key,
        status=TransactionStatus.COMPLETED,
    )

    await _post_ledger_for_escrow_create(session, tx, platform_wallet, escrow, total)

    await write_event(
        session,
        aggregate_type="EscrowAccount",
        aggregate_id=UUID(escrow.id),
        event_type="finance.escrow_created",
        payload={
            "escrow_account_id": escrow.id,
            "reservation_id": reservation_id,
            "host_id": host_id,
            "amount_egp": total,
            "host_amount_egp": host_amount,
            "platform_revenue_egp": total - host_amount,
        },
    )

    return escrow


async def handle_checkin_event(
    session: AsyncSession, payload: dict[str, Any]
) -> EscrowAccount | None:
    reservation_id = payload.get("reservation_id")
    if not reservation_id:
        return None

    escrow = await finance_repository.get_escrow_by_reservation(session, reservation_id)
    if escrow is None:
        _, host_amount, host_id = await _ensure_reservation_amounts(
            session, reservation_id, payload
        )
        _, _ = await _get_or_create_wallets(session, host_id)
        escrow = await finance_repository.create_escrow_account(
            session, reservation_id, host_id, host_amount
        )

    if escrow.status not in (EscrowStatus.CREATED, EscrowStatus.HELD):
        return escrow

    checked_in_at = payload.get("checked_in_at")
    if checked_in_at:
        checkin_dt = datetime.fromisoformat(checked_in_at)
        if checkin_dt.tzinfo is None:
            checkin_dt = checkin_dt.replace(tzinfo=UTC)
    else:
        checkin_dt = datetime.now(UTC)

    hold_until = checkin_dt + timedelta(hours=ESCROW_RELEASE_HOURS)
    escrow.hold_until = hold_until
    escrow.status = EscrowStatus.HELD
    session.add(escrow)
    await session.flush()

    celery_app.send_task(
        "app.finance.tasks.release_escrow",
        args=(escrow.id,),
        eta=hold_until,
    )

    return escrow


async def release_escrow(
    session: AsyncSession, escrow_id: str, force: bool = False
) -> EscrowAccount | None:
    escrow = await finance_repository.get_escrow_by_id(session, escrow_id)
    if escrow is None:
        return None

    if escrow.status in (EscrowStatus.REFUNDED, EscrowStatus.DISPUTED):
        return escrow
    if escrow.status == EscrowStatus.RELEASED:
        return escrow

    if not force and escrow.status == EscrowStatus.HELD:
        if escrow.hold_until and datetime.now(UTC) < escrow.hold_until:
            raise ConflictError("Escrow hold period has not elapsed")

    reservation = await _reservation_or_none(session, escrow.reservation_id)
    if reservation is None:
        raise NotFoundError("Reservation not found")

    key = _idempotency_key("escrow-release", escrow.reservation_id)
    existing = await finance_repository.get_transaction_by_idempotency_key(session, key)
    if existing is not None:
        return escrow

    total = escrow.amount_egp
    host_amount = reservation.host_amount_egp
    platform_revenue = total - host_amount

    _, host_wallet = await _get_or_create_wallets(session, escrow.host_id)

    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.ESCROW_RELEASE,
        amount_egp=total,
        reservation_id=escrow.reservation_id,
        idempotency_key=key,
        status=TransactionStatus.COMPLETED,
    )

    await _post_ledger_for_escrow_release(
        session, tx, escrow, host_wallet, host_amount, platform_revenue
    )

    escrow.status = EscrowStatus.RELEASED
    escrow.released_at = datetime.now(UTC)
    session.add(escrow)
    await session.flush()

    await write_event(
        session,
        aggregate_type="EscrowAccount",
        aggregate_id=UUID(escrow.id),
        event_type="finance.escrow_released",
        payload={
            "escrow_account_id": escrow.id,
            "reservation_id": escrow.reservation_id,
            "host_id": escrow.host_id,
            "released_amount_egp": host_amount,
        },
    )

    return escrow


async def handle_cancel_event(
    session: AsyncSession, payload: dict[str, Any]
) -> EscrowAccount | None:
    reservation_id = payload.get("reservation_id")
    if not reservation_id:
        return None

    refund_amount = payload.get("refund_amount_egp", 0)
    escrow = await finance_repository.get_escrow_by_reservation(session, reservation_id)
    if escrow is None:
        return None

    if escrow.status in (EscrowStatus.REFUNDED, EscrowStatus.DISPUTED):
        return escrow

    key = _idempotency_key("escrow-refund", reservation_id)
    existing = await finance_repository.get_transaction_by_idempotency_key(session, key)
    if existing is not None:
        return escrow

    total = escrow.amount_egp
    if refund_amount > total:
        refund_amount = total
    retained = total - refund_amount

    platform_wallet, _ = await _get_or_create_wallets(session, escrow.host_id)

    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.ESCROW_REFUND,
        amount_egp=refund_amount,
        reservation_id=reservation_id,
        idempotency_key=key,
        status=TransactionStatus.COMPLETED,
    )

    await _post_ledger_for_escrow_refund(
        session, tx, escrow, platform_wallet, refund_amount, retained
    )

    escrow.status = EscrowStatus.REFUNDED
    escrow.refunded_at = datetime.now(UTC)
    session.add(escrow)
    await session.flush()

    await write_event(
        session,
        aggregate_type="EscrowAccount",
        aggregate_id=UUID(escrow.id),
        event_type="finance.refund_processed",
        payload={
            "reservation_id": reservation_id,
            "guest_id": payload.get("guest_id"),
            "refund_amount_egp": refund_amount,
            "refund_method": "ORIGINAL_PAYMENT_METHOD",
            "expected_days": 5,
        },
    )

    return escrow


async def manual_hold_escrow(
    session: AsyncSession, escrow_id: str, hold_hours: int | None = None
) -> EscrowAccount:
    escrow = await finance_repository.get_escrow_by_id(session, escrow_id)
    if escrow is None:
        raise NotFoundError("Escrow not found")
    if escrow.status in (EscrowStatus.RELEASED, EscrowStatus.REFUNDED):
        raise ConflictError("Cannot hold a released or refunded escrow")

    hours = hold_hours or ESCROW_RELEASE_HOURS
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) + timedelta(hours=hours)
    session.add(escrow)
    await session.flush()
    return escrow


async def manual_release_escrow(
    session: AsyncSession, escrow_id: str
) -> EscrowAccount | None:
    return await release_escrow(session, escrow_id, force=True)


async def request_payout(
    session: AsyncSession,
    host_id: str,
    wallet_id: str,
    amount_egp: int,
    bank_account_info: dict[str, Any],
    provider: str | None = None,
) -> PayoutRequest:
    wallet = await finance_repository.get_wallet_by_id(session, wallet_id)
    if wallet is None:
        raise NotFoundError("Wallet not found")
    if wallet.owner_id != host_id:
        raise ValidationError("Wallet does not belong to host")
    if wallet.available_balance_egp < amount_egp:
        raise ValidationError("Insufficient available balance")

    wallet.available_balance_egp -= amount_egp
    session.add(wallet)

    payout = await finance_repository.create_payout_request(
        session,
        wallet_id=wallet_id,
        host_id=host_id,
        amount_egp=amount_egp,
        bank_account_info=bank_account_info,
        provider=provider,
    )
    await session.flush()
    return payout


async def process_payout(
    session: AsyncSession, payout_id: str, provider: str | None = None
) -> PayoutRequest:
    payout = await finance_repository.get_payout_request_by_id(session, payout_id)
    if payout is None:
        raise NotFoundError("Payout request not found")
    if payout.status != PayoutStatus.PENDING:
        raise ConflictError("Payout request is not pending")

    wallet = await finance_repository.get_wallet_by_id(session, payout.wallet_id)
    if wallet is None:
        raise NotFoundError("Wallet not found")
    if wallet.balance_egp < payout.amount_egp:
        await finance_repository.update_payout_status(
            session, payout, PayoutStatus.FAILED, failure_reason="Insufficient balance"
        )
        wallet.available_balance_egp += payout.amount_egp
        session.add(wallet)
        await session.flush()
        raise ConflictError("Insufficient wallet balance")

    await finance_repository.update_payout_status(
        session, payout, PayoutStatus.PROCESSING
    )

    selected_provider = provider or payout.provider or PaymentProvider.PAYMOB
    payout_fee = 0

    bank_info = payout.bank_account_info or {}
    if selected_provider == PaymentProvider.PAYMOB:
        success, provider_ref, payout_fee = await providers.paymob_payout(
            payout.host_id,
            payout.amount_egp,
            bank_info,
        )
    elif selected_provider == PaymentProvider.STRIPE:
        success, provider_ref, payout_fee = await providers.stripe_payout(
            payout.host_id,
            payout.amount_egp,
            bank_info,
        )
    else:
        success, provider_ref, payout_fee = True, f"internal-{payout.id}", 0

    if not success:
        await finance_repository.update_payout_status(
            session, payout, PayoutStatus.FAILED, failure_reason=provider_ref
        )
        wallet.available_balance_egp += payout.amount_egp
        session.add(wallet)
        await session.flush()
        raise ConflictError(f"Payout failed: {provider_ref}")

    platform_wallet = await finance_repository.get_platform_wallet(session)

    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.PAYOUT,
        amount_egp=payout.amount_egp,
        provider=selected_provider,
        provider_ref=provider_ref,
        idempotency_key=f"finance-payout-{payout.id}",
        status=TransactionStatus.COMPLETED,
    )

    await _post_ledger_for_payout(
        session, tx, wallet, platform_wallet, payout.amount_egp, payout_fee
    )

    await finance_repository.update_payout_status(
        session, payout, PayoutStatus.COMPLETED, provider_ref=provider_ref
    )
    await session.refresh(payout)

    await write_event(
        session,
        aggregate_type="PayoutRequest",
        aggregate_id=UUID(payout.id),
        event_type="finance.payout_dispatched",
        payload={
            "payout_instruction_id": payout.id,
            "host_id": payout.host_id,
            "amount_egp": payout.amount_egp,
            "bank_account_last4": _bank_last4(payout.bank_account_info),
        },
    )

    return payout


async def handle_manual_payment_verified(
    session: AsyncSession,
    payment_id: str,
    booking_id: str,
    host_id: str,
    amount_egp: int,
) -> None:
    """Credit host wallet when a manual payment is verified by admin.

    This bridges the manual booking/payment flow to the finance system so
    that hosts can request payouts after a confirmed booking.

    Applies the Closed Alpha commercial rule:
    - Host: 0% commission for first ALPHA_HOST_FREE_BOOKINGS completed bookings, then standard rate.
    - Guest: 0% service fee for first ALPHA_GUEST_FREE_BOOKINGS completed bookings globally, then standard rate.
    """
    from app.bookings import repository as bookings_repository
    from app.config import settings

    key = f"finance-manual-payment-{payment_id}"
    existing = await finance_repository.get_transaction_by_idempotency_key(
        session, key
    )
    if existing is not None:
        return

    host_completed = await bookings_repository.count_host_completed_bookings(
        session, host_id, exclude_booking_id=booking_id
    )
    global_completed = await bookings_repository.count_global_completed_bookings(
        session, exclude_booking_id=booking_id
    )

    if host_completed < settings.ALPHA_HOST_FREE_BOOKINGS:
        host_commission_rate = 0.0
    else:
        host_commission_rate = settings.HOST_COMMISSION_PCT

    if global_completed < settings.ALPHA_GUEST_FREE_BOOKINGS:
        guest_fee_rate = 0.0
    else:
        guest_fee_rate = settings.GUEST_SERVICE_FEE_PCT

    platform_fee = int(round(amount_egp * settings.PLATFORM_TAKE_RATE_PCT))
    host_commission = int(round(amount_egp * host_commission_rate))
    guest_fee = int(round(amount_egp * guest_fee_rate))
    host_amount = amount_egp - host_commission - platform_fee
    platform_revenue = host_commission + platform_fee

    platform_wallet, host_wallet = await _get_or_create_wallets(session, host_id)

    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.PAYMENT_CAPTURE,
        amount_egp=amount_egp,
        idempotency_key=key,
        status=TransactionStatus.COMPLETED,
    )

    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.PLATFORM_CASH,
        account_type=AccountType.ASSET,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=amount_egp,
        wallet=platform_wallet,
        description=f"Manual payment received (booking {booking_id})",
    )

    await finance_repository.create_ledger_entry(
        session,
        transaction_id=tx.id,
        ledger_account=LedgerAccount.HOST_PAYABLE,
        account_type=AccountType.LIABILITY,
        entry_type=LedgerEntryType.CREDIT,
        amount_egp=host_amount,
        wallet=host_wallet,
        description=f"Host payout owed (booking {booking_id})",
    )

    if platform_revenue > 0:
        await finance_repository.create_ledger_entry(
            session,
            transaction_id=tx.id,
            ledger_account=LedgerAccount.PLATFORM_REVENUE,
            account_type=AccountType.REVENUE,
            entry_type=LedgerEntryType.CREDIT,
            amount_egp=platform_revenue,
            description=f"Platform revenue (booking {booking_id})",
        )

    await write_event(
        session,
        aggregate_type="FinancialTransaction",
        aggregate_id=UUID(tx.id),
        event_type="finance.manual_payment_captured",
        payload={
            "payment_id": payment_id,
            "booking_id": booking_id,
            "host_id": host_id,
            "amount_egp": amount_egp,
            "host_amount_egp": host_amount,
            "platform_revenue_egp": platform_revenue,
            "host_commission_rate": host_commission_rate,
            "guest_fee_rate": guest_fee_rate,
            "guest_fee_egp": guest_fee,
            "host_completed_bookings": host_completed,
            "global_completed_bookings": global_completed,
        },
    )


def _bank_last4(bank_info: dict[str, Any] | None) -> str | None:
    if not bank_info:
        return None
    account = bank_info.get("account_number") or bank_info.get("iban") or ""
    return account[-4:] if len(account) >= 4 else account
