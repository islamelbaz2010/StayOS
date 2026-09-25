"""Tests for the Founder Acceptance Reconciliation package:

- price distribution endpoint service (histogram bucketing)
- listing review lifecycle events (submit/approve/reject audit trail)
- admin overview + booking financial context + dispute context
"""

import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.admin.services import (
    get_booking_financial_context,
    get_dispute_context,
    list_admin_listings,
    list_admin_users,
)
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.disputes.models import Dispute
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.listings.schemas import ListingSearchFilters, ListingUpdate
from app.listings.services import (
    approve_listing,
    get_listing_change_history,
    get_price_distribution,
    reject_listing,
    update_listing,
)
from app.shared.exceptions import NotFoundError
from app.shared.models import OutboxEvent


@pytest.mark.asyncio
async def test_admin_user_filter_returns_underlying_users() -> None:
    session = _session()
    user = _host()
    result = MagicMock()
    result.scalars.return_value.all.return_value = [user]
    session.execute = AsyncMock(return_value=result)

    rows = await list_admin_users(session, role="host", kyc_status="verified")

    assert [row.id for row in rows] == ["host-1"]
    statement = str(session.execute.await_args.args[0])
    assert "auth.users.role" in statement
    assert "auth.users.kyc_status" in statement


@pytest.mark.asyncio
async def test_admin_governorate_filter_returns_matching_listings() -> None:
    session = _session()
    unit = _unit()
    unit.created_at = datetime.now(UTC)
    listing = _listing()
    listing.title_en = "Cairo stay"
    unit.listing = listing
    result = MagicMock()
    result.scalars.return_value.all.return_value = [unit]
    session.execute = AsyncMock(return_value=result)

    rows = await list_admin_listings(
        session, status="LISTED", governorate="Cairo"
    )

    assert len(rows) == 1
    assert rows[0].governorate == "Cairo"
    assert rows[0].status == "LISTED"
    statement = str(session.execute.await_args.args[0])
    assert "lower(pms.units.governorate)" in statement
    assert "pms.units.status" in statement


def _session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    return session


