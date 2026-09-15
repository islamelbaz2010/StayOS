"""Dispute / report-a-problem workflow.

Guests and hosts file disputes against an existing booking; admins work
the queue. The record carries operational state only — it never decides
refunds or compensation (those remain separate business decisions).
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings.models import Booking
from app.host.constants import CoHostPermissionScope
from app.listings.models import Unit
from app.shared.exceptions import (
    AuthorizationError,
    NotFoundError,
    ValidationError,
)
from app.shared.outbox import write_event

from .constants import DisputeStatus, can_transition
from .models import Dispute
from .schemas import DisputeAdminUpdate, DisputeCreate, DisputeResponse


async def _get_booking(session: AsyncSession, booking_id: str) -> Booking:
    result = await session.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


async def _reporter_role_for_booking(
    session: AsyncSession, user: User, booking: Booking
) -> str:
    """Return 'guest' or 'host' for a booking participant, else raise."""
    if booking.guest_id == user.id:
        return "guest"
    result = await session.execute(
        select(Unit.host_id).where(Unit.id == booking.unit_id)
    )
    host_id = result.scalar_one_or_none()
    if host_id == user.id:
        return "host"
    # Co-hosts with messaging-capable scope act on the host's behalf.
    from app.host.permissions import get_unit_permission_scope

    unit_result = await session.execute(
        select(Unit).where(Unit.id == booking.unit_id)
    )
    unit = unit_result.scalar_one_or_none()
    if unit is not None:
        scope = await get_unit_permission_scope(session, user, unit)
        if scope in (
            CoHostPermissionScope.FULL_ACCESS,
            CoHostPermissionScope.CALENDAR_MESSAGING,
        ):
            return "host"
    raise AuthorizationError("Not authorized to report a problem on this booking")


def _to_response(
    dispute: Dispute,
    reporter: User | None = None,
    role: str | None = None,
    include_internal: bool = False,
) -> DisputeResponse:
    return DisputeResponse(
        id=dispute.id,
        reporter_id=dispute.reporter_id,
        reporter_name=(reporter.display_name if reporter else None),
        reporter_role=role,
        booking_id=dispute.booking_id,
        category=dispute.category,
        description=dispute.description,
        status=dispute.status,
        # Internal staff notes are never exposed to reporters/hosts.
        admin_notes=dispute.admin_notes if include_internal else None,
        resolved_by=dispute.resolved_by,
        resolved_at=dispute.resolved_at,
        # server_default columns are None until refresh on a fresh row.
        created_at=dispute.created_at or datetime.now(UTC),
        updated_at=dispute.updated_at or dispute.created_at or datetime.now(UTC),
    )


async def create_dispute(
    session: AsyncSession, user: User, request: DisputeCreate
) -> DisputeResponse:
    booking = await _get_booking(session, request.booking_id)
    role = await _reporter_role_for_booking(session, user, booking)

    dispute = Dispute(
        id=str(uuid4()),
        reporter_id=user.id,
        booking_id=booking.id,
        category=request.category.value,
        description=request.description,
        status=DisputeStatus.OPEN.value,
    )
    session.add(dispute)
    await session.flush()

    await write_event(
        session,
        aggregate_type="Dispute",
        aggregate_id=UUID(dispute.id),
        event_type="dispute.opened",
        payload={
            "dispute_id": dispute.id,
            "booking_id": booking.id,
            "reporter_id": user.id,
            "reporter_role": role,
            "category": dispute.category,
        },
    )

    return _to_response(dispute, reporter=user, role=role)


async def list_my_disputes(
    session: AsyncSession, user: User
) -> list[DisputeResponse]:
    result = await session.execute(
        select(Dispute)
        .where(Dispute.reporter_id == user.id)
        .order_by(Dispute.created_at.desc())
    )
    return [_to_response(d, reporter=user) for d in result.scalars().all()]


async def get_dispute(
    session: AsyncSession, user: User, dispute_id: str
) -> DisputeResponse:
    result = await session.execute(select(Dispute).where(Dispute.id == dispute_id))
    dispute = result.scalar_one_or_none()
    if dispute is None:
        raise NotFoundError("Dispute not found")

    is_admin = user.role == UserRole.ADMIN
    if not is_admin and user.role == UserRole.STAFF:
        from app.auth.models import StaffPermission as StaffPermissionRow

        perm = await session.execute(
            select(StaffPermissionRow.id).where(
                StaffPermissionRow.user_id == user.id,
                StaffPermissionRow.permission == "disputes",
                StaffPermissionRow.is_active.is_(True),
            )
        )
        is_admin = perm.scalar_one_or_none() is not None
    if dispute.reporter_id != user.id and not is_admin:
        # Host may view disputes filed against their bookings.
        booking = await _get_booking(session, dispute.booking_id)
        try:
            role = await _reporter_role_for_booking(session, user, booking)
        except AuthorizationError:
            raise AuthorizationError("Not authorized to view this dispute") from None
        if role != "host":
            raise AuthorizationError("Not authorized to view this dispute")

    reporter = None
    if dispute.reporter_id:
        rep_result = await session.execute(
            select(User).where(User.id == dispute.reporter_id)
        )
        reporter = rep_result.scalar_one_or_none()
    return _to_response(dispute, reporter=reporter, include_internal=is_admin)


async def list_disputes_admin(
    session: AsyncSession,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[DisputeResponse], int]:
    stmt = select(Dispute)
    count_stmt = select(func.count()).select_from(Dispute)
    if status:
        stmt = stmt.where(Dispute.status == status)
        count_stmt = count_stmt.where(Dispute.status == status)
    total = (await session.execute(count_stmt)).scalar_one()
    result = await session.execute(
        stmt.order_by(Dispute.created_at.desc()).limit(limit).offset(offset)
    )
    disputes = list(result.scalars().all())

    reporter_ids = {d.reporter_id for d in disputes}
    reporters: dict[str, User] = {}
    if reporter_ids:
        rep_result = await session.execute(
            select(User).where(User.id.in_(reporter_ids))
        )
        reporters = {u.id: u for u in rep_result.scalars().all()}

    return [
        _to_response(d, reporter=reporters.get(d.reporter_id), include_internal=True)
        for d in disputes
    ], total


async def update_dispute_admin(
    session: AsyncSession,
    admin: User,
    dispute_id: str,
    request: DisputeAdminUpdate,
) -> DisputeResponse:
    result = await session.execute(select(Dispute).where(Dispute.id == dispute_id))
    dispute = result.scalar_one_or_none()
    if dispute is None:
        raise NotFoundError("Dispute not found")

    old_status = dispute.status
    if request.status is not None and request.status.value != dispute.status:
        if not can_transition(dispute.status, request.status.value):
            raise ValidationError(
                f"Cannot transition dispute from {dispute.status} to {request.status.value}"
            )
        dispute.status = request.status.value
        if request.status.value in (DisputeStatus.RESOLVED, DisputeStatus.CLOSED):
            dispute.resolved_by = admin.id
            dispute.resolved_at = datetime.now(UTC)
    if request.admin_notes is not None:
        dispute.admin_notes = request.admin_notes
    dispute.updated_at = datetime.now(UTC)
    session.add(dispute)
    await session.flush()

    if request.status is not None and request.status.value != old_status:
        await write_event(
            session,
            aggregate_type="Dispute",
            aggregate_id=UUID(dispute.id),
            event_type="dispute.status_changed",
            payload={
                "dispute_id": dispute.id,
                "booking_id": dispute.booking_id,
                "old_status": old_status,
                "new_status": dispute.status,
                "changed_by": admin.id,
            },
        )

    rep_result = await session.execute(
        select(User).where(User.id == dispute.reporter_id)
    )
    reporter = rep_result.scalar_one_or_none()

    if request.reply:
        await _deliver_reply(session, admin, dispute, reporter, request.reply)

    return _to_response(
        dispute, reporter=reporter, include_internal=True
    )


async def _deliver_reply(
    session: AsyncSession,
    admin: User,
    dispute: Dispute,
    reporter: User | None,
    reply_text: str,
) -> None:
    """Deliver an admin/staff reply to the dispute reporter's Messages.

    Uses the existing SUPPORT conversation contract: the reporter is a real
    participant, so the reply appears in their Messages list and participates
    in the existing unread/notification path. Only the user-facing reply is
    delivered — admin_notes remain internal to the dispute record.
    """
    from app.messages import repository as messages_repository
    from app.messages import services as messages_services
    from app.messages.constants import MessageStatus, ParticipantRole

    if reporter is None or reporter.id == admin.id:
        return

    booking = await _get_booking(session, dispute.booking_id)
    try:
        reporter_role = await _reporter_role_for_booking(session, reporter, booking)
    except AuthorizationError:
        # Reporter's booking relationship changed since filing — still
        # deliver the reply to their Messages as a guest-side thread.
        reporter_role = "guest"

    conversation = await messages_repository.get_or_create_support_conversation(
        session,
        context_booking_id=booking.id,
        unit_id=booking.unit_id,
        staff_user_id=admin.id,
        target_user_id=reporter.id,
        target_role=(
            ParticipantRole.HOST if reporter_role == "host" else ParticipantRole.GUEST
        ),
    )

    message = await messages_repository.create_message(
        session,
        conversation_id=conversation.id,
        sender_id=admin.id,
        sender_role=ParticipantRole.SUPPORT,
        content=reply_text,
        status=MessageStatus.SENT,
    )

    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    await session.flush()

    await messages_services._notify_message_recipients(
        session, conversation, admin, message
    )
