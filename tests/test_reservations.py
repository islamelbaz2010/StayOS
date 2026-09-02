import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.database import get_session
from app.main import app
from app.reservations.schemas import (
    PaginationInfo,
    ReservationListResponse,
    ReservationResponse,
)


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


def _make_reservation_response(
    status: str = "PENDING_PAYMENT",
    user_id: str | None = None,
    unit_id: str | None = None,
) -> ReservationResponse:
    return ReservationResponse(
        id=str(uuid.uuid4()),
        unit_id=unit_id or str(uuid.uuid4()),
        guest_id=user_id or str(uuid.uuid4()),
        status=status,
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=4500,
        host_amount_egp=3800,
        platform_fee_egp=200,
        guest_fee_egp=500,
        payment_method="fawry",
        checked_in_at=None,
        checked_out_at=None,
        cancelled_at=None,
        cancel_reason=None,
        refund_amount_egp=None,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def reservations_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _guest_token(user: User | None = None) -> str:
    u = user or _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    return auth_services.create_access_token(u)


def _host_token(user: User | None = None) -> str:
    u = user or _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    return auth_services.create_access_token(u)


def test_create_reservation(
    reservations_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_reservation_response(user_id=guest.id)
    monkeypatch.setattr(
        "app.reservations.router.create_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(guest)
    response = reservations_client.post(
        "/api/v1/reservations",
        json={
            "unit_id": str(uuid.uuid4()),
            "check_in": "2026-08-01",
            "check_out": "2026-08-04",
            "adults": 2,
            "payment_method": "fawry",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == response_model.id


def test_create_reservation_rejects_non_guest(
    reservations_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)

    token = auth_services.create_access_token(host)
    response = reservations_client.post(
        "/api/v1/reservations",
        json={
            "unit_id": str(uuid.uuid4()),
            "check_in": "2026-08-01",
            "check_out": "2026-08-04",
            "adults": 2,
            "payment_method": "fawry",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_get_reservation(
    reservations_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_reservation_response(user_id=guest.id)
    monkeypatch.setattr(
        "app.reservations.router.get_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(guest)
    response = reservations_client.get(
        f"/api/v1/reservations/{response_model.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_list_reservations(
    reservations_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    response_model = ReservationListResponse(
        data=[_make_reservation_response(user_id=guest.id)],
        pagination=PaginationInfo(
            next_cursor=None, has_more=False, total_count=1
        ),
    )
    monkeypatch.setattr(
        "app.reservations.router.list_reservations",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(guest)
    response = reservations_client.get(
        "/api/v1/reservations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["pagination"]["total_count"] == 1


def test_confirm_reservation(
    reservations_client: TestClient, monkeypatch
) -> None:
    admin = _make_user(role=UserRole.ADMIN, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, admin)
    response_model = _make_reservation_response(status="CONFIRMED")
    monkeypatch.setattr(
        "app.reservations.router.confirm_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(admin)
    response = reservations_client.post(
        f"/api/v1/reservations/{response_model.id}/confirm",
        json={"provider": "paymob", "provider_ref": "order-123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED"


def test_cancel_reservation(
    reservations_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_reservation_response(
        status="CANCELLED", user_id=guest.id
    )
    monkeypatch.setattr(
        "app.reservations.router.cancel_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(guest)
    response = reservations_client.post(
        f"/api/v1/reservations/{response_model.id}/cancel",
        json={"reason": "change_of_plans"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_check_in(
    reservations_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)
    response_model = _make_reservation_response(status="CHECKED_IN")
    monkeypatch.setattr(
        "app.reservations.router.check_in_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(host)
    response = reservations_client.post(
        f"/api/v1/reservations/{response_model.id}/check-in",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CHECKED_IN"


def test_check_out(
    reservations_client: TestClient, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, host)
    response_model = _make_reservation_response(status="CHECKED_OUT")
    monkeypatch.setattr(
        "app.reservations.router.check_out_reservation",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(host)
    response = reservations_client.post(
        f"/api/v1/reservations/{response_model.id}/check-out",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CHECKED_OUT"


def test_apply_promo(
    reservations_client: TestClient, monkeypatch
) -> None:
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    _patch_auth_user(monkeypatch, guest)
    response_model = _make_reservation_response(user_id=guest.id)
    monkeypatch.setattr(
        "app.reservations.router.apply_promo_code",
        AsyncMock(return_value=response_model),
    )

    token = auth_services.create_access_token(guest)
    response = reservations_client.post(
        f"/api/v1/reservations/{response_model.id}/promo",
        json={"code": "SUMMER20"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
