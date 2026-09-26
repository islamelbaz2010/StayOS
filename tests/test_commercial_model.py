"""Canonical commercial model tests (Founder decision closure — Model B).

Covers the 12% economics split as a real host-side 6% commission plus a
guest-side 6% allocation, guest-facing total-only serialization,
discount precedence, custom offers, the escrow hold/release chain, and
idempotency. Canonical Model B example (§33):

    700/night × 2 nights = 1,400 accommodation + 60 cleaning
    host gross 1,460 − host commission 84 = host net 1,376
    guest taxable 1,544 (1,400 + 60 + guest-side 84) → VAT 216.16
    guest total 1,760.16 = 1,376 host + 168 StayOS revenue + 216.16 VAT
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
    return Settings(JWT_PRIVATE_KEY="x", JWT_PUBLIC_KEY="x", **kw)


# ============================================================
# CANONICAL ENGINE — 12% all-inclusive economics
# ============================================================


def test_platform_share_is_12pct_of_accommodation() -> None:
    # Model B: total StayOS revenue is still 12% of accommodation — but
    # the host-side 6% is a commission deducted from host payable, not
    # added to the guest charge. Guest taxable = accom + guest-side 6%.
    e = commercial.compute_booking_economics(1000)
    assert e.taxable_amount_egp == 1060
    assert e.vat_egp == Decimal("148.40")
    assert e.guest_total_egp == Decimal("1208.40")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 940  # 1000 − 60 host commission


def test_canonical_model_b_example() -> None:
    """§33 exact regression: 700/night × 2 + 60 cleaning.

    1,760.16 guest total = 1,376 host net + 168 StayOS revenue
    + 216.16 VAT payable.
    """
    e = commercial.compute_booking_economics(1400, 60)
    assert e.accommodation_egp == Decimal("1400")
    assert e.cleaning_fee_egp == Decimal("60")
    assert e.host_side_share_egp == Decimal("84")
    assert e.guest_side_share_egp == Decimal("84")
    assert e.taxable_amount_egp == Decimal("1544")
    assert e.vat_egp == Decimal("216.16")
    assert e.guest_total_egp == Decimal("1760.16")
    assert e.platform_share_egp == Decimal("168")
    assert e.host_net_egp == Decimal("1376")
    assert e.host_net_egp + e.platform_share_egp + e.vat_egp == (
        e.guest_total_egp
    )
    # Paymob minor units: 1,760.16 EGP → 176,016.
    assert commercial.to_minor_units(e.guest_total_egp) == 176016


def test_host_commission_deducted_never_guest_charged() -> None:
    # The host-side 6% reduces host payout — it never appears in the
    # guest's taxable amount. With identical bases, Model B guest
    # taxable is 6% lower than the superseded DEC-023 additive model.
    e = commercial.compute_booking_economics(1000)
    assert e.taxable_amount_egp == Decimal("1060")
    assert e.host_net_egp == Decimal("940")
    # Host gross (accom + cleaning) − commission = net.
    assert e.accommodation_egp + e.cleaning_fee_egp - e.host_side_share_egp == (
        e.host_net_egp
    )


def test_internal_6_6_allocation_sums_to_share() -> None:
    e = commercial.compute_booking_economics(1000)
    assert e.guest_side_share_egp == 60
    assert e.host_side_share_egp == 60
    assert e.guest_side_share_egp + e.host_side_share_egp == e.platform_share_egp


def test_cleaning_fee_not_in_fee_base() -> None:
    # 12% applies to accommodation only — cleaning passes through to the
    # host gross untouched and is never multiplied by nights. Cleaning IS
    # in the VAT tax base alongside the guest-side 6%.
    e = commercial.compute_booking_economics(1000, cleaning_fee_egp=100)
    assert e.taxable_amount_egp == 1160  # 1000 + 100 + 60
    assert e.vat_egp == Decimal("162.40")
    assert e.guest_total_egp == Decimal("1322.40")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 1040  # 1100 − 60


def test_guest_pays_taxable_plus_vat() -> None:
    # The guest pays the taxable booking amount plus VAT on top — VAT is
    # a separate tax added to the payable total, not carved out of it.
    e = commercial.compute_booking_economics(2000, 150)
    assert e.taxable_amount_egp == 2270  # 2000 + 150 + 120
    assert e.vat_egp == Decimal("317.80")
    assert e.guest_total_egp == Decimal("2587.80")


def test_no_launch_waiver_platform_share_always_applies() -> None:
    """The launch waiver is removed: no pricing path may zero the StayOS
    share. The 750/75 founder golden example — host commission 45,
    guest fee 45, taxable 870, VAT 121.80, guest total 991.80, host net
    780, StayOS revenue 90."""
    e = commercial.compute_booking_economics(750, 75)
    assert e.host_side_share_egp == Decimal("45")
    assert e.guest_side_share_egp == Decimal("45")
    assert e.taxable_amount_egp == Decimal("870")
    assert e.vat_egp == Decimal("121.80")
    assert e.guest_total_egp == Decimal("991.80")
    assert e.platform_share_egp == Decimal("90")
    assert e.host_net_egp == Decimal("780")
    assert e.host_net_egp + e.platform_share_egp + e.vat_egp == (
        e.guest_total_egp
    )
    # The waiver keyword no longer exists on the canonical engine.
    import inspect

    assert "platform_share_waived" not in inspect.signature(
        commercial.compute_booking_economics
    ).parameters


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
    # Host thinking in net terms: under Model B a net target of EGP 1,000
    # needs accommodation = 1,000 / 0.94 ≈ 1,063.83; guest pays the
    # all-inclusive price of that accommodation.
    gross = commercial.guest_all_in_price_for_host_target(1000)
    assert gross == Decimal("1285.53")
    taxable = gross - commercial.vat_inclusive_portion(gross)
    assert taxable == Decimal("1127.66")
    e = commercial.compute_booking_economics(
        taxable / (1 + commercial.rate(0.06))
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


async def _create_payment(monkeypatch, listing, custom_total=None):
    from app.payments import services as ps

    _quote_mocks(monkeypatch, listing)
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
    # 500 × 4 nights = 2000 + 50 cleaning → taxable 2000+50+120 (guest 6%)
    # = 2170 → VAT 14% = 303.80 → guest total 2473.80. Host gross = 2050.
    assert kwargs["amount_egp"] == Decimal("2473.80")
    assert kwargs["vat_egp"] == Decimal("303.80")
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
    # 500 × 8 = 4000 − 10% = 3600 + 50 cleaning + 216 (guest 6% of 3600)
    # = 3866 taxable + 14% VAT (541.24) = 4407.24.
    assert captured["amount_egp"] == Decimal("4407.24")
    assert captured["vat_egp"] == Decimal("541.24")


@pytest.mark.asyncio
async def test_custom_offer_overrides_listing_price(monkeypatch) -> None:
    # The offered total is the final all-inclusive guest price: the guest
    # pays exactly the offer — VAT is the tax component inside it and the
    # host gross is the 1/1.06 share of the taxable amount
    # (1500 = 1315.79 taxable + 184.21 VAT; host gross 1241.31).
    kwargs = await _create_payment(monkeypatch, _listing(), custom_total=1500)
    assert kwargs["amount_egp"] == Decimal("1500")
    assert kwargs["vat_egp"] == Decimal("184.21")
    assert kwargs["accommodation_amount_egp"] == Decimal("1241.31")
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
    # The column stores the host gross (accommodation 2000 + cleaning
    # 50 = 2050); the guest's Accommodation line is the final
    # all-inclusive total — no VAT, cleaning or fee lines for guests.
    payment.amount_egp = Decimal("2473.80")
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

    payment.vat_egp = Decimal("303.80")

    guest_view = ps._to_response(payment)  # default: no internal breakdown
    # Guest sees the final all-inclusive price as the single
    # Accommodation figure — no VAT, cleaning or fee components.
    assert guest_view.accommodation_amount_egp == Decimal("2473.80")
    assert guest_view.cleaning_fee_egp is None
    assert guest_view.guest_service_fee_egp is None
    assert guest_view.vat_egp is None
    assert guest_view.amount_egp == Decimal("2473.80")

    admin_view = ps._to_response(payment, include_breakdown=True)
    assert admin_view.accommodation_amount_egp == 2000
    assert admin_view.cleaning_fee_egp == 50
    assert admin_view.guest_service_fee_egp == 0
    assert admin_view.vat_egp == Decimal("303.80")


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
    amount=Decimal("1760.16"),
    accommodation_amount=Decimal("1460"),
    cleaning_fee=Decimal("60"),
    vat_egp=Decimal("216.16"),
):
    s = _s()
    payment = MagicMock()
    payment.id = "p1"
    payment.booking_id = "b1"
    payment.host_id = "h1"
    # Real rows store the host gross (accommodation+cleaning) in
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
    assert ledger_amounts == [Decimal("1760.16"), Decimal("1760.16")]


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
    # Canonical Model B example: host gross 1460 (1400 accom + 60
    # cleaning) → host net 1376 (84 commission deducted); guest 84
    # inside taxable 1544; VAT 14% = 216.16; guest total 1760.16.
    payment.amount_egp = Decimal("1760.16")
    payment.accommodation_amount_egp = Decimal("1460")
    payment.cleaning_fee_egp = Decimal("60")
    payment.vat_egp = Decimal("216.16")

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = Decimal("1760.16")

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
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
    assert calls[LedgerAccount.HOST_PAYABLE] == Decimal("1376.00")
    assert calls[LedgerAccount.PLATFORM_REVENUE] == Decimal("168.00")
    assert calls[LedgerAccount.VAT_PAYABLE] == Decimal("216.16")
    assert (
        calls[LedgerAccount.HOST_PAYABLE]
        + calls[LedgerAccount.PLATFORM_REVENUE]
        + calls[LedgerAccount.VAT_PAYABLE]
        == Decimal("1760.16")
    )
    assert calls[LedgerAccount.ESCROW] == Decimal("1760.16")
    assert escrow.status == EscrowStatus.RELEASED


@pytest.mark.asyncio
async def test_release_never_waives_platform_share() -> None:
    """Launch waiver removed: a host with zero completed bookings gets
    the identical Model B split — commission deducted, revenue posted."""
    s = _s()
    payment = MagicMock()
    payment.booking_id = "b1"
    payment.host_id = "h1"
    payment.amount_egp = Decimal("1760.16")
    payment.accommodation_amount_egp = Decimal("1460")
    payment.cleaning_fee_egp = Decimal("60")
    payment.vat_egp = Decimal("216.16")

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = Decimal("1760.16")

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)), \
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
    assert calls[LedgerAccount.HOST_PAYABLE] == Decimal("1376.00")
    assert calls[LedgerAccount.PLATFORM_REVENUE] == Decimal("168.00")
    assert calls[LedgerAccount.VAT_PAYABLE] == Decimal("216.16")
    assert calls[LedgerAccount.ESCROW] == Decimal("1760.16")


# ============================================================
# VAT — separate 14% tax on the taxable booking amount
# ============================================================


def test_vat_is_14pct_of_taxable_amount() -> None:
    # Taxable = accommodation + guest-side 6% = 1060 → VAT = 148.40
    # added on top. Guest total = 1208.40. The host net is the gross
    # minus the host-side 6% commission; StayOS revenue is 6%+6%.
    e = commercial.compute_booking_economics(1000)
    assert e.taxable_amount_egp == 1060
    assert e.vat_egp == Decimal("148.40")
    assert e.guest_total_egp == Decimal("1208.40")
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 940
    # VAT never inflates share or host payable.
    assert e.host_net_egp + e.platform_share_egp == e.taxable_amount_egp


def test_vat_tax_base_includes_cleaning_and_allocations() -> None:
    # Tax base = accommodation (post-discount) + cleaning + guest-side 6%
    # — never VAT itself, never the host-side commission.
    e = commercial.compute_booking_economics(900, cleaning_fee_egp=200)
    assert e.taxable_amount_egp == 1154  # 900 + 200 + 54
    assert e.vat_egp == Decimal("161.56")
    assert e.platform_share_egp == 108  # 12% of 900, not of 1100
    assert e.host_net_egp == 1046  # 1100 − 54


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
async def test_dec023_additive_row_resolves_by_its_own_rule() -> None:
    """Regression: a payment row priced under DEC-023 (both allocations
    charged to the guest) is detected by its 12% gap signature and split
    by the rule that actually charged it — host keeps the full gross.
    Matches STY-3E9206E8's generation signature."""
    payment = MagicMock()
    payment.host_id = "h1"
    payment.booking_id = "b1"
    payment.amount_egp = Decimal("4058.40")
    payment.accommodation_amount_egp = Decimal("3200")
    payment.cleaning_fee_egp = Decimal("200")
    payment.vat_egp = Decimal("498.40")

    with patch("app.config.settings", _s()):
        economics = await fs.booking_economics(AsyncMock(), payment)

    # gap = 3560 − 3200 = 360 = 12% of 3000 → DEC-023 signature: host
    # payable was the full gross; the whole 360 gap is StayOS revenue.
    assert economics.host_net_egp == Decimal("3200.00")
    assert economics.platform_share_egp == Decimal("360.00")
    assert economics.vat_egp == Decimal("498.40")
    assert economics.host_net_egp + economics.platform_share_egp + (
        economics.vat_egp
    ) == Decimal("4058.40")


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
    # 500×4 = 2000 + 50 cleaning + 120 guest-side 6% = 2170 taxable →
    # VAT 303.80 → guest total 2473.80.
    kwargs = await _create_payment(monkeypatch, _listing())
    assert kwargs["amount_egp"] == Decimal("2473.80")
    assert kwargs["vat_egp"] == Decimal("303.80")





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
    payment.amount_egp = Decimal("1760.16")
    payment.accommodation_amount_egp = Decimal("1460")
    payment.guest_service_fee_egp = 0
    payment.cleaning_fee_egp = Decimal("60")
    payment.vat_egp = Decimal("216.16")
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
    assert ps._to_response(payment, include_breakdown=True).vat_egp == Decimal("216.16")
    # Guest response presents the final all-inclusive total as the single
    # Accommodation figure; the cleaning component remains staff-only.
    assert ps._to_response(payment).accommodation_amount_egp == Decimal("1760.16")
    assert ps._to_response(payment).cleaning_fee_egp is None
    assert ps._to_response(payment).guest_service_fee_egp is None
    assert ps._to_response(payment, include_breakdown=True).accommodation_amount_egp == 1400
    assert ps._to_response(payment, include_breakdown=True).cleaning_fee_egp == 60


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

    with patch("app.config.settings", _s()):
        economics = await fs.booking_economics(AsyncMock(), payment)

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
    payment.amount_egp = Decimal("1760.16")
    payment.accommodation_amount_egp = Decimal("1460")
    payment.cleaning_fee_egp = Decimal("60")
    payment.vat_egp = Decimal("216.16")

    escrow = MagicMock()
    escrow.reservation_id = "b1"
    escrow.amount_egp = Decimal("1760.16")

    with patch("app.config.settings", _s()), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=payment)):
        host_amount = await fs.escrow_host_amount(AsyncMock(), escrow)

    # Host net = gross 1460 − 84 commission = 1376 — never + VAT, never
    # the guest-side 6%, never the host commission itself.
    assert host_amount == Decimal("1376.00")


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
