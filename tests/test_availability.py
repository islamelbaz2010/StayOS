from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.availability import services as availability_services
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.listings.constants import CalendarStatus, UnitStatus
from app.listings.models import CalendarRule, Unit
from app.reservations.constants import ReservationStatus
from app.reservations.models import Reservation
from app.shared.exceptions import ConflictError, ValidationError
from geoalchemy2.elements import WKTElement


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.HOST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid4()),
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


def _make_unit(host_id: str = "host-1") -> Unit:
    return Unit(
        id="unit-1",
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


def _make_rule(
    unit_id: str = "unit-1",
    status: str = CalendarStatus.BLOCKED,
    reservation_id: str | None = None,
    date_from: date = date(2026, 8, 1),
    date_to: date = date(2026, 8, 5),
) -> CalendarRule:
    now = datetime.now(UTC)
    return CalendarRule(
        id=str(uuid4()),
        unit_id=unit_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        block_type=CalendarStatus.BLOCKED if status == CalendarStatus.BLOCKED else None,
        reservation_id=reservation_id,
        price_override=None,
        created_at=now,
        updated_at=now,
    )


def _make_booking(
    unit_id: str = "unit-1",
    status: BookingStatus = BookingStatus.ACCEPTED,
    check_in: date = date(2026, 8, 1),
    check_out: date = date(2026, 8, 5),
) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid4()),
        unit_id=unit_id,
        guest_id="guest-1",
        status=str(status),
        check_in=check_in,
        check_out=check_out,
        adults=2,
        children=0,
        infants=0,
        requested_at=now,
        created_at=now,
        updated_at=now,
    )


def _make_reservation(
    unit_id: str = "unit-1",
    status: ReservationStatus = ReservationStatus.CONFIRMED,
    check_in: date = date(2026, 8, 1),
    check_out: date = date(2026, 8, 5),
) -> Reservation:
    now = datetime.now(UTC)
    return Reservation(
        id=str(uuid4()),
        unit_id=unit_id,
        guest_id="guest-1",
        status=str(status),
        check_in=check_in,
        check_out=check_out,
        total_amount_egp=1000,
        currency="EGP",
        created_at=now,
        updated_at=now,
    )


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


@pytest.mark.asyncio
async def test_get_availability_success(fake_session: AsyncMock, monkeypatch) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[]),
    )

    response = await availability_services.get_availability(
        fake_session, host, "unit-1", date(2026, 8, 1), date(2026, 8, 6)
    )
    assert response.unit_id == "unit-1"
    assert len(response.days) == 5
    assert response.days[0].status == CalendarStatus.AVAILABLE


@pytest.mark.asyncio
async def test_get_availability_shows_blocked_rule(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)
    rule = _make_rule(
        status=CalendarStatus.BLOCKED,
        date_from=date(2026, 8, 2),
        date_to=date(2026, 8, 4),
    )

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[rule]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[]),
    )

    response = await availability_services.get_availability(
        fake_session, host, "unit-1", date(2026, 8, 1), date(2026, 8, 6)
    )
    assert response.days[0].status == CalendarStatus.AVAILABLE
    assert response.days[1].status == CalendarStatus.BLOCKED
    assert response.days[2].status == CalendarStatus.BLOCKED
    assert response.days[3].status == CalendarStatus.AVAILABLE


@pytest.mark.asyncio
async def test_get_availability_shows_accepted_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)
    booking = _make_booking(
        status=BookingStatus.ACCEPTED,
        check_in=date(2026, 8, 2),
        check_out=date(2026, 8, 5),
    )

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[booking]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[]),
    )

    response = await availability_services.get_availability(
        fake_session, host, "unit-1", date(2026, 8, 1), date(2026, 8, 6)
    )
    assert response.days[0].status == CalendarStatus.AVAILABLE
    assert response.days[1].status == CalendarStatus.BOOKED
    assert response.days[2].status == CalendarStatus.BOOKED
    assert response.days[3].status == CalendarStatus.BOOKED


@pytest.mark.asyncio
async def test_update_availability_blocks_dates(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)
    created_rule = _make_rule(
        status=CalendarStatus.BLOCKED,
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 6),
    )

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.replace_host_availability_rules",
        AsyncMock(return_value=[created_rule]),
    )

    from app.availability.schemas import (
        AvailabilityRule,
        AvailabilityStatus,
        AvailabilityUpdateRequest,
    )

    request = AvailabilityUpdateRequest(
        rules=[
            AvailabilityRule(
                date_from=date(2026, 8, 1),
                date_to=date(2026, 8, 6),
                status=AvailabilityStatus.BLOCKED,
            )
        ]
    )
    result = await availability_services.update_availability(
        fake_session, host, "unit-1", request
    )
    assert len(result) == 1
    assert result[0].status == CalendarStatus.BLOCKED


