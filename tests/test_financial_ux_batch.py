"""Acceptance regression tests for the host/admin financial-UX batch:

- Host "Pending" activity filter must expand to the canonical unverified
  statuses (pending, proof_uploaded, rejected) instead of querying a
  single status that never matches displayed rows.
- "Cancelled" must stay a distinct filter from refund states.
- Host earnings summary must surface escrow-derived lifecycle aggregates.
- Admin overview must expose ledger/escrow/payout-derived amounts.
- The bulk importer must reject non-canonical property types (HOUSE) while
  accepting valid rows, and must skip exact duplicates on re-import.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.auth.constants import UserRole
from app.auth.models import User


def _make_user(user_id: str | None = None, role: UserRole = UserRole.HOST) -> User:
    user = User(
        id=user_id or str(uuid.uuid4()),
        phone_number="201000000000",
        display_name="Test User",
        role=role,
    )
    return user


# ---------------------------------------------------------------------------
# Host payment-activity filters
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_host_pending_filter_expands_unverified_statuses(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.payments import repository as payments_repository
    from app.payments import services as payment_services
    from app.payments.constants import PaymentStatus

    captured: dict = {}
    list_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(payments_repository, "list_host_payments", list_mock)

    empty = MagicMock()
    empty.scalars.return_value.all.return_value = []
    fake_session.execute = AsyncMock(return_value=empty)

    host = _make_user(role=UserRole.HOST)
    await payment_services.list_host_payments(fake_session, host, status="pending")

    statuses = list_mock.await_args.kwargs["statuses"]
    assert statuses == [
        PaymentStatus.PENDING,
        PaymentStatus.PROOF_UPLOADED,
        PaymentStatus.REJECTED,
    ]


@pytest.mark.asyncio
async def test_host_cancelled_filter_is_distinct_from_refunds(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.payments import repository as payments_repository
    from app.payments import services as payment_services

    list_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(payments_repository, "list_host_payments", list_mock)

    empty = MagicMock()
    empty.scalars.return_value.all.return_value = []
    fake_session.execute = AsyncMock(return_value=empty)

    host = _make_user(role=UserRole.HOST)
    await payment_services.list_host_payments(fake_session, host, status="cancelled")

    statuses = list_mock.await_args.kwargs["statuses"]
    assert statuses == ["cancelled"]


@pytest.mark.asyncio
async def test_host_all_filter_passes_no_statuses(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.payments import repository as payments_repository
    from app.payments import services as payment_services

    list_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(payments_repository, "list_host_payments", list_mock)

    empty = MagicMock()
    empty.scalars.return_value.all.return_value = []
    fake_session.execute = AsyncMock(return_value=empty)

    host = _make_user(role=UserRole.HOST)
    await payment_services.list_host_payments(fake_session, host, status=None)
    await payment_services.list_host_payments(fake_session, host, status="verified")

    calls = list_mock.await_args_list
    assert calls[0].kwargs["statuses"] is None
    assert calls[1].kwargs["statuses"] == ["verified"]


# ---------------------------------------------------------------------------
# Host earnings lifecycle aggregates
# ---------------------------------------------------------------------------


def _make_escrow(status: str, hold_until=None) -> MagicMock:
    escrow = MagicMock()
    escrow.id = str(uuid.uuid4())
    escrow.reservation_id = str(uuid.uuid4())
    escrow.host_id = "host-1"
    escrow.amount_egp = 3000
    escrow.status = status
    escrow.hold_until = hold_until
    return escrow


@pytest.mark.asyncio
async def test_host_earnings_lifecycle_aggregates(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.finance import services as finance_services
    from app.finance.constants import EscrowStatus
    from app.finance import commercial
    from app.host import repository as host_repository
    from app.host import services as host_services

    host = _make_user(user_id="host-1", role=UserRole.HOST)

    monkeypatch.setattr(
        host_repository,
        "get_host_earnings",
        AsyncMock(
            return_value={
                "total_bookings": 3,
                "confirmed_bookings": 2,
                "completed_stays": 1,
                "cancelled_bookings": 1,
                "total_revenue_egp": 8000,
                "pending_verification_egp": 0,
                "refund_pending_egp": 1000,
                "refunded_egp": 500,
                "paid_out_egp": 1200,
                "net_earnings_egp": 6500,
                "per_unit": [],
            }
        ),
    )

    now = datetime.now(UTC)
    held_locked = _make_escrow(
        EscrowStatus.HELD, hold_until=now + timedelta(hours=10)
    )
    held_ready = _make_escrow(
        EscrowStatus.HELD, hold_until=now - timedelta(hours=2)
    )
    released = _make_escrow(EscrowStatus.RELEASED)

    escrow_result = MagicMock()
    escrow_result.scalars.return_value.all.return_value = [
        held_locked,
        held_ready,
        released,
    ]
    verified_result = MagicMock()
    verified_result.scalars.return_value.all.return_value = [MagicMock(), MagicMock()]
    card_result = MagicMock()
    card_result.scalar.return_value = 900

    fake_session.execute = AsyncMock(
        side_effect=[escrow_result, verified_result, card_result]
    )

    monkeypatch.setattr(
        finance_services,
        "escrow_host_amount",
        AsyncMock(return_value=2500),
    )
    monkeypatch.setattr(
        finance_services,
        "booking_economics",
        AsyncMock(return_value=(commercial.compute_booking_economics(1000, 0), False)),
    )

    result = await host_services.get_host_earnings(fake_session, host)

    # Two HELD escrows count as funds held (2 * 2500); the RELEASED one does not.
    assert result.funds_held_egp == 5000
    # Only the escrow whose hold_until already passed is payout-ready.
    assert result.payout_ready_egp == 2500
    # 2 verified payments * host_net(1000) + card path 900.
    expected_net = commercial.compute_booking_economics(1000, 0).host_net_egp
    assert result.host_earnings_egp == 2 * expected_net + 900
    # Repository-derived fields flow through unchanged.
    assert result.paid_out_egp == 1200
    assert result.refunded_egp == 500
    assert result.cancelled_bookings == 1
    assert result.refund_pending_egp == 1000


# ---------------------------------------------------------------------------
# Admin overview financial fields
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_overview_financial_fields(fake_session: AsyncMock) -> None:
    from app.admin import services as admin_services

    # session.scalar call order inside get_admin_overview:
    # 0 users_total, 1 users_guests, 2 users_hosts, 3 hosts_kyc_verified,
    # 4 listings_total, 5 listings_listed, 6 listings_pending,
    # 7 listings_rejected, 8 listings_pending_changes, 9 bookings_total,
    # 10 upcoming_checkins, 11 payments_pending, 12 payments_proof,
    # 13 payments_verified, 14 payments_verified_amount,
    # 15 payments_refunded_amount, 16 payments_refund_pending_amount,
    # 17 escrows_held_amount, 18 host_payable, 19 platform_revenue,
    # 20 payouts_paid_amount, 21 payouts_pending, 22 payouts_pending_amount,
    # 23 escrows_held, 24 kyc_pending, 25 disputes_open, 26 disputes_in_review,
    # 27 maintenance_open, 28 tasks_pending, 29 tasks_overdue,
    # 30-35 bookings by status (requested, accepted, confirmed, completed,
    # cancelled, rejected)
    scalars = [0] * 36
    scalars[15] = 3150   # refunded
    scalars[16] = 6000   # refund pending
    scalars[17] = 9000   # escrow held amount
    scalars[18] = 442800 # host payable net
    scalars[19] = 67200  # platform revenue net
    scalars[20] = 50000  # payouts paid
    scalars[22] = 100000 # payouts pending amount
    scalars[23] = 3      # escrows held count
    fake_session.scalar = AsyncMock(side_effect=scalars)

    gov_result = MagicMock()
    gov_result.all.return_value = []
    fake_session.execute = AsyncMock(return_value=gov_result)

    overview = await admin_services.get_admin_overview(fake_session)

    assert overview.payments_refund_pending_amount_egp == 6000
    assert overview.payments_refunded_amount_egp == 3150
    assert overview.escrows_held_amount_egp == 9000
    assert overview.escrows_held == 3
    assert overview.host_payable_egp == 442800
    assert overview.platform_revenue_egp == 67200
    assert overview.payouts_paid_amount_egp == 50000
    assert overview.payouts_pending_amount_egp == 100000


# ---------------------------------------------------------------------------
# Bulk importer — canonical property-type validation + dedup
# ---------------------------------------------------------------------------


def _import_csv_bytes() -> bytes:
    return (
        "title,description,city,governorate,latitude,longitude,property_type,"
        "price,address,district,bedrooms,beds,bathrooms,max_guests,amenities,"
        "image_urls,host_name,host_phone,host_email,status\n"
        "Valid Flat,A nice flat,Cairo,Cairo,30.04,31.23,APARTMENT,1800,"
        "1 St,Downtown,2,2,1,4,wifi,https://example.com/a.jpg,"
        "H1,201,H1@example.com,PENDING_VERIFICATION\n"
        "House Row,A house,Dahab,South Sinai,28.49,34.51,HOUSE,1750,"
        "2 St,Lighthouse,2,3,1,5,wifi,https://example.com/b.jpg,"
        "H2,202,H2@example.com,PENDING_VERIFICATION\n"
        "Dup One,First,Cairo,Cairo,30.1,31.2,VILLA,2000,3 St,D3,1,1,1,2,"
        "wifi,,H3,203,H3@example.com,PENDING_VERIFICATION\n"
        "Dup One,Second copy same title+gov,Cairo,Cairo,30.1,31.2,VILLA,"
        "2100,4 St,D4,1,1,1,2,wifi,,H4,204,H4@example.com,PENDING_VERIFICATION\n"
    ).encode()


def test_importer_rejects_noncanonical_property_type() -> None:
    from app.importer.parser import parse_file
    from app.importer.validation import find_duplicates, validate_row

    rows = parse_file("listings.csv", _import_csv_bytes())
    assert len(rows) == 4

    errors_by_row = {r.row_number: validate_row(r) for r in rows}
    assert errors_by_row[2] == []
    house_errors = errors_by_row[3]
    assert any(
        e.field == "property_type" and "APARTMENT" in e.message
        for e in house_errors
    )
    assert errors_by_row[4] == []
    assert errors_by_row[5] == []

    # Rows 4 and 5 share title+city+governorate → second is a duplicate.
    assert find_duplicates(rows) == {5}
