"""Differentiation layer tests: Local Fit (FD-24), custom offers (FD-07),
staff role groups (FD-18), earnings simulator (FD-21)."""

import uuid
from decimal import Decimal
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.constants import STAFF_ROLE_GROUPS, StaffPermission, UserRole


def _user(role=UserRole.GUEST, **kw):
    u = MagicMock()
    u.id = kw.pop("id", str(uuid.uuid4()))
    u.role = role
    u.kyc_status = kw.pop("kyc_status", "verified")
    u.locale = kw.pop("locale", "ar")
    u.languages = kw.pop("languages", ["ar"])
    for k, v in kw.items():
        setattr(u, k, v)
    return u


def _listing(**kw):
    listing = MagicMock()
    listing.amenities = kw.pop("amenities", ["wifi"])
    listing.cultural_tags = kw.pop("cultural_tags", [])
    listing.allows_pets = kw.pop("allows_pets", False)
    listing.self_check_in = kw.pop("self_check_in", False)
    listing.max_nights = kw.pop("max_nights", 30)
    listing.min_nights = kw.pop("min_nights", 1)
    listing.monthly_discount_pct = kw.pop("monthly_discount_pct", 0)
    listing.category = kw.pop("category", "ENTIRE_PLACE")
    for k, v in kw.items():
        setattr(listing, k, v)
    return listing


def _unit(**kw):
    unit = MagicMock()
    unit.id = kw.pop("id", "u1")
    unit.host_id = kw.pop("host_id", "h1")
    unit.max_guests = kw.pop("max_guests", 4)
    for k, v in kw.items():
        setattr(unit, k, v)
    return unit


# ============================================================
# LOCAL FIT (FD-24) — rule-based, explainable
# ============================================================


def test_fit_validate_preferences_drops_unknown() -> None:
    from app.listings.fit import validate_preferences

    assert validate_preferences(["pets", "near_metro", "pets"]) == ["pets"]
    assert validate_preferences([]) == []


def test_fit_compute_explainable_checks() -> None:
    from app.listings.fit import compute_fit

    listing = _listing(
        amenities=["wifi", "workspace"],
        cultural_tags=["FAMILY_ONLY"],
        self_check_in=True,
    )
    pct, checks = compute_fit(
        ["family_friendly", "self_check_in", "pets"],
        _unit(max_guests=4),
        listing,
        None,
    )
    # 2 of 3 pass → 67%
    assert pct == 67
    by_key = {c.key: c.passed for c in checks}
    assert by_key == {
        "family_friendly": True,
        "self_check_in": True,
        "pets": False,
    }
    assert all(c.label_en and c.label_ar for c in checks)


def test_fit_no_preferences_returns_none() -> None:
    from app.listings.fit import compute_fit

    pct, checks = compute_fit([], _unit(), _listing(), None)
    assert pct is None
    assert checks == []


def test_fit_arabic_host_rule() -> None:
    from app.listings.fit import compute_fit

    host = _user(role=UserRole.HOST, languages=["ar"])
    pct, checks = compute_fit(["arabic_host"], _unit(), _listing(), host)
    assert pct == 100
    pct, checks = compute_fit(
        ["arabic_host"], _unit(), _listing(),
        _user(role=UserRole.HOST, languages=["en"], locale="en"),
    )
    assert pct == 0


