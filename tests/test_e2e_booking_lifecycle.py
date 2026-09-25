"""End-to-end booking → payment → escrow → payout lifecycle on a real DB.

Proves the canonical commercial model end to end with a deterministic
booking — not via mocks:

    accommodation 3000 + cleaning 200 = taxable 3200
    VAT 14% on taxable = 448 → guest total 3648
    StayOS share 12% of accommodation = 360 (180 host-side + 180 guest-side)
    host net = 3200 − 360 = 2840

Guest contract: only accommodation / cleaning / VAT / total are visible —
no 12%, no 6%, no service-fee line, no host economics.

The alpha free-bookings incentive is exercised honestly: the host is
seeded with 3 prior completed bookings so the 12% share is NOT waived.

Runs against a real Postgres (default stayos_e2e). Skips when the
database is unreachable so CI without a DB does not fail.
"""

from __future__ import annotations

import os
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, sessionmaker

E2E_DATABASE_URL = os.environ.get(
    "E2E_DATABASE_URL",
    "postgresql+asyncpg://ahmed@localhost:5432/stayos_e2e",
)

NIGHTLY_EGP = 1000
CLEANING_EGP = 200
NIGHTS = 3
ACCOMMODATION_EGP = NIGHTLY_EGP * NIGHTS  # 3000
TAXABLE_EGP = ACCOMMODATION_EGP + CLEANING_EGP  # 3200
VAT_EGP = round(TAXABLE_EGP * 0.14)  # 448
GUEST_TOTAL_EGP = TAXABLE_EGP + VAT_EGP  # 3648
PLATFORM_SHARE_EGP = round(ACCOMMODATION_EGP * 0.12)  # 360
HOST_SIDE_EGP = round(ACCOMMODATION_EGP * 0.06)  # 180
GUEST_SIDE_EGP = PLATFORM_SHARE_EGP - HOST_SIDE_EGP  # 180
HOST_NET_EGP = TAXABLE_EGP - PLATFORM_SHARE_EGP  # 2840

HOST_ID = "e2e-host-0000-0000-000000000001"
GUEST_ID = "e2e-guest-0000-0000-00000000001"
ADMIN_ID = "e2e-admin-000-0000-00000000001"
UNIT_ID = "e2e-unit-0000-0000-000000000001"


async def _engine():
    engine = create_async_engine(E2E_DATABASE_URL)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        await engine.dispose()
        pytest.skip("E2E database not reachable")
    return engine


async def _seed(session: AsyncSession) -> None:
    from geoalchemy2 import WKTElement

    from app.auth.models import User
    from app.bookings.models import Booking
    from app.listings.models import Unit, UnitListing

    async def upsert_user(**kw):
        u = await session.get(User, kw["id"])
        if u is None:
            session.add(User(**kw))
        return kw["id"]

    await upsert_user(
        id=HOST_ID, phone_number="+201000000100", email="e2e-host@stayos.test",
        display_name="E2E Host", locale="en", role="host", kyc_status="verified",
    )
    await upsert_user(
        id=GUEST_ID, phone_number="+201000000101", email="e2e-guest@stayos.test",
        display_name="E2E Guest", locale="en", role="guest", kyc_status="verified",
    )
    await upsert_user(
        id=ADMIN_ID, phone_number="+201000000102", email="e2e-admin@stayos.test",
        display_name="E2E Admin", locale="en", role="admin", kyc_status="verified",
    )

    unit = await session.get(Unit, UNIT_ID)
    if unit is None:
        unit = Unit(
            id=UNIT_ID,
            host_id=HOST_ID,
            property_type="APARTMENT",
            status="LISTED",
            coordinates=WKTElement("POINT(29.95 31.21)", srid=4326),
            governorate="Alexandria",
            city="Alexandria",
            district="Smouha",
            max_guests=4,
            bedrooms=2,
            bathrooms=1,
            beds=2,
        )
        session.add(unit)
        await session.flush()
        session.add(
            UnitListing(
                unit_id=UNIT_ID,
                title_ar="E2E شقة الإسكندرية",
                title_en="E2E Alexandria Flat",
                description_ar="Deterministic E2E listing",
                base_price_egp=NIGHTLY_EGP,
                cleaning_fee_egp=CLEANING_EGP,
                instant_book=True,
                weekly_discount_pct=0,
                monthly_discount_pct=0,
            )
        )
    # Past completed bookings for the host → alpha share waiver does NOT apply.
    for i in range(3):
        bid = f"e2e-past-{i:04d}-0000-00000000000{i}"
        if await session.get(Booking, bid) is None:
            session.add(
                Booking(
                    id=bid, unit_id=UNIT_ID, guest_id=GUEST_ID,
                    status="completed",
                    check_in=date(2026, 1, 10 + i * 7),
                    check_out=date(2026, 1, 12 + i * 7),
                    adults=1,
                )
            )
    await session.flush()


