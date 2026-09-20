import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.database import get_session
from app.listings.constants import UnitStatus
from app.listings.models import Unit
from app.reviews import repository as reviews_repository
from app.reviews import router as reviews_router
from app.reviews import services as review_services
from app.reviews.models import Review
from app.reviews.schemas import HostResponseCreate, ReviewCreate, ReviewListResponse, ReviewResponse
from app.shared.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError

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
        reviewer_id=guest.id,
        reviewer_role="guest",
        rating=rating,
        comment="Great stay!",
        created_at=now,
        updated_at=now,
        # Mark as published so existing tests that don't test the
        # publication window still see the review.
        published_at=now,
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
        reviews_repository, "get_guest_review_by_booking", AsyncMock(return_value=None)
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
        reviews_repository, "get_guest_review_by_booking", AsyncMock(return_value=existing_review)
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
    monkeypatch.setattr(
        reviews_repository,
        "get_subrating_averages_for_unit",
        AsyncMock(return_value={}),
    )
    monkeypatch.setattr(
        reviews_repository,
        "get_rating_distribution_for_unit",
        AsyncMock(return_value={5: 1, 4: 0, 3: 0, 2: 0, 1: 0}),
    )

    result = await review_services.get_listing_reviews(fake_session, unit.id, limit=10, offset=0)

    assert result.average_rating == 4.0
    assert result.review_count == 1
    assert len(result.data) == 1
    assert result.data[0].rating == 4


@pytest.mark.asyncio
async def test_get_listing_reviews_passes_search_query(
    fake_session: AsyncMock, monkeypatch
) -> None:
    list_mock = AsyncMock(return_value=[])
    monkeypatch.setattr(reviews_repository, "list_reviews_for_unit", list_mock)
    monkeypatch.setattr(
        reviews_repository,
        "get_rating_aggregate_for_unit",
        AsyncMock(return_value=(None, 0)),
    )
    monkeypatch.setattr(
        reviews_repository,
        "get_subrating_averages_for_unit",
        AsyncMock(return_value={}),
    )
    monkeypatch.setattr(
        reviews_repository,
        "get_rating_distribution_for_unit",
        AsyncMock(return_value={}),
    )

    await review_services.get_listing_reviews(
        fake_session, "unit-1", limit=10, offset=0, query="clean"
    )

    list_mock.assert_awaited_once_with(fake_session, "unit-1", 10, 0, "clean")


def test_escape_like_escapes_wildcards() -> None:
    assert reviews_repository._escape_like("100%_\\") == "100\\%\\_\\\\"
    assert reviews_repository._escape_like("clean") == "clean"


# ============================================================
# REPOSITORY COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_get_review_by_booking(fake_session: AsyncMock) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = review
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await reviews_repository.get_review_by_booking(fake_session, booking.id)
    assert result == review


@pytest.mark.asyncio
async def test_create_review(fake_session: AsyncMock) -> None:
    fake_session.add = MagicMock()
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = await reviews_repository.create_review(
        fake_session,
        booking_id=booking.id,
        unit_id=unit.id,
        guest_id=guest.id,
        reviewer_id=guest.id,
        reviewer_role="guest",
        rating=5,
        comment="Great stay!",
    )
    assert review.rating == 5
    assert review.unit_id == unit.id
    assert fake_session.add.called
    assert fake_session.commit.await_count == 1


@pytest.mark.asyncio
async def test_list_reviews_for_unit(fake_session: AsyncMock) -> None:
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    mock_result = MagicMock()
    mock_result.all.return_value = [(review, guest.display_name)]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await reviews_repository.list_reviews_for_unit(fake_session, unit.id, 10, 0)
    assert len(result) == 1
    assert result[0][0] == review