def _admin() -> User:
    now = datetime.now(UTC)
    return User(
        id="admin-1",
        phone_number="+1000000000",
        email=None,
        firebase_uid=None,
        display_name="Admin",
        locale="ar",
        role=str(UserRole.ADMIN),
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _host() -> User:
    now = datetime.now(UTC)
    return User(
        id="host-1",
        phone_number="+1111111111",
        email=None,
        firebase_uid=None,
        display_name="Host",
        locale="ar",
        role=str(UserRole.HOST),
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _unit(status: str = UnitStatus.LISTED) -> Unit:
    return Unit(
        id="unit-1",
        host_id="host-1",
        property_type="APARTMENT",
        status=str(status),
        rejection_reason=None,
        coordinates=None,
        governorate="Cairo",
        city="Zamalek",
        district=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        beds=2,
        address=None,
        photos=[],
    )


def _listing(pending: dict | None = None) -> UnitListing:
    return UnitListing(
        id="listing-1",
        unit_id="unit-1",
        title_ar="شقة",
        title_en="Flat",
        description_ar="وصف",
        description_en="Desc",
        amenities=[],
        cultural_tags=[],
        base_price_egp=1500,
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        country="Egypt",
        currency="EGP",
        category="ENTIRE_PLACE",
        cleaning_fee_egp=100,
        cancellation_policy="FLEXIBLE",
        instant_book=False,
        pending_changes=pending,
    )


# ---------------------------------------------------------------- price distribution


@pytest.mark.asyncio
async def test_price_distribution_buckets():
    session = _session()
    with patch(
        "app.listings.services.listings_repository.search_price_values",
        new=AsyncMock(return_value=[500, 600, 1500, 2000, 8000]),
    ):
        result = await get_price_distribution(session, ListingSearchFilters())

    assert result.min_price_egp == 500
    assert result.max_price_egp == 8000
    assert result.total == 5
    assert sum(b.count for b in result.buckets) == 5
    assert result.buckets[0].from_egp == 500


@pytest.mark.asyncio
async def test_price_distribution_empty():
    session = _session()
    with patch(
        "app.listings.services.listings_repository.search_price_values",
        new=AsyncMock(return_value=[]),
    ):
        result = await get_price_distribution(session, ListingSearchFilters())

    assert result.total == 0
    assert result.buckets == []
    assert result.min_price_egp is None


@pytest.mark.asyncio
async def test_price_distribution_single_price():
    session = _session()
    with patch(
        "app.listings.services.listings_repository.search_price_values",
        new=AsyncMock(return_value=[2000, 2000]),
    ):
        result = await get_price_distribution(session, ListingSearchFilters())

    assert result.min_price_egp == 2000
    assert result.max_price_egp == 2000
    assert result.buckets[0].count == 2


@pytest.mark.asyncio
async def test_price_distribution_ignores_price_filters():
    """The histogram always covers the full result range for the current
    search — min_price/max_price must not narrow the distribution."""
    session = _session()
    mock = AsyncMock(return_value=[100, 200])
    with patch(
        "app.listings.services.listings_repository.search_price_values",
        new=mock,
    ):
        await get_price_distribution(
            session,
            ListingSearchFilters(min_price=100, max_price=200),
        )
    filters = mock.call_args.args[1]
    assert filters.min_price is None
    assert filters.max_price is None


# ---------------------------------------------------------------- review lifecycle events


def _outbox_events(session: AsyncMock) -> list[OutboxEvent]:
    return [
        call.args[0]
        for call in session.add.call_args_list
        if isinstance(call.args[0], OutboxEvent)
    ]


@pytest.mark.asyncio
async def test_host_edit_on_listed_emits_submission_event():
    session = _session()
    unit = _unit(UnitStatus.LISTED)
    listing = _listing()
    unit.listing = listing

    with patch(
        "app.listings.services.listings_repository.get_unit_with_listing",
        new=AsyncMock(return_value=unit),
    ), patch(
        "app.listings.services._fetch_coordinates",
        new=AsyncMock(return_value=(30.0, 31.0)),
    ), patch(
        "app.listings.services.assert_can_edit_listing",
        new=AsyncMock(),
    ):
        await update_listing(
            session, _host(), "unit-1", ListingUpdate(title_en="New title")
        )

    events = _outbox_events(session)
    assert any(e.event_type == "listing.edit_submitted" for e in events)
    submitted = next(
        e for e in events if e.event_type == "listing.edit_submitted"
    )
    assert submitted.payload["submitted_by"] == "host-1"
    assert "title_en" in submitted.payload["fields"]
    # The published version must stay untouched.
    assert listing.title_en == "Flat"
    assert listing.pending_changes["listing"]["title_en"] == "New title"


@pytest.mark.asyncio
async def test_approve_pending_edit_applies_and_logs():
    session = _session()
    unit = _unit(UnitStatus.LISTED)
    listing = _listing(
        pending={
            "listing": {"title_en": "New title"},
            "submitted_by": "host-1",
            "submitted_at": datetime.now(UTC).isoformat(),
        }
    )
    unit.listing = listing

    with patch(
        "app.listings.services.listings_repository.get_unit_with_listing",
        new=AsyncMock(return_value=unit),
    ), patch(
        "app.listings.services._fetch_coordinates",
        new=AsyncMock(return_value=(30.0, 31.0)),
    ):
        session.execute = AsyncMock(
            return_value=MagicMock(
                **{"scalars.return_value.all.return_value": []}
            )
        )
        session.scalar = AsyncMock(return_value=_host())
        result = await approve_listing(session, _admin(), "unit-1")

    events = _outbox_events(session)
    assert any(e.event_type == "listing.edit_approved" for e in events)
    approved = next(
        e for e in events if e.event_type == "listing.edit_approved"
    )
    assert approved.payload["decided_by"] == "admin-1"
    assert "title_en" in approved.payload["fields"]
    # Host notification context — approval must not be silent.
    assert approved.payload["unit_id"] == "unit-1"
    assert approved.payload["host_id"] == "host-1"
    assert approved.payload["host_phone"] == "+1111111111"
    assert "listing_title" in approved.payload
    # Approved change is now live.
    assert listing.pending_changes is None
    assert listing.title_en == "New title"


@pytest.mark.asyncio
async def test_reject_pending_edit_discards_and_logs():
    session = _session()
    unit = _unit(UnitStatus.LISTED)
    listing = _listing(
        pending={
            "listing": {"title_en": "New title"},
            "submitted_by": "host-1",
            "submitted_at": datetime.now(UTC).isoformat(),
        }
    )
    unit.listing = listing

    with patch(
        "app.listings.services.listings_repository.get_unit_with_listing",
        new=AsyncMock(return_value=unit),
    ), patch(
        "app.listings.services._fetch_coordinates",
        new=AsyncMock(return_value=(30.0, 31.0)),
    ):
        session.execute = AsyncMock(
            return_value=MagicMock(
                **{"scalars.return_value.all.return_value": []}
            )
        )
        session.scalar = AsyncMock(return_value=_host())
        result = await reject_listing(
            session, _admin(), "unit-1", reason="Fix the title"
        )

    events = _outbox_events(session)
    rejected = next(
        e for e in events if e.event_type == "listing.edit_rejected"
    )
    assert rejected.payload["reason"] == "Fix the title"
    assert rejected.payload["host_id"] == "host-1"
    assert rejected.payload["unit_id"] == "unit-1"
    # Published version stays authoritative.
    assert listing.title_en == "Flat"
    assert listing.pending_changes is None
    assert unit.rejection_reason == "Fix the title"


@pytest.mark.asyncio
async def test_change_history_resolves_actor_names():
    session = _session()
    now = datetime.now(UTC)
    events = [
        OutboxEvent(
            id=str(uuid.uuid4()),
            aggregate_type="listing",
            aggregate_id="unit-1",
            event_type="listing.edit_submitted",
            payload={"submitted_by": "host-1", "fields": ["title_en"]},
        ),
        OutboxEvent(
            id=str(uuid.uuid4()),
            aggregate_type="listing",
            aggregate_id="unit-1",
            event_type="listing.edit_approved",
            payload={"decided_by": "admin-1", "fields": ["title_en"]},
        ),
    ]
    for event in events:
        event.created_at = now

    host = _host()
    admin = _admin()
    users_result = MagicMock()
    users_result.scalars.return_value.all.return_value = [host, admin]
    session.execute = AsyncMock(return_value=users_result)

    with patch(
        "app.listings.services.listings_repository.list_listing_events",
        new=AsyncMock(return_value=events),
    ):
        history = await get_listing_change_history(session, "unit-1")

    assert len(history) == 2
    assert history[0].actor_name == "Host"
    assert history[1].actor_name == "Admin"
    assert history[0].payload["fields"] == ["title_en"]


# ---------------------------------------------------------------- admin services


def _booking() -> Booking:
    return Booking(
        id="booking-1",
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(BookingStatus.CONFIRMED),
        check_in=date(2026, 10, 1),
        check_out=date(2026, 10, 4),
        adults=2,
        children=0,
        infants=0,
        requested_at=datetime.now(UTC),
        accepted_at=datetime.now(UTC),
        cancelled_at=None,
        cancel_reason=None,
    )


@pytest.mark.asyncio
async def test_booking_financial_context_not_found():
    session = _session()
    empty = MagicMock()
    empty.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=empty)

    with pytest.raises(NotFoundError):
        await get_booking_financial_context(session, "missing")


@pytest.mark.asyncio
async def test_booking_financial_context_joins_payment_context(monkeypatch):
    session = _session()
    booking = _booking()
    unit = _unit()
    listing = _listing()
    unit.listing = listing
    guest = _host()
    guest.id = "guest-1"
    host = _host()

    from app.payments.models import Payment

    payment = Payment(
        id="pay-1",
        booking_id="booking-1",
        status="verified",
        method="bank_transfer",
        amount_egp=5000,
        accommodation_amount_egp=4500,
        guest_service_fee_egp=400,
        cleaning_fee_egp=100,
        reference_number="REF-1",
        payment_deadline_at=None,
        proof_uploaded_at=None,
        verified_at=datetime.now(UTC),
        reject_reason=None,
        refund_amount_egp=None,
        refunded_at=None,
    )

    booking_result = MagicMock()
    booking_result.scalar_one_or_none.return_value = booking

    # Ordered scalar() calls: unit, listing, guest, host, payment, escrow.
    session.scalar = AsyncMock(
        side_effect=[unit, listing, guest, host, payment, None]
    )

    txn_result = MagicMock()
    txn_result.scalars.return_value.all.return_value = []
    dispute_result = MagicMock()
    dispute_result.scalars.return_value.all.return_value = []

    session.execute = AsyncMock(
        side_effect=[booking_result, txn_result, dispute_result]
    )

    # The economics helper counts the host's completed bookings — stub it
    # so the canonical platform-share math runs deterministically.
    monkeypatch.setattr(
        "app.bookings.repository.count_host_completed_bookings",
        AsyncMock(return_value=99),
    )

    ctx = await get_booking_financial_context(session, "booking-1")

    assert ctx.booking_id == "booking-1"
    assert ctx.booking_status == BookingStatus.CONFIRMED
    assert ctx.payment_id == "pay-1"
    assert ctx.payment_amount_egp == 5000
    assert ctx.guest_service_fee_egp == 400
    assert ctx.unit_title == "شقة"
    assert ctx.host_id == "host-1"

    # New-model detection: the 500 gap between the amount (5000) and the
    # stored host payable (4500) is the additive StayOS revenue — the
    # ledger stays balanced (4500 + 500 + 0 VAT = 5000).
    assert ctx.financials is not None
    assert ctx.financials["guest_paid_egp"] == 5000
    assert ctx.financials["accommodation_egp"] == 4400
    assert ctx.financials["cleaning_fee_egp"] == 100
    assert ctx.financials["platform_share_egp"] == 500
    assert ctx.financials["host_net_egp"] == 4500
    assert ctx.financials["platform_share_waived"] is False
    # No escrow row in this fixture → no payout state.
    assert ctx.payout is None


@pytest.mark.asyncio
async def test_dispute_context_not_found():
    session = _session()
    empty = MagicMock()
    empty.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=empty)

    with pytest.raises(NotFoundError):
        await get_dispute_context(session, "missing")


