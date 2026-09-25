"""Canonical commercial model tests (Founder decision closure).

Covers the 12% all-inclusive economics, the 6%+6% internal allocation,
guest-facing total-only serialization, discount precedence, custom
offers, the escrow hold/release chain, and idempotency.
"""

import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.config import Settings
from app.finance import commercial
from app.finance import services as fs
from app.finance.constants import EscrowStatus, LedgerAccount, LedgerEntryType


def _s(**kw) -> Settings:
    return Settings(
        JWT_PRIVATE_KEY="x", JWT_PUBLIC_KEY="x",
        ALPHA_HOST_FREE_BOOKINGS=3, ALPHA_GUEST_FREE_BOOKINGS=10, **kw,
    )


# ============================================================
# CANONICAL ENGINE — 12% all-inclusive economics
# ============================================================


def test_platform_share_is_12pct_of_accommodation() -> None:
    e = commercial.compute_booking_economics(1000)
    assert e.taxable_amount_egp == 1120
    assert e.vat_egp == Decimal("156.80")
    assert e.guest_total_egp == Decimal("1276.80")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 1000


def test_internal_6_6_allocation_sums_to_share() -> None:
    e = commercial.compute_booking_economics(1000)
    assert e.guest_side_share_egp == 60
    assert e.host_side_share_egp == 60
    assert e.guest_side_share_egp + e.host_side_share_egp == e.platform_share_egp


def test_cleaning_fee_not_in_fee_base() -> None:
    # 12% applies to accommodation only — cleaning passes through to the
    # host payable untouched. Cleaning IS in the VAT tax base alongside
    # both 6% allocations (accommodation + cleaning + 6% + 6%).
    e = commercial.compute_booking_economics(1000, cleaning_fee_egp=100)
    assert e.taxable_amount_egp == 1220
    assert e.vat_egp == Decimal("170.80")
    assert e.guest_total_egp == Decimal("1390.80")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 1100


def test_guest_pays_taxable_plus_vat() -> None:
    # The guest pays the taxable booking amount plus VAT on top — VAT is
    # a separate tax added to the payable total, not carved out of it.
    e = commercial.compute_booking_economics(2000, 150)
    assert e.taxable_amount_egp == 2390
    assert e.vat_egp == Decimal("334.60")
    assert e.guest_total_egp == Decimal("2724.60")


def test_alpha_waiver_gives_host_full_taxable_amount() -> None:
    e = commercial.compute_booking_economics(1000, platform_share_waived=True)
    assert e.platform_share_egp == 0
    # The waived allocation accrues to the host — payable the full
    # taxable amount (accommodation + cleaning + the collected 12%).
    assert e.host_net_egp == 1120
    # The guest charge is unchanged: the allocations were still paid.
    assert e.host_side_share_egp == 60
    assert e.guest_side_share_egp == 60
    # The waiver affects ONLY the StayOS commercial share — VAT is a
    # separate tax and is never waived by it.
    assert e.vat_egp == Decimal("156.80")
    assert e.guest_total_egp == Decimal("1276.80")


def test_rounding_stays_2dp_and_balanced() -> None:
    for base in (1, 3, 7, 99, 999, 1001, 3333):
        e = commercial.compute_booking_economics(base, 7)
        assert (
            e.host_net_egp + e.platform_share_egp + e.vat_egp
            == e.guest_total_egp
        )
        assert e.host_side_share_egp + e.guest_side_share_egp == e.platform_share_egp
        assert isinstance(e.guest_total_egp, Decimal)
        # Every amount is quantized to piastres (2dp).
        for v in (
            e.guest_total_egp, e.vat_egp, e.taxable_amount_egp,
            e.host_net_egp, e.platform_share_egp,
            e.host_side_share_egp, e.guest_side_share_egp,
        ):
            assert v == v.quantize(Decimal("0.01"))


def test_gross_up_helper_for_host_target() -> None:
    # Host thinking in net terms: under the additive model the host is
    # payable the full base — EGP 1,000 target → taxable 1,120 → guest
    # pays 1,276.80 all-in.
    gross = commercial.guest_all_in_price_for_host_target(1000)
    assert gross == Decimal("1276.80")
    taxable = gross - commercial.vat_inclusive_portion(gross)
    # Decomposing the taxable amount still yields host payable ≥ target.
    assert taxable == Decimal("1120.00")
    e = commercial.compute_booking_economics(
        taxable / (1 + commercial.rate(0.12))
    )
    assert e.host_net_egp >= 1000  # rounding never underpays the host


