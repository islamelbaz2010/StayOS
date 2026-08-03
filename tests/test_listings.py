import uuid
from datetime import UTC, date, datetime
from typing import Any
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
    PhotoPresignResponse,
    PhotoResponse,
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
        host_display_name=None,
        host_kyc_status=None,
        host_joined_at=None,
        property_type="APARTMENT",
        status="LISTED",
        lat=30.0444,
        lng=31.2357,
        governorate="Cairo",
        city="Cairo",
        country="Egypt",
        district=None,
        address=None,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=1,
        category="ENTIRE_PLACE",
        title_ar="شقة تجريبية",
        title_en="Test Apartment",
        title="شقة تجريبية",
        description_ar="وصف",
        description_en="Description",
        description="وصف",
        amenities=["WIFI"],
        cultural_tags=["FAMILY_ONLY"],
        base_price_egp=1500,
        cleaning_fee_egp=0,
        cancellation_policy="FLEXIBLE",
        price=1500,
        currency="EGP",
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        house_rules=None,
        check_in_instructions=None,
        policies=None,
        cover_image=None,
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


def test_search_listings_supports_offset(listings_client: TestClient, monkeypatch) -> None:
    captured: dict[str, Any] = {}

    async def _capture_search(session: Any, filters: Any) -> ListingSearchResponse:
        captured["offset"] = filters.get_offset()
        captured["limit"] = filters.limit
        return ListingSearchResponse(
            data=[],
            pagination=PaginationInfo(next_cursor=None, has_more=False, total_count=0),
        )

    monkeypatch.setattr("app.listings.router.search_listings", _capture_search)

    response = listings_client.get("/api/v1/listings?offset=10&limit=5")
    assert response.status_code == 200
    assert captured.get("offset") == 10
    assert captured.get("limit") == 5


