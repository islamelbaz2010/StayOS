import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.listings.constants import CalendarStatus
from app.listings.models import CalendarRule, Unit, UnitListing, UnitPhoto
from app.listings.schemas import (
    ListingCreate,
    ListingSearchFilters,
    ListingUpdate,
)
from app.listings.services import (
    create_listing,
    get_availability,
    get_listing_detail,
    search_listings,
    update_listing,
)
from geoalchemy2.elements import WKTElement


def _make_user(
    user_id: str = "host-1",
    role: UserRole = UserRole.HOST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+1234567890",
        email="host@example.com",
        firebase_uid=None,
        display_name="Host",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
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
    )


def _make_unit(status: str = "LISTED") -> Unit:
    unit = Unit(
        id="unit-1",
        host_id="host-1",
        property_type="APARTMENT",
        status=status,
        coordinates=WKTElement("POINT(31.0 30.0)", srid=4326),
        governorate="Cairo",
        city="Cairo",
        district=None,
        google_place_id=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
    )
    unit.listing = _make_listing()
    unit.photos = [
        UnitPhoto(
            id="photo-1",
            unit_id="unit-1",
            s3_key="covers/test.jpg",
            url="https://cdn.example.com/covers/test.jpg",
            display_order=0,
            is_cover=True,
        )
    ]
    return unit


def _make_session() -> AsyncMock:
    session = AsyncMock()
    row = MagicMock(lat=30.0, lng=31.0)
    execute_result = MagicMock()
    execute_result.one = MagicMock(return_value=row)
    session.execute = AsyncMock(return_value=execute_result)
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_create_listing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "create_listing", AsyncMock(return_value=unit)
    )

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
    result = await create_listing(fake_session, _make_user(), request)
    assert result.property_type == "APARTMENT"
    assert result.base_price_egp == 1500


@pytest.mark.asyncio
async def test_create_listing_rejects_non_host(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.shared.exceptions import AuthorizationError

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
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await create_listing(fake_session, guest, request)


@pytest.mark.asyncio
async def test_get_listing_detail(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    result = await get_listing_detail(fake_session, "unit-1")
    assert result.id == "unit-1"
    assert result.lat == 30.0
    assert result.lng == 31.0
    assert result.title == "شقة"
    assert result.description == "وصف"
    assert result.price == 1500
    assert result.currency == "EGP"
    assert result.country == "Egypt"
    assert result.cover_image == "https://cdn.example.com/covers/test.jpg"


@pytest.mark.asyncio
async def test_update_listing(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository,
        "update_unit_listing",
        AsyncMock(return_value=unit.listing),
    )

    result = await update_listing(
        fake_session, _make_user(), "unit-1", ListingUpdate(base_price_egp=2000)
    )
    assert result.id == "unit-1"


@pytest.mark.asyncio
async def test_search_listings(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rows = [(unit, unit.listing, 30.0, 31.0)]
    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=(rows, 1))
    )

    filters = ListingSearchFilters(offset=10, limit=5)
    result = await search_listings(fake_session, filters)
    assert len(result.data) == 1
    assert result.pagination.total_count == 1
    assert result.data[0].title == "شقة"
    assert result.data[0].price == 1500
    assert result.data[0].currency == "EGP"
    assert result.data[0].cover_image == "https://cdn.example.com/covers/test.jpg"


@pytest.mark.asyncio
async def test_search_listings_validation(fake_session: AsyncMock) -> None:
    from app.listings.services import ValidationError

    filters = ListingSearchFilters(min_price=1000, max_price=500)
    with pytest.raises(ValidationError):
        await search_listings(fake_session, filters)


@pytest.mark.asyncio
async def test_get_availability(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rules = [
        CalendarRule(
            id=str(uuid.uuid4()),
            unit_id="unit-1",
            date_from=date(2026, 8, 2),
            date_to=date(2026, 8, 3),
            status=CalendarStatus.BLOCKED,
        )
    ]
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository,
        "get_calendar_rules_in_range",
        AsyncMock(return_value=rules),
    )

    result = await get_availability(
        fake_session, "unit-1", date(2026, 8, 1), date(2026, 8, 4)
    )
    assert result.unit_id == "unit-1"
    assert len(result.days) == 3
    assert result.days[1].status == "BLOCKED"
