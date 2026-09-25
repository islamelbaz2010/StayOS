import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings.constants import CalendarStatus, UnitStatus
from app.listings.models import CalendarRule, Unit, UnitListing, UnitPhoto
from app.listings.schemas import (
    ListingCreate,
    ListingSearchFilters,
    ListingUpdate,
    PhotoCreate,
)
from app.listings.services import (
    approve_listing,
    create_listing,
    get_availability,
    get_listing_detail,
    search_listings,
    update_listing,
)


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
        country="Egypt",
        currency="EGP",
        category="ENTIRE_PLACE",
        cleaning_fee_egp=0,
        cancellation_policy="FLEXIBLE",
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
        beds=1,
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
    # session.refresh is a no-op on the mock session — the unit already
    # has listing/photos populated via _make_unit().
    fake_session.refresh = AsyncMock(return_value=None)
    # _fetch_host returns a User for _to_listing_response.
    host = _make_user()
    monkeypatch.setattr(
        "app.listings.services._fetch_host", AsyncMock(return_value=host)
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
    monkeypatch.setattr(
        listings.services, "_fetch_host", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregate_for_unit",
        AsyncMock(return_value=(None, 0)),
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


def _make_search_session_result() -> MagicMock:
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    return result


@pytest.mark.asyncio
async def test_search_listings_no_dates_shows_per_night_only(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rows = [(unit, unit.listing, 30.0, 31.0)]
    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=(rows, 1))
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={"unit-1": (None, 0)}),
    )
    fake_session.execute = AsyncMock(return_value=_make_search_session_result())

    filters = ListingSearchFilters(offset=10, limit=5)
    result = await search_listings(fake_session, filters)
    assert len(result.data) == 1
    assert result.data[0].price == 1500
    assert result.data[0].available_for_dates is None
    assert result.data[0].nights is None
    assert result.data[0].total_egp is None


@pytest.mark.asyncio
async def test_search_listings_selected_dates_total_and_nights(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    rows = [(unit, unit.listing, 30.0, 31.0)]
    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=(rows, 1))
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={"unit-1": (None, 0)}),
    )
    # Alpha free-booking incentive active → guest service fee waived, so the
    # all-in total equals the accommodation subtotal.
    monkeypatch.setattr(
        listings.services.bookings_repository,
        "count_global_completed_bookings",
        AsyncMock(return_value=0),
    )
    fake_session.execute = AsyncMock(return_value=_make_search_session_result())

    check_in = date(2026, 8, 1)
    check_out = date(2026, 8, 4)
    filters = ListingSearchFilters(check_in=check_in, check_out=check_out)
    result = await search_listings(fake_session, filters)
    assert len(result.data) == 1
    assert result.data[0].available_for_dates is True
    assert result.data[0].nights == 3
    # 1500 × 3 = 4500 taxable + 14% VAT (630)
    assert result.data[0].total_egp == 1500 * 3 + 630


@pytest.mark.asyncio
async def test_search_listings_calendar_rule_override_respected(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    unit.calendar_rules = [
        CalendarRule(
            id=str(uuid.uuid4()),
            unit_id="unit-1",
            date_from=date(2026, 8, 2),
            date_to=date(2026, 8, 3),
            status=CalendarStatus.AVAILABLE,
            price_override=3000,
        )
    ]
    rows = [(unit, unit.listing, 30.0, 31.0)]
    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=(rows, 1))
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={"unit-1": (None, 0)}),
    )
    monkeypatch.setattr(
        listings.services.bookings_repository,
        "count_global_completed_bookings",
        AsyncMock(return_value=0),
    )
    fake_session.execute = AsyncMock(return_value=_make_search_session_result())

    check_in = date(2026, 8, 1)
    check_out = date(2026, 8, 4)
    filters = ListingSearchFilters(check_in=check_in, check_out=check_out)
    result = await search_listings(fake_session, filters)
    assert result.data[0].nights == 3
    # 1500 + 3000 (override) + 1500 = 6000 taxable + 14% VAT (840)
    assert result.data[0].total_egp == 6000 + 840


@pytest.mark.asyncio
async def test_search_listings_adjacent_blocked_rule_excludes_correctly(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    unit.calendar_rules = [
        CalendarRule(
            id=str(uuid.uuid4()),
            unit_id="unit-1",
            date_from=date(2026, 8, 1),
            date_to=date(2026, 8, 3),
            status=CalendarStatus.BLOCKED,
        )
    ]
    rows = [(unit, unit.listing, 30.0, 31.0)]
    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=(rows, 1))
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={"unit-1": (None, 0)}),
    )
    monkeypatch.setattr(
        listings.services.bookings_repository,
        "count_global_completed_bookings",
        AsyncMock(return_value=0),
    )
    fake_session.execute = AsyncMock(return_value=_make_search_session_result())

    # The night of 2026-08-03 is after the blocked rule (which covers 2026-08-01 and 2026-08-02).
    check_in = date(2026, 8, 3)
    check_out = date(2026, 8, 4)
    filters = ListingSearchFilters(check_in=check_in, check_out=check_out)
    result = await search_listings(fake_session, filters)
    assert result.data[0].nights == 1
    # 1500 taxable + 14% VAT (210)
    assert result.data[0].total_egp == 1500 + 210