# ============================================================
# DISCOUNTS — single applicable discount (FD-08/FD-20)
# ============================================================


def test_discount_precedence() -> None:
    from app.listings.pricing import applicable_discount_pct

    listing = MagicMock(
        listing_discount_pct=0, weekly_discount_pct=10, monthly_discount_pct=15
    )
    assert applicable_discount_pct(listing, 5) == 0
    assert applicable_discount_pct(listing, 8) == 10
    assert applicable_discount_pct(listing, 30) == 15
    listing.listing_discount_pct = 20
    assert applicable_discount_pct(listing, 30) == 20  # promo beats LOS


# ============================================================
# PAYMENT CREATION — all-inclusive quote, custom offers
# ============================================================


def _quote_mocks(monkeypatch, listing):
    """Mock the listings lookups used by compute_booking_quote."""
    unit = MagicMock()
    unit.host_id = "host-1"
    unit.listing = listing
    monkeypatch.setattr(
        "app.payments.services.payments_repository.get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        "app.payments.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.payments.services.listings_repository.get_calendar_rules_in_range",
        AsyncMock(return_value=[]),
    )
    # Default: the host has completed bookings beyond the alpha waiver —
    # VAT and platform share apply unless a test overrides the count.
    monkeypatch.setattr(
        "app.payments.services.bookings_repository.count_host_completed_bookings",
        AsyncMock(return_value=10),
    )


def _listing(**over) -> MagicMock:
    listing = MagicMock()
    listing.base_price_egp = 500
    listing.cleaning_fee_egp = 50
    listing.weekend_mult = 1.0
    listing.peak_mult = 1.0
    listing.listing_discount_pct = 0
    listing.weekly_discount_pct = 0
    listing.monthly_discount_pct = 0
    for k, v in over.items():
        setattr(listing, k, v)
    return listing


async def _create_payment(
    monkeypatch, listing, custom_total=None, host_completed: int | None = None
):
    from app.payments import services as ps

    _quote_mocks(monkeypatch, listing)
    if host_completed is not None:
        monkeypatch.setattr(
            "app.payments.services.bookings_repository.count_host_completed_bookings",
            AsyncMock(return_value=host_completed),
        )
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.unit_id = "u1"
    booking.guest_id = "g1"
    booking.check_in = date(2026, 1, 1)
    booking.check_out = date(2026, 1, 5)  # 4 nights
    booking.custom_total_egp = custom_total
    guest = MagicMock()
    guest.id = "g1"
    guest.locale = "ar"
    guest.phone_number = "+123"
    guest.email = "g@e.com"
    guest.display_name = "G"

    captured: dict = {}

    async def _capture(session, **kwargs):
        captured.update(kwargs)
        now = datetime.now(UTC)
        return MagicMock(
            id=str(uuid.uuid4()), booking_id=booking.id, guest_id="g1",
            host_id="host-1", unit_id="u1", status="pending", method="manual",
            provider=None, checkout_url=None,
            amount_egp=kwargs.get("amount_egp", 0), nights=4,
            reference_number="REF", proof_s3_key=None, proof_url=None,
            proof_uploaded_at=None, verified_at=None, verified_by=None,
            rejected_at=None, rejected_by=None, reject_reason=None,
            cancelled_at=None, refund_amount_egp=None, refunded_at=None,
            payment_deadline_at=kwargs.get("payment_deadline_at"),
            proof_rejection_count=0,
            instructions="instr", created_at=now, updated_at=now,
        )

    monkeypatch.setattr(
        "app.payments.services.payments_repository.create_payment", _capture
    )
    monkeypatch.setattr(
        "app.payments.services._emit_outbox_event", AsyncMock()
    )
    await ps.create_payment_for_booking(AsyncMock(), booking, guest)
    return captured


@pytest.mark.asyncio
async def test_payment_is_all_inclusive_no_guest_fee(monkeypatch) -> None:
    kwargs = await _create_payment(monkeypatch, _listing())
    # 500 × 4 nights = 2000 + 50 cleaning → taxable 2000+50+240 = 2290
    # → VAT 14% = 320.60 → guest total 2610.60. Host payable = 2050.
    assert kwargs["amount_egp"] == Decimal("2610.60")
    assert kwargs["vat_egp"] == Decimal("320.60")
    assert kwargs["accommodation_amount_egp"] == 2050
    assert kwargs["guest_service_fee_egp"] == 0