def test_get_listing_required_fields(listings_client: TestClient, monkeypatch) -> None:
    listing = _make_listing_response()
    monkeypatch.setattr(
        "app.listings.router.get_listing_detail", AsyncMock(return_value=listing)
    )

    response = listings_client.get(f"/api/v1/listings/{listing.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == listing.id
    assert data["title"] == listing.title
    assert data["description"] == listing.description
    assert data["country"] == "Egypt"
    assert data["price"] == listing.price
    assert data["currency"] == "EGP"
    assert "cover_image" in data
    assert data["max_guests"] == listing.max_guests
    assert data["property_type"] == listing.property_type


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


def test_presign_photo_upload_as_host(listings_client: TestClient, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    presign_response = PhotoPresignResponse(
        upload_url="https://s3.example.com/upload",
        photo_key="listings/unit-1/photo_abc.jpg",
    )
    monkeypatch.setattr(
        "app.listings.router.generate_photo_presigned_url",
        AsyncMock(return_value=presign_response),
    )

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings/unit-1/photos/presign",
        json={"filename": "photo.jpg", "content_type": "image/jpeg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["upload_url"] == "https://s3.example.com/upload"
    assert data["photo_key"] == "listings/unit-1/photo_abc.jpg"


def test_presign_photo_upload_forbidden_for_guest(
    listings_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)

    token = auth_services.create_access_token(guest)
    response = listings_client.post(
        "/api/v1/listings/unit-1/photos/presign",
        json={"filename": "photo.jpg", "content_type": "image/jpeg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_presign_photo_upload_not_found(
    listings_client: TestClient, monkeypatch
) -> None:
    from app.shared.exceptions import NotFoundError

    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    async def _raise_not_found(*args, **kwargs):
        raise NotFoundError("Listing not found")

    monkeypatch.setattr(
        "app.listings.router.generate_photo_presigned_url", _raise_not_found
    )

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings/missing-unit/photos/presign",
        json={"filename": "photo.jpg", "content_type": "image/jpeg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def _make_photo_response(photo_id: str = "photo-1", is_cover: bool = False) -> PhotoResponse:
    return PhotoResponse(
        id=photo_id,
        unit_id="unit-1",
        s3_key="listings/unit-1/photo_abc.jpg",
        url="https://s3.example.com/listings/unit-1/photo_abc.jpg",
        display_order=0,
        is_cover=is_cover,
        caption=None,
    )


def test_post_photo_as_host(listings_client: TestClient, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    photo = _make_photo_response()
    monkeypatch.setattr(
        "app.listings.router.create_photo", AsyncMock(return_value=photo)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings/unit-1/photos",
        json={
            "s3_key": "listings/unit-1/photo_abc.jpg",
            "url": "https://s3.example.com/listings/unit-1/photo_abc.jpg",
            "is_cover": False,
            "display_order": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "photo-1"
    assert data["s3_key"] == "listings/unit-1/photo_abc.jpg"


def test_post_photo_forbidden_for_guest(
    listings_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)

    token = auth_services.create_access_token(guest)
    response = listings_client.post(
        "/api/v1/listings/unit-1/photos",
        json={
            "s3_key": "listings/unit-1/photo_abc.jpg",
            "url": "https://s3.example.com/listings/unit-1/photo_abc.jpg",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_get_photos(listings_client: TestClient, monkeypatch) -> None:
    photos = [_make_photo_response("photo-1"), _make_photo_response("photo-2")]
    monkeypatch.setattr(
        "app.listings.router.list_photos", AsyncMock(return_value=photos)
    )

    response = listings_client.get("/api/v1/listings/unit-1/photos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == "photo-1"
    assert data[1]["id"] == "photo-2"


def test_patch_cover_photo_as_host(
    listings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    photo = _make_photo_response("photo-2", is_cover=True)
    monkeypatch.setattr(
        "app.listings.router.set_cover_photo", AsyncMock(return_value=photo)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.patch(
        "/api/v1/listings/unit-1/photos/photo-2/cover",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "photo-2"
    assert data["is_cover"] is True


def test_delete_photo_as_host(
    listings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    monkeypatch.setattr(
        "app.listings.router.delete_photo", AsyncMock(return_value=None)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.delete(
        "/api/v1/listings/unit-1/photos/photo-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_delete_photo_not_found(
    listings_client: TestClient, monkeypatch
) -> None:
    from app.shared.exceptions import NotFoundError

    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    async def _raise_not_found(*args, **kwargs):
        raise NotFoundError("Photo not found")

    monkeypatch.setattr("app.listings.router.delete_photo", _raise_not_found)

    token = auth_services.create_access_token(host)
    response = listings_client.delete(
        "/api/v1/listings/unit-1/photos/missing-photo",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def _make_admin_user(user_id: str | None = None) -> User:
    return _make_user(
        user_id=user_id, role=UserRole.ADMIN, kyc_status=KycStatus.VERIFIED
    )


def test_get_host_listings(listings_client: TestClient, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    listings = [_make_listing_response(user_id=host.id)]
    monkeypatch.setattr(
        "app.listings.router.get_host_listings", AsyncMock(return_value=listings)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.get(
        "/api/v1/listings/host/listings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


def test_get_host_listings_forbidden_for_guest(
    listings_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)

    token = auth_services.create_access_token(guest)
    response = listings_client.get(
        "/api/v1/listings/host/listings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_get_host_listing_detail(listings_client: TestClient, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    listing = _make_listing_response(user_id=host.id)
    monkeypatch.setattr(
        "app.listings.router.get_host_listing_detail", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.get(
        "/api/v1/listings/host/unit-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == listing.id


def test_submit_for_review_as_host(
    listings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    listing = _make_listing_response(user_id=host.id)
    listing = listing.model_copy(update={"status": "PENDING_VERIFICATION"})
    monkeypatch.setattr(
        "app.listings.router.submit_for_review", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings/unit-1/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING_VERIFICATION"


def test_submit_for_review_forbidden_for_guest(
    listings_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)

    token = auth_services.create_access_token(guest)
    response = listings_client.post(
        "/api/v1/listings/unit-1/submit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_get_admin_pending_listings(
    listings_client: TestClient, monkeypatch
) -> None:
    admin = _make_admin_user()
    _patch_auth_user(monkeypatch, admin)

    listings = [_make_listing_response()]
    monkeypatch.setattr(
        "app.listings.router.get_pending_listings", AsyncMock(return_value=listings)
    )

    token = auth_services.create_access_token(admin)
    response = listings_client.get(
        "/api/v1/listings/admin/pending",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_admin_pending_forbidden_for_host(
    listings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    token = auth_services.create_access_token(host)
    response = listings_client.get(
        "/api/v1/listings/admin/pending",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_approve_listing_as_admin(
    listings_client: TestClient, monkeypatch
) -> None:
    admin = _make_admin_user()
    _patch_auth_user(monkeypatch, admin)

    listing = _make_listing_response()
    listing = listing.model_copy(update={"status": "LISTED"})
    monkeypatch.setattr(
        "app.listings.router.approve_listing", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(admin)
    response = listings_client.post(
        "/api/v1/listings/admin/unit-1/approve",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "LISTED"


def test_reject_listing_as_admin(
    listings_client: TestClient, monkeypatch
) -> None:
    admin = _make_admin_user()
    _patch_auth_user(monkeypatch, admin)

    listing = _make_listing_response()
    listing = listing.model_copy(update={"status": "REJECTED"})
    monkeypatch.setattr(
        "app.listings.router.reject_listing", AsyncMock(return_value=listing)
    )

    token = auth_services.create_access_token(admin)
    response = listings_client.post(
        "/api/v1/listings/admin/unit-1/reject",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"


def test_approve_listing_forbidden_for_host(
    listings_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    token = auth_services.create_access_token(host)
    response = listings_client.post(
        "/api/v1/listings/admin/unit-1/approve",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