@pytest.mark.asyncio
async def test_search_listings_empty_when_no_units_available_for_dates(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    monkeypatch.setattr(
        listings.repository, "search_listings", AsyncMock(return_value=([], 0))
    )
    monkeypatch.setattr(
        listings.services.reviews_repository,
        "get_rating_aggregates_for_units",
        AsyncMock(return_value={}),
    )
    monkeypatch.setattr(
        listings.services.bookings_repository,
        "count_global_completed_bookings",
        AsyncMock(return_value=0),
    )
    fake_session.execute = AsyncMock(return_value=_make_search_session_result())

    filters = ListingSearchFilters(check_in=date(2026, 8, 1), check_out=date(2026, 8, 4))
    result = await search_listings(fake_session, filters)
    assert result.data == []
    assert result.pagination.total_count == 0


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


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_success(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://s3.example.com/upload"
    monkeypatch.setattr(
        "app.listings.services._s3_client", MagicMock(return_value=mock_s3)
    )

    from app.listings.services import generate_photo_presigned_url

    result = await generate_photo_presigned_url(
        fake_session, _make_user(), "unit-1", "photo.jpg", "image/jpeg"
    )
    assert result.upload_url == "https://s3.example.com/upload"
    assert result.photo_key.startswith("listings/unit-1/photo_")
    assert result.photo_key.endswith(".jpg")
    mock_s3.generate_presigned_url.assert_called_once()
    call_kwargs = mock_s3.generate_presigned_url.call_args
    assert call_kwargs.kwargs["Params"]["ContentType"] == "image/jpeg"
    assert call_kwargs.kwargs["ExpiresIn"] == 900


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_non_owner(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings
    from app.shared.exceptions import AuthorizationError

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    from app.listings.services import generate_photo_presigned_url

    other_user = _make_user(user_id="other-host")
    with pytest.raises(AuthorizationError):
        await generate_photo_presigned_url(
            fake_session, other_user, "unit-1", "photo.jpg", "image/jpeg"
        )


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_not_found(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings
    from app.shared.exceptions import NotFoundError

    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=None)
    )

    from app.listings.services import generate_photo_presigned_url

    with pytest.raises(NotFoundError):
        await generate_photo_presigned_url(
            fake_session, _make_user(), "missing-unit", "photo.jpg", "image/jpeg"
        )


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_admin(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://s3.example.com/upload"
    monkeypatch.setattr(
        "app.listings.services._s3_client", MagicMock(return_value=mock_s3)
    )

    from app.listings.services import generate_photo_presigned_url

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    result = await generate_photo_presigned_url(
        fake_session, admin, "unit-1", "photo.png", "image/png"
    )
    assert result.upload_url == "https://s3.example.com/upload"
    assert result.photo_key.startswith("listings/unit-1/photo_")
    assert result.photo_key.endswith(".png")


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_storage_unconfigured(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Same production failure class as KYC: Railway defines the AWS/S3
    variables but leaves them empty, so boto3 built `https://s3..amazonaws.com`
    and crashed with an unhandled ValueError → HTTP 500 on /photos/presign.
    Presigning must fail fast with a controlled ServiceUnavailableError
    (→ HTTP 503) instead."""
    from app import listings
    from app.config import settings
    from app.shared.exceptions import ServiceUnavailableError

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    for name in (
        "S3_LISTINGS_BUCKET",
        "AWS_REGION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
    ):
        monkeypatch.setattr(settings, name, "")

    from app.listings.services import generate_photo_presigned_url

    with pytest.raises(ServiceUnavailableError):
        await generate_photo_presigned_url(
            fake_session, _make_user(), "unit-1", "photo.jpg", "image/jpeg"
        )


@pytest.mark.asyncio
async def test_generate_photo_presigned_url_rejects_unsupported_mime(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """The frontend only accepts jpeg/png/webp; the presign endpoint must
    enforce the same allowlist server-side so a caller cannot sign an
    arbitrary Content-Type (e.g. text/html) into the listings bucket."""
    from app import listings
    from app.shared.exceptions import ValidationError

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    mock_s3 = MagicMock()
    monkeypatch.setattr(
        "app.listings.services._s3_client", MagicMock(return_value=mock_s3)
    )

    from app.listings.services import generate_photo_presigned_url

    with pytest.raises(ValidationError):
        await generate_photo_presigned_url(
            fake_session, _make_user(), "unit-1", "page.html", "text/html"
        )
    mock_s3.generate_presigned_url.assert_not_called()


def _make_photo(
    photo_id: str = "photo-1",
    unit_id: str = "unit-1",
    is_cover: bool = False,
    display_order: int = 0,
) -> UnitPhoto:
    return UnitPhoto(
        id=photo_id,
        unit_id=unit_id,
        s3_key="listings/unit-1/photo_abc.jpg",
        url="https://s3.example.com/listings/unit-1/photo_abc.jpg",
        display_order=display_order,
        is_cover=is_cover,
        caption_ar=None,
        accessibility_feature=None,
    )


@pytest.mark.asyncio
async def test_create_photo_success(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    monkeypatch.setattr("app.listings.services.verify_image_upload", MagicMock())
    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    photo = _make_photo()
    monkeypatch.setattr(
        listings.repository, "create_photo", AsyncMock(return_value=photo)
    )

    from app.listings.services import create_photo

    request = PhotoCreate(
        s3_key="listings/unit-1/photo_abc.jpg",
        url="https://s3.example.com/listings/unit-1/photo_abc.jpg",
        is_cover=False,
        display_order=0,
    )
    result = await create_photo(fake_session, _make_user(), "unit-1", request)
    assert result.id == "photo-1"
    assert result.s3_key == "listings/unit-1/photo_abc.jpg"
    assert result.is_cover is False
    assert listings.repository.create_photo.await_args.kwargs["url"] == "s3://test-listings/listings/unit-1/photo_abc.jpg"


@pytest.mark.asyncio
async def test_create_photo_rejects_foreign_storage_key(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings
    from app.shared.exceptions import ValidationError
    from app.listings.services import create_photo

    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=_make_unit())
    )
    with pytest.raises(ValidationError, match="does not belong"):
        await create_photo(
            fake_session,
            _make_user(),
            "unit-1",
            PhotoCreate(s3_key="listings/other-unit/photo.jpg", url="https://x"),
        )


@pytest.mark.asyncio
async def test_create_photo_fails_closed_when_object_missing(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings
    from app.shared.exceptions import ValidationError
    from app.listings.services import create_photo

    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=_make_unit())
    )
    monkeypatch.setattr(
        "app.listings.services.verify_image_upload",
        MagicMock(side_effect=ValidationError("Uploaded image could not be verified")),
    )
    with pytest.raises(ValidationError, match="could not be verified"):
        await create_photo(
            fake_session,
            _make_user(),
            "unit-1",
            PhotoCreate(
                s3_key="listings/unit-1/missing.jpg",
                url="https://x",
            ),
        )


@pytest.mark.asyncio
async def test_create_photo_with_cover(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    monkeypatch.setattr("app.listings.services.verify_image_upload", MagicMock())
    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "clear_cover_flags", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        listings.repository, "set_listing_cover_photo", AsyncMock(return_value=None)
    )

    photo = _make_photo(is_cover=True)
    monkeypatch.setattr(
        listings.repository, "create_photo", AsyncMock(return_value=photo)
    )

    from app.listings.services import create_photo

    request = PhotoCreate(
        s3_key="listings/unit-1/photo_abc.jpg",
        url="https://s3.example.com/listings/unit-1/photo_abc.jpg",
        is_cover=True,
        display_order=0,
    )
    # Admin edits publish immediately — host edits on a LISTED unit are
    # moderated and covered by the pending-changes tests.
    result = await create_photo(
        fake_session, _make_user(role=UserRole.ADMIN), "unit-1", request
    )
    assert result.is_cover is True
    listings.repository.clear_cover_flags.assert_called_once_with(fake_session, "unit-1")
    listings.repository.set_listing_cover_photo.assert_called_once()


@pytest.mark.asyncio
async def test_create_photo_non_owner(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings
    from app.shared.exceptions import AuthorizationError

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    from app.listings.services import create_photo

    request = PhotoCreate(
        s3_key="listings/unit-1/photo_abc.jpg",
        url="https://s3.example.com/listings/unit-1/photo_abc.jpg",
    )
    other_user = _make_user(user_id="other-host")
    with pytest.raises(AuthorizationError):
        await create_photo(fake_session, other_user, "unit-1", request)


@pytest.mark.asyncio
async def test_list_photos(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    photos = [_make_photo("photo-1"), _make_photo("photo-2", display_order=1)]
    monkeypatch.setattr(
        listings.repository, "get_photos_by_unit", AsyncMock(return_value=photos)
    )

    from app.listings.services import list_photos

    result = await list_photos(fake_session, "unit-1")
    assert len(result) == 2
    assert result[0].id == "photo-1"
    assert result[1].id == "photo-2"


@pytest.mark.asyncio
async def test_set_cover_photo(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    photo = _make_photo("photo-2", is_cover=False)
    monkeypatch.setattr(
        listings.repository, "get_photo_by_id", AsyncMock(return_value=photo)
    )
    monkeypatch.setattr(
        listings.repository, "clear_cover_flags", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        listings.repository, "set_listing_cover_photo", AsyncMock(return_value=None)
    )

    from app.listings.services import set_cover_photo

    # Admin applies cover changes immediately; host cover changes on a
    # LISTED unit are stashed for moderation.
    result = await set_cover_photo(
        fake_session, _make_user(role=UserRole.ADMIN), "unit-1", "photo-2"
    )
    assert result.is_cover is True
    assert photo.is_cover is True


@pytest.mark.asyncio
async def test_set_cover_photo_not_found(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings
    from app.shared.exceptions import NotFoundError

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository, "get_photo_by_id", AsyncMock(return_value=None)
    )

    from app.listings.services import set_cover_photo

    with pytest.raises(NotFoundError):
        await set_cover_photo(fake_session, _make_user(), "unit-1", "missing-photo")


@pytest.mark.asyncio
async def test_delete_photo(fake_session: AsyncMock, monkeypatch) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    photo = _make_photo("photo-1", is_cover=False)
    monkeypatch.setattr(
        listings.repository, "get_photo_by_id", AsyncMock(return_value=photo)
    )
    monkeypatch.setattr(
        listings.repository, "delete_photo", AsyncMock(return_value=None)
    )

    from app.listings.services import delete_photo

    # Admin removal is immediate; host removal on a LISTED unit is
    # moderated (pending_remove) and covered separately.
    await delete_photo(
        fake_session, _make_user(role=UserRole.ADMIN), "unit-1", "photo-1"
    )
    listings.repository.delete_photo.assert_called_once()


@pytest.mark.asyncio
async def test_delete_cover_photo_clears_listing(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app import listings

    unit = _make_unit()
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    photo = _make_photo("photo-1", is_cover=True)
    monkeypatch.setattr(
        listings.repository, "get_photo_by_id", AsyncMock(return_value=photo)
    )
    monkeypatch.setattr(
        listings.repository, "clear_listing_cover_photo", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        listings.repository, "delete_photo", AsyncMock(return_value=None)
    )

    from app.listings.services import delete_photo

    await delete_photo(
        fake_session, _make_user(role=UserRole.ADMIN), "unit-1", "photo-1"
    )
    listings.repository.clear_listing_cover_photo.assert_called_once_with(
        fake_session, "unit-1", "photo-1"
    )


@pytest.mark.asyncio
async def test_approve_listing_pending_to_listed(fake_session: AsyncMock, monkeypatch) -> None:
    """Regression: approve_listing must work without greenlet/lazy-load errors.

    Bug: set_unit_status called session.refresh() which expired eagerly-loaded
    relationships, causing greenlet_spawn errors when accessing unit.listing.
    Fix: removed session.refresh() from set_unit_status.
    """
    from app import listings

    unit = _make_unit(status=UnitStatus.PENDING_VERIFICATION)
    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )

    async def set_listed(session, u, status):
        u.status = status
        return u

    monkeypatch.setattr(listings.repository, "set_unit_status", set_listed)

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    result = await approve_listing(fake_session, admin, "unit-1")
    assert result.status == UnitStatus.LISTED


@pytest.mark.asyncio
async def test_get_availability_shows_active_request_as_booked(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A REQUESTED booking must still render its dates unavailable to guests."""
    from app import listings

    unit = _make_unit()
    now = datetime.now(UTC)
    requested_booking = Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id="guest-1",
        status=str(BookingStatus.REQUESTED),
        check_in=date(2026, 8, 2),
        check_out=date(2026, 8, 4),
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        created_at=now,
        updated_at=now,
    )

    monkeypatch.setattr(
        listings.repository, "get_unit_with_listing", AsyncMock(return_value=unit)
    )
    monkeypatch.setattr(
        listings.repository,
        "get_calendar_rules_in_range",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        listings.services,
        "bookings_repository",
        MagicMock(list_overlapping_bookings=AsyncMock(return_value=[requested_booking])),
    )

    result = await get_availability(
        fake_session, "unit-1", date(2026, 8, 1), date(2026, 8, 6)
    )
    assert result.days[0].status == str(CalendarStatus.AVAILABLE)
    assert result.days[1].status == str(CalendarStatus.BOOKED)
    assert result.days[2].status == str(CalendarStatus.BOOKED)
    assert result.days[3].status == str(CalendarStatus.AVAILABLE)
