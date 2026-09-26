"""Admin commercial adjustments — the canonical mechanism for exceptional
commercial treatment (compensation, fee waivers, goodwill credits).

The removed launch waiver proves why this exists: no pricing rule may
silently change what a host or guest pays/receives. Every exception is a
CommercialAdjustment row carrying reason, actor and audit timestamps, and
applying it posts a distinct ``adjustment`` FinancialTransaction plus a
balanced double-entry ledger pair.

Ledger semantics per adjustment type (VAT is never touched — adjustments
do not alter the booking's taxable base):

- ``host_credit``   DR platform_revenue / CR host_payable (host wallet)
- ``host_debit``    DR host_payable (host wallet) / CR platform_revenue
- ``guest_credit``  DR platform_revenue / CR guest_refund_payable
                    (disbursed through the existing refund-settlement path)
- ``guest_debit``   DR guest_refund_payable / CR platform_revenue
                    (reverses a recorded guest liability)
"""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.exceptions import ConflictError, NotFoundError, ValidationError

from . import repository as finance_repository
from .commercial import money
from .constants import (
    AccountType,
    AdjustmentCategory,
    AdjustmentStatus,
    AdjustmentType,
    LedgerAccount,
    LedgerEntryType,
    PaymentProvider,
    TransactionStatus,
    TransactionType,
)
from .models import CommercialAdjustment


async def _validate_targets(
    session: AsyncSession,
    booking_id: str | None,
    user_id: str | None,
    listing_id: str | None,
) -> None:
    """Referenced targets must exist — an adjustment against a phantom
    booking/user would be unauditable."""
    from app.auth.models import User
    from app.bookings.models import Booking
    from app.listings.models import Unit

    if booking_id is not None:
        if await session.scalar(
            select(Booking.id).where(Booking.id == booking_id)
        ) is None:
            raise NotFoundError("Booking not found")
    if user_id is not None:
        if await session.scalar(
            select(User.id).where(User.id == user_id)
        ) is None:
            raise NotFoundError("User not found")
    if listing_id is not None:
        if await session.scalar(
            select(Unit.id).where(Unit.id == listing_id)
        ) is None:
            raise NotFoundError("Listing not found")


async def create_adjustment(
    session: AsyncSession,
    *,
    actor_id: str,
    adjustment_type: str,
    category: str,
    amount_egp,
    reason: str,
    booking_id: str | None = None,
    user_id: str | None = None,
    listing_id: str | None = None,
    requested_by_id: str | None = None,
    internal_note: str | None = None,
    customer_note: str | None = None,
) -> CommercialAdjustment:
    try:
        AdjustmentType(adjustment_type)
        AdjustmentCategory(category)
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc
    if adjustment_type.startswith("host_") and user_id is None and booking_id is None:
        raise ValidationError(
            "Host adjustments require a target user or booking"
        )
    if adjustment_type.startswith("guest_") and user_id is None and booking_id is None:
        raise ValidationError(
            "Guest adjustments require a target user or booking"
        )
    amount = money(amount_egp)
    if amount <= 0:
        raise ValidationError("Adjustment amount must be positive")
    if not reason or not reason.strip():
        raise ValidationError("Adjustment reason is required")
    await _validate_targets(session, booking_id, user_id, listing_id)

    adjustment = CommercialAdjustment(
        id=str(uuid4()),
        booking_id=booking_id,
        user_id=user_id,
        listing_id=listing_id,
        adjustment_type=adjustment_type,
        category=category,
        amount_egp=amount,
        reason=reason.strip(),
        internal_note=internal_note,
        customer_note=customer_note,
        # A request logged on behalf of a host/guest needs a decision;
        # an adjustment the admin records directly is already decided.
        status=(
            AdjustmentStatus.PENDING
            if requested_by_id is not None
            else AdjustmentStatus.APPROVED
        ),
        requested_by_id=requested_by_id,
        created_by_id=actor_id,
        decided_by_id=None if requested_by_id is not None else actor_id,
        decided_at=None if requested_by_id is not None else datetime.now(UTC),
    )
    session.add(adjustment)
    await session.flush()
    return adjustment