@pytest.mark.asyncio
async def test_weekly_discount_applies(monkeypatch) -> None:
    listing = _listing(weekly_discount_pct=10)
    booking_nights = 8
    from app.payments import services as ps

    _quote_mocks(monkeypatch, listing)
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.unit_id = "u1"
    booking.guest_id = "g1"
    booking.check_in = date(2026, 1, 1)
    booking.check_out = date(2026, 1, 1) + timedelta(days=booking_nights)
    booking.custom_total_egp = None
    guest = MagicMock(locale="ar", id="g1")

    captured: dict = {}

    async def _capture(session, **kwargs):
        captured.update(kwargs)
        now = datetime.now(UTC)
        return MagicMock(
            id=str(uuid.uuid4()), booking_id=booking.id, guest_id="g1",
            host_id="h", unit_id="u1", status="pending", method="manual",
            provider=None, checkout_url=None,
            amount_egp=kwargs["amount_egp"], nights=booking_nights,
            reference_number="R", proof_s3_key=None, proof_url=None,
            proof_uploaded_at=None, verified_at=None, verified_by=None,
            rejected_at=None, rejected_by=None, reject_reason=None,
            cancelled_at=None, refund_amount_egp=None, refunded_at=None,
            payment_deadline_at=None, proof_rejection_count=0,
            instructions="i", created_at=now, updated_at=now,
        )

    monkeypatch.setattr(
        "app.payments.services.payments_repository.create_payment", _capture
    )
    monkeypatch.setattr("app.payments.services._emit_outbox_event", AsyncMock())
    await ps.create_payment_for_booking(AsyncMock(), booking, guest)
    # 500 × 8 = 4000 − 10% = 3600 + 50 cleaning + 432 (12% of 3600)
    # = 4082 taxable + 14% VAT (571.48) = 4653.48.
    assert captured["amount_egp"] == Decimal("4653.48")
    assert captured["vat_egp"] == Decimal("571.48")


@pytest.mark.asyncio
async def test_custom_offer_overrides_listing_price(monkeypatch) -> None:
    # The offered total is the final all-inclusive guest price: the guest
    # pays exactly the offer — VAT is the tax component inside it and the
    # host payable is the 1/1.12 share of the taxable amount
    # (1500 = 1315.79 taxable + 184.21 VAT; host payable 1174.81).
    kwargs = await _create_payment(monkeypatch, _listing(), custom_total=1500)
    assert kwargs["amount_egp"] == Decimal("1500")
    assert kwargs["vat_egp"] == Decimal("184.21")
    assert kwargs["accommodation_amount_egp"] == Decimal("1174.81")
    assert kwargs["cleaning_fee_egp"] == 0


# ============================================================
# GUEST-FACING SERIALIZATION — never expose internal economics
# ============================================================


def test_payment_response_shows_booking_components_hides_service_fee() -> None:
    from app.payments import services as ps

    now = datetime.now(UTC)
    payment = MagicMock()
    payment.id = "p1"
    payment.booking_id = "b1"
    payment.guest_id = "g1"
    payment.host_id = "h1"
    payment.unit_id = "u1"
    payment.status = "verified"
    payment.method = "manual"
    payment.provider = None
    payment.checkout_url = None
    # The column stores the host payable (accommodation 2000 + cleaning
    # 50 = 2050); the guest's Accommodation line is the final
    # all-inclusive total — no VAT, cleaning or fee lines for guests.
    payment.amount_egp = Decimal("2610.60")
    payment.accommodation_amount_egp = Decimal("2050")
    payment.guest_service_fee_egp = 0
    payment.cleaning_fee_egp = 50
    payment.refund_amount_egp = None
    payment.nights = 4
    payment.reference_number = "REF"
    payment.payment_deadline_at = None
    payment.proof_rejection_count = 0
    payment.proof_s3_key = None
    payment.proof_url = None
    payment.proof_uploaded_at = None
    payment.verified_at = now
    payment.verified_by = "a1"
    payment.rejected_at = None
    payment.rejected_by = None
    payment.reject_reason = None
    payment.cancelled_at = None
    payment.refunded_at = None
    payment.instructions = "instr"
    payment.unit = None
    payment.created_at = now
    payment.updated_at = now

    payment.vat_egp = Decimal("320.60")

    guest_view = ps._to_response(payment)  # default: no internal breakdown
    # Guest sees the final all-inclusive price as the single
    # Accommodation figure — no VAT, cleaning or fee components.
    assert guest_view.accommodation_amount_egp == Decimal("2610.60")
    assert guest_view.cleaning_fee_egp is None
    assert guest_view.guest_service_fee_egp is None
    assert guest_view.vat_egp is None
    assert guest_view.amount_egp == Decimal("2610.60")

    admin_view = ps._to_response(payment, include_breakdown=True)
    assert admin_view.accommodation_amount_egp == 2000
    assert admin_view.cleaning_fee_egp == 50
    assert admin_view.guest_service_fee_egp == 0
    assert admin_view.vat_egp == Decimal("320.60")


