import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.listings.constants import CalendarStatus
from app.listings.models import CalendarRule, Unit, UnitListing
from app.reservations.constants import PaymentStatus, ReservationStatus
from app.reservations.models import PaymentIntent, PromoCode, Reservation
from app.reservations.schemas import (
    PaymentConfirmationRequest,
    PromoApplyRequest,
    ReservationCancelRequest,
    ReservationCreate,
    ReservationListFilters,
)
from app.reservations.services import (
    apply_promo_code,
    cancel_reservation,
    check_in_reservation,
    check_out_reservation,
    confirm_reservation,
    confirm_reservation_by_provider,
    create_reservation,
    fail_reservation_by_provider,
    get_reservation,
    list_reservations,
)
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    PaymentError,
    ValidationError,
)
from geoalchemy2.elements import WKTElement


def _make_user(
    user_id: str = "user-1",
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+1234567890",
        email="user@example.com",
        firebase_uid=None,
        display_name="Test",
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
        base_price_egp=1000,
        weekend_mult=1.0,
        peak_mult=1.0,
        min_nights=1,
        max_nights=30,
        country="Egypt",
        currency="EGP",
    )


def _make_unit(
    unit_id: str = "unit-1",
    host_id: str = "host-1",
    status: str = "LISTED",
) -> Unit:
    unit = Unit(
        id=unit_id,
        host_id=host_id,
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
    return unit


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock(return_value=None)
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


def _mock_repository(monkeypatch) -> MagicMock:
    repo = MagicMock()
    monkeypatch.setattr(
        "app.reservations.services.reservations_repository", repo
    )
    monkeypatch.setattr(
        "app.reservations.services.listings_repository", repo
    )
    monkeypatch.setattr(
        "app.reservations.services._create_provider_payment",
        AsyncMock(
            return_value={
                "order_id": "paymob-order-res-1",
                "payment_token": "paymob-token",
                "iframe_url": "https://paymob.com/iframe?token=paymob-token",
            }
        ),
    )
    monkeypatch.setattr("app.reservations.services.write_event", AsyncMock())
    return repo


@pytest.mark.asyncio
async def test_create_reservation(fake_session: AsyncMock, monkeypatch) -> None:
    repo = _mock_repository(monkeypatch)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.get_calendar_rules_in_range = AsyncMock(return_value=[])
    repo.create_payment_intent = AsyncMock(
        return_value=PaymentIntent(
            id=str(uuid.uuid4()),
            reservation_id="res-1",
            provider="paymob",
            provider_ref="ref-1",
            amount_egp=4500,
            status=PaymentStatus.PENDING,
        )
    )
    repo.acquire_calendar_lock = AsyncMock()
    repo.write_booking_event = AsyncMock()

    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        payment_method="fawry",
    )
    result = await create_reservation(fake_session, _make_user(), request)
    assert result.unit_id == "unit-1"
    assert result.status == ReservationStatus.PENDING_PAYMENT


@pytest.mark.asyncio
async def test_create_reservation_rejects_non_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        payment_method="fawry",
    )
    with pytest.raises(AuthorizationError):
        await create_reservation(fake_session, _make_user(role=UserRole.HOST), request)


@pytest.mark.asyncio
async def test_create_reservation_rejects_unverified_kyc(
    fake_session: AsyncMock, monkeypatch
) -> None:
    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        payment_method="fawry",
    )
    with pytest.raises(ConflictError):
        await create_reservation(
            fake_session,
            _make_user(kyc_status=KycStatus.UNVERIFIED),
            request,
        )


@pytest.mark.asyncio
async def test_create_reservation_calendar_conflict(
    fake_session: AsyncMock, monkeypatch
) -> None:
    repo = _mock_repository(monkeypatch)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.get_calendar_rules_in_range = AsyncMock(
        return_value=[
            CalendarRule(
                id="rule-1",
                unit_id="unit-1",
                date_from=date(2026, 8, 2),
                date_to=date(2026, 8, 3),
                status=CalendarStatus.BLOCKED,
            )
        ]
    )

    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        payment_method="fawry",
    )
    with pytest.raises(ConflictError):
        await create_reservation(fake_session, _make_user(), request)


