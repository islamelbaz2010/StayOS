from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.listings.constants import CalendarStatus, UnitStatus
from app.listings.models import CalendarRule, Unit, UnitListing
from app.auth.models import User  # noqa: F401 — ensure mapper registry includes User
from app.bookings.models import Booking  # noqa: F401 — ensure mapper registry includes Booking
from app.listings.repository import (
    create_listing,
    get_calendar_rules_in_range,
    get_host_unit_ids,
    get_unit_with_listing,
    search_listings,
    update_unit_listing,
)
from app.listings.schemas import ListingCreate, ListingSearchFilters, ListingUpdate


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.scalar = AsyncMock(return_value=1)
    execute_result = MagicMock()
    execute_result.all = MagicMock(return_value=[])
    session.execute = AsyncMock(return_value=execute_result)
    return session


def _make_unit() -> Unit:
    return Unit(
        id="unit-1",
        host_id="host-1",
        property_type="APARTMENT",
        status=UnitStatus.LISTED,
        coordinates=WKTElement("POINT(31.0 30.0)", srid=4326),
        governorate="Cairo",
        city="Cairo",
        district=None,
        google_place_id=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
    )


def _make_listing() -> UnitListing:
    return UnitListing(
        id="listing-1",
        unit_id="unit-1",
        title_ar="شقة",
        title_en="Test",
        description_ar="وصف",
        description_en="Desc",
        amenities=["WIFI"],
        cultural_tags=["FAMILY_ONLY"],
        house_rules=None,
        check_in_instructions=None,
        policies=None,
        base_price_egp=1500,
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        country="Egypt",
        currency="EGP",
    )


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_create_listing(fake_session: AsyncMock) -> None:
    request = ListingCreate(
        property_type="APARTMENT",
        lat=30.0,
        lng=31.0,
        governorate="Cairo",
        city="Cairo",
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        title_ar="شقة",
        description_ar="وصف",
        base_price_egp=1500,
    )
    unit = await create_listing(fake_session, "host-1", request)
    assert unit.host_id == "host-1"
    assert unit.property_type == "APARTMENT"
    fake_session.add.assert_called()
    fake_session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_get_unit_with_listing(fake_session: AsyncMock) -> None:
    unit = _make_unit()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=unit)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_unit_with_listing(fake_session, "unit-1")
    assert result == unit


@pytest.mark.asyncio
async def test_update_unit_listing(fake_session: AsyncMock) -> None:
    unit = _make_unit()
    listing = _make_listing()
    request = ListingUpdate(base_price_egp=2000)
    updated = await update_unit_listing(fake_session, unit, listing, request)
    assert updated.base_price_egp == 2000