def test_guest_quote_contract_has_no_internal_fields() -> None:
    """The guest quote exposes only the all-inclusive Accommodation and
    Total — no VAT line, no cleaning, no internal economics."""
    from app.payments.schemas import BookingQuote

    for f in ("accommodation_egp", "total_egp"):
        assert f in BookingQuote.model_fields
    for f in (
        "cleaning_fee_egp", "vat_egp", "nightly_rate_egp",
        "service_fee_egp", "guest_fee_egp", "platform_fee_egp",
        "platform_share_egp", "host_net_egp", "host_amount_egp",
        "taxable_amount_egp",
    ):
        assert f not in BookingQuote.model_fields


def test_reservation_response_nulls_economics_for_guest() -> None:
    """Guest-viewed reservation responses carry total only."""
    from app.reservations.schemas import ReservationResponse

    # Internal economic fields are nullable — guests receive nulls.
    for f in ("host_amount_egp", "platform_fee_egp", "guest_fee_egp"):
        field = ReservationResponse.model_fields[f]
        assert not field.is_required()


# ============================================================
# ESCROW CHAIN — funds held → check-in → 24h → release split
# ============================================================


async def _run_escrow_create(
    amount=Decimal("4058.40"),
    accommodation_amount=Decimal("3200"),
    cleaning_fee=Decimal("200"),
    vat_egp=Decimal("498.40"),
    host_completed=10,
):
    s = _s()
    payment = MagicMock()
    payment.id = "p1"
    payment.booking_id = "b1"
    payment.host_id = "h1"
    # Real rows store the host payable (accommodation+cleaning) in
    # accommodation_amount_egp; the engine recovers the fee base.
    payment.amount_egp = amount
    payment.accommodation_amount_egp = accommodation_amount
    payment.cleaning_fee_egp = cleaning_fee
    # Stored VAT component — NULL/0 on rows predating the VAT column.
    payment.vat_egp = vat_egp

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = amount
    escrow.status = EscrowStatus.CREATED

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=host_completed)), \
         patch.object(fs, "_get_or_create_wallets",
                      AsyncMock(return_value=(MagicMock(), MagicMock()))), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.get_escrow_by_reservation = AsyncMock(return_value=None)
        fr.create_escrow_account = AsyncMock(return_value=escrow)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id=str(uuid.uuid4()))
        )
        fr.create_ledger_entry = AsyncMock()
        session = AsyncMock()
        result = await fs.handle_payment_confirmed(
            session, {"reservation_id": "b1", "payment_id": "p1"}
        )
        return result, fr, escrow


@pytest.mark.asyncio
async def test_payment_confirmed_creates_held_escrow() -> None:
    escrow, fr, _ = await _run_escrow_create()
    assert escrow is not None
    fr.create_escrow_account.assert_awaited_once()
    # Escrow always holds the FULL collected amount — the split happens
    # at release via the canonical engine.
    call = fr.create_escrow_account.call_args
    assert call.args[2] == "h1" or call.kwargs.get("host_id") == "h1"
    ledger_amounts = [
        c.kwargs["amount_egp"] for c in fr.create_ledger_entry.call_args_list
    ]
    assert ledger_amounts == [Decimal("4058.40"), Decimal("4058.40")]