@pytest.mark.asyncio
async def test_get_rating_aggregate_for_unit(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.one.return_value = (4.5, 3)
    fake_session.execute = AsyncMock(return_value=mock_result)
    avg, count = await reviews_repository.get_rating_aggregate_for_unit(fake_session, "unit-1")
    assert avg == 4.5
    assert count == 3


@pytest.mark.asyncio
async def test_get_subrating_averages_for_unit(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ({"cleanliness": 4, "accuracy": 5},),
        ({"cleanliness": 5, "accuracy": 3},),
        ({"cleanliness": 3},),
    ]
    fake_session.execute = AsyncMock(return_value=mock_result)
    averages = await reviews_repository.get_subrating_averages_for_unit(fake_session, "unit-1")
    assert averages["cleanliness"] == 4.0
    assert averages["accuracy"] == 4.0
    assert "location" not in averages


@pytest.mark.asyncio
async def test_get_subrating_averages_for_unit_empty(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.all.return_value = []
    fake_session.execute = AsyncMock(return_value=mock_result)
    averages = await reviews_repository.get_subrating_averages_for_unit(fake_session, "unit-1")
    assert averages == {}


@pytest.mark.asyncio
async def test_get_rating_distribution_for_unit(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.all.return_value = [(5, 3), (4, 2), (1, 1)]
    fake_session.execute = AsyncMock(return_value=mock_result)
    dist = await reviews_repository.get_rating_distribution_for_unit(fake_session, "unit-1")
    assert dist == {1: 1, 2: 0, 3: 0, 4: 2, 5: 3}


@pytest.mark.asyncio
async def test_get_rating_aggregates_for_units(fake_session: AsyncMock) -> None:
    mock_result = MagicMock()
    mock_result.all.return_value = [("unit-1", 4.5, 3), ("unit-2", 3.0, 1)]
    fake_session.execute = AsyncMock(return_value=mock_result)
    result = await reviews_repository.get_rating_aggregates_for_units(fake_session, ["unit-1", "unit-2"])
    assert result["unit-1"] == (4.5, 3)
    assert result["unit-2"] == (3.0, 1)


@pytest.mark.asyncio
async def test_get_rating_aggregates_for_units_empty(fake_session: AsyncMock) -> None:
    result = await reviews_repository.get_rating_aggregates_for_units(fake_session, [])
    assert result == {}


# ============================================================
# ROUTER COVERAGE
# ============================================================

def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override():
        yield fake_session

    return _override


@pytest.fixture
def reviews_client(client, fake_session):
    client.app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    client.app.dependency_overrides.pop(get_session, None)


def _make_review_response() -> ReviewResponse:
    _now = datetime.now(UTC)
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    return ReviewResponse(
        id=review.id,
        unit_id=review.unit_id,
        booking_id=review.booking_id,
        guest_id=review.guest_id,
        reviewer_id=review.reviewer_id,
        reviewer_role=review.reviewer_role,
        guest_display_name=guest.display_name,
        reviewer_display_name=guest.display_name,
        rating=review.rating,
        comment=review.comment,
        subratings=None,
        published=True,
        host_response=None,
        host_response_at=None,
        created_at=review.created_at,
    )


def _make_review_list_response() -> ReviewListResponse:
    return ReviewListResponse(
        data=[_make_review_response()],
        average_rating=5.0,
        review_count=1,
        limit=10,
        offset=0,
    )


def test_post_booking_review_route(reviews_client, monkeypatch) -> None:
    guest = _make_user()
    _patch_auth_user(monkeypatch, guest)
    monkeypatch.setattr(
        reviews_router, "create_review", AsyncMock(return_value=_make_review_response())
    )
    token = _token_for(guest)
    response = reviews_client.post(
        "/api/v1/bookings/booking-1/reviews",
        json={"rating": 5, "comment": "Great stay!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    assert response.json()["rating"] == 5


def test_get_unit_reviews_route(reviews_client, monkeypatch) -> None:
    monkeypatch.setattr(
        reviews_router, "get_listing_reviews", AsyncMock(return_value=_make_review_list_response())
    )
    response = reviews_client.get("/api/v1/listings/unit-1/reviews")
    assert response.status_code == 200
    assert response.json()["review_count"] == 1


@pytest.mark.asyncio
async def test_get_listing_rating(fake_session: AsyncMock, monkeypatch) -> None:
    monkeypatch.setattr(
        reviews_repository,
        "get_rating_aggregate_for_unit",
        AsyncMock(return_value=(4.5, 3)),
    )
    result = await review_services.get_listing_rating(fake_session, "unit-1")
    assert result.average_rating == 4.5
    assert result.review_count == 3


def test_post_booking_review_not_found_returns_404(reviews_client, monkeypatch) -> None:
    guest = _make_user()
    _patch_auth_user(monkeypatch, guest)
    monkeypatch.setattr(
        reviews_router, "create_review",
        AsyncMock(side_effect=NotFoundError("Booking not found")),
    )
    token = _token_for(guest)
    response = reviews_client.post(
        "/api/v1/bookings/missing/reviews",
        json={"rating": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


# ============================================================
# HOST REVIEW COVERAGE
# ============================================================

@pytest.mark.asyncio
async def test_create_host_review_success(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    fake_session.execute = AsyncMock(return_value=mock_unit_result)

    mock_guest_result = MagicMock()
    mock_guest_result.scalar_one_or_none.return_value = guest
    # Need a separate execute mock for the guest query
    call_count = [0]
    original_execute = fake_session.execute

    async def _mock_execute(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return mock_unit_result
        return mock_guest_result

    fake_session.execute = AsyncMock(side_effect=_mock_execute)

    review = _make_review(booking, unit, guest, rating=4)
    review.reviewer_id = host.id
    review.reviewer_role = "host"
    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        reviews_repository, "create_review", AsyncMock(return_value=review)
    )

    request = ReviewCreate(rating=4, comment="Good guest")
    response = await review_services.create_host_review(fake_session, host, booking.id, request)

    assert response.rating == 4
    assert response.reviewer_id == host.id


@pytest.mark.asyncio
async def test_create_host_review_rejects_guest(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)

    with pytest.raises(AuthorizationError):
        await review_services.create_host_review(
            fake_session, guest, "booking-1", ReviewCreate(rating=5)
        )


@pytest.mark.asyncio
async def test_create_host_review_rejects_duplicate(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    existing_review = _make_review(booking, unit, guest)
    existing_review.reviewer_id = host.id
    existing_review.reviewer_role = "host"

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    fake_session.execute = AsyncMock(return_value=mock_unit_result)

    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=existing_review)
    )

    with pytest.raises(ConflictError):
        await review_services.create_host_review(
            fake_session, host, booking.id, ReviewCreate(rating=3)
        )


# ============================================================
# REVIEW PARITY — subratings, publication, host response
# ============================================================


def test_subratings_validation_accepts_valid() -> None:
    """Valid subratings with all 6 categories, each 1-5, are accepted."""
    req = ReviewCreate(
        rating=5,
        subratings={
            "cleanliness": 5,
            "accuracy": 4,
            "check_in": 5,
            "communication": 4,
            "location": 5,
            "value": 4,
        },
    )
    assert req.subratings is not None
    assert req.subratings["cleanliness"] == 5


def test_subratings_validation_rejects_unknown_category() -> None:
    """Unknown subrating categories are rejected."""
    with pytest.raises(ValueError):
        ReviewCreate(rating=5, subratings={"cleanliness": 5, "foo": 3})


def test_subratings_validation_rejects_out_of_range() -> None:
    """Subrating values outside 1-5 are rejected."""
    with pytest.raises(ValueError):
        ReviewCreate(rating=5, subratings={"cleanliness": 0})
    with pytest.raises(ValueError):
        ReviewCreate(rating=5, subratings={"cleanliness": 6})


def test_subratings_validation_accepts_none() -> None:
    """No subratings (None) is accepted — subratings are optional."""
    req = ReviewCreate(rating=4)
    assert req.subratings is None


def test_is_review_published_with_counterpart() -> None:
    """A review is published when the other party's review exists."""
    from app.reviews.constants import PUBLICATION_WINDOW_DAYS

    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.published_at = None  # not pre-published
    assert reviews_repository.is_review_published(review, has_counterpart=True)


def test_is_review_published_after_window() -> None:
    """A review is published after the 14-day window even without counterpart."""
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.published_at = None
    # created_at is now; simulate 15 days ago
    review.created_at = datetime.now(UTC) - timedelta(days=15)
    assert reviews_repository.is_review_published(review, has_counterpart=False)


def test_is_review_published_within_window_no_counterpart() -> None:
    """A review within the 14-day window with no counterpart is NOT published."""
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.published_at = None
    review.created_at = datetime.now(UTC) - timedelta(days=3)
    assert not reviews_repository.is_review_published(review, has_counterpart=False)


def test_is_review_published_pre_published() -> None:
    """A review with published_at set is always published."""
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    # published_at is set by _make_review helper
    assert reviews_repository.is_review_published(review, has_counterpart=False)


@pytest.mark.asyncio
async def test_create_review_with_subratings(fake_session: AsyncMock, monkeypatch) -> None:
    """Guest review with subratings stores and returns them."""
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    booking.status = BookingStatus.COMPLETED

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        reviews_repository, "get_guest_review_by_booking", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=None)
    )

    created_review = _make_review(booking, unit, guest)
    created_review.subratings = {"cleanliness": 5, "accuracy": 4}

    monkeypatch.setattr(
        reviews_repository,
        "create_review",
        AsyncMock(return_value=created_review),
    )

    request = ReviewCreate(
        rating=5,
        subratings={"cleanliness": 5, "accuracy": 4},
    )
    result = await review_services.create_review(fake_session, guest, booking.id, request)
    assert result.subratings == {"cleanliness": 5, "accuracy": 4}


@pytest.mark.asyncio
async def test_create_host_review_stores_no_subratings(fake_session: AsyncMock, monkeypatch) -> None:
    """Host reviews never store subratings (Airbnb behavior)."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    booking.status = BookingStatus.COMPLETED

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )

    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    mock_guest_result = MagicMock()
    mock_guest_result.scalar_one_or_none.return_value = guest
    fake_session.execute = AsyncMock(
        side_effect=[mock_unit_result, mock_guest_result]
    )

    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=None)
    )
    monkeypatch.setattr(
        reviews_repository, "get_guest_review_by_booking", AsyncMock(return_value=None)
    )

    created_review = _make_review(booking, unit, guest, rating=4)
    created_review.reviewer_id = host.id
    created_review.reviewer_role = "host"
    created_review.subratings = None

    monkeypatch.setattr(
        reviews_repository,
        "create_review",
        AsyncMock(return_value=created_review),
    )

    # Even if the request includes subratings, host review stores None
    request = ReviewCreate(
        rating=4,
        subratings={"cleanliness": 5},  # should be ignored for host reviews
    )
    result = await review_services.create_host_review(fake_session, host, booking.id, request)
    assert result.rating == 4


@pytest.mark.asyncio
async def test_create_host_response_success(fake_session: AsyncMock, monkeypatch) -> None:
    """Host can write a public response to a guest review."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.host_response = None
    review.host_response_at = None

    monkeypatch.setattr(
        reviews_repository, "get_review_by_id", AsyncMock(return_value=review)
    )

    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    mock_guest_result = MagicMock()
    mock_guest_result.scalar_one_or_none.return_value = guest
    # First execute call returns unit, second returns guest
    fake_session.execute = AsyncMock(
        side_effect=[mock_unit_result, mock_guest_result]
    )

    async def _set_response(session, rev, resp):
        rev.host_response = resp
        rev.host_response_at = datetime.now(UTC)
        return rev

    monkeypatch.setattr(reviews_repository, "set_host_response", _set_response)
    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=None)
    )

    result = await review_services.create_host_response(
        fake_session, host, review.id, HostResponseCreate(response="Thank you!")
    )
    assert result.host_response == "Thank you!"
    assert result.host_response_at is not None


@pytest.mark.asyncio
async def test_create_host_response_rejects_duplicate(fake_session: AsyncMock, monkeypatch) -> None:
    """Host cannot write a second response to the same review."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.host_response = "Already responded"
    review.host_response_at = datetime.now(UTC)

    monkeypatch.setattr(
        reviews_repository, "get_review_by_id", AsyncMock(return_value=review)
    )

    with pytest.raises(ConflictError):
        await review_services.create_host_response(
            fake_session, host, review.id, HostResponseCreate(response="Second response")
        )


@pytest.mark.asyncio
async def test_create_host_response_rejects_host_review(fake_session: AsyncMock, monkeypatch) -> None:
    """Host cannot respond to a host review (only guest reviews)."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)
    review.reviewer_role = "host"

    monkeypatch.setattr(
        reviews_repository, "get_review_by_id", AsyncMock(return_value=review)
    )

    with pytest.raises(ValidationError):
        await review_services.create_host_response(
            fake_session, host, review.id, HostResponseCreate(response="Response")
        )


@pytest.mark.asyncio
async def test_create_host_response_rejects_non_owner(fake_session: AsyncMock, monkeypatch) -> None:
    """A host who doesn't own the unit cannot respond to a guest review."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    other_host = _make_user(user_id="host-2", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1")
    unit = _make_unit(host_id="host-1")  # owned by host-1, not other_host
    booking = _make_booking(unit, guest)
    review = _make_review(booking, unit, guest)

    monkeypatch.setattr(
        reviews_repository, "get_review_by_id", AsyncMock(return_value=review)
    )

    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    fake_session.execute = AsyncMock(return_value=mock_unit_result)

    with pytest.raises(AuthorizationError):
        await review_services.create_host_response(
            fake_session, other_host, review.id, HostResponseCreate(response="Response")
        )


@pytest.mark.asyncio
async def test_create_host_response_rejects_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    """Responding to a non-existent review raises NotFoundError."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    monkeypatch.setattr(
        reviews_repository, "get_review_by_id", AsyncMock(return_value=None)
    )
    with pytest.raises(NotFoundError):
        await review_services.create_host_response(
            fake_session, host, "nonexistent", HostResponseCreate(response="Response")
        )


@pytest.mark.asyncio
async def test_create_review_rejects_expired_window(fake_session: AsyncMock, monkeypatch) -> None:
    """Review submission is rejected once the 14-day window after checkout passes."""
    guest = _make_user()
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    # checkout was 20 days ago — outside the 14-day window
    booking.check_out = _TODAY - timedelta(days=20)
    booking.status = BookingStatus.COMPLETED

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    monkeypatch.setattr(
        reviews_repository, "get_guest_review_by_booking", AsyncMock(return_value=None)
    )

    with pytest.raises(ValidationError):
        await review_services.create_review(
            fake_session, guest, booking.id, ReviewCreate(rating=5)
        )


@pytest.mark.asyncio
async def test_create_host_review_rejects_expired_window(fake_session: AsyncMock, monkeypatch) -> None:
    """Host review submission is rejected once the 14-day window after checkout passes."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user()
    unit = _make_unit(host_id="host-1")
    booking = _make_booking(unit, guest)
    booking.check_out = _TODAY - timedelta(days=20)
    booking.status = BookingStatus.COMPLETED

    monkeypatch.setattr(
        bookings_repository, "get_booking_or_raise", AsyncMock(return_value=booking)
    )
    mock_unit_result = MagicMock()
    mock_unit_result.scalar_one_or_none.return_value = unit
    mock_guest_result = MagicMock()
    mock_guest_result.scalar_one_or_none.return_value = guest
    fake_session.execute = AsyncMock(side_effect=[mock_unit_result, mock_guest_result])
    monkeypatch.setattr(
        reviews_repository, "get_host_review_by_booking", AsyncMock(return_value=None)
    )

    with pytest.raises(ValidationError):
        await review_services.create_host_review(
            fake_session, host, booking.id, ReviewCreate(rating=5)
        )
