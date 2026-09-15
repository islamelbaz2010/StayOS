"""Coverage for the founder-acceptance closure pass:

- Post-publication listing edit moderation (stash / approve / reject).
- Photo moderation states on published listings.
- Dispute intake + admin queue workflow.
- Internal staff accounts + scoped permission checks.
- Admin booking timeline + admin↔guest/host support contact.
- Role-upgrade guard (ops accounts can never become hosts).
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from geoalchemy2.elements import WKTElement

from app.auth.constants import KycStatus, StaffPermission, UserRole
from app.auth.models import User
from app.bookings.models import Booking
from app.disputes.constants import DisputeStatus
from app.disputes.models import Dispute
from app.listings import repository as listings_repository
from app.listings import services as listings_services
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing, UnitPhoto
from app.listings.schemas import ListingUpdate, PhotoCreate
from app.shared.exceptions import (
    AuthorizationError,
    NotFoundError,
    ValidationError,
)


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.HOST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+201000000000",
        email="u@example.com",
        firebase_uid=None,
        display_name="User",
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
        cultural_tags=[],
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


def _make_unit(status: str = "LISTED", host_id: str = "host-1") -> Unit:
    unit = Unit(
        id="unit-1",
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
        beds=1,
    )
    unit.listing = _make_listing()
    unit.photos = []
    return unit


def _make_booking(
    unit: Unit, guest: User, status: str = "confirmed"
) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status=status,
        check_in=now.date(),
        check_out=now.date(),
        adults=2,
        children=0,
        infants=0,
        created_at=now,
        updated_at=now,
    )


def _result(
    *,
    scalar_one_or_none=None,
    scalars_all=None,
    scalar_one=None,
    one=None,
):
    res = MagicMock()
    res.scalar_one_or_none.return_value = scalar_one_or_none
    res.scalar_one.return_value = scalar_one
    res.one.return_value = one
    scalars = MagicMock()
    scalars.all.return_value = scalars_all or []
    res.scalars.return_value = scalars
    return res


# ============================================================
# LISTING EDIT MODERATION
# ============================================================


def test_split_update_for_moderation_partitions_fields() -> None:
    from app.listings import moderation

    unit_changes, reviewed, direct = moderation.split_update_for_moderation(
        {
            "title_en": "New",
            "base_price_egp": 2000,
            "city": "Giza",
            "lat": 29.9,
            "check_in_instructions": "hidden until confirmed",
            "google_place_id": "gp-1",
        }
    )
    assert "city" in unit_changes and "lat" in unit_changes
    assert "title_en" in reviewed and "base_price_egp" in reviewed
    assert "check_in_instructions" in direct
    assert "google_place_id" in direct


def test_stash_pending_changes_merges_change_set() -> None:
    from app.listings import moderation

    unit = _make_unit()
    listing = unit.listing
    assert moderation.stash_pending_changes(
        unit, listing, {"title_en": "A"}, submitted_by="host-1"
    )
    assert listing.pending_changes["listing"]["title_en"] == "A"
    assert listing.pending_changes["submitted_by"] == "host-1"

    # A second edit merges instead of replacing.
    assert moderation.stash_pending_changes(
        unit, listing, {"city": "Giza"}, submitted_by="host-1"
    )
    assert listing.pending_changes["unit"]["city"] == "Giza"
    assert listing.pending_changes["listing"]["title_en"] == "A"


@pytest.mark.asyncio
async def test_update_listing_on_listed_unit_stashes_changes(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_can_edit_listing", AsyncMock()
    )
    fake_session.execute = AsyncMock(
        return_value=_result(one=MagicMock(lat=30.0, lng=31.0))
    )

    host = _make_user(user_id="host-1", role=UserRole.HOST)
    result = await listings_services.update_listing(
        fake_session, host, "unit-1", ListingUpdate(base_price_egp=2500)
    )

    # Published price is untouched; the edit is stashed for review.
    assert unit.listing.base_price_egp == 1500
    assert unit.listing.pending_changes["listing"]["base_price_egp"] == 2500
    assert result.has_pending_changes is True
    assert result.pending_changes is not None


@pytest.mark.asyncio
async def test_update_listing_admin_applies_directly(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_can_edit_listing", AsyncMock()
    )
    monkeypatch.setattr(
        listings_repository,
        "update_unit_listing",
        AsyncMock(return_value=unit.listing),
    )
    fake_session.execute = AsyncMock(
        return_value=_result(one=MagicMock(lat=30.0, lng=31.0))
    )

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    await listings_services.update_listing(
        fake_session, admin, "unit-1", ListingUpdate(base_price_egp=2500)
    )
    listings_repository.update_unit_listing.assert_awaited_once()
    assert unit.listing.pending_changes is None


@pytest.mark.asyncio
async def test_approve_listed_edit_publishes_changes(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    unit.listing.pending_changes = {
        "listing": {"base_price_egp": 3000},
        "submitted_by": "host-1",
        "submitted_at": "2026-09-15T00:00:00+00:00",
    }
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalars_all=[]),  # photos for apply_pending_changes
            _result(one=MagicMock(lat=30.0, lng=31.0)),  # coordinates
        ]
    )

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    result = await listings_services.approve_listing(
        fake_session, admin, "unit-1"
    )
    assert unit.listing.base_price_egp == 3000
    assert unit.listing.pending_changes is None
    assert result.status == UnitStatus.LISTED


@pytest.mark.asyncio
async def test_reject_listed_edit_discards_changes(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    unit.listing.pending_changes = {
        "listing": {"title_en": "Spam title"},
        "submitted_by": "host-1",
        "submitted_at": "2026-09-15T00:00:00+00:00",
    }
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalars_all=[]),  # photos
            _result(one=MagicMock(lat=30.0, lng=31.0)),
        ]
    )

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    await listings_services.reject_listing(
        fake_session, admin, "unit-1", reason="Policy violation"
    )
    assert unit.listing.title_en == "Test"
    assert unit.listing.pending_changes is None
    assert unit.status == UnitStatus.LISTED
    assert unit.rejection_reason == "Policy violation"


@pytest.mark.asyncio
async def test_approve_listed_without_changes_fails(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    with pytest.raises(ValidationError):
        await listings_services.approve_listing(fake_session, admin, "unit-1")


@pytest.mark.asyncio
async def test_approve_requires_admin(fake_session: AsyncMock) -> None:
    host = _make_user(role=UserRole.HOST)
    with pytest.raises(AuthorizationError):
        await listings_services.approve_listing(fake_session, host, "unit-1")


@pytest.mark.asyncio
async def test_create_photo_on_listed_unit_is_pending(
    fake_session: AsyncMock, monkeypatch
) -> None:
    unit = _make_unit(status=UnitStatus.LISTED)
    monkeypatch.setattr(
        listings_repository,
        "get_unit_with_listing",
        AsyncMock(return_value=unit),
    )
    monkeypatch.setattr(
        listings_services, "assert_can_edit_listing", AsyncMock()
    )
    photo = UnitPhoto(
        id="p-new",
        unit_id="unit-1",
        s3_key="k",
        url="https://cdn.example.com/x.jpg",
        display_order=5,
        is_cover=False,
    )
    monkeypatch.setattr(
        listings_repository, "create_photo", AsyncMock(return_value=photo)
    )

    host = _make_user(user_id="host-1", role=UserRole.HOST)
    result = await listings_services.create_photo(
        fake_session,
        host,
        "unit-1",
        PhotoCreate(s3_key="k", url="https://cdn.example.com/x.jpg"),
    )
    assert result.moderation_state == "pending_add"


@pytest.mark.asyncio
async def test_list_photos_hides_pending_from_public(
    fake_session: AsyncMock, monkeypatch
) -> None:
    live = UnitPhoto(
        id="p1", unit_id="unit-1", s3_key="a", url="https://x/a",
        display_order=0, is_cover=True,
    )
    pending = UnitPhoto(
        id="p2", unit_id="unit-1", s3_key="b", url="https://x/b",
        display_order=1, is_cover=False, moderation_state="pending_add",
    )
    monkeypatch.setattr(
        listings_repository,
        "get_photos_by_unit",
        AsyncMock(return_value=[live, pending]),
    )

    public = await listings_services.list_photos(fake_session, "unit-1", None)
    assert [p.id for p in public] == ["p1"]

    fake_session.execute = AsyncMock(
        return_value=_result(scalar_one_or_none="host-1")
    )
    owner = _make_user(user_id="host-1", role=UserRole.HOST)
    owned = await listings_services.list_photos(fake_session, "unit-1", owner)
    assert {p.id for p in owned} == {"p1", "p2"}


@pytest.mark.asyncio
async def test_discard_pending_changes_restores_photos(
    fake_session: AsyncMock,
) -> None:
    from app.listings import moderation

    unit = _make_unit(status=UnitStatus.LISTED)
    pending_photo = UnitPhoto(
        id="pp", unit_id="unit-1", s3_key="k", url="https://x/p",
        display_order=3, is_cover=False, moderation_state="pending_add",
    )
    fake_session.execute = AsyncMock(
        return_value=_result(scalars_all=[pending_photo])
    )
    fake_session.delete = AsyncMock()

    ok = await moderation.discard_pending_changes(
        fake_session, unit, unit.listing
    )
    assert ok is True
    fake_session.delete.assert_awaited_once_with(pending_photo)


# ============================================================
# DISPUTES
# ============================================================


@pytest.mark.asyncio
async def test_create_dispute_as_guest(fake_session: AsyncMock) -> None:
    from app.disputes import services as dispute_services
    from app.disputes.schemas import DisputeCreate
    from app.disputes.constants import DisputeCategory

    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=booking),  # _get_booking
            _result(),  # write_event insert
        ]
    )

    result = await dispute_services.create_dispute(
        fake_session,
        guest,
        DisputeCreate(
            booking_id=booking.id,
            category=DisputeCategory.PROPERTY,
            description="The AC was broken for the whole stay.",
        ),
    )
    assert result.status == DisputeStatus.OPEN
    assert result.reporter_role == "guest"
    assert result.booking_id == booking.id


@pytest.mark.asyncio
async def test_create_dispute_as_host(fake_session: AsyncMock) -> None:
    from app.disputes import services as dispute_services
    from app.disputes.schemas import DisputeCreate
    from app.disputes.constants import DisputeCategory

    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=booking),
            _result(scalar_one_or_none="host-1"),  # Unit.host_id lookup
            _result(),  # write_event
        ]
    )

    result = await dispute_services.create_dispute(
        fake_session,
        host,
        DisputeCreate(
            booking_id=booking.id,
            category=DisputeCategory.GUEST,
            description="Guest caused damage to the furniture.",
        ),
    )
    assert result.reporter_role == "host"


@pytest.mark.asyncio
async def test_create_dispute_denied_for_stranger(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.disputes import services as dispute_services
    from app.disputes.schemas import DisputeCreate
    from app.disputes.constants import DisputeCategory

    stranger = _make_user(user_id="stranger", role=UserRole.GUEST)
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=booking),
            _result(scalar_one_or_none="host-1"),
            _result(scalar_one_or_none=unit),
        ]
    )
    monkeypatch.setattr(
        "app.host.permissions.get_unit_permission_scope",
        AsyncMock(return_value=None),
    )

    with pytest.raises(AuthorizationError):
        await dispute_services.create_dispute(
            fake_session,
            stranger,
            DisputeCreate(
                booking_id=booking.id,
                category=DisputeCategory.OTHER,
                description="I am not part of this booking at all.",
            ),
        )


@pytest.mark.asyncio
async def test_dispute_admin_transition_flow(fake_session: AsyncMock) -> None:
    from app.disputes import services as dispute_services
    from app.disputes.schemas import DisputeAdminUpdate

    admin = _make_user(role=UserRole.ADMIN)
    dispute = Dispute(
        id=str(uuid.uuid4()),
        reporter_id="guest-1",
        booking_id="b-1",
        category="booking",
        description="Issue with the stay",
        status=DisputeStatus.OPEN,
    )
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(),  # write_event
            _result(scalar_one_or_none=None),  # reporter user
        ]
    )
    updated = await dispute_services.update_dispute_admin(
        fake_session,
        admin,
        "d-1",
        DisputeAdminUpdate(status=DisputeStatus.IN_REVIEW),
    )
    assert updated.status == "in_review"

    # Invalid transition resolved -> open is rejected.
    dispute.status = DisputeStatus.RESOLVED
    fake_session.execute = AsyncMock(
        side_effect=[_result(scalar_one_or_none=dispute)]
    )
    with pytest.raises(ValidationError):
        await dispute_services.update_dispute_admin(
            fake_session,
            admin,
            "d-1",
            DisputeAdminUpdate(status=DisputeStatus.OPEN),
        )


@pytest.mark.asyncio
async def test_get_dispute_denied_for_unrelated_user(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.disputes import services as dispute_services

    dispute = Dispute(
        id=str(uuid.uuid4()),
        reporter_id="guest-1",
        booking_id="b-1",
        category="booking",
        description="Something happened during stay.",
        status=DisputeStatus.OPEN,
    )
    booking = MagicMock()
    booking.guest_id = "guest-1"
    booking.unit_id = "unit-1"
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(scalar_one_or_none=booking),  # _get_booking
            _result(scalar_one_or_none="host-1"),
            _result(scalar_one_or_none=_make_unit()),
        ]
    )
    monkeypatch.setattr(
        "app.host.permissions.get_unit_permission_scope",
        AsyncMock(return_value=None),
    )
    stranger = _make_user(user_id="nobody", role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await dispute_services.get_dispute(fake_session, stranger, "d-1")


# ============================================================
# STAFF RBAC
# ============================================================


@pytest.mark.asyncio
async def test_require_staff_permission_matrix() -> None:
    from app.auth.dependencies import require_staff_permission

    checker = require_staff_permission(StaffPermission.OPERATIONS)

    admin = _make_user(role=UserRole.ADMIN)
    session = AsyncMock()
    assert await checker(user=admin, session=session) is admin

    # Staff with an active grant passes.
    staff = _make_user(role=UserRole.STAFF)
    session_with_grant = AsyncMock()
    session_with_grant.execute = AsyncMock(
        return_value=_result(scalar_one_or_none="perm-1")
    )
    assert await checker(user=staff, session=session_with_grant) is staff

    # Staff without the grant is denied.
    session_without = AsyncMock()
    session_without.execute = AsyncMock(
        return_value=_result(scalar_one_or_none=None)
    )
    with pytest.raises(AuthorizationError):
        await checker(user=staff, session=session_without)

    # Guests and hosts are never staff-permission holders.
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(AuthorizationError):
        await checker(user=guest, session=session_without)


@pytest.mark.asyncio
async def test_create_staff_account(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.auth import repository as auth_repository
    from app.auth import staff as staff_services
    from app.auth.staff_schemas import StaffCreateRequest

    admin = _make_user(role=UserRole.ADMIN)
    monkeypatch.setattr(
        auth_repository, "get_user_by_phone", AsyncMock(return_value=None)
    )
    created = _make_user(role=UserRole.STAFF)
    monkeypatch.setattr(
        auth_repository, "create_user", AsyncMock(return_value=created)
    )
    fake_session.execute = AsyncMock(return_value=_result())

    result = await staff_services.create_staff(
        fake_session,
        admin,
        StaffCreateRequest(
            phone_number="+201111111111",
            display_name="Ops Agent",
            permissions=["operations", "disputes"],
        ),
    )
    assert result.role == UserRole.STAFF
    assert sorted(result.permissions) == ["disputes", "operations"]


@pytest.mark.asyncio
async def test_create_staff_rejects_unknown_permission(
    fake_session: AsyncMock,
) -> None:
    from app.auth import staff as staff_services
    from app.auth.staff_schemas import StaffCreateRequest

    admin = _make_user(role=UserRole.ADMIN)
    with pytest.raises(ValidationError):
        await staff_services.create_staff(
            fake_session,
            admin,
            StaffCreateRequest(
                phone_number="+201111111111",
                display_name="Ops Agent",
                permissions=["superuser"],
            ),
        )


@pytest.mark.asyncio
async def test_ops_accounts_cannot_upgrade_to_host() -> None:
    from app.auth import router as auth_router
    from app.auth import schemas as auth_schemas

    session = AsyncMock()
    for role in (UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD_STAFF):
        user = _make_user(role=role)
        with pytest.raises(ValidationError):
            await auth_router.upgrade_role(
                auth_schemas.RoleUpgradeRequest(role=UserRole.HOST),
                user=user,
                session=session,
            )


# ============================================================
# BOOKING TIMELINE + ADMIN CONTACT
# ============================================================


@pytest.mark.asyncio
async def test_booking_timeline_synthesizes_created_event(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repository
    from app.bookings import services as bookings_services

    admin = _make_user(role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalars_all=[]),  # no outbox rows
            _result(scalars_all=[guest]),  # actor users
        ]
    )

    timeline = await bookings_services.get_booking_timeline(
        fake_session, admin, booking.id
    )
    assert timeline.booking_id == booking.id
    assert len(timeline.events) == 1
    assert timeline.events[0].event_type == "booking.created"


@pytest.mark.asyncio
async def test_booking_timeline_includes_outbox_events(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repository
    from app.bookings import services as bookings_services
    from app.shared.models import OutboxEvent

    admin = _make_user(role=UserRole.ADMIN)
    guest = _make_user(role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    event = OutboxEvent(
        id="e-1",
        aggregate_type="Booking",
        aggregate_id=booking.id,
        event_type="booking.created",
        payload={"booking_id": booking.id, "actor_id": guest.id},
        created_at=booking.created_at,
    )
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalars_all=[event]),
            _result(scalars_all=[guest]),
        ]
    )

    timeline = await bookings_services.get_booking_timeline(
        fake_session, admin, booking.id
    )
    assert [e.event_type for e in timeline.events] == ["booking.created"]
    assert timeline.events[0].actor_id == guest.id


@pytest.mark.asyncio
async def test_admin_contact_creates_support_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repository
    from app.messages import repository as messages_repository
    from app.messages import services as messages_services
    from app.messages.constants import ConversationType

    admin = _make_user(role=UserRole.ADMIN)
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    booking.unit = unit
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )

    conversation = MagicMock()
    conversation.id = "conv-1"
    conversation.booking_id = None
    conversation.unit_id = unit.id
    conversation.type = ConversationType.SUPPORT
    conversation.status = "active"
    conversation.created_at = datetime.now(UTC)
    conversation.updated_at = datetime.now(UTC)
    participant = MagicMock()
    participant.user_id = guest.id
    participant.role = "guest"
    participant.last_read_at = None
    conversation.participants = [participant]

    get_or_create = AsyncMock(return_value=conversation)
    monkeypatch.setattr(
        messages_repository, "get_or_create_support_conversation", get_or_create
    )
    create_message = AsyncMock(return_value=MagicMock(id="m-1"))
    monkeypatch.setattr(
        messages_repository, "create_message", create_message
    )
    monkeypatch.setattr(
        messages_services,
        "_notify_message_recipients",
        AsyncMock(),
    )

    result = await messages_services.admin_contact_participant(
        fake_session, admin, booking.id, "guest", "Hello, we are reviewing your booking."
    )
    get_or_create.assert_awaited_once()
    kwargs = get_or_create.await_args.kwargs
    assert kwargs["target_user_id"] == guest.id
    assert kwargs["context_booking_id"] == booking.id
    create_message.assert_awaited_once()
    assert result.type == ConversationType.SUPPORT


@pytest.mark.asyncio
async def test_admin_contact_self_is_rejected(
    fake_session: AsyncMock, monkeypatch
) -> None:
    from app.bookings import repository as bookings_repository
    from app.messages import services as messages_services

    admin = _make_user(role=UserRole.ADMIN)
    unit = _make_unit()
    booking = _make_booking(unit, admin)  # admin is the "guest" here
    booking.unit = unit
    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    with pytest.raises(ValidationError):
        await messages_services.admin_contact_participant(
            fake_session, admin, booking.id, "guest", "Hi"
        )


# ============================================================
# LOCATION TREE
# ============================================================


@pytest.mark.asyncio
async def test_location_tree_groups_hierarchy(fake_session: AsyncMock) -> None:
    from app.favorites import services as favorites_services
    from app.favorites.models import LocationAlias

    rows = [
        LocationAlias(
            id=str(uuid.uuid4()),
            canonical_name_en="Maadi",
            canonical_name_ar="المعادي",
            alias="maadi",
            alias_type="exact",
            city="Cairo",
            governorate="Cairo",
            lat=29.96,
            lng=31.26,
        ),
        LocationAlias(
            id=str(uuid.uuid4()),
            canonical_name_en="Zamalek",
            canonical_name_ar="الزمالك",
            alias="zamalek",
            alias_type="exact",
            city="Cairo",
            governorate="Cairo",
            lat=30.06,
            lng=31.22,
        ),
        LocationAlias(
            id=str(uuid.uuid4()),
            canonical_name_en="Smouha",
            canonical_name_ar="سموحة",
            alias="smouha",
            alias_type="exact",
            city="Alexandria",
            governorate="Alexandria",
            lat=31.21,
            lng=29.94,
        ),
    ]
    fake_session.execute = AsyncMock(
        return_value=_result(scalars_all=rows)
    )
    tree = await favorites_services.location_tree(fake_session)
    names = {g.name for g in tree.governorates}
    assert names == {"Cairo", "Alexandria"}
    cairo = next(g for g in tree.governorates if g.name == "Cairo")
    assert cairo.cities[0].name == "Cairo"
    assert {a.name_en for a in cairo.cities[0].areas} == {"Maadi", "Zamalek"}


# ---------------------------------------------------------------------------
# Discovery geo filters + Google Places env wiring
# ---------------------------------------------------------------------------


def test_google_places_adapter_prefers_places_env_var(monkeypatch):
    """GOOGLE_PLACES_API_KEY (the Railway variable name) must enable the
    adapter even when GOOGLE_MAPS_API_KEY is unset."""
    from app.config import settings
    from app.discovery.adapters.google_places import GooglePlacesAdapter
    from app.discovery.constants import SourceStatus

    monkeypatch.setattr(settings, "GOOGLE_PLACES_API_KEY", "pk-123")
    monkeypatch.setattr(settings, "GOOGLE_MAPS_API_KEY", "")
    adapter = GooglePlacesAdapter()
    assert adapter.source_status == SourceStatus.ENABLED
    assert adapter.is_available()

    monkeypatch.setattr(settings, "GOOGLE_PLACES_API_KEY", "")
    monkeypatch.setattr(settings, "GOOGLE_MAPS_API_KEY", "mk-456")
    fallback = GooglePlacesAdapter()
    assert fallback.is_available()

    monkeypatch.setattr(settings, "GOOGLE_MAPS_API_KEY", "")
    missing = GooglePlacesAdapter()
    assert missing.source_status == SourceStatus.REQUIRES_CREDENTIALS
    assert not missing.is_available()


@pytest.mark.asyncio
async def test_list_candidates_governorate_and_zone_filters():
    """zone and governorate params must produce real persisted-field
    filters, not frontend-only decoration."""
    from app.discovery import services as discovery_services
    from app.discovery.models import DiscoveryCandidate

    fake_session = MagicMock()
    captured: list = []

    def capture(stmt):
        captured.append(str(stmt))
        return _result(scalars_all=[], scalar_one=0)

    fake_session.execute = AsyncMock(side_effect=capture)

    await discovery_services.list_candidates(
        fake_session, zone="Maadi", governorate="Cairo"
    )
    sql = captured[0]
    assert "zone" in sql
    assert "governorate" in sql


@pytest.mark.asyncio
async def test_attribute_geo_assigns_nearest_alias():
    """A candidate with coordinates but garbage/no city should pick up
    governorate/city/zone from the nearest canonical alias."""
    from app.discovery import services as discovery_services
    from app.favorites.models import LocationAlias

    aliases = [
        LocationAlias(
            canonical_name_en="Maadi", canonical_name_ar="م", alias="maadi",
            alias_type="exact", city="Cairo", governorate="Cairo",
            lat=29.96, lng=31.26,
        ),
        LocationAlias(
            canonical_name_en="Smouha", canonical_name_ar="س", alias="smouha",
            alias_type="exact", city="Alexandria", governorate="Alexandria",
            lat=31.21, lng=29.94,
        ),
    ]
    normalized = {"latitude": 29.97, "longitude": 31.25, "city": None, "zone": None}
    discovery_services._attribute_geo(normalized, aliases, {"Cairo", "Alexandria"})
    assert normalized["governorate"] == "Cairo"
    assert normalized["city"] == "Cairo"
    assert normalized["zone"] == "Maadi"


@pytest.mark.asyncio
async def test_attribute_geo_replaces_noncanonical_city():
    from app.discovery import services as discovery_services
    from app.favorites.models import LocationAlias

    aliases = [
        LocationAlias(
            canonical_name_en="Dahab", canonical_name_ar="د", alias="dahab",
            alias_type="exact", city="Dahab", governorate="South Sinai",
            lat=28.51, lng=34.51,
        ),
    ]
    normalized = {
        "latitude": 28.51, "longitude": 34.51,
        "city": "Some Random Street Name 123", "zone": None,
    }
    discovery_services._attribute_geo(normalized, aliases, {"Dahab"})
    assert normalized["city"] == "Dahab"
    assert normalized["governorate"] == "South Sinai"


@pytest.mark.asyncio
async def test_attribute_geo_far_point_untouched():
    from app.discovery import services as discovery_services
    from app.favorites.models import LocationAlias

    aliases = [
        LocationAlias(
            canonical_name_en="Maadi", canonical_name_ar="م", alias="maadi",
            alias_type="exact", city="Cairo", governorate="Cairo",
            lat=29.96, lng=31.26,
        ),
    ]
    normalized = {"latitude": 51.5, "longitude": -0.12, "city": "London", "zone": None}
    discovery_services._attribute_geo(normalized, aliases, {"London"})
    assert "governorate" not in normalized
    assert normalized["city"] == "London"


@pytest.mark.asyncio
async def test_trigger_run_passes_max_candidates(monkeypatch):
    """A config's max_candidates_per_run must reach the adapter search
    config — previously dropped, silently capping every run at 50."""
    from app.discovery.router import trigger_run
    from app.discovery.schemas import DiscoveryRunTriggerRequest
    from app.discovery.adapters.base import registry
    from app.discovery import services as discovery_services

    adapter = registry.get("overpass_osm") or registry.get("json_api")
    assert adapter is not None

    config = MagicMock()
    config.city = "Cairo"
    config.zone = None
    config.property_type = None
    config.min_price = None
    config.max_price = None
    config.country = "Egypt"
    config.max_candidates_per_run = 150

    captured: dict = {}

    async def fake_run(session, adapter_, search_config, config_id=None, config_dict=None):
        from app.discovery.models import DiscoveryRun

        captured["max_candidates"] = search_config.max_candidates
        now = datetime.now(UTC)
        return DiscoveryRun(
            id=str(uuid.uuid4()),
            config_id=config_id,
            source=adapter_.source_name,
            status="COMPLETED",
            started_at=now,
            pages_scanned=0,
            candidates_found=0,
            new_candidates=0,
            duplicates=0,
            qualified=0,
            rejected=0,
            errors=[],
            run_metadata={},
            created_at=now,
            updated_at=now,
        )

    fake_session = MagicMock()
    fake_session.execute = AsyncMock(return_value=_result(scalar_one_or_none=config))
    monkeypatch.setattr(discovery_services, "run_discovery", fake_run)

    await trigger_run(
        DiscoveryRunTriggerRequest(source=adapter.source_name, config_id="cfg-1"),
        _=None,
        session=fake_session,
    )
    assert captured["max_candidates"] == 150
