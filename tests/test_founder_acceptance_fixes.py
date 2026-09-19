"""Regression coverage for the consolidated founder-acceptance fix pass:

- B: Admin/staff dispute replies are delivered to the reporter's Messages
  via the existing support-conversation contract; internal admin_notes are
  never exposed to reporters.
- C: The dedicated acceptance Staff fixture is isolated and idempotent.
- D: Listing-edit moderation reaches a user-visible final outcome —
  rejection preserves the reason, approval clears stale rejection state.
- E: PATCH /auth/me/role requires a reviewed KYC document, not just the
  verified flag — the guest→host transition cannot bypass document review.
"""

import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(
    0, str(Path(__file__).resolve().parent.parent / "scripts")
)  # noqa: E402

import seed_acceptance_staff as staff_seed  # noqa: E402

from app.auth.constants import KycStatus, UserRole  # noqa: E402
from app.auth.models import User  # noqa: E402
from app.auth.router import upgrade_role  # noqa: E402
from app.auth.schemas import RoleUpgradeRequest  # noqa: E402
from app.bookings.models import Booking  # noqa: E402
from app.disputes import services as dispute_services  # noqa: E402
from app.disputes.constants import DisputeStatus  # noqa: E402
from app.disputes.models import Dispute  # noqa: E402
from app.disputes.schemas import DisputeAdminUpdate  # noqa: E402
from app.kyc.models import KycDocument  # noqa: E402
from app.listings import repository as listings_repository  # noqa: E402
from app.listings import services as listings_services  # noqa: E402
from app.listings.constants import UnitStatus  # noqa: E402
from app.listings.models import Unit, UnitListing  # noqa: E402
from app.listings.schemas import ListingUpdate  # noqa: E402
from app.shared.exceptions import AuthorizationError, ValidationError  # noqa: E402


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
    display_name: str = "User",
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+201000000000",
        email="u@example.com",
        firebase_uid=None,
        display_name=display_name,
        locale="en",
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
        amenities=[],
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
        cleaning_fee_egp=300,
        cancellation_policy="FLEXIBLE",
    )


def _make_unit(status: str = "LISTED", host_id: str = "host-1") -> Unit:
    unit = Unit(
        id="unit-1",
        host_id=host_id,
        property_type="APARTMENT",
        status=status,
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


def _make_booking(unit: Unit, guest: User) -> Booking:
    now = datetime.now(UTC)
    return Booking(
        id=str(uuid.uuid4()),
        unit_id=unit.id,
        guest_id=guest.id,
        status="confirmed",
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
    fetchone=None,
) -> MagicMock:
    res = MagicMock()
    res.scalar_one_or_none.return_value = scalar_one_or_none
    res.scalar_one.return_value = scalar_one
    res.one.return_value = one
    res.fetchone.return_value = fetchone
    scalars = MagicMock()
    scalars.all.return_value = scalars_all or []
    res.scalars.return_value = scalars
    return res


# ============================================================
# B — SUPPORT REPLY DELIVERY
# ============================================================


def _make_dispute(reporter_id: str, booking_id: str) -> Dispute:
    return Dispute(
        id=str(uuid.uuid4()),
        reporter_id=reporter_id,
        booking_id=booking_id,
        category="booking",
        description="The AC was broken for the whole stay.",
        status=DisputeStatus.OPEN,
    )


@pytest.mark.asyncio
async def test_admin_reply_reaches_guest_support_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Admin reply on a guest-filed dispute is persisted as a support
    message addressed to the reporting guest only."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    unit = _make_unit()
    booking = _make_booking(unit, guest)
    dispute = _make_dispute(reporter_id=guest.id, booking_id=booking.id)
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)

    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),  # dispute lookup
            _result(scalar_one_or_none=guest),  # reporter lookup
            _result(scalar_one_or_none=booking),  # _get_booking
        ]
    )

    conversation = MagicMock()
    conversation.id = "conv-1"
    conversation.booking_id = None
    conversation.unit_id = unit.id
    conversation.participants = []

    get_conv = AsyncMock(return_value=conversation)
    create_msg = AsyncMock(return_value=MagicMock(id="msg-1"))
    notify = AsyncMock()
    monkeypatch.setattr(
        "app.messages.repository.get_or_create_support_conversation", get_conv
    )
    monkeypatch.setattr("app.messages.repository.create_message", create_msg)
    monkeypatch.setattr(
        "app.messages.services._notify_message_recipients", notify
    )

    result = await dispute_services.update_dispute_admin(
        fake_session,
        admin,
        dispute.id,
        DisputeAdminUpdate(reply="We are looking into this now."),
    )

    get_conv.assert_awaited_once()
    kwargs = get_conv.await_args.kwargs
    assert kwargs["context_booking_id"] == booking.id
    assert kwargs["staff_user_id"] == admin.id
    assert kwargs["target_user_id"] == guest.id
    assert kwargs["target_role"] == "guest"

    create_msg.assert_awaited_once()
    msg_kwargs = create_msg.await_args.kwargs
    assert msg_kwargs["conversation_id"] == conversation.id
    assert msg_kwargs["sender_id"] == admin.id
    assert msg_kwargs["sender_role"] == "support"
    assert msg_kwargs["content"] == "We are looking into this now."

    notify.assert_awaited_once()
    assert result.id == dispute.id