@pytest.mark.asyncio
async def test_fit_endpoint_scores_listing(monkeypatch) -> None:
    from app.listings.router import get_listing_fit_endpoint

    guest = _user(guest_preferences=["pets", "self_check_in"])
    unit = _unit()
    unit.listing = _listing(self_check_in=True)

    monkeypatch.setattr(
        "app.listings.repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    resp = await get_listing_fit_endpoint("u1", guest, AsyncMock())
    assert resp.match_pct == 50
    assert {c.key: c.passed for c in resp.checks} == {
        "pets": False, "self_check_in": True,
    }


# ============================================================
# CUSTOM OFFERS (FD-07)
# ============================================================


def _conversation(host_id="h1", guest_id="g1", unit_id="u1"):
    conv = MagicMock()
    conv.id = "c1"
    conv.unit_id = unit_id
    host_p = MagicMock()
    host_p.role = "host"
    host_p.user_id = host_id
    guest_p = MagicMock()
    guest_p.role = "guest"
    guest_p.user_id = guest_id
    conv.participants = [host_p, guest_p]
    return conv


@pytest.mark.asyncio
async def test_offer_create_happy_path(monkeypatch) -> None:
    from app.bookings import offers
    from app.bookings.schemas import BookingOfferCreate
    from app.listings.constants import UnitStatus

    host = _user(role=UserRole.HOST, id="h1")
    conv = _conversation()
    unit = _unit()
    unit.status = UnitStatus.LISTED
    unit.listing = _listing()

    monkeypatch.setattr(
        offers.messages_repository, "get_conversation_by_id_or_raise",
        AsyncMock(return_value=conv),
    )
    monkeypatch.setattr(
        offers.messages_repository, "is_conversation_participant",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        offers.listings_repository, "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        offers.listings_repository, "lock_unit_for_booking", AsyncMock()
    )
    monkeypatch.setattr(
        "app.bookings.services._assert_no_conflicts", AsyncMock()
    )
    monkeypatch.setattr(offers.messages_services, "send_message", AsyncMock())
    monkeypatch.setattr(offers, "write_event", AsyncMock())

    session = AsyncMock()
    pending = MagicMock()
    pending.scalars.return_value.all.return_value = []
    session.execute = AsyncMock(return_value=pending)

    now = datetime.now(UTC)
    added: list = []

    def _add(obj):
        added.append(obj)
        for attr in ("created_at", "updated_at"):
            if getattr(obj, attr, None) is None:
                setattr(obj, attr, now)

    session.add = _add

    resp = await offers.create_booking_offer(
        session, host, "c1",
        BookingOfferCreate(
            check_in=date.today() + timedelta(days=7),
            check_out=date.today() + timedelta(days=10),
            total_price_egp=1500,
        ),
    )
    assert resp.status == "pending"
    assert resp.total_price_egp == 1500
    assert added


@pytest.mark.asyncio
async def test_offer_create_guest_forbidden(monkeypatch) -> None:
    from app.bookings import offers
    from app.bookings.schemas import BookingOfferCreate
    from app.shared.exceptions import AuthorizationError

    with pytest.raises(AuthorizationError):
        await offers.create_booking_offer(
            AsyncMock(), _user(role=UserRole.GUEST), "c1",
            BookingOfferCreate(
                check_in=date.today() + timedelta(days=7),
                check_out=date.today() + timedelta(days=10),
                total_price_egp=1500,
            ),
        )


@pytest.mark.asyncio
async def test_offer_accept_creates_booking_and_payment(monkeypatch) -> None:
    from app.bookings import offers
    from app.listings.constants import UnitStatus

    guest = _user(role=UserRole.GUEST, id="g1")
    offer = MagicMock()
    offer.id = str(uuid.uuid4())
    offer.status = "pending"
    offer.guest_id = "g1"
    offer.host_id = "h1"
    offer.unit_id = "u1"
    offer.conversation_id = "c1"
    offer.check_in = date.today() + timedelta(days=7)
    offer.check_out = date.today() + timedelta(days=10)
    offer.expires_at = datetime.now(UTC) + timedelta(hours=12)
    offer.total_price_egp = 1500
    offer.booking_id = None

    unit = _unit()
    unit.status = UnitStatus.LISTED
    unit.listing = _listing()

    result = MagicMock()
    result.scalar_one_or_none.return_value = offer
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)

    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    monkeypatch.setattr(
        offers.bookings_repository, "create_booking",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        offers.listings_repository, "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        offers.listings_repository, "lock_unit_for_booking", AsyncMock()
    )
    monkeypatch.setattr(
        "app.bookings.services._assert_no_conflicts", AsyncMock()
    )
    monkeypatch.setattr(offers.messages_services, "send_message", AsyncMock())
    monkeypatch.setattr(offers, "write_event", AsyncMock())
    create_payment = AsyncMock()
    monkeypatch.setattr(
        "app.payments.services.create_payment_for_booking", create_payment
    )
    monkeypatch.setattr(
        "app.bookings.services._to_response", lambda b: MagicMock()
    )

    await offers.accept_booking_offer(session, guest, offer.id)

    assert booking.custom_total_egp == 1500
    assert booking.offer_id == offer.id
    assert offer.status == "accepted"
    create_payment.assert_awaited_once()


@pytest.mark.asyncio
async def test_offer_accept_wrong_guest_rejected(monkeypatch) -> None:
    from app.bookings import offers
    from app.shared.exceptions import AuthorizationError

    offer = MagicMock()
    offer.status = "pending"
    offer.guest_id = "other-guest"
    offer.expires_at = datetime.now(UTC) + timedelta(hours=12)

    result = MagicMock()
    result.scalar_one_or_none.return_value = offer
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)

    with pytest.raises(AuthorizationError):
        await offers.accept_booking_offer(
            session, _user(role=UserRole.GUEST, id="g1"), "o1"
        )