@pytest.mark.asyncio
async def test_payment_confirmed_idempotent() -> None:
    s = _s()
    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=MagicMock(
             amount_egp=100, accommodation_amount_egp=100,
             cleaning_fee_egp=0, vat_egp=None, host_id="h", booking_id="b",
         ))), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=0)), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_transaction_by_idempotency_key = AsyncMock(
            return_value=MagicMock()  # already processed
        )
        fr.get_escrow_by_reservation = AsyncMock(return_value=MagicMock())
        fr.create_ledger_entry = AsyncMock()
        await fs.handle_payment_confirmed(
            AsyncMock(), {"reservation_id": "b"}
        )
        fr.create_ledger_entry.assert_not_called()


@pytest.mark.asyncio
async def test_release_blocked_before_hold_elapsed() -> None:
    from app.shared.exceptions import ConflictError

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) + timedelta(hours=10)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"

    with patch.object(fs, "finance_repository") as fr:
        fr.get_escrow_by_id = AsyncMock(return_value=escrow)
        with pytest.raises(ConflictError):
            await fs.release_escrow(AsyncMock(), escrow.id)


@pytest.mark.asyncio
async def test_release_splits_via_canonical_engine() -> None:
    """Release credits host net and platform share — never re-derives
    pricing independently."""
    s = _s()
    payment = MagicMock()
    payment.booking_id = "b1"
    payment.host_id = "h1"
    # Canonical example: taxable 3560 = host payable 3200 + revenue 360;
    # VAT 14% of 3560 = 498.40; guest total 4058.40.
    payment.amount_egp = Decimal("4058.40")
    payment.accommodation_amount_egp = Decimal("3200")
    payment.cleaning_fee_egp = Decimal("200")
    payment.vat_egp = Decimal("498.40")

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = Decimal("4058.40")

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=10)), \
         patch.object(fs, "_get_or_create_wallets",
                      AsyncMock(return_value=(MagicMock(), MagicMock()))), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_escrow_by_id = AsyncMock(return_value=escrow)
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id=str(uuid.uuid4()))
        )
        fr.create_ledger_entry = AsyncMock()
        await fs.release_escrow(AsyncMock(), escrow.id)

    calls = {c.kwargs["ledger_account"]: c.kwargs["amount_egp"]
             for c in fr.create_ledger_entry.call_args_list}
    assert calls[LedgerAccount.HOST_PAYABLE] == Decimal("3200.00")
    assert calls[LedgerAccount.PLATFORM_REVENUE] == Decimal("360.00")
    assert calls[LedgerAccount.VAT_PAYABLE] == Decimal("498.40")
    assert (
        calls[LedgerAccount.HOST_PAYABLE]
        + calls[LedgerAccount.PLATFORM_REVENUE]
        + calls[LedgerAccount.VAT_PAYABLE]
        == Decimal("4058.40")
    )
    assert calls[LedgerAccount.ESCROW] == Decimal("4058.40")
    assert escrow.status == EscrowStatus.RELEASED


@pytest.mark.asyncio
async def test_release_alpha_waived_host_gets_full_taxable() -> None:
    """A waived platform share gives the host the full taxable amount —
    but VAT is a separate tax and still posts to VAT_PAYABLE."""
    s = _s()
    payment = MagicMock()
    payment.booking_id = "b1"
    payment.host_id = "h1"
    # Waived share: guest charge unchanged — the collected 12% accrues
    # to the host, who is payable the full taxable amount (3560).
    payment.amount_egp = Decimal("4058.40")
    payment.accommodation_amount_egp = Decimal("3200")
    payment.cleaning_fee_egp = Decimal("200")
    payment.vat_egp = Decimal("498.40")

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = Decimal("4058.40")

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=0)), \
         patch.object(fs, "_get_or_create_wallets",
                      AsyncMock(return_value=(MagicMock(), MagicMock()))), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_escrow_by_id = AsyncMock(return_value=escrow)
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id=str(uuid.uuid4()))
        )
        fr.create_ledger_entry = AsyncMock()
        await fs.release_escrow(AsyncMock(), escrow.id)

    calls = {c.kwargs["ledger_account"]: c.kwargs["amount_egp"]
             for c in fr.create_ledger_entry.call_args_list}
    # Waived: host keeps the full taxable amount (3200 + 360).
    assert calls[LedgerAccount.HOST_PAYABLE] == Decimal("3560.00")
    assert LedgerAccount.PLATFORM_REVENUE not in calls  # share waived
    # VAT is a separate tax — the waiver does not waive it.
    assert calls[LedgerAccount.VAT_PAYABLE] == Decimal("498.40")
    assert calls[LedgerAccount.ESCROW] == Decimal("4058.40")