@pytest.mark.asyncio
async def test_search_listings(fake_session: AsyncMock) -> None:
    unit = _make_unit()
    listing = _make_listing()
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[(unit, listing, 30.0, 31.0)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    filters = ListingSearchFilters(
        sw_lat=29.9,
        sw_lng=30.9,
        ne_lat=30.1,
        ne_lng=31.1,
        lat=30.0,
        lng=31.0,
        radius_km=5.0,
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        min_price=1000,
        max_price=2000,
        property_type="APARTMENT",
        cultural_tags="FAMILY_ONLY",
        amenities="WIFI",
        guests=4,
        q="شقة",
    )
    rows, total = await search_listings(fake_session, filters, 0, 20)
    assert len(rows) == 1
    assert total == 1


@pytest.mark.asyncio
async def test_search_listings_sort_price_asc(fake_session: AsyncMock) -> None:
    """Sort by price_asc should be accepted and return results."""
    unit = _make_unit()
    listing = _make_listing()
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[(unit, listing, 30.0, 31.0)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    filters = ListingSearchFilters(sort="price_asc")
    rows, total = await search_listings(fake_session, filters, 0, 20)
    assert len(rows) == 1
    assert total == 1


@pytest.mark.asyncio
async def test_search_listings_sort_price_desc(fake_session: AsyncMock) -> None:
    """Sort by price_desc should be accepted and return results."""
    unit = _make_unit()
    listing = _make_listing()
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[(unit, listing, 30.0, 31.0)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    filters = ListingSearchFilters(sort="price_desc")
    rows, total = await search_listings(fake_session, filters, 0, 20)
    assert len(rows) == 1
    assert total == 1


@pytest.mark.asyncio
async def test_search_listings_sort_default_uses_created_at(fake_session: AsyncMock) -> None:
    """Default sort (no sort param) should be accepted and return results."""
    unit = _make_unit()
    listing = _make_listing()
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[(unit, listing, 30.0, 31.0)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    filters = ListingSearchFilters()
    rows, total = await search_listings(fake_session, filters, 0, 20)
    assert len(rows) == 1
    assert total == 1
    rule = CalendarRule(
        id="rule-1",
        unit_id="unit-1",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 3),
        status=CalendarStatus.AVAILABLE,
    )
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[rule])
    result_mock = MagicMock()
    result_mock.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_calendar_rules_in_range(
        fake_session, "unit-1", date(2026, 8, 1), date(2026, 8, 4)
    )
    assert len(result) == 1
    assert result[0].id == "rule-1"


@pytest.mark.asyncio
async def test_resolve_location_terms_city_level(fake_session: AsyncMock) -> None:
    """'alex' resolves to the Alexandria city-level alias — regression
    for destination search returning zero results when the query is a
    city name that never appears in title/description text."""
    from app.favorites.models import LocationAlias
    from app.listings.repository import _resolve_location_terms

    alias_row = LocationAlias(
        id="a1",
        canonical_name_en="Alexandria",
        canonical_name_ar="الإسكندرية",
        alias="alex",
        alias_type="variant",
        city="Alexandria",
        governorate="Alexandria",
        lat=31.2001,
        lng=29.9187,
    )
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[alias_row])
    result_mock = MagicMock()
    result_mock.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=result_mock)

    cities, govs, points = await _resolve_location_terms(fake_session, "Alex")
    assert cities == {"Alexandria"}
    assert govs == set()
    assert points == []


@pytest.mark.asyncio
async def test_resolve_location_terms_area_level(fake_session: AsyncMock) -> None:
    """Neighbourhood aliases resolve to coordinates, not the whole city."""
    from app.favorites.models import LocationAlias
    from app.listings.repository import _resolve_location_terms

    alias_row = LocationAlias(
        id="a2",
        canonical_name_en="Smouha",
        canonical_name_ar="سموحة",
        alias="smouha",
        alias_type="exact",
        city="Alexandria",
        governorate="Alexandria",
        lat=31.2106,
        lng=29.9453,
    )
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[alias_row])
    result_mock = MagicMock()
    result_mock.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=result_mock)

    cities, govs, points = await _resolve_location_terms(fake_session, "smouha")
    assert cities == set()
    assert govs == set()
    assert points == [(31.2106, 29.9453)]


@pytest.mark.asyncio
async def test_search_q_includes_location_match() -> None:
    """q is OR'd with a city/governorate match so 'Alexandria' finds
    listings whose title/description never name the city."""
    from app.listings.repository import _build_search_statement

    filters = ListingSearchFilters(q="Alexandria")
    stmt = _build_search_statement(
        filters, ({"Alexandria"}, set(), [])
    )
    compiled = str(stmt)
    assert "lower(pms.units.city)" in compiled
    assert "search_vector" in compiled


@pytest.mark.asyncio
async def test_get_host_unit_ids(fake_session: AsyncMock) -> None:
    result_mock = MagicMock()
    result_mock.all = MagicMock(return_value=[("unit-1",), ("unit-2",)])
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_host_unit_ids(fake_session, "host-1")
    assert result == ["unit-1", "unit-2"]
