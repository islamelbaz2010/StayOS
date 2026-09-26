"""Admin console aggregation services.

Read-only operational views over the live marketplace tables. Every
figure is computed from existing data — no invented KPI definitions.
Financial visibility uses the payment/finance models as-is; commission,
payout and refund policy remain founder decisions (FD-01/FD-12).
"""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.constants import KycStatus, StaffPermission, UserRole
from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.disputes.constants import DisputeStatus
from app.disputes.models import Dispute
from app.finance import services as finance_services
from app.finance.constants import (
    EscrowStatus,
    LedgerAccount,
    LedgerEntryType,
    PayoutStatus,
)
from app.finance.models import (
    EscrowAccount,
    FinancialTransaction,
    LedgerEntry,
    PayoutRequest,
)
from app.kyc.models import KycDocument
from app.listings import configuration as listing_configuration
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.operations.constants import MaintenanceRequestStatus, TaskStatus
from app.operations.models import MaintenanceRequest, OperationTask
from app.payments.constants import PaymentStatus
from app.payments.models import Payment
from app.reservations.models import Reservation
from app.shared.exceptions import NotFoundError

from .schemas import (
    AdminListingListItem,
    AdminOverviewResponse,
    AdminUserListItem,
    BookingFinancialContextResponse,
    DisputeContextResponse,
)


async def _count(session: AsyncSession, stmt: Any) -> int:
    return int(await session.scalar(stmt) or 0)


async def _sum(session: AsyncSession, stmt: Any):
    """Money aggregation — Decimal, never truncated to int."""
    from app.finance.commercial import money

    return money(await session.scalar(stmt) or 0)


async def list_admin_users(
    session: AsyncSession,
    role: str | None = None,
    kyc_status: str | None = None,
) -> list[AdminUserListItem]:
    stmt = select(User).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if kyc_status:
        stmt = stmt.where(User.kyc_status == kyc_status)
    users = list((await session.execute(stmt)).scalars().all())
    return [AdminUserListItem.model_validate(user, from_attributes=True) for user in users]


async def list_admin_listings(
    session: AsyncSession,
    status: str | None = None,
    governorate: str | None = None,
) -> list[AdminListingListItem]:
    stmt = (
        select(Unit)
        .options(selectinload(Unit.listing))
        .order_by(Unit.created_at.desc())
    )
    if status:
        stmt = stmt.where(Unit.status == status.upper())
    if governorate:
        stmt = stmt.where(func.lower(Unit.governorate) == governorate.lower())
    units = list((await session.execute(stmt)).scalars().all())
    return [
        AdminListingListItem(
            id=unit.id,
            title=(unit.listing.title_en or unit.listing.title_ar or "") if unit.listing else "",
            host_id=unit.host_id,
            status=str(unit.status),
            governorate=unit.governorate,
            city=unit.city,
            has_pending_changes=bool(unit.listing and unit.listing.pending_changes),
            created_at=unit.created_at,
        )
        for unit in units
    ]