# ============================================================
# VAT — separate 14% tax on the taxable booking amount
# ============================================================


def test_vat_is_14pct_of_taxable_amount() -> None:
    # Taxable = accommodation + 12% allocations = 1120 → VAT = 156.80
    # added on top. Guest total = 1276.80. The host payable is the pure
    # base — the 12% is additive revenue, not carved out of host pay.
    e = commercial.compute_booking_economics(1000)
    assert e.taxable_amount_egp == 1120
    assert e.vat_egp == Decimal("156.80")
    assert e.guest_total_egp == Decimal("1276.80")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 1000
    # VAT never inflates share or host payable.
    assert e.host_net_egp + e.platform_share_egp == e.taxable_amount_egp


def test_vat_not_waived_by_alpha_share_waiver() -> None:
    e = commercial.compute_booking_economics(1000, platform_share_waived=True)
    assert e.platform_share_egp == 0
    assert e.vat_egp == Decimal("156.80")
    assert e.guest_total_egp == Decimal("1276.80")
    assert e.host_net_egp == 1120


def test_vat_tax_base_includes_cleaning_and_allocations() -> None:
    # Tax base = accommodation (post-discount) + cleaning + both 6%
    # allocations — never VAT itself.
    e = commercial.compute_booking_economics(900, cleaning_fee_egp=200)
    assert e.taxable_amount_egp == 1208  # 900 + 200 + 54 + 54
    assert e.vat_egp == Decimal("169.12")
    assert e.platform_share_egp == 108  # 12% of 900, not of 1100
    assert e.host_net_egp == 1100


def test_compute_vat_and_inclusive_portion_round_trip() -> None:
    assert commercial.compute_vat(1000) == 140
    assert commercial.compute_vat(0) == 0
    assert commercial.compute_vat(-5) == 0
    for total in (Decimal("4058.40"), 100, Decimal("2610.60"), 9999):
        vat = commercial.vat_inclusive_portion(total)
        taxable = commercial.money(total) - vat
        assert taxable + vat == commercial.money(total)
        # Within rounding of a fresh computation.
        assert abs(commercial.compute_vat(taxable) - vat) <= Decimal("0.05")
    assert commercial.vat_inclusive_portion(0) == 0


@pytest.mark.asyncio
async def test_refund_retained_amount_splits_vat() -> None:
    """A partial refund returns the VAT portion of the refunded taxable
    amount to the guest; only the retained VAT portion stays payable."""
    s = _s()
    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = 1140  # 1000 taxable + 140 VAT

    tx = MagicMock()
    tx.id = str(uuid.uuid4())

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s):
        fr.create_ledger_entry = AsyncMock()
        await fs._post_ledger_for_escrow_refund(
            AsyncMock(), tx, escrow, MagicMock(),
            refund_amount=570, retained=570, vat_total_egp=140,
            provider_confirmed=True,
        )

    calls = {c.kwargs["ledger_account"]: c.kwargs["amount_egp"]
             for c in fr.create_ledger_entry.call_args_list}
    assert calls[LedgerAccount.ESCROW] == 1140
    assert calls[LedgerAccount.PLATFORM_CASH] == 570
    # Retained 570 splits: VAT 70 (140×570/1140) + taxable 500.
    assert calls[LedgerAccount.VAT_PAYABLE] == 70
    assert calls[LedgerAccount.PLATFORM_REVENUE] == 500


@pytest.mark.asyncio
async def test_full_refund_posts_no_revenue_or_vat() -> None:
    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "b1"
    escrow.amount_egp = 1140

    tx = MagicMock()
    tx.id = str(uuid.uuid4())

    with patch.object(fs, "finance_repository") as fr:
        fr.create_ledger_entry = AsyncMock()
        await fs._post_ledger_for_escrow_refund(
            AsyncMock(), tx, escrow, MagicMock(),
            refund_amount=1140, retained=0, vat_total_egp=140,
            provider_confirmed=False,
        )

    accounts = [c.kwargs["ledger_account"]
                for c in fr.create_ledger_entry.call_args_list]
    assert LedgerAccount.PLATFORM_REVENUE not in accounts
    assert LedgerAccount.VAT_PAYABLE not in accounts
    assert LedgerAccount.GUEST_REFUND_PAYABLE in accounts