async def _cleanup_prior_runs(session: AsyncSession) -> None:
    """Remove leftover E2E bookings (and dependents) so re-runs never
    collide on the availability conflict check. Scoped to our fixture
    unit only — finance rows from the first successful run are fine to
    leave since assertions filter by reservation id."""
    from app.bookings.models import Booking

    rows = (
        await session.execute(
            select(Booking.id).where(
                Booking.unit_id == UNIT_ID,
                Booking.check_in >= date.today(),
            )
        )
    ).scalars().all()
    for bid in rows:
        await session.execute(text("DELETE FROM finance.ledger_entries WHERE transaction_id IN (SELECT id FROM finance.financial_transactions WHERE reservation_id = :b)"), {"b": bid})
        await session.execute(text("DELETE FROM finance.financial_transactions WHERE reservation_id = :b"), {"b": bid})
        await session.execute(text("DELETE FROM finance.escrow_accounts WHERE reservation_id = :b"), {"b": bid})
        await session.execute(text("DELETE FROM payment.payments WHERE booking_id = :b"), {"b": bid})
        await session.execute(text("DELETE FROM messaging.messages WHERE conversation_id IN (SELECT id FROM messaging.conversations WHERE booking_id = :b)"), {"b": bid})
        await session.execute(text("DELETE FROM messaging.conversation_participants WHERE conversation_id IN (SELECT id FROM messaging.conversations WHERE booking_id = :b)"), {"b": bid})
        await session.execute(text("DELETE FROM messaging.conversations WHERE booking_id = :b"), {"b": bid})
        await session.execute(text("DELETE FROM booking.bookings WHERE id = :b"), {"b": bid})
    await session.flush()