@pytest.mark.asyncio
async def test_update_availability_rejects_overlapping_accepted_booking(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)
    booking = _make_booking(
        status=BookingStatus.ACCEPTED,
        check_in=date(2026, 8, 2),
        check_out=date(2026, 8, 5),
    )

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[booking]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[]),
    )

    from app.availability.schemas import (
        AvailabilityRule,
        AvailabilityStatus,
        AvailabilityUpdateRequest,
    )

    request = AvailabilityUpdateRequest(
        rules=[
            AvailabilityRule(
                date_from=date(2026, 8, 1),
                date_to=date(2026, 8, 6),
                status=AvailabilityStatus.BLOCKED,
            )
        ]
    )
    with pytest.raises(ConflictError):
        await availability_services.update_availability(
            fake_session, host, "unit-1", request
        )


@pytest.mark.asyncio
async def test_update_availability_rejects_unblocking_confirmed_reservation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)
    reservation = _make_reservation(
        status=ReservationStatus.CONFIRMED,
        check_in=date(2026, 8, 2),
        check_out=date(2026, 8, 5),
    )

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_calendar_rules_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_accepted_bookings_for_unit",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        "app.availability.services.availability_repository.get_confirmed_reservations_for_unit",
        AsyncMock(return_value=[reservation]),
    )

    from app.availability.schemas import (
        AvailabilityRule,
        AvailabilityStatus,
        AvailabilityUpdateRequest,
    )

    request = AvailabilityUpdateRequest(
        rules=[
            AvailabilityRule(
                date_from=date(2026, 8, 1),
                date_to=date(2026, 8, 6),
                status=AvailabilityStatus.AVAILABLE,
            )
        ]
    )
    with pytest.raises(ConflictError):
        await availability_services.update_availability(
            fake_session, host, "unit-1", request
        )


@pytest.mark.asyncio
async def test_update_availability_rejects_overlapping_rules(
    fake_session: AsyncMock, monkeypatch
) -> None:
    host = _make_user(role=UserRole.HOST)
    unit = _make_unit(host.id)

    monkeypatch.setattr(
        "app.availability.services.listings_repository.get_unit_with_listing",
        AsyncMock(return_value=unit),
    )

    from app.availability.schemas import (
        AvailabilityRule,
        AvailabilityStatus,
        AvailabilityUpdateRequest,
    )

    request = AvailabilityUpdateRequest(
        rules=[
            AvailabilityRule(
                date_from=date(2026, 8, 1),
                date_to=date(2026, 8, 5),
                status=AvailabilityStatus.BLOCKED,
            ),
            AvailabilityRule(
                date_from=date(2026, 8, 4),
                date_to=date(2026, 8, 7),
                status=AvailabilityStatus.AVAILABLE,
            ),
        ]
    )
    with pytest.raises(ValidationError):
        await availability_services.update_availability(
            fake_session, host, "unit-1", request
        )


def test_availability_routes(client, monkeypatch) -> None:
    from app.availability import router as availability_router
    from app.availability.schemas import (
        AvailabilityDay,
        AvailabilityResponse,
        CalendarRuleResponse,
    )

    host = _make_user(role=UserRole.HOST)
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=host),
    )
    token = _token_for(host)

    now = datetime.now(UTC)
    start = now.strftime("%Y-%m-%d")
    end = (now + timedelta(days=5)).strftime("%Y-%m-%d")
    rule_response = CalendarRuleResponse(
        id=str(uuid4()),
        unit_id="unit-1",
        date_from=now.date(),
        date_to=(now + timedelta(days=5)).date(),
        status="blocked",
        block_type="manual",
        reservation_id=None,
        price_override=None,
    )
    monkeypatch.setattr(
        availability_router,
        "get_availability",
        AsyncMock(
            return_value=AvailabilityResponse(
                unit_id="unit-1",
                check_in=now.date(),
                check_out=(now + timedelta(days=5)).date(),
                days=[
                    AvailabilityDay(
                        date=(now + timedelta(days=i)).date(),
                        status="available",
                        block_type=None,
                    )
                    for i in range(5)
                ],
            )
        ),
    )
    monkeypatch.setattr(
        availability_router,
        "update_availability",
        AsyncMock(return_value=[rule_response]),
    )

    get_resp = client.get(
        f"/api/v1/availability/unit-1?check_in={start}&check_out={end}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_resp.status_code == 200

    patch_resp = client.patch(
        "/api/v1/availability/unit-1",
        json={
            "rules": [
                {
                    "date_from": start,
                    "date_to": end,
                    "status": "blocked",
                }
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == 200