@pytest.mark.asyncio
async def test_create_reservation_exceeds_max_guests(
    fake_session: AsyncMock, monkeypatch
) -> None:
    repo = _mock_repository(monkeypatch)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.get_calendar_rules_in_range = AsyncMock(return_value=[])

    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=5,
        payment_method="fawry",
    )
    with pytest.raises(ValidationError):
        await create_reservation(fake_session, _make_user(), request)


@pytest.mark.asyncio
async def test_get_reservation(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user()
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id=guest.id,
        status=str(ReservationStatus.CONFIRMED),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())

    result = await get_reservation(fake_session, guest, "res-1")
    assert result.id == reservation.id


@pytest.mark.asyncio
async def test_get_reservation_unauthorized(
    fake_session: AsyncMock, monkeypatch
) -> None:
    other = _make_user(user_id="other-1")
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id=other.id,
        status=str(ReservationStatus.CONFIRMED),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)

    with pytest.raises(AuthorizationError):
        await get_reservation(fake_session, _make_user(), "res-1")


@pytest.mark.asyncio
async def test_list_reservations_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    repo = _mock_repository(monkeypatch)
    repo.count_user_reservations = AsyncMock(return_value=0)
    repo.list_user_reservations = AsyncMock(return_value=[])

    result = await list_reservations(
        fake_session, _make_user(), ReservationListFilters()
    )
    assert result.data == []


@pytest.mark.asyncio
async def test_list_reservations_host(
    fake_session: AsyncMock, monkeypatch
) -> None:
    repo = _mock_repository(monkeypatch)
    repo.get_host_unit_ids = AsyncMock(return_value=["unit-1"])
    repo.count_user_reservations = AsyncMock(return_value=0)
    repo.list_user_reservations = AsyncMock(return_value=[])

    result = await list_reservations(
        fake_session, _make_user(role=UserRole.HOST), ReservationListFilters()
    )
    assert result.data == []


@pytest.mark.asyncio
async def test_confirm_reservation(fake_session: AsyncMock, monkeypatch) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    intent = PaymentIntent(
        id=str(uuid.uuid4()),
        reservation_id="res-1",
        provider="paymob",
        provider_ref="ref-1",
        amount_egp=4500,
        status=PaymentStatus.PENDING,
    )
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_payment_intent_by_provider_ref = AsyncMock(return_value=intent)
    repo.confirm_calendar_booking = AsyncMock()
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())

    result = await confirm_reservation(
        fake_session, "res-1", PaymentConfirmationRequest(provider="paymob", provider_ref="ref-1")
    )
    assert result.status == ReservationStatus.CONFIRMED
    assert intent.status == PaymentStatus.CAPTURED


@pytest.mark.asyncio
async def test_cancel_reservation_by_guest(
    fake_session: AsyncMock, monkeypatch
) -> None:
    guest = _make_user()
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id=guest.id,
        status=str(ReservationStatus.CONFIRMED),
        check_in=date(2099, 8, 1),
        check_out=date(2099, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=4500,
        host_amount_egp=3800,
        platform_fee_egp=200,
        guest_fee_egp=500,
        payment_method="fawry",
        created_at=datetime.now(UTC),
    )
    reservation.payment_intents = [
        PaymentIntent(
            id=str(uuid.uuid4()),
            reservation_id="res-1",
            provider="paymob",
            provider_ref="ref-1",
            amount_egp=4500,
            status=PaymentStatus.CAPTURED,
        )
    ]
    reservation.promo_applications = []
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.release_calendar_lock = AsyncMock()
    repo.write_booking_event = AsyncMock()

    result = await cancel_reservation(
        fake_session,
        guest,
        "res-1",
        ReservationCancelRequest(reason="change_of_plans"),
    )
    assert result.status == ReservationStatus.CANCELLED