@pytest.mark.asyncio
async def test_full_booking_lifecycle_12pct_economics(monkeypatch) -> None:
    engine = await _engine()
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from app.bookings.schemas import BookingCreate
    from app.bookings import services as booking_services
    from app.finance import services as finance_services
    from app.finance.constants import EscrowStatus, LedgerAccount, LedgerEntryType
    from app.finance.models import EscrowAccount, LedgerEntry
    from app.payments import services as payment_services
    from app.payments.models import Payment
    from app.auth.models import User
    from app.listings.models import Unit

    # The check-in consumer schedules a Celery release task — no broker here.
    monkeypatch.setattr(
        "app.finance.services.celery_app.send_task", lambda *a, **k: None
    )

    check_in = date.today() + timedelta(days=30)
    check_out = check_in + timedelta(days=NIGHTS)

    async with factory() as session:
        await _seed(session)
        await _cleanup_prior_runs(session)
        await session.commit()

    # ---- 1. Guest books the Instant Book listing -------------------------
    async with factory() as session:
        guest = await session.get(User, GUEST_ID)
        resp = await booking_services.create_booking(
            session, guest,
            BookingCreate(
                unit_id=UNIT_ID, check_in=check_in, check_out=check_out, adults=2
            ),
        )
        await session.commit()
        booking_id = resp.id
        assert str(resp.status) == "accepted"  # Instant Book — no host step

        payment = (
            await session.execute(
                select(Payment)
                .options(
                    selectinload(Payment.unit).selectinload(Unit.listing),
                    selectinload(Payment.unit).selectinload(Unit.photos),
                )
                .where(Payment.booking_id == booking_id)
            )
        ).scalar_one()

        # Server-authoritative quote persisted on the payment row.
        assert payment.amount_egp == GUEST_TOTAL_EGP
        assert payment.vat_egp == VAT_EGP
        assert payment.cleaning_fee_egp == CLEANING_EGP
        assert payment.nights == NIGHTS

        # Guest-facing contract: accommodation + cleaning + VAT == total;
        # internal economics stay hidden.
        guest_view = payment_services._to_response(payment)
        assert guest_view.accommodation_amount_egp == ACCOMMODATION_EGP
        assert guest_view.cleaning_fee_egp == CLEANING_EGP
        assert guest_view.vat_egp == VAT_EGP
        assert guest_view.amount_egp == GUEST_TOTAL_EGP
        assert (
            guest_view.accommodation_amount_egp
            + guest_view.cleaning_fee_egp
            + guest_view.vat_egp
            == guest_view.amount_egp
        )
        assert guest_view.guest_service_fee_egp is None

    # ---- 2. Payment confirmed → escrow created (full amount held) --------
    async with factory() as session:
        payment = (
            await session.execute(
                select(Payment).where(Payment.booking_id == booking_id)
            )
        ).scalar_one()
        escrow = await finance_services.handle_payment_confirmed(
            session,
            {
                "reservation_id": booking_id,
                "payment_id": payment.id,
                "amount_egp": payment.amount_egp,
                "host_id": payment.host_id,
            },
        )
        await session.commit()
        assert escrow is not None
        assert escrow.amount_egp == GUEST_TOTAL_EGP

    # ---- 3. Check-in → escrow HELD ---------------------------------------
    async with factory() as session:
        escrow = await finance_services.handle_checkin_event(
            session,
            {
                "reservation_id": booking_id,
                "checked_in_at": (
                    datetime.now(UTC) - timedelta(days=4)
                ).isoformat(),
            },
        )
        await session.commit()
        assert escrow.status == EscrowStatus.HELD
        # Release window already elapsed (checked in 4 days ago).

    # ---- 4. Escrow release → canonical 3-way split ------------------------
    async with factory() as session:
        escrow = (
            await session.execute(
                select(EscrowAccount).where(EscrowAccount.reservation_id == booking_id)
            )
        ).scalar_one()
        released = await finance_services.release_escrow(session, escrow.id)
        await session.commit()
        assert released.status == EscrowStatus.RELEASED

        entries = (
            await session.execute(
                select(LedgerEntry).order_by(LedgerEntry.created_at)
            )
        ).scalars().all()
        credits = {
            (e.ledger_account, e.entry_type): e.amount_egp
            for e in entries if e.entry_type == LedgerEntryType.CREDIT
        }
        assert credits[(LedgerAccount.HOST_PAYABLE, "credit")] == HOST_NET_EGP
        assert credits[(LedgerAccount.PLATFORM_REVENUE, "credit")] == PLATFORM_SHARE_EGP
        assert credits[(LedgerAccount.VAT_PAYABLE, "credit")] == VAT_EGP

    # ---- 5. Internal 12% = 6% host-side + 6% guest-side -------------------
    async with factory() as session:
        payment = (
            await session.execute(
                select(Payment).where(Payment.booking_id == booking_id)
            )
        ).scalar_one()
        economics, waived = await finance_services.booking_economics(session, payment)
        assert waived is False  # host already completed ≥ alpha threshold
        assert economics.accommodation_egp == ACCOMMODATION_EGP
        assert economics.taxable_amount_egp == TAXABLE_EGP
        assert economics.vat_egp == VAT_EGP
        assert economics.guest_total_egp == GUEST_TOTAL_EGP
        assert economics.platform_share_egp == PLATFORM_SHARE_EGP
        assert economics.host_side_share_egp == HOST_SIDE_EGP
        assert economics.guest_side_share_egp == GUEST_SIDE_EGP
        assert economics.host_net_egp == HOST_NET_EGP
        assert (
            economics.host_net_egp
            + economics.platform_share_egp
            + economics.vat_egp
            == payment.amount_egp
        )

    await engine.dispose()