@pytest.mark.asyncio
async def test_payment_persists_vat_component(monkeypatch) -> None:
    # 500×4 = 2000 + 50 cleaning + 240 allocations = 2290 taxable →
    # VAT 320.60 → guest total 2610.60.
    kwargs = await _create_payment(monkeypatch, _listing())
    assert kwargs["amount_egp"] == Decimal("2610.60")
    assert kwargs["vat_egp"] == Decimal("320.60")


@pytest.mark.asyncio
async def test_payment_vat_applies_under_alpha_waiver(monkeypatch) -> None:
    # The waiver changes only the internal split (host keeps the collected
    # share) — the guest charge is identical to a non-waived booking:
    # taxable 2290 → VAT 320.60 → total 2610.60.
    kwargs = await _create_payment(monkeypatch, _listing(), host_completed=0)
    assert kwargs["vat_egp"] == Decimal("320.60")
    assert kwargs["amount_egp"] == Decimal("2610.60")


def test_payment_response_exposes_vat_to_payer() -> None:
    from app.payments import services as ps

    now = datetime.now(UTC)
    payment = MagicMock()
    payment.id = "p1"
    payment.booking_id = "b1"
    payment.guest_id = "g1"
    payment.host_id = "h1"
    payment.unit_id = "u1"
    payment.status = "verified"
    payment.method = "manual"
    payment.provider = None
    payment.checkout_url = None
    payment.amount_egp = Decimal("4058.40")
    payment.accommodation_amount_egp = Decimal("3200")
    payment.guest_service_fee_egp = 0
    payment.cleaning_fee_egp = Decimal("200")
    payment.vat_egp = Decimal("498.40")
    payment.refund_amount_egp = None
    payment.nights = 4
    payment.reference_number = "REF"
    payment.payment_deadline_at = None
    payment.proof_rejection_count = 0
    payment.proof_s3_key = None
    payment.proof_url = None
    payment.proof_uploaded_at = None
    payment.verified_at = now
    payment.verified_by = "a1"
    payment.rejected_at = None
    payment.rejected_by = None
    payment.reject_reason = None
    payment.cancelled_at = None
    payment.refunded_at = None
    payment.instructions = "instr"
    payment.unit = None
    payment.created_at = now
    payment.updated_at = now

    # VAT is an internal liability line — hidden from the guest; the
    # internal economics breakdown stays staff-gated.
    assert ps._to_response(payment).vat_egp is None
    assert ps._to_response(payment, include_breakdown=True).vat_egp == Decimal("498.40")
    # Guest response presents the final all-inclusive total as the single
    # Accommodation figure; the cleaning component remains staff-only.
    assert ps._to_response(payment).accommodation_amount_egp == Decimal("4058.40")
    assert ps._to_response(payment).cleaning_fee_egp is None
    assert ps._to_response(payment).guest_service_fee_egp is None
    assert ps._to_response(payment, include_breakdown=True).accommodation_amount_egp == 3000
    assert ps._to_response(payment, include_breakdown=True).cleaning_fee_egp == 200


# ============================================================
# SPLIT RESOLUTION — legacy rows, stored VAT, and fallbacks
# ============================================================


@pytest.mark.asyncio
async def test_booking_economics_falls_back_when_breakdown_missing() -> None:
    """Legacy payment rows without the amount breakdown recover the fee
    base from amount − VAT; cleaning then falls back to zero."""
    payment = MagicMock()
    payment.host_id = "h1"
    payment.booking_id = "b1"
    payment.amount_egp = 1140
    payment.accommodation_amount_egp = None
    payment.cleaning_fee_egp = None
    payment.vat_egp = 140

    with patch("app.config.settings", _s()), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=10)):
        economics, waived = await fs.booking_economics(AsyncMock(), payment)

    assert waived is False
    # fee_base = 1140 − 140 = 1000 taxable; VAT comes from the stored row.
    # Rows with no allocation gap resolve via the legacy split.
    assert economics.taxable_amount_egp == 1000
    assert economics.vat_egp == 140
    assert economics.platform_share_egp == 120
    assert economics.host_net_egp == 880


