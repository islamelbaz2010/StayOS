import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.reviews import repository as reviews_repository
from app.reviews import services as review_services
from app.reviews.models import Review
from app.reviews.schemas import ReviewCreate
from app.shared.exceptions import AuthorizationError, ConflictError, ValidationError

_TODAY = datetime.now(UTC).date()


def _make_user(user_id: str | None = None, role: UserRole = UserRole.GUEST) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test Guest",
        locale="ar",
        role=str(role),
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_unit(unit_id: str = "unit-1", host_id: str = "host-1") -> Unit:
    return Unit(
        id=unit_id,
        host_id=host_id,
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


def _make_booking(
    unit: Unit, guest: User, status: BookingStatus = BookingStatus.COMPLETED
) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status=str(status),
        check_in=_TODAY - timedelta(days=10),
        check_out=_TODAY - timedelta(days=8),
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
    )


def _make_review(booking: Booking, unit: Unit, guest: User, rating: int = 5) -> Review:
    now = datetime.now(UTC)
    return Review(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        unit_id=unit.id,
        guest_id=guest.id,
        rating=rating,
        comment="Great stay!",
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_create_review_success(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        reviews_repository, "get_review_by_booking", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        reviews_repository, "create_review", AsyncMock(return_value=review)
    )

    request = ReviewCreate(rating=5, comment="Great stay!")
    response = await review_services.create_review(fake_session, guest, booking.id, request)

    assert response.rating == 5
    assert response.unit_id == unit.id
    assert response.guest_display_name == guest.display_name


@pytest.mark.asyncio
async def test_create_review_rejects_other_guest(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user()
    other_guest = _make_user(user_id="other-guest")
    unit = _make_unit()
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(AuthorizationError):
        await review_services.create_review(
            fake_session, other_guest, booking.id, ReviewCreate(rating=4)
        )


@pytest.mark.asyncio
async def test_create_review_rejects_incomplete_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest, status=BookingStatus.ACCEPTED)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    with pytest.raises(ValidationError):
        await review_services.create_review(
            fake_session, guest, booking.id, ReviewCreate(rating=4)
        )


@pytest.mark.asyncio
async def test_create_review_rejects_duplicate(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    existing_review = _make_review(booking, unit, guest)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        reviews_repository, "get_review_by_booking", AsyncMock(return_value=existing_review)
    )

    with pytest.raises(ConflictError):
        await review_services.create_review(
            fake_session, guest, booking.id, ReviewCreate(rating=3)
        )


@pytest.mark.asyncio
async def test_get_listing_reviews_returns_aggregate(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest, rating=4)

    monkeypatch.setattr(
        reviews_repository,
        "list_reviews_for_unit",
        AsyncMock(return_value=[(review, guest.display_name)]),
    )
    monkeypatch.setattr(
        reviews_repository,
        "get_rating_aggregate_for_unit",
        AsyncMock(return_value=(4.0, 1)),
    )

    result = await review_services.get_listing_reviews(fake_session, unit.id, limit=10, offset=0)

    assert result.average_rating == 4.0
    assert result.review_count == 1
    assert len(result.data) == 1
    assert result.data[0].rating == 4