@pytest.mark.asyncio
async def test_admin_reply_reaches_host_support_conversation(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Admin reply on a host-filed dispute targets the reporting host."""
    host = _make_user(user_id="host-1", role=UserRole.HOST)
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    unit = _make_unit(host_id=host.id)
    booking = _make_booking(unit, guest)
    dispute = _make_dispute(reporter_id=host.id, booking_id=booking.id)
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)

    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(scalar_one_or_none=host),  # reporter
            _result(scalar_one_or_none=booking),  # _get_booking
            _result(scalar_one_or_none=host.id),  # Unit.host_id lookup
        ]
    )

    conversation = MagicMock()
    conversation.id = "conv-2"
    conversation.participants = []

    get_conv = AsyncMock(return_value=conversation)
    create_msg = AsyncMock(return_value=MagicMock(id="msg-2"))
    notify = AsyncMock()
    monkeypatch.setattr(
        "app.messages.repository.get_or_create_support_conversation", get_conv
    )
    monkeypatch.setattr("app.messages.repository.create_message", create_msg)
    monkeypatch.setattr(
        "app.messages.services._notify_message_recipients", notify
    )

    await dispute_services.update_dispute_admin(
        fake_session,
        admin,
        dispute.id,
        DisputeAdminUpdate(reply="Payout is being reviewed."),
    )

    kwargs = get_conv.await_args.kwargs
    assert kwargs["target_user_id"] == host.id
    assert kwargs["target_role"] == "host"
    notify.assert_awaited_once()


@pytest.mark.asyncio
async def test_dispute_update_without_reply_creates_no_message(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Status-only updates do not touch messaging."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    dispute = _make_dispute(reporter_id=guest.id, booking_id="b-1")
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)

    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(),  # write_event (status change)
            _result(scalar_one_or_none=guest),  # reporter
        ]
    )
    get_conv = AsyncMock()
    monkeypatch.setattr(
        "app.messages.repository.get_or_create_support_conversation", get_conv
    )

    await dispute_services.update_dispute_admin(
        fake_session,
        admin,
        dispute.id,
        DisputeAdminUpdate(status=DisputeStatus.IN_REVIEW),
    )
    get_conv.assert_not_awaited()


@pytest.mark.asyncio
async def test_admin_notes_never_exposed_to_reporter(
    fake_session: AsyncMock,
) -> None:
    """Internal admin_notes stay staff-only — reporter views get None."""
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    dispute = _make_dispute(reporter_id=guest.id, booking_id="b-1")
    dispute.admin_notes = "internal: possible fraud pattern"

    # Reporter view
    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(scalar_one_or_none=guest),  # reporter user
        ]
    )
    reporter_view = await dispute_services.get_dispute(
        fake_session, guest, dispute.id
    )
    assert reporter_view.admin_notes is None

    # Reporter's own list
    fake_session.execute = AsyncMock(
        return_value=_result(scalars_all=[dispute])
    )
    mine = await dispute_services.list_my_disputes(fake_session, guest)
    assert mine[0].admin_notes is None


@pytest.mark.asyncio
async def test_admin_notes_visible_to_admin(
    fake_session: AsyncMock,
) -> None:
    guest = _make_user(user_id="guest-1", role=UserRole.GUEST)
    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    dispute = _make_dispute(reporter_id=guest.id, booking_id="b-1")
    dispute.admin_notes = "internal: escalate if repeated"

    fake_session.execute = AsyncMock(
        side_effect=[
            _result(scalar_one_or_none=dispute),
            _result(scalar_one_or_none=guest),  # reporter user
        ]
    )
    view = await dispute_services.get_dispute(fake_session, admin, dispute.id)
    assert view.admin_notes == "internal: escalate if repeated"


# ============================================================
# C — STAFF FIXTURE
# ============================================================


def _staff_row(role: str, kyc_status: str) -> MagicMock:
    row = MagicMock()
    row.role = role
    row.kyc_status = kyc_status
    return row


@pytest.mark.asyncio
async def test_staff_seed_creates_fixture_and_permissions() -> None:
    session = AsyncMock()
    session.execute.return_value = _result(fetchone=None)

    await staff_seed.create_acceptance_staff(session)

    # 1 existence check + 1 user insert + 6 permission checks + 6 inserts.
    assert session.execute.await_count == 14
    insert_user = session.execute.await_args_list[1]
    assert "INSERT INTO auth.users" in str(insert_user.args[0])
    assert "'staff'" in str(insert_user.args[0])
    assert insert_user.args[1]["id"] == staff_seed.ACCEPTANCE_STAFF_ID

    perm_inserts = [
        c for c in session.execute.await_args_list
        if "INSERT INTO auth.staff_permissions" in str(c.args[0])
    ]
    granted = {c.args[1]["perm"] for c in perm_inserts}
    assert granted == set(staff_seed.STAFF_PERMISSIONS)


@pytest.mark.asyncio
async def test_staff_seed_is_idempotent() -> None:
    session = AsyncMock()
    session.execute.return_value = _result(
        fetchone=_staff_row("staff", "verified")
    )

    await staff_seed.create_acceptance_staff(session)

    # existence check + 6 permission SELECTs (all active) — no writes.
    assert session.execute.await_count == 7
    writes = [
        c for c in session.execute.await_args_list
        if "INSERT" in str(c.args[0]) or "UPDATE" in str(c.args[0])
    ]
    assert writes == []


@pytest.mark.asyncio
async def test_staff_seed_repairs_role_drift() -> None:
    session = AsyncMock()
    session.execute.side_effect = [
        _result(fetchone=_staff_row("guest", "unverified")),  # drifted user
        _result(),  # repair UPDATE
        *(
            _result(fetchone=MagicMock(is_active=True))
            for _ in staff_seed.STAFF_PERMISSIONS
        ),
    ]

    await staff_seed.create_acceptance_staff(session)

    update_call = session.execute.await_args_list[1]
    sql = str(update_call.args[0])
    assert "UPDATE auth.users" in sql
    assert "'staff'" in sql and "'verified'" in sql


# ============================================================
# D — LISTING EDIT MODERATION OUTCOME
# ============================================================


@pytest.mark.asyncio
async def test_reject_listed_edit_exposes_reason_to_host(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Rejecting a published edit finalizes the change-set and returns the
    reason on the host-facing listing contract."""
    unit = _make_unit(status=UnitStatus.LISTED)
    unit.listing.pending_changes = {
        "listing": {"base_price_egp": 5000},
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
            _result(one=MagicMock(lat=30.0, lng=31.0)),  # coordinates
        ]
    )

    admin = _make_user(user_id="admin-1", role=UserRole.ADMIN)
    result = await listings_services.reject_listing(
        fake_session, admin, "unit-1", reason="Price far above market"
    )

    assert unit.listing.pending_changes is None
    assert unit.listing.base_price_egp == 1500  # published price preserved
    assert result.has_pending_changes is False
    assert result.rejection_reason == "Price far above market"