@pytest.mark.asyncio
async def test_escrow_host_amount_resolves_via_split() -> None:
    payment = MagicMock()
    payment.booking_id = "b1"
    payment.host_id = "h1"
    payment.amount_egp = Decimal("4058.40")
    payment.accommodation_amount_egp = Decimal("3200")
    payment.cleaning_fee_egp = Decimal("200")
    payment.vat_egp = Decimal("498.40")

    escrow = MagicMock()
    escrow.reservation_id = "b1"
    escrow.amount_egp = Decimal("4058.40")

    with patch("app.config.settings", _s()), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
         patch("app.bookings.repository.count_host_completed_bookings",
               AsyncMock(return_value=10)):
        host_amount = await fs.escrow_host_amount(AsyncMock(), escrow)

    # Host payable = accommodation + cleaning = 3200 — never + VAT and
    # never minus the host-side allocation (it is additive revenue).
    assert host_amount == Decimal("3200.00")


@pytest.mark.asyncio
async def test_reservation_release_derives_vat_from_stored_amounts() -> None:
    """Legacy reservation rows carry host/platform amounts; VAT is the
    remainder of the escrowed total (0 on pre-VAT rows)."""
    s = _s()
    reservation = MagicMock()
    reservation.total_amount_egp = 1140
    reservation.host_amount_egp = 880
    reservation.platform_fee_egp = 120

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "r1"
    escrow.host_id = "h1"
    escrow.amount_egp = 1140

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none",
                      AsyncMock(return_value=reservation)), \
         patch.object(fs, "_get_or_create_wallets",
                      AsyncMock(return_value=(MagicMock(), MagicMock()))), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_escrow_by_id = AsyncMock(return_value=escrow)
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id=str(uuid.uuid4()))
        )
        fr.create_ledger_entry = AsyncMock()
        await fs.release_escrow(AsyncMock(), escrow.id)

    calls = {c.kwargs["ledger_account"]: c.kwargs["amount_egp"]
             for c in fr.create_ledger_entry.call_args_list}
    # vat = 1140 − 880 − 120 = 140; platform revenue = the stored fee.
    assert calls[LedgerAccount.HOST_PAYABLE] == 880
    assert calls[LedgerAccount.VAT_PAYABLE] == 140
    assert calls[LedgerAccount.PLATFORM_REVENUE] == 120
    assert calls[LedgerAccount.ESCROW] == 1140


@pytest.mark.asyncio
async def test_payment_confirmed_reservation_path_derives_amounts() -> None:
    """A legacy reservation resolves total/host/vat from its row when the
    event payload carries no amounts — VAT is the remainder."""
    s = _s()
    reservation = MagicMock()
    reservation.total_amount_egp = 1140
    reservation.host_amount_egp = 880
    reservation.platform_fee_egp = 120
    reservation.unit_id = "u1"

    unit = MagicMock()
    unit.host_id = "h1"

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "r1"
    escrow.host_id = "h1"
    escrow.amount_egp = 1140
    escrow.status = EscrowStatus.CREATED

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none",
                      AsyncMock(return_value=reservation)), \
         patch.object(fs, "listings_repository") as lr, \
         patch.object(fs, "_get_or_create_wallets",
                      AsyncMock(return_value=(MagicMock(), MagicMock()))), \
         patch.object(fs, "write_event", AsyncMock()) as we:
        lr.get_unit_with_listing = AsyncMock(return_value=unit)
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.get_escrow_by_reservation = AsyncMock(return_value=None)
        fr.create_escrow_account = AsyncMock(return_value=escrow)
        fr.create_financial_transaction = AsyncMock(
            return_value=MagicMock(id=str(uuid.uuid4()))
        )
        fr.create_ledger_entry = AsyncMock()
        await fs.handle_payment_confirmed(
            AsyncMock(), {"reservation_id": "r1"}
        )

    # Escrow holds the full collected total; the event reports platform
    # revenue excluding VAT (1140 − 880 − 140 = 120).
    fr.create_escrow_account.assert_awaited_once()
    payload = we.call_args.kwargs["payload"]
    assert payload["host_amount_egp"] == 880
    assert payload["platform_revenue_egp"] == 120