@pytest.mark.asyncio
async def test_offer_expired_cannot_accept(monkeypatch) -> None:
    from app.bookings import offers
    from app.shared.exceptions import ConflictError

    offer = MagicMock()
    offer.status = "pending"
    offer.guest_id = "g1"
    offer.expires_at = datetime.now(UTC) - timedelta(hours=1)

    result = MagicMock()
    result.scalar_one_or_none.return_value = offer
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)

    with pytest.raises(ConflictError):
        await offers.accept_booking_offer(
            session, _user(role=UserRole.GUEST, id="g1"), "o1"
        )
    assert offer.status == "expired"


# ============================================================
# STAFF ROLE GROUPS (FD-18)
# ============================================================


def test_role_groups_cover_known_permissions() -> None:
    valid = {p.value for p in StaffPermission}
    for key, group in STAFF_ROLE_GROUPS.items():
        assert set(group["permissions"]) <= valid
        assert group["label_en"] and group["label_ar"]


def test_role_groups_include_required_templates() -> None:
    for key in ("operations_manager", "kyc_officer", "finance_officer",
                "listings_manager", "admin"):
        assert key in STAFF_ROLE_GROUPS
    assert set(STAFF_ROLE_GROUPS["admin"]["permissions"]) == {
        p.value for p in StaffPermission
    }


@pytest.mark.asyncio
async def test_staff_create_with_role_group(monkeypatch) -> None:
    from app.auth import staff as staff_services
    from app.auth.staff_schemas import StaffCreateRequest

    admin = _user(role=UserRole.ADMIN)
    request = StaffCreateRequest(
        phone_number="+201000000099",
        display_name="Finance Staff",
        role_group="finance_officer",
    )
    monkeypatch.setattr(
        staff_services.auth_repository, "get_user_by_phone",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        staff_services.auth_repository, "get_user_by_email",
        AsyncMock(return_value=None),
    )

    session = AsyncMock()
    created = []
    now = datetime.now(UTC)

    def _capture(obj):
        created.append(obj)
        for attr in ("created_at", "updated_at"):
            if getattr(obj, attr, None) is None:
                setattr(obj, attr, now)

    session.add = _capture
    result = await staff_services.create_staff(session, admin, request)
    assert set(result.permissions) == {"payments", "disputes"}


@pytest.mark.asyncio
async def test_staff_create_unknown_role_group_rejected(monkeypatch) -> None:
    from app.auth import staff as staff_services
    from app.auth.staff_schemas import StaffCreateRequest
    from app.shared.exceptions import ValidationError

    request = StaffCreateRequest(
        phone_number="+201000000099",
        display_name="Bad Group",
        role_group="super_admin",
    )
    with pytest.raises(ValidationError):
        await staff_services.create_staff(
            AsyncMock(), _user(role=UserRole.ADMIN), request
        )


# ============================================================
# EARNINGS SIMULATOR (FD-21) — canonical engine
# ============================================================


@pytest.mark.asyncio
async def test_earnings_simulator_uses_canonical_engine() -> None:
    from app.host import services as host_services
    from app.host.schemas import EarningsSimulateRequest

    resp = await host_services.simulate_earnings(
        _user(role=UserRole.HOST),
        EarningsSimulateRequest(
            nightly_price_egp=500, nights=4, cleaning_fee_egp=50
        ),
    )
    # 2000 accom + 50 cleaning + 240 (12%) = 2290 taxable; VAT 320.60 →
    # guest 2610.60. Host payable = accom + cleaning = 2050.
    assert resp.vat_egp == Decimal("320.60")
    assert resp.guest_total_egp == Decimal("2610.60")
    assert resp.stayos_share_egp == Decimal("240.00")
    assert resp.host_net_egp == Decimal("2050.00")
    assert resp.discount_egp == 0


@pytest.mark.asyncio
async def test_earnings_simulator_with_discount() -> None:
    from app.host import services as host_services
    from app.host.schemas import EarningsSimulateRequest

    resp = await host_services.simulate_earnings(
        _user(role=UserRole.HOST),
        EarningsSimulateRequest(
            nightly_price_egp=500, nights=8, cleaning_fee_egp=0,
            discount_pct=10,
        ),
    )
    # 4000 − 10% = 3600 accom; +432 (12%) → taxable 4032; VAT 564.48 →
    # guest 4596.48. Host payable = accom + cleaning = 3600.
    assert resp.accommodation_egp == 3600
    assert resp.discount_egp == 400
    assert resp.vat_egp == Decimal("564.48")
    assert resp.guest_total_egp == Decimal("4596.48")
    assert resp.stayos_share_egp == Decimal("432.00")
    assert resp.host_net_egp == Decimal("3600.00")