@pytest.mark.asyncio
async def test_approve_listed_edit_clears_stale_rejection(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Approving a new change-set resolves a previous rejection record."""
    unit = _make_unit(status=UnitStatus.LISTED)
    unit.rejection_reason = "Previously rejected"
    unit.listing.pending_changes = {
        "listing": {"base_price_egp": 2500},
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
    result = await listings_services.approve_listing(
        fake_session, admin, "unit-1"
    )

    assert unit.listing.base_price_egp == 2500  # new price live
    assert unit.listing.pending_changes is None
    assert unit.rejection_reason is None
    assert result.rejection_reason is None
    assert result.has_pending_changes is False


@pytest.mark.asyncio
async def test_new_edit_submission_clears_stale_rejection(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A fresh change-set supersedes the previous rejection so the host no
    longer sees a stale outcome while the new edit is pending."""
    unit = _make_unit(status=UnitStatus.LISTED)
    unit.rejection_reason = "Earlier edit rejected"
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
    await listings_services.update_listing(
        fake_session, host, "unit-1", ListingUpdate(base_price_egp=2200)
    )

    assert unit.rejection_reason is None
    assert unit.listing.pending_changes["listing"]["base_price_egp"] == 2200


# ============================================================
# E — HOST ONBOARDING REQUIRES REVIEWED KYC DOCUMENT
# ============================================================


def _verified_document(user_id: str) -> KycDocument:
    now = datetime.now(UTC)
    return KycDocument(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=None,
        document_type="national_id",
        document_number=None,
        status="verified",
        legal_name="Test User",
        front_image_key="kyc/u/d/front.jpg",
        back_image_key=None,
        selfie_image_key="kyc/u/d/selfie.jpg",
        verification_payload={},
        verified_at=now,
        rejected_at=None,
        rejection_reason=None,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_role_upgrade_blocked_without_reviewed_document(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A verified flag alone (e.g. seeded/admin-set) cannot self-upgrade —
    a document must have completed the review workflow."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[]),
    )
    update_user = AsyncMock()
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    with pytest.raises(ValidationError):
        await upgrade_role(
            RoleUpgradeRequest(role=UserRole.HOST), guest, fake_session
        )
    update_user.assert_not_awaited()


@pytest.mark.asyncio
async def test_role_upgrade_blocked_with_only_pending_document(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """A submitted-but-unreviewed document does not grant host access —
    the pending-review state is enforced."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.PENDING)
    pending_doc = _verified_document(guest.id)
    pending_doc.status = "pending"
    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[pending_doc]),
    )
    update_user = AsyncMock()
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    with pytest.raises(ValidationError):
        await upgrade_role(
            RoleUpgradeRequest(role=UserRole.HOST), guest, fake_session
        )
    update_user.assert_not_awaited()


@pytest.mark.asyncio
async def test_role_upgrade_succeeds_with_verified_document(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """After the review workflow approves the document, the guest may
    complete the self-upgrade — every host is backed by a reviewed doc."""
    guest = _make_user(role=UserRole.GUEST, kyc_status=KycStatus.VERIFIED)
    monkeypatch.setattr(
        "app.kyc.repository.get_kyc_documents_by_user_id",
        AsyncMock(return_value=[_verified_document(guest.id)]),
    )
    upgraded = _make_user(
        user_id=guest.id, role=UserRole.HOST, kyc_status=KycStatus.VERIFIED
    )
    update_user = AsyncMock(return_value=upgraded)
    monkeypatch.setattr("app.auth.repository.update_user", update_user)

    result = await upgrade_role(
        RoleUpgradeRequest(role=UserRole.HOST), guest, fake_session
    )
    update_user.assert_awaited_once()
    assert update_user.await_args.kwargs["role"] == UserRole.HOST
    assert result.role == UserRole.HOST


@pytest.mark.asyncio
async def test_role_upgrade_rejects_non_host_target(
    fake_session: AsyncMock,
) -> None:
    guest = _make_user(role=UserRole.GUEST)
    with pytest.raises(ValidationError):
        await upgrade_role(
            RoleUpgradeRequest(role=UserRole.GUEST), guest, fake_session
        )


@pytest.mark.asyncio
async def test_role_upgrade_rejects_operational_accounts(
    fake_session: AsyncMock,
) -> None:
    for role in (UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD_STAFF):
        user = _make_user(role=role)
        with pytest.raises(ValidationError):
            await upgrade_role(
                RoleUpgradeRequest(role=UserRole.HOST), user, fake_session
            )


# ============================================================
# KYC INITIATE — NO LAZY RELATIONSHIP IO
# ============================================================


@pytest.mark.asyncio
async def test_initiate_kyc_fetches_account_without_lazy_load(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """``user.account`` is a lazy relationship — reading it inside the async
    session raises MissingGreenlet (the production 500 behind the reported
    CORS failure). The service must fetch the account via the repository."""
    from app.auth.models import Account
    from app.kyc import services as kyc_services
    from app.kyc.schemas import KycInitiateRequest

    user = _make_user(role=UserRole.GUEST)

    account = Account(id="acct-1", user_id=user.id)
    get_account = AsyncMock(return_value=account)
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id", get_account
    )
    document = KycDocument(
        id=str(uuid.uuid4()),
        user_id=user.id,
        account_id=account.id,
        document_type="national_id",
        document_number=None,
        status="unverified",
    )
    create_doc = AsyncMock(return_value=document)
    monkeypatch.setattr(
        "app.kyc.repository.create_kyc_document", create_doc
    )
    monkeypatch.setattr(
        "app.kyc.repository.update_kyc_document", AsyncMock(return_value=document)
    )
    monkeypatch.setattr(
        kyc_services,
        "_generate_presigned_put_url",
        lambda bucket, key, content_type: "https://s3.example.com/presigned",
    )

    result = await kyc_services.initiate_kyc_document(
        fake_session, user, KycInitiateRequest(document_type="national_id")
    )

    get_account.assert_awaited_once()
    assert get_account.await_args.args[1] == user.id
    assert create_doc.await_args.kwargs["account_id"] == "acct-1"
    assert result.document_id == document.id


@pytest.mark.asyncio
async def test_initiate_kyc_allows_missing_account(
    fake_session: AsyncMock, monkeypatch
) -> None:
    """Users without an Account row still initiate KYC (account_id=None)."""
    from app.kyc import services as kyc_services
    from app.kyc.schemas import KycInitiateRequest

    user = _make_user(role=UserRole.GUEST)
    monkeypatch.setattr(
        "app.auth.repository.get_account_by_user_id", AsyncMock(return_value=None)
    )
    document = KycDocument(
        id=str(uuid.uuid4()),
        user_id=user.id,
        account_id=None,
        document_type="national_id",
        document_number=None,
        status="unverified",
    )
    create_doc = AsyncMock(return_value=document)
    monkeypatch.setattr(
        "app.kyc.repository.create_kyc_document", create_doc
    )
    monkeypatch.setattr(
        "app.kyc.repository.update_kyc_document", AsyncMock(return_value=document)
    )
    monkeypatch.setattr(
        kyc_services,
        "_generate_presigned_put_url",
        lambda bucket, key, content_type: "https://s3.example.com/presigned",
    )

    result = await kyc_services.initiate_kyc_document(
        fake_session, user, KycInitiateRequest(document_type="national_id")
    )

    assert create_doc.await_args.kwargs["account_id"] is None
    assert result.document_id == document.id
