from datetime import date
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.listings.constants import CalendarStatus
from app.listings.models import CalendarRule, Unit
from app.shared.exceptions import ConflictError, NotFoundError
from app.shared.outbox import write_event

from .constants import PaymentStatus, ReservationStatus
from .models import PaymentIntent, PromoApplication, PromoCode, Reservation


async def get_reservation_with_relations(
    session: AsyncSession, reservation_id: str
) -> Reservation | None:
    result = await session.execute(
        select(Reservation)
        .options(
            selectinload(Reservation.payment_intents),
            selectinload(Reservation.promo_applications).selectinload(
                PromoApplication.promo_code
            ),
        )
        .where(Reservation.id == reservation_id)
    )
    return result.scalar_one_or_none()


async def acquire_calendar_lock(
    session: AsyncSession,
    unit_id: str,
    reservation_id: str,
    check_in: date,
    check_out: date,
) -> None:
    # Lock the unit row to serialize concurrent booking attempts for this unit.
    unit_result = await session.execute(
        select(Unit).where(Unit.id == unit_id).with_for_update()
    )
    unit = unit_result.scalar_one_or_none()
    if unit is None:
        raise NotFoundError("Unit not found")

    conflict = await session.execute(
        select(CalendarRule)
        .where(
            CalendarRule.unit_id == unit_id,
            CalendarRule.date_from < check_out,
            CalendarRule.date_to > check_in,
            CalendarRule.status != CalendarStatus.AVAILABLE,
        )
        .with_for_update()
    )
    if conflict.scalar_one_or_none() is not None:
        raise ConflictError("Requested dates are not available")

    session.add(
        CalendarRule(
            id=str(uuid4()),
            unit_id=unit_id,
            date_from=check_in,
            date_to=check_out,
            status=CalendarStatus.HOLD,
            reservation_id=reservation_id,
        )
    )
    try:
        await session.flush()
    except IntegrityError as exc:
        raise ConflictError("Requested dates are not available") from exc


async def confirm_calendar_booking(session: AsyncSession, reservation_id: str) -> None:
    result = await session.execute(
        select(CalendarRule)
        .where(CalendarRule.reservation_id == reservation_id)
        .with_for_update()
    )
    rule = result.scalar_one_or_none()
    if rule is not None:
        rule.status = CalendarStatus.BOOKED
        session.add(rule)
        await session.flush()


async def release_calendar_lock(session: AsyncSession, reservation_id: str) -> None:
    result = await session.execute(
        select(CalendarRule).where(CalendarRule.reservation_id == reservation_id)
    )
    rule = result.scalar_one_or_none()
    if rule is not None:
        await session.delete(rule)
        await session.flush()


async def create_payment_intent(
    session: AsyncSession,
    reservation_id: str,
    provider: str,
    provider_ref: str,
    amount_egp: int,
    provider_metadata: dict[str, Any] | None = None,
) -> PaymentIntent:
    intent = PaymentIntent(
        id=str(uuid4()),
        reservation_id=reservation_id,
        provider=provider,
        provider_ref=provider_ref,
        amount_egp=amount_egp,
        status=PaymentStatus.PENDING,
        provider_metadata=provider_metadata,
    )
    session.add(intent)
    await session.flush()
    await session.refresh(intent)
    return intent


async def get_payment_intent_by_ref(
    session: AsyncSession, reservation_id: str, provider_ref: str
) -> PaymentIntent | None:
    result = await session.execute(
        select(PaymentIntent).where(
            PaymentIntent.reservation_id == reservation_id,
            PaymentIntent.provider_ref == provider_ref,
        )
    )
    return result.scalar_one_or_none()


async def get_payment_intent_by_provider_ref(
    session: AsyncSession, provider_ref: str
) -> PaymentIntent | None:
    result = await session.execute(
        select(PaymentIntent).where(PaymentIntent.provider_ref == provider_ref)
    )
    return result.scalar_one_or_none()


async def update_payment_intent(
    session: AsyncSession, intent: PaymentIntent, **kwargs: object
) -> PaymentIntent:
    for key, value in kwargs.items():
        setattr(intent, key, value)
    session.add(intent)
    await session.flush()
    await session.refresh(intent)
    return intent


async def count_user_reservations(
    session: AsyncSession,
    unit_ids: list[str] | None,
    guest_id: str | None,
    status: ReservationStatus | None,
) -> int:
    stmt = select(func.count(Reservation.id))
    if unit_ids:
        stmt = stmt.where(Reservation.unit_id.in_(unit_ids))
    if guest_id:
        stmt = stmt.where(Reservation.guest_id == guest_id)
    if status:
        stmt = stmt.where(Reservation.status == status)
    result = await session.scalar(stmt)
    return result or 0


async def list_user_reservations(
    session: AsyncSession,
    unit_ids: list[str] | None,
    guest_id: str | None,
    status: ReservationStatus | None,
    offset: int,
    limit: int,
) -> list[Reservation]:
    stmt = (
        select(Reservation)
        .order_by(Reservation.created_at.desc(), Reservation.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if unit_ids:
        stmt = stmt.where(Reservation.unit_id.in_(unit_ids))
    if guest_id:
        stmt = stmt.where(Reservation.guest_id == guest_id)
    if status:
        stmt = stmt.where(Reservation.status == status)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_promo_code_by_code(
    session: AsyncSession, code: str
) -> PromoCode | None:
    result = await session.execute(
        select(PromoCode).where(PromoCode.code == code.upper())
    )
    return result.scalar_one_or_none()


async def create_promo_application(
    session: AsyncSession,
    reservation_id: str,
    promo_code: PromoCode,
    discount_amount_egp: int,
) -> PromoApplication:
    promo_code.uses += 1
    session.add(promo_code)

    application = PromoApplication(
        id=str(uuid4()),
        reservation_id=reservation_id,
        promo_code_id=promo_code.id,
        discount_pct=float(promo_code.discount_pct),
        discount_amount_egp=discount_amount_egp,
    )
    session.add(application)
    await session.flush()
    await session.refresh(application)
    return application


async def write_booking_event(
    session: AsyncSession,
    event_type: str,
    reservation: Reservation,
    extra: dict[str, Any] | None = None,
) -> None:
    payload: dict[str, Any] = {
        "reservation_id": reservation.id,
        "unit_id": reservation.unit_id,
        "guest_id": reservation.guest_id,
        "check_in": reservation.check_in.isoformat(),
        "check_out": reservation.check_out.isoformat(),
        "total_amount_egp": reservation.total_amount_egp,
    }
    if extra:
        payload.update(extra)
    await write_event(
        session, "Reservation", UUID(reservation.id), event_type, payload
    )
