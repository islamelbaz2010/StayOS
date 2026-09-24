"""Canonical commercial model tests (Founder decision closure).

Covers the 12% all-inclusive economics, the 6%+6% internal allocation,
guest-facing total-only serialization, discount precedence, custom
offers, the escrow hold/release chain, and idempotency.
"""

import uuid
from datetime import UTC, date, datetime, timedelta
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
    assert e.guest_total_egp == 1000
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 880


def test_internal_6_6_allocation_sums_to_share() -> None:
    e = commercial.compute_booking_economics(1000)
    assert e.guest_side_share_egp == 60
    assert e.host_side_share_egp == 60
    assert e.guest_side_share_egp + e.host_side_share_egp == e.platform_share_egp


def test_cleaning_fee_not_in_fee_base() -> None:
    # 12% applies to accommodation only — cleaning passes through to host.
    e = commercial.compute_booking_economics(1000, cleaning_fee_egp=100)
    assert e.guest_total_egp == 1100
    assert e.platform_share_egp == 120
    assert e.host_net_egp == 980


def test_guest_pays_advertised_total_nothing_added() -> None:
    # All-inclusive: the total equals accommodation + cleaning — no fee
    # is ever added on top for the guest.
    e = commercial.compute_booking_economics(2000, 150)
    assert e.guest_total_egp == 2150


def test_alpha_waiver_gives_host_full_amount() -> None:
    e = commercial.compute_booking_economics(1000, platform_share_waived=True)
    assert e.platform_share_egp == 0
    assert e.host_net_egp == 1000
    assert e.host_side_share_egp == 0
    assert e.guest_side_share_egp == 0


def test_rounding_stays_integer_and_balanced() -> None:
    for base in (1, 3, 7, 99, 999, 1001, 3333):
        e = commercial.compute_booking_economics(base, 7)
        assert e.host_net_egp + e.platform_share_egp == e.guest_total_egp
        assert e.host_side_share_egp + e.guest_side_share_egp == e.platform_share_egp
        assert isinstance(e.guest_total_egp, int)


def test_gross_up_helper_for_host_target() -> None:
    # Host thinking in net terms: EGP 1,000 target → ~1,136.36 all-in.
    gross = commercial.guest_all_in_price_for_host_target(1000)
    assert gross == 1136
    e = commercial.compute_booking_economics(gross)
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
    # 500 × 4 nights + 50 cleaning = 2050 — nothing added on top.
    assert kwargs["amount_egp"] == 2050
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
    # 500 × 8 = 4000 − 10% = 3600 + 50 cleaning = 3650
    assert captured["amount_egp"] == 3650


@pytest.mark.asyncio
async def test_custom_offer_overrides_listing_price(monkeypatch) -> None:
    kwargs = await _create_payment(monkeypatch, _listing(), custom_total=1500)
    assert kwargs["amount_egp"] == 1500
    assert kwargs["accommodation_amount_egp"] == 1500
    assert kwargs["cleaning_fee_egp"] == 0


# ============================================================
# GUEST-FACING SERIALIZATION — never expose internal economics
# ============================================================


def test_payment_response_hides_breakdown_for_guests() -> None:
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
    payment.amount_egp = 2050
    payment.accommodation_amount_egp = 2000
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

    guest_view = ps._to_response(payment)  # default: no breakdown
    assert guest_view.accommodation_amount_egp is None
    assert guest_view.guest_service_fee_egp is None
    assert guest_view.cleaning_fee_egp is None
    assert guest_view.amount_egp == 2050

    admin_view = ps._to_response(payment, include_breakdown=True)
    assert admin_view.accommodation_amount_egp == 2000


def test_guest_quote_contract_has_no_fee_fields() -> None:
    """The guest quote schema must not carry internal components."""
    from app.payments.schemas import BookingQuote

    assert "accommodation_egp" not in BookingQuote.model_fields
    assert "cleaning_fee_egp" not in BookingQuote.model_fields
    assert "service_fee_egp" not in BookingQuote.model_fields
    assert "guest_fee_egp" not in BookingQuote.model_fields
    assert "platform_fee_egp" not in BookingQuote.model_fields


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


async def _run_escrow_create(amount=2050, host_completed=10):
    s = _s()
    payment = MagicMock()
    payment.id = "p1"
    payment.booking_id = "b1"
    payment.host_id = "h1"
    # Real rows store the pre-economics subtotal (accommodation+cleaning)
    # in accommodation_amount_egp; the engine recovers the fee base.
    payment.amount_egp = amount
    payment.accommodation_amount_egp = amount
    payment.cleaning_fee_egp = 50

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
    assert ledger_amounts == [2050, 2050]  # cash debit + held credit


