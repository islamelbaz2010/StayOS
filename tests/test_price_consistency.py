"""Price-consistency E2E — "THE PRICE YOU SEE IS THE PRICE YOU PAY".

For the canonical Founder example (accommodation 3,000 EGP/night × 1
night + cleaning 200 EGP), the exact same all-inclusive amount must
surface at every step of the guest journey:

    Search → Listing Detail → Booking Quote → Payment → Paymob

    3,000 + 200 + 180 (host-side 6%) + 180 (guest-side 6%) = 3,560 taxable
    3,560 × 14% VAT = 498.40
    Final guest price = 4,058.40

No amount may change at checkout, and no guest surface may expose the
internal components (cleaning, VAT, 6%/12% allocations, service fee).
"""

import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.bookings.models import Booking
from app.finance import commercial
from app.listings.models import Unit, UnitListing, UnitPhoto
from app.listings.schemas import ListingSearchFilters

# ---------------------------------------------------------------------------
# Canonical fixture — Founder deterministic example
# ---------------------------------------------------------------------------

NIGHTLY_EGP = 3000
CLEANING_EGP = 200
CHECK_IN = date(2026, 11, 1)
CHECK_OUT = date(2026, 11, 2)  # 1 night → accommodation 3,000

GUEST_TOTAL = Decimal("4058.40")
PAYMOB_MINOR_UNITS = 405840  # 4,058.40 EGP in piastres


def _listing() -> UnitListing:
    return UnitListing(
        unit_id="unit-1",
        title_ar="شقة",
        title_en="Canonical Flat",
        description_ar="وصف",
        amenities=[],
        cultural_tags=[],
        house_rules=None,
        check_in_instructions=None,
        policies=None,
        base_price_egp=NIGHTLY_EGP,
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        country="Egypt",
        currency="EGP",
        category="ENTIRE_PLACE",
        cleaning_fee_egp=CLEANING_EGP,
        cancellation_policy="FLEXIBLE",
        listing_discount_pct=0,
        weekly_discount_pct=0,
        monthly_discount_pct=0,
    )


def _unit() -> Unit:
    unit = Unit(
        id="unit-1",
        host_id="host-1",
        property_type="APARTMENT",
        status="LISTED",
        coordinates=WKTElement("POINT(31.0 30.0)", srid=4326),
        governorate="Cairo",
        city="Cairo",
        district=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        beds=1,
    )
    unit.listing = _listing()
    unit.calendar_rules = []
    unit.photos = [
        UnitPhoto(
            id="photo-1", unit_id="unit-1", s3_key="covers/test.jpg",
            url="https://cdn.example.com/covers/test.jpg",
            display_order=0, is_cover=True,
        )
    ]
    return unit


def _session() -> AsyncMock:
    session = AsyncMock()
    empty = MagicMock()
    empty.scalars.return_value.all.return_value = []
    row = MagicMock(lat=30.0, lng=31.0)
    coords = MagicMock()
    coords.one = MagicMock(return_value=row)
    session.execute = AsyncMock(side_effect=[coords, empty, empty, empty])
    return session