async def get_admin_overview(session: AsyncSession) -> AdminOverviewResponse:
    today = date.today()
    week_ahead = today + timedelta(days=7)

    users_total = await _count(session, select(func.count(User.id)))
    users_guests = await _count(
        session,
        select(func.count(User.id)).where(User.role == UserRole.GUEST),
    )
    users_hosts = await _count(
        session,
        select(func.count(User.id)).where(User.role == UserRole.HOST),
    )
    hosts_kyc_verified = await _count(
        session,
        select(func.count(User.id)).where(
            User.role == UserRole.HOST,
            User.kyc_status == KycStatus.VERIFIED,
        ),
    )

    listings_total = await _count(session, select(func.count(Unit.id)))
    listings_listed = await _count(
        session,
        select(func.count(Unit.id)).where(Unit.status == UnitStatus.LISTED),
    )
    listings_pending = await _count(
        session,
        select(func.count(Unit.id)).where(
            Unit.status == UnitStatus.PENDING_VERIFICATION
        ),
    )
    listings_rejected = await _count(
        session,
        select(func.count(Unit.id)).where(Unit.status == UnitStatus.REJECTED),
    )
    listings_pending_changes = await _count(
        session,
        select(func.count(UnitListing.unit_id)).where(
            UnitListing.pending_changes.isnot(None)
        ),
    )
    gov_rows = await session.execute(
        select(Unit.governorate, func.count(Unit.id))
        .where(Unit.status == UnitStatus.LISTED)
        .group_by(Unit.governorate)
        .order_by(func.count(Unit.id).desc())
    )
    listings_by_governorate = {str(g): int(c) for g, c in gov_rows.all()}

    bookings_total = await _count(session, select(func.count(Booking.id)))

    async def _bookings_by(status: BookingStatus) -> int:
        return await _count(
            session,
            select(func.count(Booking.id)).where(Booking.status == status),
        )

    upcoming_checkins = await _count(
        session,
        select(func.count(Booking.id)).where(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.check_in >= today,
            Booking.check_in <= week_ahead,
        ),
    )

    payments_pending = await _count(
        session,
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PENDING
        ),
    )
    payments_proof = await _count(
        session,
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PROOF_UPLOADED
        ),
    )
    payments_verified = await _count(
        session,
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.VERIFIED
        ),
    )
    payments_verified_amount = await _sum(
        session,
        select(func.coalesce(func.sum(Payment.amount_egp), 0)).where(
            Payment.status == PaymentStatus.VERIFIED
        ),
    )
    payments_refunded_amount = await _sum(
        session,
        select(func.coalesce(func.sum(Payment.refund_amount_egp), 0)).where(
            Payment.refund_amount_egp.isnot(None)
        ),
    )
    payments_refund_pending_amount = await _sum(
        session,
        select(func.coalesce(func.sum(Payment.refund_amount_egp), 0)).where(
            Payment.status == PaymentStatus.REFUND_PENDING
        ),
    )
    escrows_held_amount = await _sum(
        session,
        select(func.coalesce(func.sum(EscrowAccount.amount_egp), 0)).where(
            EscrowAccount.status.in_(
                [EscrowStatus.CREATED, EscrowStatus.HELD, EscrowStatus.DISPUTED]
            )
        ),
    )
    # Ledger-derived balances — the canonical source for money owed.
    # HOST_PAYABLE net = credits (owed on escrow release) minus debits
    # (payouts disbursed); PLATFORM_REVENUE net = recognised StayOS share.
    ledger_net = func.coalesce(
        func.sum(
            case(
                (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount_egp),
                else_=-LedgerEntry.amount_egp,
            )
        ),
        0,
    )
    host_payable_amount = await _sum(
        session,
        select(ledger_net).where(
            LedgerEntry.ledger_account == LedgerAccount.HOST_PAYABLE
        ),
    )
    platform_revenue_amount = await _sum(
        session,
        select(ledger_net).where(
            LedgerEntry.ledger_account == LedgerAccount.PLATFORM_REVENUE
        ),
    )
    vat_amount = await _sum(
        session,
        select(ledger_net).where(
            LedgerEntry.ledger_account == LedgerAccount.VAT_PAYABLE
        ),
    )
    # VAT is a liability from the moment it is collected, but the ledger
    # only credits VAT_PAYABLE on escrow release/refund. VAT still held
    # inside an unreleased escrow therefore never reaches the ledger —
    # add it per escrow, resolved exactly like _resolve_escrow_split:
    # booking-path rows carry payment.vat_egp; reservation-path rows
    # derive it as total − host − platform_fee (0 for pre-VAT rows).
    vat_held_amount = await _sum(
        session,
        select(
            func.coalesce(
                func.sum(
                    case(
                        (Payment.vat_egp.isnot(None), Payment.vat_egp),
                        else_=func.greatest(
                            EscrowAccount.amount_egp
                            - Reservation.host_amount_egp
                            - Reservation.platform_fee_egp,
                            0,
                        ),
                    )
                ),
                0,
            )
        )
        .select_from(EscrowAccount)
        .outerjoin(Payment, Payment.booking_id == EscrowAccount.reservation_id)
        .outerjoin(
            Reservation, Reservation.id == EscrowAccount.reservation_id
        )
        .where(
            EscrowAccount.status.in_(
                [
                    EscrowStatus.CREATED,
                    EscrowStatus.HELD,
                    EscrowStatus.DISPUTED,
                ]
            )
        ),
    )
    vat_amount = (vat_amount or 0) + (vat_held_amount or 0)
    payouts_paid_amount = await _sum(
        session,
        select(func.coalesce(func.sum(PayoutRequest.amount_egp), 0)).where(
            PayoutRequest.status == PayoutStatus.COMPLETED
        ),
    )

    payouts_pending = await _count(
        session,
        select(func.count(PayoutRequest.id)).where(
            PayoutRequest.status == PayoutStatus.PENDING
        ),
    )
    payouts_pending_amount = await _sum(
        session,
        select(func.coalesce(func.sum(PayoutRequest.amount_egp), 0)).where(
            PayoutRequest.status == PayoutStatus.PENDING
        ),
    )
    escrows_held = await _count(
        session,
        select(func.count(EscrowAccount.id)).where(
            EscrowAccount.status.in_(
                [EscrowStatus.CREATED, EscrowStatus.HELD, EscrowStatus.DISPUTED]
            )
        ),
    )

    kyc_pending = await _count(
        session,
        select(func.count(KycDocument.id)).where(
            KycDocument.status == KycStatus.PENDING
        ),
    )
    disputes_open = await _count(
        session,
        select(func.count(Dispute.id)).where(
            Dispute.status == DisputeStatus.OPEN
        ),
    )
    disputes_in_review = await _count(
        session,
        select(func.count(Dispute.id)).where(
            Dispute.status == DisputeStatus.IN_REVIEW
        ),
    )
    maintenance_open = await _count(
        session,
        select(func.count(MaintenanceRequest.id)).where(
            MaintenanceRequest.status == MaintenanceRequestStatus.OPEN
        ),
    )
    tasks_pending = await _count(
        session,
        select(func.count(OperationTask.id)).where(
            OperationTask.status == TaskStatus.PENDING
        ),
    )
    tasks_overdue = await _count(
        session,
        select(func.count(OperationTask.id)).where(
            OperationTask.status.in_(
                [TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
            ),
            OperationTask.due_by < datetime.now(UTC),
        ),
    )

    return AdminOverviewResponse(
        users_total=users_total,
        users_guests=users_guests,
        users_hosts=users_hosts,
        hosts_kyc_verified=hosts_kyc_verified,
        listings_total=listings_total,
        listings_listed=listings_listed,
        listings_pending_verification=listings_pending,
        listings_pending_changes=listings_pending_changes,
        listings_rejected=listings_rejected,
        listings_by_governorate=listings_by_governorate,
        bookings_total=bookings_total,
        bookings_requested=await _bookings_by(BookingStatus.REQUESTED),
        bookings_accepted=await _bookings_by(BookingStatus.ACCEPTED),
        bookings_confirmed=await _bookings_by(BookingStatus.CONFIRMED),
        bookings_completed=await _bookings_by(BookingStatus.COMPLETED),
        bookings_cancelled=await _bookings_by(BookingStatus.CANCELLED),
        bookings_rejected=await _bookings_by(BookingStatus.REJECTED),
        upcoming_checkins_7d=upcoming_checkins,
        payments_pending=payments_pending,
        payments_proof_uploaded=payments_proof,
        payments_verified=payments_verified,
        payments_verified_amount_egp=payments_verified_amount,
        payments_refund_pending_amount_egp=payments_refund_pending_amount,
        payments_refunded_amount_egp=payments_refunded_amount,
        payouts_pending=payouts_pending,
        payouts_pending_amount_egp=payouts_pending_amount,
        payouts_paid_amount_egp=payouts_paid_amount,
        escrows_held=escrows_held,
        escrows_held_amount_egp=escrows_held_amount,
        host_payable_egp=host_payable_amount,
        platform_revenue_egp=platform_revenue_amount,
        vat_egp=vat_amount,
        kyc_pending_documents=kyc_pending,
        disputes_open=disputes_open,
        disputes_in_review=disputes_in_review,
        maintenance_open=maintenance_open,
        tasks_pending=tasks_pending,
        tasks_overdue=tasks_overdue,
    )


async def _booking_financials(
    session: AsyncSession, payment: Payment | None
) -> dict[str, Any] | None:
    """Canonical booking economics for the admin investigation view.

    Computed by the finance module's commercial engine — identical math to
    the escrow-release path."""
    if payment is None:
        return None
    economics = await finance_services.booking_economics(session, payment)
    return {
        "guest_paid_egp": payment.amount_egp,
        "accommodation_egp": economics.accommodation_egp,
        "cleaning_fee_egp": economics.cleaning_fee_egp,
        # VAT is a separate tax on the taxable booking amount — not part
        # of the platform share, not revenue, not host earnings.
        "taxable_amount_egp": economics.taxable_amount_egp,
        "vat_egp": economics.vat_egp,
        "platform_share_egp": economics.platform_share_egp,
        "host_side_share_egp": economics.host_side_share_egp,
        "guest_side_share_egp": economics.guest_side_share_egp,
        "host_net_egp": economics.host_net_egp,
        "provider": payment.provider,
        "provider_ref": payment.provider_ref,
        "transaction_ref": payment.transaction_ref,
    }


async def get_booking_financial_context(
    session: AsyncSession, booking_id: str
) -> BookingFinancialContextResponse:
    result = await session.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise NotFoundError("Booking not found")

    unit = await session.scalar(
        select(Unit)
        .options(selectinload(Unit.photos))
        .where(Unit.id == booking.unit_id)
    )
    listing = None
    if unit is not None:
        listing = await session.scalar(
            select(UnitListing).where(UnitListing.unit_id == unit.id)
        )
    host_id = unit.host_id if unit else None

    guest = await session.scalar(
        select(User).where(User.id == booking.guest_id)
    )
    host = (
        await session.scalar(select(User).where(User.id == host_id))
        if host_id
        else None
    )

    payment = await session.scalar(
        select(Payment).where(Payment.booking_id == booking.id)
    )

    escrow = await session.scalar(
        select(EscrowAccount).where(
            EscrowAccount.reservation_id == booking.id
        )
    )
    txn_rows = await session.execute(
        select(FinancialTransaction)
        .where(FinancialTransaction.reservation_id == booking.id)
        .order_by(FinancialTransaction.created_at)
    )
    transactions = list(txn_rows.scalars().all())

    txn_ids = [t.id for t in transactions]
    ledger: list[LedgerEntry] = []
    if txn_ids:
        ledger_rows = await session.execute(
            select(LedgerEntry)
            .where(LedgerEntry.transaction_id.in_(txn_ids))
            .order_by(LedgerEntry.created_at)
        )
        ledger = list(ledger_rows.scalars().all())

    dispute_rows = await session.execute(
        select(Dispute)
        .where(Dispute.booking_id == booking.id)
        .order_by(Dispute.created_at.desc())
    )
    disputes = [
        {
            "id": d.id,
            "category": d.category,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in dispute_rows.scalars().all()
    ]

    ledger_by_txn: dict[str, list[dict[str, Any]]] = {}
    for entry in ledger:
        ledger_by_txn.setdefault(entry.transaction_id, []).append(
            {
                "ledger_account": entry.ledger_account,
                "entry_type": entry.entry_type,
                "amount_egp": entry.amount_egp,
                "balance_after": entry.balance_after,
                "created_at": entry.created_at.isoformat()
                if entry.created_at
                else None,
            }
        )

    return BookingFinancialContextResponse(
        booking_id=booking.id,
        booking_status=booking.status,
        check_in=booking.check_in,
        check_out=booking.check_out,
        adults=booking.adults,
        children=booking.children,
        infants=booking.infants,
        requested_at=booking.requested_at,
        accepted_at=booking.accepted_at,
        cancelled_at=booking.cancelled_at,
        cancel_reason=booking.cancel_reason,
        guest_id=booking.guest_id,
        guest_name=guest.display_name if guest else None,
        guest_phone=guest.phone_number if guest else None,
        host_id=host_id or "",
        host_name=host.display_name if host else None,
        host_phone=host.phone_number if host else None,
        unit_id=booking.unit_id,
        unit_title=(
            (listing.title_ar or listing.title_en) if listing else None
        ),
        unit_city=unit.city if unit else None,
        unit_governorate=unit.governorate if unit else None,
        unit_cover_image=(
            listing_configuration.resolve_cover_image_url(unit, listing)
            if unit is not None and listing is not None
            else None
        ),
        payment_id=payment.id if payment else None,
        payment_status=payment.status if payment else None,
        payment_method=payment.method if payment else None,
        payment_amount_egp=payment.amount_egp if payment else None,
        # Column stores the taxable subtotal (accommodation + cleaning);
        # expose pure accommodation so the labeled line matches the
        # guest-facing PaymentResponse semantics.
        accommodation_amount_egp=(
            payment.accommodation_amount_egp - (payment.cleaning_fee_egp or 0)
            if payment and payment.accommodation_amount_egp is not None
            else None
        ),
        guest_service_fee_egp=payment.guest_service_fee_egp if payment else None,
        cleaning_fee_egp=payment.cleaning_fee_egp if payment else None,
        reference_number=payment.reference_number if payment else None,
        payment_deadline_at=payment.payment_deadline_at if payment else None,
        proof_uploaded_at=payment.proof_uploaded_at if payment else None,
        verified_at=payment.verified_at if payment else None,
        refund_amount_egp=payment.refund_amount_egp if payment else None,
        refunded_at=payment.refunded_at if payment else None,
        reject_reason=payment.reject_reason if payment else None,
        escrow=(
            {
                "id": escrow.id,
                "status": escrow.status,
                "amount_egp": escrow.amount_egp,
                "hold_until": escrow.hold_until.isoformat()
                if escrow.hold_until
                else None,
                "released_at": escrow.released_at.isoformat()
                if escrow.released_at
                else None,
                "refunded_at": escrow.refunded_at.isoformat()
                if escrow.refunded_at
                else None,
            }
            if escrow
            else None
        ),
        financials=await _booking_financials(session, payment),
        payout=(
            finance_services.derive_payout_state(escrow) if escrow else None
        ),
        transactions=[
            {
                "id": t.id,
                "type": t.transaction_type,
                "amount_egp": t.amount_egp,
                "status": t.status,
                "provider": t.provider,
                "provider_ref": t.provider_ref,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "ledger_entries": ledger_by_txn.get(t.id, []),
            }
            for t in transactions
        ],
        disputes=disputes,
    )


async def get_dispute_context(
    session: AsyncSession, dispute_id: str
) -> DisputeContextResponse:
    """Full investigation context for a dispute: the dispute row, the
    reporter's identity, and the booking's financial context."""
    result = await session.execute(
        select(Dispute).where(Dispute.id == dispute_id)
    )
    dispute = result.scalar_one_or_none()
    if dispute is None:
        raise NotFoundError("Dispute not found")

    reporter = await session.scalar(
        select(User).where(User.id == dispute.reporter_id)
    )

    booking_context = None
    if dispute.booking_id:
        try:
            booking_context = await get_booking_financial_context(
                session, dispute.booking_id
            )
        except NotFoundError:
            booking_context = None

    return DisputeContextResponse(
        dispute={
            "id": dispute.id,
            "booking_id": dispute.booking_id,
            "category": dispute.category,
            "description": dispute.description,
            "status": dispute.status,
            "admin_notes": dispute.admin_notes,
            "resolved_by": dispute.resolved_by,
            "resolved_at": dispute.resolved_at.isoformat()
            if dispute.resolved_at
            else None,
            "created_at": dispute.created_at.isoformat()
            if dispute.created_at
            else None,
            "updated_at": dispute.updated_at.isoformat()
            if dispute.updated_at
            else None,
        },
        reporter=(
            {
                "id": reporter.id,
                "display_name": reporter.display_name,
                "phone_number": reporter.phone_number,
                "role": reporter.role,
            }
            if reporter
            else None
        ),
        booking=booking_context,
    )