@pytest.mark.asyncio
async def test_check_in(fake_session: AsyncMock, monkeypatch) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.CONFIRMED),
        check_in=date(2020, 8, 1),
        check_out=date(2020, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=4500,
        host_amount_egp=3800,
        platform_fee_egp=200,
        guest_fee_egp=500,
        payment_method="fawry",
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.write_booking_event = AsyncMock()

    result = await check_in_reservation(
        fake_session, _make_user(role=UserRole.HOST, user_id="host-1"), "res-1"
    )
    assert result.status == ReservationStatus.CHECKED_IN


@pytest.mark.asyncio
async def test_check_out(fake_session: AsyncMock, monkeypatch) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.CHECKED_IN),
        check_in=date(2020, 8, 1),
        check_out=date(2020, 8, 4),
        adults=2,
        children=0,
        infants=0,
        total_amount_egp=4500,
        host_amount_egp=3800,
        platform_fee_egp=200,
        guest_fee_egp=500,
        payment_method="fawry",
        checked_in_at=datetime.now(UTC),
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.write_booking_event = AsyncMock()

    result = await check_out_reservation(
        fake_session, _make_user(role=UserRole.HOST, user_id="host-1"), "res-1"
    )
    assert result.status == ReservationStatus.CHECKED_OUT


@pytest.mark.asyncio
async def test_apply_promo(fake_session: AsyncMock, monkeypatch) -> None:
    guest = _make_user()
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id=guest.id,
        status=str(ReservationStatus.PENDING_PAYMENT),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    promo = PromoCode(
        id="promo-1",
        code="SUMMER20",
        discount_pct=20,
        is_active=True,
        max_uses=None,
        uses=0,
    )
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_promo_code_by_code = AsyncMock(return_value=promo)
    repo.create_promo_application = AsyncMock(
        return_value=MagicMock(id="pa-1", reservation_id="res-1")
    )

    result = await apply_promo_code(
        fake_session, guest, "res-1", PromoApplyRequest(code="SUMMER20")
    )
    assert result.id == reservation.id


@pytest.mark.asyncio
async def test_confirm_reservation_by_provider(fake_session: AsyncMock, monkeypatch) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    intent = PaymentIntent(
        id=str(uuid.uuid4()),
        reservation_id="res-1",
        provider="paymob",
        provider_ref="ref-1",
        amount_egp=4500,
        status=PaymentStatus.PENDING,
    )
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_payment_intent_by_provider_ref = AsyncMock(return_value=intent)
    repo.confirm_calendar_booking = AsyncMock()
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())

    result = await confirm_reservation_by_provider(
        fake_session, "res-1", "paymob", "ref-1"
    )
    assert result.status == ReservationStatus.CONFIRMED
    assert intent.status == PaymentStatus.CAPTURED


@pytest.mark.asyncio
async def test_fail_reservation_by_provider(fake_session: AsyncMock, monkeypatch) -> None:
    reservation = Reservation(
        id=str(uuid.uuid4()),
        unit_id="unit-1",
        guest_id="guest-1",
        status=str(ReservationStatus.PENDING_PAYMENT),
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
    )
    reservation.payment_intents = []
    reservation.promo_applications = []
    intent = PaymentIntent(
        id=str(uuid.uuid4()),
        reservation_id="res-1",
        provider="paymob",
        provider_ref="ref-1",
        amount_egp=4500,
        status=PaymentStatus.PENDING,
    )
    repo = _mock_repository(monkeypatch)
    repo.get_reservation_with_relations = AsyncMock(return_value=reservation)
    repo.get_payment_intent_by_provider_ref = AsyncMock(return_value=intent)
    repo.release_calendar_lock = AsyncMock()
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.write_booking_event = AsyncMock()

    result = await fail_reservation_by_provider(
        fake_session, "res-1", "ref-1", failure_reason="card declined"
    )
    assert result is not None
    assert result.status == ReservationStatus.CANCELLED
    assert intent.status == PaymentStatus.FAILED


@pytest.mark.asyncio
async def test_create_reservation_propagates_provider_failure(
    fake_session: AsyncMock, monkeypatch
) -> None:
    repo = _mock_repository(monkeypatch)
    repo.get_unit_with_listing = AsyncMock(return_value=_make_unit())
    repo.get_calendar_rules_in_range = AsyncMock(return_value=[])
    monkeypatch.setattr(
        "app.reservations.services._create_provider_payment",
        AsyncMock(side_effect=PaymentError("Provider timeout")),
    )

    request = ReservationCreate(
        unit_id="unit-1",
        check_in=date(2026, 8, 1),
        check_out=date(2026, 8, 4),
        adults=2,
        payment_method="fawry",
    )
    with pytest.raises(PaymentError):
        await create_reservation(fake_session, _make_user(), request)