async def get_adjustment(
    session: AsyncSession, adjustment_id: str
) -> CommercialAdjustment:
    adjustment = await session.get(CommercialAdjustment, adjustment_id)
    if adjustment is None:
        raise NotFoundError("Adjustment not found")
    return adjustment


async def list_adjustments(
    session: AsyncSession,
    *,
    status: str | None = None,
    adjustment_type: str | None = None,
    booking_id: str | None = None,
    user_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[CommercialAdjustment]:
    stmt = select(CommercialAdjustment).order_by(
        CommercialAdjustment.created_at.desc()
    )
    if status:
        stmt = stmt.where(CommercialAdjustment.status == status)
    if adjustment_type:
        stmt = stmt.where(
            CommercialAdjustment.adjustment_type == adjustment_type
        )
    if booking_id:
        stmt = stmt.where(CommercialAdjustment.booking_id == booking_id)
    if user_id:
        stmt = stmt.where(CommercialAdjustment.user_id == user_id)
    result = await session.execute(stmt.limit(limit).offset(offset))
    return list(result.scalars().all())


def _require_status(
    adjustment: CommercialAdjustment, *allowed: str
) -> None:
    if adjustment.status not in allowed:
        raise ConflictError(
            f"Adjustment is {adjustment.status}; expected "
            f"{' or '.join(allowed)}"
        )


async def decide_adjustment(
    session: AsyncSession,
    adjustment_id: str,
    *,
    actor_id: str,
    approve: bool,
) -> CommercialAdjustment:
    adjustment = await get_adjustment(session, adjustment_id)
    _require_status(adjustment, AdjustmentStatus.PENDING)
    adjustment.status = (
        AdjustmentStatus.APPROVED if approve else AdjustmentStatus.REJECTED
    )
    adjustment.decided_by_id = actor_id
    adjustment.decided_at = datetime.now(UTC)
    session.add(adjustment)
    await session.flush()
    return adjustment


async def cancel_adjustment(
    session: AsyncSession, adjustment_id: str
) -> CommercialAdjustment:
    adjustment = await get_adjustment(session, adjustment_id)
    _require_status(
        adjustment, AdjustmentStatus.PENDING, AdjustmentStatus.APPROVED
    )
    adjustment.status = AdjustmentStatus.CANCELLED
    session.add(adjustment)
    await session.flush()
    return adjustment


async def apply_adjustment(
    session: AsyncSession, adjustment_id: str
) -> CommercialAdjustment:
    """Post the approved adjustment to the financial ledger.

    Idempotent via a per-adjustment idempotency key — re-applying a
    settled adjustment returns it unchanged. The booking's stored amounts
    are never touched: the adjustment is its own transaction.
    """
    adjustment = await get_adjustment(session, adjustment_id)
    _require_status(adjustment, AdjustmentStatus.APPROVED)

    key = f"adjustment:{adjustment.id}"
    existing = await finance_repository.get_transaction_by_idempotency_key(
        session, key
    )
    if existing is not None:
        adjustment.status = AdjustmentStatus.APPLIED
        adjustment.applied_at = adjustment.applied_at or datetime.now(UTC)
        adjustment.financial_transaction_id = existing.id
        session.add(adjustment)
        await session.flush()
        return adjustment

    amount = adjustment.amount_egp
    tx = await finance_repository.create_financial_transaction(
        session,
        transaction_type=TransactionType.ADJUSTMENT,
        amount_egp=amount,
        reservation_id=adjustment.booking_id,
        provider=PaymentProvider.INTERNAL,
        idempotency_key=key,
        provider_metadata={
            "adjustment_id": adjustment.id,
            "adjustment_type": adjustment.adjustment_type,
            "category": adjustment.category,
            "created_by_id": adjustment.created_by_id,
        },
        status=TransactionStatus.COMPLETED,
    )

    adj_type = AdjustmentType(adjustment.adjustment_type)
    if adj_type == AdjustmentType.HOST_CREDIT:
        # Platform funds a host credit: revenue down, host payable up.
        wallet_owner = adjustment.user_id
        if wallet_owner is None and adjustment.booking_id is not None:
            wallet_owner = await _booking_host_id(session, adjustment.booking_id)
        host_wallet = await finance_repository.get_host_wallet(
            session, wallet_owner
        )
        await _pair(
            session,
            tx.id,
            debit=(LedgerAccount.PLATFORM_REVENUE, AccountType.REVENUE, None),
            credit=(LedgerAccount.HOST_PAYABLE, AccountType.LIABILITY, host_wallet),
            amount=amount,
            description="Admin host credit adjustment",
        )
    elif adj_type == AdjustmentType.HOST_DEBIT:
        wallet_owner = adjustment.user_id
        if wallet_owner is None and adjustment.booking_id is not None:
            wallet_owner = await _booking_host_id(session, adjustment.booking_id)
        host_wallet = await finance_repository.get_host_wallet(
            session, wallet_owner
        )
        await _pair(
            session,
            tx.id,
            debit=(LedgerAccount.HOST_PAYABLE, AccountType.LIABILITY, host_wallet),
            credit=(LedgerAccount.PLATFORM_REVENUE, AccountType.REVENUE, None),
            amount=amount,
            description="Admin host debit adjustment",
        )
        # _update_balance treats liability debits as payout settlement and
        # leaves available untouched — correct for payouts, wrong for a
        # debit adjustment: the reclaimed amount must also stop being
        # withdrawable. Negative available is fine — future escrow
        # releases top it back up.
        host_wallet.available_balance_egp -= amount
        session.add(host_wallet)
    elif adj_type == AdjustmentType.GUEST_CREDIT:
        # Owed to the guest — settled through the existing
        # guest-refund-payable disbursement path.
        await _pair(
            session,
            tx.id,
            debit=(LedgerAccount.PLATFORM_REVENUE, AccountType.REVENUE, None),
            credit=(
                LedgerAccount.GUEST_REFUND_PAYABLE,
                AccountType.LIABILITY,
                None,
            ),
            amount=amount,
            description="Admin guest credit adjustment",
        )
    else:  # GUEST_DEBIT
        await _pair(
            session,
            tx.id,
            debit=(
                LedgerAccount.GUEST_REFUND_PAYABLE,
                AccountType.LIABILITY,
                None,
            ),
            credit=(LedgerAccount.PLATFORM_REVENUE, AccountType.REVENUE, None),
            amount=amount,
            description="Admin guest debit adjustment",
        )

    adjustment.status = AdjustmentStatus.APPLIED
    adjustment.applied_at = datetime.now(UTC)
    adjustment.financial_transaction_id = tx.id
    session.add(adjustment)
    await session.flush()
    return adjustment


async def _booking_host_id(session: AsyncSession, booking_id: str) -> str:
    from app.payments.models import Payment

    host_id = await session.scalar(
        select(Payment.host_id).where(Payment.booking_id == booking_id)
    )
    if host_id is None:
        raise NotFoundError("Payment not found for booking")
    return host_id


async def _pair(
    session: AsyncSession,
    transaction_id: str,
    *,
    debit: tuple[str, str, Any],
    credit: tuple[str, str, Any],
    amount: Decimal,
    description: str,
) -> None:
    """Post a balanced DR/CR ledger pair. Each tuple is
    (ledger_account, account_type, wallet_or_None)."""
    debit_account, debit_type, debit_wallet = debit
    credit_account, credit_type, credit_wallet = credit
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=transaction_id,
        ledger_account=debit_account,
        account_type=debit_type,
        entry_type=LedgerEntryType.DEBIT,
        amount_egp=amount,
        wallet=debit_wallet,
        description=description,
    )
    await finance_repository.create_ledger_entry(
        session,
        transaction_id=transaction_id,
        ledger_account=credit_account,
        account_type=credit_type,
        entry_type=LedgerEntryType.CREDIT,
        amount_egp=amount,
        wallet=credit_wallet,
        description=description,
    )