@pytest.mark.asyncio
async def test_earnings_simulator_guest_forbidden() -> None:
    from app.host import services as host_services
    from app.host.schemas import EarningsSimulateRequest
    from app.shared.exceptions import AuthorizationError

    with pytest.raises(AuthorizationError):
        await host_services.simulate_earnings(
            _user(role=UserRole.GUEST),
            EarningsSimulateRequest(nightly_price_egp=500),
        )


# ============================================================
# FD-03 — infants do not count toward max_guests
# ============================================================


def test_booking_infants_excluded_from_capacity() -> None:
    """max_guests counts adults + children only (FD-03)."""
    from app.bookings import services as booking_services
    from app.bookings.schemas import BookingCreate as BookingCreateRequest
    from app.shared.exceptions import ValidationError

    unit = _unit(max_guests=3)
    request = BookingCreateRequest(
        unit_id="u1",
        check_in=date.today() + timedelta(days=7),
        check_out=date.today() + timedelta(days=9),
        adults=2,
        children=1,
        infants=2,  # would be 5 guests if infants counted — must pass
    )
    booking_services._assert_guest_capacity(unit, request)

    over_capacity = BookingCreateRequest(
        unit_id="u1",
        check_in=date.today() + timedelta(days=7),
        check_out=date.today() + timedelta(days=9),
        adults=3,
        children=1,
        infants=0,
    )
    with pytest.raises(ValidationError):
        booking_services._assert_guest_capacity(unit, over_capacity)


# ============================================================
# FD-04 — review report → admin moderation queue
# ============================================================


@pytest.mark.asyncio
async def test_report_review_creates_open_report(monkeypatch) -> None:
    from app.reviews import services as review_services
    from app.reviews.schemas import ReviewReportCreate
    from app.reviews.constants import ReviewReportReason

    review = MagicMock()
    review.id = "r1"
    review.reviewer_id = "someone-else"

    monkeypatch.setattr(
        review_services.reviews_repository,
        "get_review_by_id",
        AsyncMock(return_value=review),
    )

    session = AsyncMock()
    empty = MagicMock()
    empty.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=empty)

    added = []
    now = datetime.now(UTC)

    def _add(obj):
        added.append(obj)
        if getattr(obj, "id", None) is None:
            obj.id = str(uuid.uuid4())
        for attr in ("created_at", "updated_at"):
            if getattr(obj, attr, None) is None:
                setattr(obj, attr, now)

    session.add = _add

    resp = await review_services.report_review(
        session,
        _user(role=UserRole.GUEST),
        "r1",
        ReviewReportCreate(reason=ReviewReportReason.SPAM),
    )
    assert resp.status == "open"
    assert resp.review_id == "r1"


@pytest.mark.asyncio
async def test_report_own_review_rejected(monkeypatch) -> None:
    from app.reviews import services as review_services
    from app.reviews.schemas import ReviewReportCreate
    from app.reviews.constants import ReviewReportReason
    from app.shared.exceptions import ValidationError

    user = _user(role=UserRole.HOST)
    review = MagicMock()
    review.id = "r1"
    review.reviewer_id = user.id

    monkeypatch.setattr(
        review_services.reviews_repository,
        "get_review_by_id",
        AsyncMock(return_value=review),
    )

    with pytest.raises(ValidationError):
        await review_services.report_review(
            AsyncMock(),
            user,
            "r1",
            ReviewReportCreate(reason=ReviewReportReason.SPAM),
        )


@pytest.mark.asyncio
async def test_admin_hide_review_via_report(monkeypatch) -> None:
    from app.reviews import services as review_services
    from app.reviews.schemas import ReviewReportAdminUpdate
    from app.reviews.constants import ReviewReportStatus

    review = MagicMock()
    review.id = "r1"
    review.is_hidden = False

    report = MagicMock()
    report.id = "rep1"
    report.review_id = "r1"
    report.reporter_id = "guest-1"
    report.reason = "spam"
    report.details = None
    report.status = "open"
    report.admin_notes = None
    report.resolved_by = None
    report.resolved_at = None
    report.created_at = datetime.now(UTC)
    report.updated_at = datetime.now(UTC)

    monkeypatch.setattr(
        review_services.reviews_repository,
        "get_review_by_id",
        AsyncMock(return_value=review),
    )

    session = AsyncMock()
    found = MagicMock()
    found.scalar_one_or_none.return_value = report
    session.execute = AsyncMock(return_value=found)

    resp = await review_services.update_review_report_admin(
        session,
        _user(role=UserRole.ADMIN),
        "rep1",
        ReviewReportAdminUpdate(
            status=ReviewReportStatus.RESOLVED, hide_review=True
        ),
    )
    assert review.is_hidden is True
    assert resp.status == "resolved"
