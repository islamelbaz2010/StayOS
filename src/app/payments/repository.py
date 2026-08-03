from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import PaymentStatus
from .models import Payment


async def create_payment(
    session: AsyncSession,
    booking_id: str,
    guest_id: str,
    host_id: str,
    unit_id: str,
    amount_egp: int,
    nights: int,
    reference_number: str,
    instructions: str,
) -> Payment:
    payment = Payment(
        id=str(uuid4()),
        booking_id=booking_id,
        guest_id=guest_id,
        host_id=host_id,
        unit_id=unit_id,
        status=PaymentStatus.PENDING,
        amount_egp=amount_egp,
        nights=nights,
        reference_number=reference_number,
        instructions=instructions,
    )
    session.add(payment)
    await session.flush()
    await session.refresh(payment)
    return payment


async def get_payment(session: AsyncSession, payment_id: str) -> Payment | None:
    result = await session.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    return result.scalar_one_or_none()


async def get_payment_or_raise(session: AsyncSession, payment_id: str) -> Payment:
    payment = await get_payment(session, payment_id)
    if payment is None:
        from app.shared.exceptions import NotFoundError

        raise NotFoundError("Payment not found")
    return payment


async def get_payment_by_booking(
    session: AsyncSession, booking_id: str
) -> Payment | None:
    result = await session.execute(
        select(Payment).where(Payment.booking_id == booking_id)
    )
    return result.scalar_one_or_none()


async def update_payment(
    session: AsyncSession, payment: Payment, **kwargs: object
) -> Payment:
    for key, value in kwargs.items():
        setattr(payment, key, value)
    session.add(payment)
    await session.flush()
    await session.refresh(payment)
    return payment


async def list_pending_payments(
    session: AsyncSession,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Payment]:
    stmt = (
        select(Payment)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Payment.status == status)
    else:
        stmt = stmt.where(
            Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.PROOF_UPLOADED])
        )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_guest_payments(
    session: AsyncSession,
    guest_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[Payment]:
    stmt = (
        select(Payment)
        .where(Payment.guest_id == guest_id)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
