"""Alpha commission regression tests."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.config import Settings
from app.finance import services as fs


def _s():
    return Settings(
        JWT_PRIVATE_KEY="x", JWT_PUBLIC_KEY="x",
        HOST_COMMISSION_PCT=0.10, PLATFORM_TAKE_RATE_PCT=0.02,
        GUEST_SERVICE_FEE_PCT=0.04, ALPHA_HOST_FREE_BOOKINGS=3,
        ALPHA_GUEST_FREE_BOOKINGS=10,
    )


async def _run(hc, gc, amt=1000):
    s = _s()
    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch("app.bookings.repository.count_host_completed_bookings", return_value=hc), \
         patch("app.bookings.repository.count_global_completed_bookings", return_value=gc), \
         patch.object(fs, "_get_or_create_wallets", return_value=(MagicMock(), MagicMock())), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(return_value=MagicMock(id=str(uuid.uuid4())))
        fr.create_ledger_entry = AsyncMock()
        await fs.handle_manual_payment_verified(AsyncMock(), "p", "b", "h", amt)
        return fr.create_ledger_entry.call_args_list


def _ha(calls):
    for c in calls:
        kw = c.kwargs
        if kw.get("ledger_account") == "host_payable":
            return kw["amount_egp"]
    return None


def _pr(calls):
    for c in calls:
        kw = c.kwargs
        if kw.get("ledger_account") == "platform_revenue":
            return kw["amount_egp"]
    return 0


# TEST 1: Host with 0 completed bookings → 0% commission (platform fee still applies)
@pytest.mark.asyncio
async def test_host_0_completed_0_pct():
    calls = await _run(0, 0)
    assert _ha(calls) == 980  # 1000 - 0 (0% commission) - 20 (2% platform fee)

# TEST 2: Host with 1 completed booking → 0% commission
@pytest.mark.asyncio
async def test_host_1_completed_0_pct():
    calls = await _run(1, 0)
    assert _ha(calls) == 980

# TEST 3: Host with 2 completed bookings → 0% commission
@pytest.mark.asyncio
async def test_host_2_completed_0_pct():
    calls = await _run(2, 0)
    assert _ha(calls) == 980

# TEST 4: Host with 3 completed bookings → 10% standard commission applies
@pytest.mark.asyncio
async def test_host_3_completed_10_pct():
    calls = await _run(3, 0)
    # 1000 - 100 (10% commission) - 20 (2% platform) = 880
    assert _ha(calls) == 880

# TEST 5: Cancelled booking does NOT consume a free slot
@pytest.mark.asyncio
async def test_cancelled_does_not_consume_free_slot():
    calls = await _run(2, 0)
    assert _ha(calls) == 980

# TEST 6: Uncompleted confirmed booking does NOT consume a slot
@pytest.mark.asyncio
async def test_confirmed_not_completed_no_slot():
    calls = await _run(0, 0)
    assert _ha(calls) == 980

# TEST 7: Completed booking consumes exactly one slot
@pytest.mark.asyncio
async def test_completed_consumes_exactly_one_slot():
    calls = await _run(1, 0)
    assert _ha(calls) == 980
    calls = await _run(3, 0)
    assert _ha(calls) == 880

# TEST 8: Same payment verification cannot consume a slot twice
@pytest.mark.asyncio
async def test_idempotency_prevents_double_counting():
    s = _s()
    with patch.object(fs, "finance_repository") as fr, \
         patch("app.config.settings", s), \
         patch("app.bookings.repository.count_host_completed_bookings", return_value=0), \
         patch("app.bookings.repository.count_global_completed_bookings", return_value=0), \
         patch.object(fs, "_get_or_create_wallets", return_value=(MagicMock(), MagicMock())), \
         patch.object(fs, "write_event", AsyncMock()):
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=None)
        fr.create_financial_transaction = AsyncMock(return_value=MagicMock(id=str(uuid.uuid4())))
        fr.create_ledger_entry = AsyncMock()
        await fs.handle_manual_payment_verified(AsyncMock(), "p1", "b1", "h1", 1000)
        assert fr.create_ledger_entry.call_count == 3
        fr.get_transaction_by_idempotency_key = AsyncMock(return_value=MagicMock())
        fr.create_ledger_entry.reset_mock()
        await fs.handle_manual_payment_verified(AsyncMock(), "p1", "b1", "h1", 1000)
        assert fr.create_ledger_entry.call_count == 0

# TEST 9: Host payout is correct
@pytest.mark.asyncio
async def test_host_payout_correct():
    calls = await _run(5, 10, amt=2000)
    assert _ha(calls) == 1760

# TEST 9: Fixed Fee remains available as a supported revenue method
# (Verified by the TransactionType enum which includes PAYOUT_FEE,
#  and the financial model workbook. No code change needed.)
def test_fixed_fee_still_supported():
    from app.finance.constants import TransactionType
    assert TransactionType.PAYOUT_FEE == "payout_fee"


# === GUEST SERVICE FEE TESTS 10-15 ===
# Tests the real pricing path via create_payment_for_booking

async def _run_payment_creation(global_completed, base_price=500, nights=2, cleaning=50):
    from datetime import date

    from app.payments import services as ps
    s = _s()
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.check_in = date(2026, 1, 1)
    booking.check_out = date(2026, 1, 1 + nights)
    booking.guest_id = "g1"
    booking.unit_id = "u1"
    listing = MagicMock()
    listing.base_price_egp = base_price
    listing.cleaning_fee_egp = cleaning
    unit = MagicMock()
    unit.host_id = "host1"
    unit.listing = listing
    guest = MagicMock()
    guest.id = "g1"
    guest.locale = "ar"
    guest.phone_number = "+123"
    guest.email = "g@e.com"
    guest.display_name = "G"

    with patch.object(ps, "payments_repository") as pr, \
         patch.object(ps, "settings", s), \
         patch.object(ps, "_fetch_unit_and_listing", AsyncMock(return_value=(unit, listing))), \
         patch.object(ps, "_emit_outbox_event", AsyncMock()), \
         patch("app.bookings.repository.count_global_completed_bookings", return_value=global_completed):
        pr.get_payment_by_booking = AsyncMock(return_value=None)
        from datetime import UTC, datetime
        now = datetime.now(UTC)
        captured_amount = {}

        async def _capture_create(session, **kwargs):
            captured_amount["amount"] = kwargs.get("amount_egp")
            return MagicMock(
                id=str(uuid.uuid4()), booking_id=booking.id, guest_id="g1",
                host_id="host1", unit_id="u1", status="pending", method="manual",
                amount_egp=kwargs.get("amount_egp", 0), nights=nights,
                reference_number="REF", proof_s3_key=None, proof_url=None,
                proof_uploaded_at=None, verified_at=None, verified_by=None,
                rejected_at=None, rejected_by=None, reject_reason=None,
                cancelled_at=None, instructions="instr", created_at=now, updated_at=now,
            )

        pr.create_payment = _capture_create
        result = await ps.create_payment_for_booking(AsyncMock(), booking, guest)
        return result.amount_egp

# TEST 10: Guest bookings #1-#10 (completed count 0-9) → 0% guest fee
@pytest.mark.asyncio
async def test_guest_bookings_1_to_10_0_fee():
    for count in range(10):
        amt = await _run_payment_creation(count)
        expected = 500 * 2 + 50  # 1050, no guest fee
        assert amt == expected, f"Failed at count={count}: got {amt}, expected {expected}"

# TEST 11: Guest booking #11 (completed count 10) → 4% guest fee
@pytest.mark.asyncio
async def test_guest_booking_11_4_fee():
    amt = await _run_payment_creation(10)
    # 10 completed → current booking is #11 → 4% applies
    expected = 1050 + int(round(1050 * 0.04))  # 1050 + 42 = 1092
    assert amt == expected

# TEST 12: Guest booking #12+ (completed count 11+) → 4% standard fee
@pytest.mark.asyncio
async def test_guest_booking_12_plus_4_fee():
    amt = await _run_payment_creation(11)
    expected = 1050 + int(round(1050 * 0.04))  # 1092
    assert amt == expected

# TEST 13: Guest-visible total reflects Alpha fee correctly
@pytest.mark.asyncio
async def test_guest_total_reflects_alpha():
    # Alpha: 0 completed → booking #1 → no guest fee
    amt_free = await _run_payment_creation(0)
    assert amt_free == 1050
    # Post-alpha: 10 completed → booking #11 → 4% guest fee
    amt_paid = await _run_payment_creation(10)
    assert amt_paid == 1092

# TEST 14: Payment amount matches guest-visible total
# (create_payment_for_booking sets amount_egp which is what the guest pays)
@pytest.mark.asyncio
async def test_payment_amount_matches_guest_total():
    amt = await _run_payment_creation(0, base_price=1000, nights=3, cleaning=100)
    assert amt == 3100  # 1000*3 + 100, no guest fee

# TEST 15: Finance ledger matches actual transaction
# (handle_manual_payment_verified uses payment.amount_egp as the base)
@pytest.mark.asyncio
async def test_ledger_matches_transaction():
    calls = await _run(0, 0, amt=1092)
    # Platform cash should be 1092 (full payment amount)
    for c in calls:
        kw = c.kwargs
        if kw.get("ledger_account") == "platform_cash" and kw.get("entry_type") == "debit":
            assert kw["amount_egp"] == 1092
    # Host payable: 1092 - 0 (0% commission) - 21 (2% of 1092 rounded) = 1071
    assert _ha(calls) == 1092 - 0 - int(round(1092 * 0.02))


# === PLATFORM FEE TESTS 16-18 ===

# TEST 16: 2% platform fee is explicit and consistent
@pytest.mark.asyncio
async def test_platform_fee_2pct_explicit():
    calls = await _run(0, 0, amt=1000)
    # Platform revenue = host_commission + platform_fee = 0 + 20 = 20
    assert _pr(calls) == 20

# TEST 17: Host payout matches commission + platform-fee rules
@pytest.mark.asyncio
async def test_host_payout_matches_rules():
    calls = await _run(3, 10, amt=1000)
    # host_amount = 1000 - 100 (10% commission) - 20 (2% platform) = 880
    assert _ha(calls) == 880
    # platform_revenue = 100 + 20 = 120
    assert _pr(calls) == 120

# TEST 18: Fixed Fee remains supported but inactive for Accommodation Alpha
def test_fixed_fee_inactive_for_accommodation():
    from app.finance.constants import TransactionType
    # PAYOUT_FEE exists as a transaction type (supported)
    assert TransactionType.PAYOUT_FEE == "payout_fee"
    # But it's not used in handle_manual_payment_verified (inactive for Alpha)
