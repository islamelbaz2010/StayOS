import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock

import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.database import get_session
from app.listings.schemas import (
    AvailabilityResponse,
    ListingResponse,
    ListingSearchResponse,
    PaginationInfo,
)
from app.main import app
from fastapi.testclient import TestClient


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test User",
        locale="ar",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_listing_response(user_id: str | None = None) -> ListingResponse:
    return ListingResponse(
        id=str(uuid.uuid4()),
        host_id=user_id or str(uuid.uuid4()),
        property_type="APARTMENT",
        status="LISTED",
        lat=30.0444,
        lng=31.2357,
        governorate="Cairo",
        city="Cairo",
        district=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        title_ar="شقة تجريبية",
        title_en="Test Apartment",
        description_ar="وصف",
        description_en="Description",
        amenities=["WIFI"],
        cultural_tags=["FAMILY_ONLY"],
        base_price_egp=1500,
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        house_rules=None,
        check_in_instructions=None,
        policies=None,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def listings_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _host_token(user_id: str | None = None) -> str:
    user = _make_user(user_id=user_id, role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    return auth_services.create_access_token(user)


def _guest_token(user_id: str | None = None) -> str:
    user = _make_user(user_id=user_id, role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    return auth_services.create_access_token(user)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def test_search_listings(listings_client: TestClient, monkeypatch) -> None:
    response_model = ListingSearchResponse(
        data=[_make_listing_response().model_dump()],
        pagination=PaginationInfo(next_cursor=None, has_more=False, total_count=1),
    )
    monkeypatch.setattr(
        "app.listings.router.search_listings", AsyncMock(return_value=response_model)
    )

    response = listings_client.get("/api/v1/listings?city=Cairo")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["pagination"]["total_count"] == 1


def test_search_listings_validation(listings_client: TestClient) -> None:
    response = listings_client.get("/api/v1/listings?min_price=1000&max_price=500")
    assert response.status_code == 422


def test_get_listing(listings_client: TestClient, monkeypatch) -> None:
    listing = _make_listing_response()
    monkeypatch.setattr(
        "app.listings.router.get_listing_detail", AsyncMock(return_value=listing)
    )

    response = listings_client.get(f"/api/v1/listings/{listing.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == listing.id


def test_get_listing_availability(listings_client: TestClient, monkeypatch) -> None:
    listing = _make_listing_response()
    availability = AvailabilityResponse(
        unit_id=listing.id,
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        days=[
            {"date": "2026-08-01", "status": "AVAILABLE", "price_egp": 1500},
            {"date": "2026-08-02", "status": "AVAILABLE", "price_egp": 1500},
            {"date": "2026-08-03", "status": "AVAILABLE", "price_egp": 1500},
        ],
    )
    monkeypatch.setattr(
        "app.listings.router.get_availability", AsyncMock(return_value=availability)
    )

    response = listings_client.get(
        f"/api/v1/listings/{listing.id}/availability",
        params={"check_in": "2026-08-01", "check_out": "2026-08-04"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["days"]) == 3


def test_create_listing_requires_host(listings_client: TestClient, monkeypatch) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    token = auth_services.create_access_token(guest)
    response = listings_client.post(
        "/api/v1/listings",
        json={
            "property_type": "APARTMENT",
            "lat": 30.0444,
            "lng": 31.2357,
            "governorate": "Cairo",
            "city": "Cairo",
            "max_guests": 4,
            "bedrooms": 2,
            "bathrooms": 1,
            "title_ar": "شقة",
            "description_ar": "وصف",
            "base_price_egp": 1500,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_create_listing_as_host(listings_client: TestClient, monkeypatch) -> None:
    listing = _make_listing_response()
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)
    monkeypatch.setattr(
        "app.listings.router.create_listing", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings",
        json={
            "property_type": "APARTMENT",
            "lat": 30.0444,
            "lng": 31.2357,
            "governorate": "Cairo",
            "city": "Cairo",
            "max_guests": 4,
            "bedrooms": 2,
            "bathrooms": 1,
            "title_ar": "شقة",
            "description_ar": "وصف",
            "base_price_egp": 1500,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title_ar"] == listing.title_ar


def test_update_listing_as_host(listings_client: TestClient, monkeypatch) -> None:
    listing = _make_listing_response()
    host = _make_user(user_id=listing.host_id, role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)
    monkeypatch.setattr(
        "app.listings.router.update_listing", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.patch(
        f"/api/v1/listings/{listing.id}",
        json={"base_price_egp": 2000},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == listing.id