@pytest.mark.asyncio
async def test_price_consistent_search_to_paymob(monkeypatch) -> None:
    """Search → Detail → Quote → Payment → Paymob: 4,058.40 everywhere."""
    from app.listings import services as listing_services
    from app.payments import services as payment_services

    unit = _unit()
    session = _session()

    # ---- Search (dateless discovery) -------------------------------------
    monkeypatch.setattr(
        listing_services.listings_repository, "search_listings",
        AsyncMock(return_value=([(unit, unit.listing, 30.0, 31.0)], 1)),
    )
    monkeypatch.setattr(
        listing_services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={"unit-1": (None, 0)}),
    )
    result = await listing_services.search_listings(
        session, ListingSearchFilters()
    )
    assert result.data[0].price == GUEST_TOTAL  # all-inclusive nightly

    # ---- Search (selected dates) ------------------------------------------
    session2 = _session()
    result = await listing_services.search_listings(
        session2,
        ListingSearchFilters(check_in=CHECK_IN, check_out=CHECK_OUT),
    )
    assert result.data[0].nights == 1
    assert result.data[0].total_egp == GUEST_TOTAL
    assert result.data[0].effective_nightly_egp == GUEST_TOTAL

    # ---- Listing detail -----------------------------------------------------
    monkeypatch.setattr(
        listing_services.listings_repository, "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.listings.services._fetch_host", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        "app.listings.services._calculate_host_response_metrics",
        AsyncMock(return_value=(None, None)),
    )
    monkeypatch.setattr(
        listing_services.reviews_repository,
        "get_rating_aggregate_for_unit",
        AsyncMock(return_value=(None, 0)),
    )
    detail = await listing_services.get_listing_detail(session, "unit-1")
    assert detail.price == GUEST_TOTAL  # same all-inclusive nightly

    # ---- Booking quote (date selection / BookingPanel) ----------------------
    monkeypatch.setattr(
        payment_services.listings_repository, "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        payment_services.listings_repository,
        "get_calendar_rules_in_range", AsyncMock(return_value=[]),
    )
    quote = await payment_services.get_booking_quote(
        session, "unit-1", CHECK_IN, CHECK_OUT
    )
    assert quote.total_egp == GUEST_TOTAL
    assert quote.accommodation_egp == GUEST_TOTAL
    # Guest contract exposes no internal components.
    for f in (
        "cleaning_fee_egp", "vat_egp", "service_fee_egp",
        "platform_share_egp", "host_net_egp", "nightly_rate_egp",
    ):
        assert f not in type(quote).model_fields

    # ---- Payment creation (checkout amount) ---------------------------------
    guest = MagicMock(id="guest-1", locale="en")
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.unit_id = "unit-1"
    booking.guest_id = "guest-1"
    booking.check_in = CHECK_IN
    booking.check_out = CHECK_OUT
    booking.custom_total_egp = None

    captured: dict = {}

    async def _capture(sess, **kwargs):
        captured.update(kwargs)
        now = datetime.now(UTC)
        return MagicMock(
            id="pay-1", booking_id=booking.id, guest_id="guest-1",
            host_id="host-1", unit_id="unit-1", status="pending",
            method="manual", provider=None, checkout_url=None,
            amount_egp=kwargs["amount_egp"],
            accommodation_amount_egp=kwargs["accommodation_amount_egp"],
            vat_egp=kwargs["vat_egp"], nights=1, reference_number="REF",
            guest_service_fee_egp=0, cleaning_fee_egp=kwargs["cleaning_fee_egp"],
            proof_s3_key=None, proof_url=None, proof_uploaded_at=None,
            verified_at=None, verified_by=None, rejected_at=None,
            rejected_by=None, reject_reason=None, cancelled_at=None,
            refund_amount_egp=None, refunded_at=None,
            payment_deadline_at=kwargs.get("payment_deadline_at"),
            proof_rejection_count=0, instructions="i",
            unit=None, created_at=now, updated_at=now,
        )

    monkeypatch.setattr(
        payment_services.payments_repository, "get_payment_by_booking",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        payment_services.payments_repository, "create_payment", _capture
    )
    monkeypatch.setattr(
        payment_services, "_emit_outbox_event", AsyncMock()
    )
    await payment_services.create_payment_for_booking(session, booking, guest)
    # Checkout charge = the exact all-inclusive total already displayed.
    assert captured["amount_egp"] == GUEST_TOTAL
    assert captured["vat_egp"] == Decimal("498.40")
    assert captured["accommodation_amount_egp"] == Decimal("3200.00")

    # ---- Paymob intention — exact minor units, server-authoritative --------
    now = datetime.now(UTC)
    payment_row = MagicMock(
        id="pay-1", booking_id=booking.id, guest_id="guest-1",
        host_id="host-1", unit_id="unit-1", status="pending",
        method="manual", provider=None, checkout_url=None,
        amount_egp=GUEST_TOTAL,
        accommodation_amount_egp=Decimal("3200.00"),
        vat_egp=Decimal("498.40"), nights=1, reference_number="REF",
        guest_service_fee_egp=0, cleaning_fee_egp=Decimal("200"),
        proof_s3_key=None, proof_url=None, proof_uploaded_at=None,
        verified_at=None, verified_by=None, rejected_at=None,
        rejected_by=None, reject_reason=None, cancelled_at=None,
        refund_amount_egp=None, refunded_at=None,
        payment_deadline_at=now, proof_rejection_count=0,
        instructions="i", unit=None, created_at=now, updated_at=now,
    )
    monkeypatch.setattr(
        payment_services.payments_repository, "get_payment_or_raise",
        AsyncMock(return_value=payment_row),
    )
    provider_amounts: list = []

    async def _fake_paymob(booking_id, amount_egp, **kw):
        provider_amounts.append(amount_egp)
        return {
            "payment_intent_id": "pi_test",
            "client_secret": "cs_test",
            "checkout_url": "https://paymob.example/checkout",
        }

    monkeypatch.setattr(
        "app.finance.providers.create_paymob_payment", _fake_paymob
    )
    monkeypatch.setattr(
        payment_services.payments_repository, "update_payment",
        AsyncMock(return_value=payment_row),
    )
    resp = await payment_services.create_card_checkout_session(
        session, guest, "pay-1"
    )
    assert provider_amounts == [GUEST_TOTAL]
    assert commercial.to_minor_units(provider_amounts[0]) == PAYMOB_MINOR_UNITS