@pytest.mark.asyncio
async def test_dispute_context_includes_booking():
    session = _session()
    dispute = Dispute(
        id="disp-1",
        reporter_id="guest-1",
        booking_id="booking-1",
        category="booking",
        description="something went wrong here",
        status="open",
        admin_notes=None,
        resolved_by=None,
        resolved_at=None,
    )
    dispute.created_at = datetime.now(UTC)
    dispute.updated_at = datetime.now(UTC)

    dispute_result = MagicMock()
    dispute_result.scalar_one_or_none.return_value = dispute

    reporter = _host()
    reporter.id = "guest-1"

    booking = _booking()
    booking_result = MagicMock()
    booking_result.scalar_one_or_none.return_value = booking

    unit = _unit()
    unit.listing = _listing()
    guest = _host()
    guest.id = "guest-1"
    host = _host()

    empty_rows = MagicMock()
    empty_rows.scalars.return_value.all.return_value = []

    session.execute = AsyncMock(
        side_effect=[
            dispute_result,
            booking_result,
            empty_rows,  # financial transactions
            empty_rows,  # disputes on booking
        ]
    )
    # scalar() order: reporter, then inside booking context —
    # unit, listing, guest, host, payment, escrow.
    session.scalar = AsyncMock(
        side_effect=[reporter, unit, unit.listing, guest, host, None, None]
    )

    ctx = await get_dispute_context(session, "disp-1")

    assert ctx.dispute["id"] == "disp-1"
    assert ctx.reporter["id"] == "guest-1"
    assert ctx.booking is not None
    assert ctx.booking.booking_id == "booking-1"