@pytest.mark.asyncio
async def test_payment_confirmed_idempotent() -> None:
    s = _s()
    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch.object(fs, "_reservation_or_none", AsyncMock(return_value=None)), \
         patch.object(fs, "_payment_or_none", AsyncMock(return_value=MagicMock(
             amount_egp=100, accommodation_amount_egp=100,
             cleaning_fee_egp=0, host_id="h", booking_id="b",
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
    payment.amount_egp = 2050
    payment.accommodation_amount_egp = 2050
    payment.cleaning_fee_egp = 50

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = 2050

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
    # 12% of 2000 = 240 platform share; host net = 2050 − 240 = 1810.
    # The share is VAT-inclusive at 14%: net revenue = 240/1.14 ≈ 211,
    # VAT payable = 29. Net + VAT always sums exactly to the share.
    assert calls[LedgerAccount.HOST_PAYABLE] == 1810
    assert calls[LedgerAccount.PLATFORM_REVENUE] == 211
    assert calls[LedgerAccount.VAT_PAYABLE] == 29
    assert (
        calls[LedgerAccount.PLATFORM_REVENUE] + calls[LedgerAccount.VAT_PAYABLE]
        == 240
    )
    assert calls[LedgerAccount.ESCROW] == 2050
    assert escrow.status == EscrowStatus.RELEASED


@pytest.mark.asyncio
async def test_release_alpha_waived_host_gets_full() -> None:
    s = _s()
    payment = MagicMock()
    payment.booking_id = "b1"
    payment.host_id = "h1"
    payment.amount_egp = 2050
    payment.accommodation_amount_egp = 2050
    payment.cleaning_fee_egp = 50

    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.status = EscrowStatus.HELD
    escrow.hold_until = datetime.now(UTC) - timedelta(hours=1)
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = 2050

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
    assert calls[LedgerAccount.HOST_PAYABLE] == 2050
    assert LedgerAccount.PLATFORM_REVENUE not in calls  # waived


# ============================================================
# VAT — 14% platform-service tax inside the platform share
# ============================================================


def test_vat_is_14pct_inside_platform_share() -> None:
    # Accommodation 1000 → share 120 (VAT-inclusive). Net = 120/1.14 ≈ 105,
    # VAT = 15. Guest total and host net are deliberately unchanged.
    e = commercial.compute_booking_economics(1000)
    assert e.platform_share_egp == 120
    assert e.vat_egp == 15
    assert e.platform_net_revenue_egp == 105
    assert e.vat_egp + e.platform_net_revenue_egp == e.platform_share_egp
    assert e.guest_total_egp == 1000
    assert e.host_net_egp == 880


def test_vat_zero_when_share_waived() -> None:
    e = commercial.compute_booking_economics(1000, platform_share_waived=True)
    assert e.platform_share_egp == 0
    assert e.vat_egp == 0
    assert e.platform_net_revenue_egp == 0


def test_vat_applies_post_discount_base_only() -> None:
    # The engine receives the already-discounted accommodation amount —
    # VAT inherits the post-discount fee base; cleaning is never in it.
    e = commercial.compute_booking_economics(900, cleaning_fee_egp=200)
    assert e.platform_share_egp == 108  # 12% of 900, not of 1100
    assert e.vat_egp + e.platform_net_revenue_egp == 108
    assert e.guest_total_egp == 1100
    assert e.host_net_egp == 992


def test_vat_split_rounds_and_balances() -> None:
    for share in (1, 3, 7, 50, 120, 240, 999, 3333):
        vat, net = commercial.split_vat(share)
        assert vat + net == share
        assert vat >= 0 and net >= 0
    assert commercial.split_vat(0) == (0, 0)
    assert commercial.split_vat(-5) == (0, -5)


@pytest.mark.asyncio
async def test_refund_retained_fees_post_vat_split() -> None:
    """Retained cancellation fees are VAT-inclusive platform revenue too —
    the refund posting must split them into net revenue + VAT payable."""
    s = _s()
    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "b1"
    escrow.host_id = "h1"
    escrow.amount_egp = 1000

    tx = MagicMock()
    tx.id = str(uuid.uuid4())

    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s):
        fr.create_ledger_entry = AsyncMock()
        await fs._post_ledger_for_escrow_refund(
            AsyncMock(), tx, escrow, MagicMock(),
            refund_amount=760, retained=240, provider_confirmed=True,
        )

    calls = {c.kwargs["ledger_account"]: c.kwargs["amount_egp"]
             for c in fr.create_ledger_entry.call_args_list}
    assert calls[LedgerAccount.ESCROW] == 1000
    assert calls[LedgerAccount.PLATFORM_CASH] == 760
    assert calls[LedgerAccount.PLATFORM_REVENUE] == 211
    assert calls[LedgerAccount.VAT_PAYABLE] == 29


@pytest.mark.asyncio
async def test_full_refund_posts_no_revenue_or_vat() -> None:
    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = "b1"
    escrow.amount_egp = 1000

    tx = MagicMock()
    tx.id = str(uuid.uuid4())

    with patch.object(fs, "finance_repository") as fr:
        fr.create_ledger_entry = AsyncMock()
        await fs._post_ledger_for_escrow_refund(
            AsyncMock(), tx, escrow, MagicMock(),
            refund_amount=1000, retained=0, provider_confirmed=False,
        )

    accounts = [c.kwargs["ledger_account"]
                for c in fr.create_ledger_entry.call_args_list]
    assert LedgerAccount.PLATFORM_REVENUE not in accounts
    assert LedgerAccount.VAT_PAYABLE not in accounts
    assert LedgerAccount.GUEST_REFUND_PAYABLE in accounts


@pytest.mark.asyncio
async def test_payment_persists_vat_component(monkeypatch) -> None:
    # 500×4 = 2000 accommodation → share 240 → VAT 240−round(240/1.14)=29.
    kwargs = await _create_payment(monkeypatch, _listing())
    assert kwargs["amount_egp"] == 2050
    assert kwargs["vat_egp"] == 29


@pytest.mark.asyncio
async def test_payment_vat_zero_under_alpha_waiver(monkeypatch) -> None:
    kwargs = await _create_payment(monkeypatch, _listing(), host_completed=0)
    assert kwargs["vat_egp"] == 0
    # Guest total still all-inclusive — VAT never changes what is charged.
    assert kwargs["amount_egp"] == 2050


def test_payment_response_gates_vat_to_staff_breakdown() -> None:
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
    payment.amount_egp = 2050
    payment.accommodation_amount_egp = 2050
    payment.guest_service_fee_egp = 0
    payment.cleaning_fee_egp = 50
    payment.vat_egp = 29
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

    assert ps._to_response(payment).vat_egp is None
    assert ps._to_response(payment, include_breakdown=True).vat_egp == 29
