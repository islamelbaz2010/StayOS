"""Admin report query builders — canonical data only.

Rules enforced here:

- Financial values come from the persisted payment row interpreted by the
  canonical ``finance.services.booking_economics`` engine (generation-aware:
  Model B, DEC-023 additive and pre-VAT containment rows all resolve from
  their own stored facts). Nothing is recomputed from payout state.
- Escrow/payout columns come from ``derive_payout_state`` — settlement
  lifecycle is reported, never used to derive revenue, VAT or host net.
- Bounded scans: every row-builder fetches at most ``MAX_SCAN`` records
  after SQL filters, applies computed-column filters (stay_phase, amount
  ranges) in memory, then paginates. Reported ``total`` is the filtered
  total, not the page size.
"""

from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.services import _compute_stay_phase
from app.disputes.models import Dispute
from app.finance import commercial
from app.finance import services as finance_services
from app.finance.constants import (
    EscrowStatus,
    LedgerAccount,
    LedgerEntryType,
    PayoutStatus,
    TransactionType,
)
from app.finance.models import (
    CommercialAdjustment,
    EscrowAccount,
    FinancialTransaction,
    LedgerEntry,
    PayoutRequest,
)
from app.kyc.models import KycDocument
from app.listings.models import Unit, UnitListing
from app.payments.constants import PaymentStatus
from app.payments.models import Payment
from app.reports.registry import BY_KEY, ReportDef
from app.reports.schemas import ReportResult
from app.reservations.models import Reservation
from app.reviews.models import Review, ReviewReport

MAX_SCAN = 5_000
EXPORT_MAX = 10_000


@dataclass
class ReportParams:
    date_from: date | None = None
    date_to: date | None = None
    status: str | None = None
    payment_status: str | None = None
    payout_status: str | None = None
    kyc_status: str | None = None
    role: str | None = None
    governorate: str | None = None
    city: str | None = None
    property_type: str | None = None
    host_id: str | None = None
    guest_id: str | None = None
    unit_id: str | None = None
    payment_method: str | None = None
    cancel_reason: str | None = None
    entry_type: str | None = None
    stay_phase: str | None = None
    stay_in_range: str | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
    page: int = 1
    page_size: int = 50
    sort: str | None = None
    order: str = "desc"
    # for export — one page covering the whole (bounded) result set
    export: bool = False

    def applied(self) -> dict[str, str]:
        return {
            k: str(v)
            for k, v in vars(self).items()
            if v is not None and k not in {"page", "page_size", "sort", "order", "export"}
        }


def _num(v) -> float | None:
    return float(v) if v is not None else None


def _iso(v) -> str | None:
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return str(v)


def _window(column, params: ReportParams):
    conds = []
    if params.date_from:
        conds.append(column >= datetime.combine(params.date_from, datetime.min.time(), tzinfo=UTC))
    if params.date_to:
        conds.append(column <= datetime.combine(params.date_to, datetime.max.time(), tzinfo=UTC))
    return conds


async def _finalize(
    report: ReportDef,
    params: ReportParams,
    rows: list[dict],
    *,
    total_rows: int | None = None,
) -> ReportResult:
    """Sort computed keys, sum totals over the filtered set, paginate."""
    sort_key = params.sort
    if sort_key and sort_key in report.sortable and rows and sort_key in rows[0]:
        rows.sort(
            key=lambda r: (r.get(sort_key) is None, r.get(sort_key)),
            reverse=params.order == "desc",
        )
    totals: dict[str, float] = {}
    for col in report.money_columns:
        totals[col] = float(sum(Decimal(str(r.get(col) or 0)) for r in rows))
    total = total_rows if total_rows is not None else len(rows)
    if params.export:
        page, page_size = 1, EXPORT_MAX
    else:
        page, page_size = params.page, params.page_size
    start = (page - 1) * page_size
    return ReportResult(
        key=report.key,
        category=report.category,
        date_basis=report.date_basis,
        columns=list(report.columns),
        rows=rows[start : start + page_size],
        total=total,
        page=page,
        page_size=page_size,
        totals=totals,
        generated_at=datetime.now(UTC),
        filters_applied=params.applied(),
        total_labels=dict(report.total_labels),
        note=report.note,
    )


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------

_Guest = User
_Host = User


def _booking_base():
    guest_u = _Guest.__table__.alias("guest_u")
    host_u = _Host.__table__.alias("host_u")
    return (
        select(
            Booking,
            Unit.governorate,
            Unit.city,
            Unit.host_id,
            UnitListing.title_en,
            UnitListing.title_ar,
            guest_u.c.display_name.label("guest_name"),
            host_u.c.display_name.label("host_name"),
        )
        .join(Unit, Unit.id == Booking.unit_id)
        .outerjoin(UnitListing, UnitListing.unit_id == Unit.id)
        .outerjoin(guest_u, guest_u.c.id == Booking.guest_id)
        .outerjoin(host_u, host_u.c.id == Unit.host_id)
    )


def _apply_booking_filters(q, params: ReportParams, fixed: dict):
    date_field = fixed.get("date_field")
    if date_field == "check_in":
        if params.date_from:
            q = q.where(Booking.check_in >= params.date_from)
        if params.date_to:
            q = q.where(Booking.check_in <= params.date_to)
    elif date_field == "check_out":
        if params.date_from:
            q = q.where(Booking.check_out >= params.date_from)
        if params.date_to:
            q = q.where(Booking.check_out <= params.date_to)
    elif params.stay_in_range == "true":
        # Stay-overlap semantics replace the created_at window entirely —
        # the range describes the stay, not when it was booked.
        if params.date_from:
            q = q.where(Booking.check_out >= params.date_from)
        if params.date_to:
            q = q.where(Booking.check_in <= params.date_to)
    else:
        q = q.where(*_window(Booking.created_at, params))
    status = fixed.get("status") or params.status
    if status:
        q = q.where(Booking.status == status)
    if params.host_id:
        q = q.where(Unit.host_id == params.host_id)
    if params.guest_id:
        q = q.where(Booking.guest_id == params.guest_id)
    if params.unit_id:
        q = q.where(Booking.unit_id == params.unit_id)
    if params.governorate:
        q = q.where(Unit.governorate == params.governorate)
    if params.city:
        q = q.where(Unit.city == params.city)
    if params.cancel_reason:
        q = q.where(Booking.cancel_reason.ilike(f"%{params.cancel_reason}%"))
    return q


_BOOKING_SORT = {
    "created_at": Booking.created_at,
    "check_in": Booking.check_in,
    "check_out": Booking.check_out,
    "cancelled_at": Booking.cancelled_at,
}


async def bookings_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = _apply_booking_filters(_booking_base(), params, report.fixed)
    sort_col = _BOOKING_SORT.get(params.sort or "")
    q = q.order_by(
        (sort_col.desc() if params.order == "desc" else sort_col.asc())
        if sort_col is not None
        else Booking.created_at.desc()
    ).limit(MAX_SCAN)
    rows: list[dict] = []
    for r in (await session.execute(q)).all():
        b: Booking = r[0]
        stay_phase = _compute_stay_phase(b)
        if params.stay_phase and stay_phase != params.stay_phase:
            continue
        row = {
            "booking_id": b.id,
            "created_at": _iso(b.created_at),
            "check_in": _iso(b.check_in),
            "check_out": _iso(b.check_out),
            "status": b.status,
            "stay_phase": stay_phase,
            "guest_name": r.guest_name,
            "host_name": r.host_name,
            "listing_title": r.title_en or r.title_ar,
            "governorate": r.governorate,
            "city": r.city,
            "nights": (b.check_out - b.check_in).days,
            "guests": b.adults + b.children,
            "cancel_reason": b.cancel_reason,
            "cancelled_at": _iso(b.cancelled_at),
            "checked_in_at": _iso(b.checked_in_at),
            "checked_out_at": _iso(b.checked_out_at),
        }
        rows.append(row)
    return await _finalize(report, params, rows)


async def grouped_booking_status(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(Booking.status, func.count())
        .where(*_window(Booking.created_at, params))
        .group_by(Booking.status)
    )
    rows = [
        {"status": status, "count": count}
        for status, count in (await session.execute(q)).all()
    ]
    rows.sort(key=lambda r: r["status"])
    return await _finalize(report, params, rows)


async def exceptions_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Operational exceptions: no-shows and bookings whose escrow is in
    dispute — the records an ops team actually has to chase."""
    q = _apply_booking_filters(_booking_base(), params, report.fixed)
    disputed = select(EscrowAccount.reservation_id).where(
        EscrowAccount.status == EscrowStatus.DISPUTED
    )
    q = q.where(
        or_(
            Booking.status == BookingStatus.NO_SHOW.value,
            Booking.id.in_(disputed),
        )
    ).order_by(Booking.created_at.desc()).limit(MAX_SCAN)
    rows = []
    for r in (await session.execute(q)).all():
        b: Booking = r[0]
        is_no_show = b.status == BookingStatus.NO_SHOW.value
        rows.append(
            {
                "booking_id": b.id,
                "created_at": _iso(b.created_at),
                "check_in": _iso(b.check_in),
                "check_out": _iso(b.check_out),
                "status": b.status,
                "stay_phase": _compute_stay_phase(b),
                "guest_name": r.guest_name,
                "host_name": r.host_name,
                "listing_title": r.title_en or r.title_ar,
                "exception": "no_show" if is_no_show else "escrow_disputed",
            }
        )
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Booking financials — canonical economics per booking
# ---------------------------------------------------------------------------

async def booking_financials(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    adj_sub = (
        select(
            CommercialAdjustment.booking_id,
            func.sum(
                case(
                    (
                        CommercialAdjustment.adjustment_type.in_(
                            ("host_credit", "guest_credit")
                        ),
                        CommercialAdjustment.amount_egp,
                    ),
                    else_=-CommercialAdjustment.amount_egp,
                )
            ).label("adj"),
        )
        .where(CommercialAdjustment.status == "applied")
        .group_by(CommercialAdjustment.booking_id)
        .subquery()
    )
    q = (
        _apply_booking_filters(_booking_base(), params, report.fixed)
        .outerjoin(Payment, Payment.booking_id == Booking.id)
        .outerjoin(
            EscrowAccount, EscrowAccount.reservation_id == Booking.id
        )
        .outerjoin(adj_sub, adj_sub.c.booking_id == Booking.id)
        .add_columns(Payment, EscrowAccount, adj_sub.c.adj)
    )
    if params.payment_status:
        q = q.where(Payment.status == params.payment_status)
    q = q.order_by(
        Booking.created_at.desc(), Payment.created_at.desc().nullslast()
    ).limit(MAX_SCAN)
    rows: list[dict] = []
    seen: set[str] = set()
    for r in (await session.execute(q)).all():
        b: Booking = r[0]
        if b.id in seen:
            continue  # one row per booking — latest payment wins
        seen.add(b.id)
        payment: Payment | None = r.Payment
        escrow: EscrowAccount | None = r.EscrowAccount
        eco = (
            await finance_services.booking_economics(session, payment)
            if payment is not None
            else None
        )
        payout_state = (
            finance_services.derive_payout_state(escrow) if escrow else None
        )
        if params.payout_status and (
            not payout_state or payout_state["payout_status"] != params.payout_status
        ):
            continue
        revenue = _num(eco.platform_share_egp) if eco else None
        if params.min_amount is not None and (revenue or 0) < float(params.min_amount):
            continue
        if params.max_amount is not None and (revenue or 0) > float(params.max_amount):
            continue
        rows.append(
            {
                "booking_id": b.id,
                "created_at": _iso(b.created_at),
                "check_in": _iso(b.check_in),
                "check_out": _iso(b.check_out),
                "status": b.status,
                "stay_phase": _compute_stay_phase(b),
                "guest_name": r.guest_name,
                "host_name": r.host_name,
                "listing_title": r.title_en or r.title_ar,
                "governorate": r.governorate,
                "city": r.city,
                "nights": (b.check_out - b.check_in).days,
                "guests": b.adults + b.children,
                "accommodation_egp": _num(eco.accommodation_egp) if eco else None,
                "cleaning_fee_egp": _num(eco.cleaning_fee_egp) if eco else None,
                "host_commission_egp": _num(eco.host_side_share_egp) if eco else None,
                "guest_commission_egp": _num(eco.guest_side_share_egp) if eco else None,
                "taxable_amount_egp": _num(eco.taxable_amount_egp) if eco else None,
                "vat_egp": _num(eco.vat_egp) if eco else None,
                "guest_total_egp": _num(eco.guest_total_egp) if eco else None,
                "host_net_egp": _num(eco.host_net_egp) if eco else None,
                "stayos_revenue_egp": revenue,
                "payment_status": payment.status if payment else None,
                "payment_collected_egp": _num(payment.amount_egp) if payment else None,
                "refund_amount_egp": _num(payment.refund_amount_egp) if payment else None,
                "funds_status": payout_state["funds_status"] if payout_state else None,
                "payout_status": payout_state["payout_status"] if payout_state else None,
                "expected_payout_at": payout_state["expected_payout_at"] if payout_state else None,
                "adjustment_amount_egp": _num(r.adj),
            }
        )
    return await _finalize(report, params, rows)


async def ledger_account_report(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Signed ledger rows for one account — credit = +amount, debit =
    −amount. ``credit_egp``/``debit_egp`` are hidden helper keys so the
    totals row carries gross credits, gross debits and the signed net,
    reconciling exactly with the Admin Earnings ledger sums."""
    account = LedgerAccount(report.fixed["ledger_account"])
    q = (
        select(
            LedgerEntry.created_at,
            LedgerEntry.entry_type,
            LedgerEntry.amount_egp,
            FinancialTransaction.reservation_id,
            FinancialTransaction.transaction_type,
        )
        .join(
            FinancialTransaction,
            FinancialTransaction.id == LedgerEntry.transaction_id,
        )
        .where(
            LedgerEntry.ledger_account == account,
            *_window(LedgerEntry.created_at, params),
        )
    )
    if params.entry_type:
        q = q.where(LedgerEntry.entry_type == params.entry_type)
    sort_col = {"created_at": LedgerEntry.created_at, "amount_egp": LedgerEntry.amount_egp}.get(
        params.sort or "", LedgerEntry.created_at
    )
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = []
    for r in (await session.execute(q)).all():
        amount = Decimal(str(r.amount_egp))
        is_credit = r.entry_type == LedgerEntryType.CREDIT
        rows.append(
            {
                "created_at": _iso(r.created_at),
                "booking_id": r.reservation_id,
                "entry_type": r.entry_type,
                "amount_egp": float(amount if is_credit else -amount),
                "credit_egp": float(amount) if is_credit else 0.0,
                "debit_egp": 0.0 if is_credit else float(amount),
                "transaction_type": r.transaction_type,
            }
        )
    return await _finalize(report, params, rows)


_HELD_ESCROW_STATUSES = (
    EscrowStatus.CREATED,
    EscrowStatus.HELD,
    EscrowStatus.DISPUTED,
)


def _refund_vat_reversal(
    payment: Payment, escrow: EscrowAccount | None, eco
) -> Decimal:
    """Canonical VAT reversal for a refunded booking — the refunded share
    of VAT returns to the guest; only the retained share stays payable.
    Shared by the VAT Payable report and the management report."""
    refunded = (
        escrow is not None and escrow.status == EscrowStatus.REFUNDED
    ) or payment.status == "refunded"
    if not refunded:
        return Decimal("0")
    refund_amount = Decimal(str(payment.refund_amount_egp or 0))
    base = Decimal(
        str(escrow.amount_egp if escrow is not None else eco.guest_total_egp)
    )
    if base > 0 and refund_amount >= base:
        return eco.vat_egp
    if base > 0 and refund_amount > 0:
        return commercial.money(eco.vat_egp * refund_amount / base)
    return eco.vat_egp


async def _vat_held_by_month(
    session: AsyncSession, params: ReportParams
) -> dict[str, Decimal]:
    """Recognised VAT whose cash still sits inside open escrows, bucketed
    by escrow creation month. Informational funds-position figure — this
    VAT posts to VAT_PAYABLE at capture and is never added on top."""
    month = func.date_trunc("month", EscrowAccount.created_at)
    vat_expr = case(
        (Payment.vat_egp.isnot(None), Payment.vat_egp),
        else_=func.greatest(
            EscrowAccount.amount_egp
            - Reservation.host_amount_egp
            - Reservation.platform_fee_egp,
            0,
        ),
    )
    q = (
        select(month.label("m"), func.coalesce(func.sum(vat_expr), 0))
        .select_from(EscrowAccount)
        .outerjoin(Payment, Payment.booking_id == EscrowAccount.reservation_id)
        .outerjoin(Reservation, Reservation.id == EscrowAccount.reservation_id)
        .where(
            EscrowAccount.status.in_(_HELD_ESCROW_STATUSES),
            *_window(EscrowAccount.created_at, params),
        )
        .group_by(month)
    )
    out: dict[str, Decimal] = {}
    for m, v in (await session.execute(q)).all():
        out[m.strftime("%Y-%m")] = Decimal(str(v))
    return out


async def recognition_by_month(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Revenue Summary — true financial-recognition report.

    Date basis: ledger/transaction recognition date. Per month:
    recognised StayOS revenue, VAT payable (recognised at payment
    capture, net of reversals — matching Admin Earnings), host payable,
    collected captures, refunds, net financial activity and the count of
    bookings whose payment was recognised that month. ``vat_held_egp``
    remains for backwards-compatible consumers and reports VAT whose
    cash still sits inside an open escrow — it is already recognised,
    never added on top.
    """
    month = func.date_trunc("month", LedgerEntry.created_at).label("m")
    signed = case(
        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount_egp),
        else_=-LedgerEntry.amount_egp,
    )
    ledger_q = (
        select(
            month,
            LedgerEntry.ledger_account,
            func.coalesce(func.sum(signed), 0),
        )
        .where(
            LedgerEntry.ledger_account.in_(
                (
                    LedgerAccount.PLATFORM_REVENUE,
                    LedgerAccount.VAT_PAYABLE,
                    LedgerAccount.HOST_PAYABLE,
                )
            ),
            *_window(LedgerEntry.created_at, params),
        )
        .group_by(month, LedgerEntry.ledger_account)
    )
    txn_month = func.date_trunc("month", FinancialTransaction.created_at)
    txn_q = (
        select(
            txn_month.label("m"),
            FinancialTransaction.transaction_type,
            func.coalesce(func.sum(FinancialTransaction.amount_egp), 0),
            func.count(func.distinct(FinancialTransaction.reservation_id)),
        )
        .where(
            FinancialTransaction.transaction_type.in_(
                (
                    TransactionType.PAYMENT_CAPTURE,
                    TransactionType.REFUND,
                    TransactionType.ESCROW_REFUND,
                )
            ),
            *_window(FinancialTransaction.created_at, params),
        )
        .group_by(txn_month, FinancialTransaction.transaction_type)
    )
    months: dict[str, dict[str, Any]] = {}

    def bucket(m: str) -> dict[str, Any]:
        return months.setdefault(
            m,
            {
                "month": m,
                "stayos_revenue_egp": Decimal("0"),
                "vat_recognised_egp": Decimal("0"),
                "vat_held_egp": Decimal("0"),
                "vat_payable_egp": Decimal("0"),
                "host_payable_egp": Decimal("0"),
                "collected_egp": Decimal("0"),
                "refunded_egp": Decimal("0"),
                "net_activity_egp": Decimal("0"),
                "bookings_count": 0,
            },
        )

    for m, account, net in (await session.execute(ledger_q)).all():
        b = bucket(m.strftime("%Y-%m"))
        key = {
            LedgerAccount.PLATFORM_REVENUE: "stayos_revenue_egp",
            LedgerAccount.VAT_PAYABLE: "vat_recognised_egp",
            LedgerAccount.HOST_PAYABLE: "host_payable_egp",
        }[LedgerAccount(account)]
        b[key] += Decimal(str(net))
    for m, ttype, amount, bookings in (await session.execute(txn_q)).all():
        b = bucket(m.strftime("%Y-%m"))
        if ttype == TransactionType.PAYMENT_CAPTURE:
            b["collected_egp"] += Decimal(str(amount))
            b["bookings_count"] += int(bookings or 0)
        else:
            b["refunded_egp"] += Decimal(str(amount))
    for m, held in (await _vat_held_by_month(session, params)).items():
        bucket(m)["vat_held_egp"] += held
    rows = []
    for _, b in sorted(months.items(), reverse=True):
        b["vat_payable_egp"] = b["vat_recognised_egp"]
        b["net_activity_egp"] = b["collected_egp"] - b["refunded_egp"]
        rows.append({k: (_num(v) if isinstance(v, Decimal) else v) for k, v in b.items()})
    return await _finalize(report, params, rows)


async def economics_by_month(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Booking Economics Summary — booking-economics aggregates grouped by
    booking creation month. Calculated VAT / guest total / host net here
    are booking economics, NOT ledger-recognised amounts; unpaid and
    cancelled bookings count in ``bookings_count`` but contribute zero
    economics."""
    q = (
        _apply_booking_filters(_booking_base(), params, report.fixed)
        .outerjoin(Payment, Payment.booking_id == Booking.id)
        .add_columns(Payment)
        .order_by(Booking.created_at.desc(), Payment.created_at.desc().nullslast())
        .limit(MAX_SCAN)
    )
    months: dict[str, dict[str, Any]] = {}
    seen: set[str] = set()
    for r in (await session.execute(q)).all():
        b: Booking = r[0]
        payment: Payment | None = r.Payment
        if b.id in seen:
            continue  # one row per booking — latest payment wins
        seen.add(b.id)
        m = b.created_at.strftime("%Y-%m")
        bucket = months.setdefault(
            m,
            {
                "month": m,
                "bookings_count": 0,
                "accommodation_egp": Decimal("0"),
                "cleaning_fee_egp": Decimal("0"),
                "host_commission_egp": Decimal("0"),
                "guest_commission_egp": Decimal("0"),
                "taxable_amount_egp": Decimal("0"),
                "vat_calculated_egp": Decimal("0"),
                "guest_total_egp": Decimal("0"),
                "host_net_egp": Decimal("0"),
                "stayos_revenue_egp": Decimal("0"),
            },
        )
        bucket["bookings_count"] += 1
        if payment is None:
            continue
        eco = await finance_services.booking_economics(session, payment)
        bucket["accommodation_egp"] += eco.accommodation_egp
        bucket["cleaning_fee_egp"] += eco.cleaning_fee_egp
        bucket["host_commission_egp"] += eco.host_side_share_egp
        bucket["guest_commission_egp"] += eco.guest_side_share_egp
        bucket["taxable_amount_egp"] += eco.taxable_amount_egp
        bucket["vat_calculated_egp"] += eco.vat_egp
        bucket["guest_total_egp"] += eco.guest_total_egp
        bucket["host_net_egp"] += eco.host_net_egp
        bucket["stayos_revenue_egp"] += eco.platform_share_egp
    rows = [
        {k: (_num(v) if isinstance(v, Decimal) else v) for k, v in b.items()}
        for _, b in sorted(months.items(), reverse=True)
    ]
    return await _finalize(report, params, rows)


async def vat_by_booking(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """VAT Payable — per-booking VAT decomposition that reconciles with
    Admin Earnings: ``vat_payable = vat_calculated − vat_reversed`` where
    reversal follows the canonical refund rule (the refunded share of VAT
    returns to the guest; only the retained share stays payable)."""
    q = (
        _apply_booking_filters(_booking_base(), params, report.fixed)
        .join(Payment, Payment.booking_id == Booking.id)
        .outerjoin(EscrowAccount, EscrowAccount.reservation_id == Booking.id)
        .add_columns(Payment, EscrowAccount)
        .order_by(
            Booking.created_at.desc(), Payment.created_at.desc().nullslast()
        )
        .limit(MAX_SCAN)
    )
    if params.payment_status:
        q = q.where(Payment.status == params.payment_status)
    rows: list[dict] = []
    seen: set[str] = set()
    for r in (await session.execute(q)).all():
        b: Booking = r[0]
        if b.id in seen:
            continue
        seen.add(b.id)
        payment: Payment = r.Payment
        escrow: EscrowAccount | None = r.EscrowAccount
        eco = await finance_services.booking_economics(session, payment)
        vat = eco.vat_egp
        reversed_vat = _refund_vat_reversal(payment, escrow, eco)
        payout_state = (
            finance_services.derive_payout_state(escrow) if escrow else None
        )
        if params.payout_status and (
            not payout_state or payout_state["payout_status"] != params.payout_status
        ):
            continue
        rows.append(
            {
                "booking_id": b.id,
                "created_at": _iso(b.created_at),
                "guest_name": r.guest_name,
                "host_name": r.host_name,
                "listing_title": r.title_en or r.title_ar,
                "payment_status": payment.status,
                "funds_status": payout_state["funds_status"] if payout_state else None,
                "taxable_amount_egp": _num(eco.taxable_amount_egp),
                "vat_calculated_egp": _num(vat),
                "vat_reversed_egp": _num(reversed_vat),
                "vat_payable_egp": _num(vat - reversed_vat),
            }
        )
    return await _finalize(report, params, rows)


async def host_earnings(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(Payment, Unit.host_id, User.display_name, EscrowAccount.status)
        .join(Booking, Booking.id == Payment.booking_id)
        .join(Unit, Unit.id == Booking.unit_id)
        .join(User, User.id == Unit.host_id)
        .outerjoin(
            EscrowAccount, EscrowAccount.reservation_id == Payment.booking_id
        )
        .where(
            Payment.status.in_(("verified", "refund_pending", "refunded")),
            *_window(Payment.created_at, params),
        )
        .order_by(Payment.created_at.desc())
        .limit(MAX_SCAN)
    )
    if params.host_id:
        q = q.where(Unit.host_id == params.host_id)
    per_host: dict[str, dict[str, Any]] = {}
    for payment, host_id, host_name, escrow_status in (
        await session.execute(q)
    ).all():
        eco = await finance_services.booking_economics(session, payment)
        agg = per_host.setdefault(
            host_id,
            {"host_id": host_id, "host_name": host_name, "bookings_count": 0,
             "host_net_egp": Decimal("0"), "paid_out_egp": Decimal("0"),
             "pending_payable_egp": Decimal("0")},
        )
        agg["bookings_count"] += 1
        agg["host_net_egp"] += eco.host_net_egp
        # Settlement position comes from the escrow lifecycle, never the
        # economics.
        if escrow_status == EscrowStatus.RELEASED:
            agg["paid_out_egp"] += eco.host_net_egp
        elif escrow_status in (
            EscrowStatus.CREATED,
            EscrowStatus.HELD,
            EscrowStatus.DISPUTED,
        ):
            agg["pending_payable_egp"] += eco.host_net_egp
    rows = [
        {
            **a,
            "host_net_egp": _num(a["host_net_egp"]),
            "paid_out_egp": _num(a["paid_out_egp"]),
            "pending_payable_egp": _num(a["pending_payable_egp"]),
        }
        for a in per_host.values()
    ]
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Payments / payouts / transactions
# ---------------------------------------------------------------------------

async def payments_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    guest_u = _Guest.__table__.alias("guest_u")
    host_u = _Host.__table__.alias("host_u")
    q = (
        select(
            Payment,
            guest_u.c.display_name.label("guest_name"),
            host_u.c.display_name.label("host_name"),
            UnitListing.title_en,
            UnitListing.title_ar,
            Booking.id.label("booking_ref"),
        )
        .join(Booking, Booking.id == Payment.booking_id)
        .join(Unit, Unit.id == Booking.unit_id)
        .outerjoin(UnitListing, UnitListing.unit_id == Unit.id)
        .outerjoin(guest_u, guest_u.c.id == Payment.guest_id)
        .outerjoin(host_u, host_u.c.id == Payment.host_id)
        .where(*_window(Payment.created_at, params))
    )
    fixed = report.fixed
    statuses = fixed.get("statuses")
    if fixed.get("refunds_only"):
        q = q.where(
            or_(
                Payment.refund_amount_egp.isnot(None),
                Payment.status.in_(("refund_pending", "refunded")),
            )
        )
    if statuses:
        q = q.where(Payment.status.in_(statuses))
    elif params.payment_status:
        q = q.where(Payment.status == params.payment_status)
    if params.payment_method:
        q = q.where(Payment.method == params.payment_method)
    if params.host_id:
        q = q.where(Unit.host_id == params.host_id)
    if params.guest_id:
        q = q.where(Payment.guest_id == params.guest_id)
    if params.unit_id:
        q = q.where(Payment.unit_id == params.unit_id)
    sort_col = {
        "created_at": Payment.created_at,
        "amount_egp": Payment.amount_egp,
        "refund_amount_egp": Payment.refund_amount_egp,
    }.get(params.sort or "", Payment.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = []
    for r in (await session.execute(q)).all():
        p: Payment = r[0]
        rows.append(
            {
                "payment_id": p.id,
                "booking_id": r.booking_ref,
                "created_at": _iso(p.created_at),
                "payment_status": p.status,
                "payment_method": p.method,
                "amount_egp": _num(p.amount_egp),
                "refund_amount_egp": _num(p.refund_amount_egp),
                "refunded_at": _iso(p.refunded_at),
                "verified_at": _iso(p.verified_at),
                "reject_reason": p.reject_reason,
                "guest_name": r.guest_name,
                "host_name": r.host_name,
                "listing_title": r.title_en or r.title_ar,
            }
        )
    return await _finalize(report, params, rows)


async def payments_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(
            Payment.status,
            Payment.method,
            func.count(),
            func.coalesce(func.sum(Payment.amount_egp), 0),
            func.coalesce(func.sum(Payment.refund_amount_egp), 0),
        )
        .where(*_window(Payment.created_at, params))
        .group_by(Payment.status, Payment.method)
    )
    if params.status:
        q = q.where(Payment.status == params.status)
    rows = [
        {
            "payment_status": s,
            "payment_method": m,
            "count": c,
            "amount_egp": _num(a),
            "refund_amount_egp": _num(rf),
        }
        for s, m, c, a, rf in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def transactions_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = select(FinancialTransaction).where(
        *_window(FinancialTransaction.created_at, params)
    )
    if report.fixed.get("transaction_types"):
        q = q.where(
            FinancialTransaction.transaction_type.in_(
                report.fixed["transaction_types"]
            )
        )
    if params.status:
        q = q.where(FinancialTransaction.status == params.status)
    sort_col = {
        "created_at": FinancialTransaction.created_at,
        "amount_egp": FinancialTransaction.amount_egp,
    }.get(params.sort or "", FinancialTransaction.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = [
        {
            "transaction_id": t.id,
            "created_at": _iso(t.created_at),
            "transaction_type": t.transaction_type,
            "booking_id": t.reservation_id,
            "amount_egp": _num(t.amount_egp),
            "status": t.status,
            "provider": t.provider,
        }
        for t in (await session.execute(q)).scalars().all()
    ]
    return await _finalize(report, params, rows)


async def payouts_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(PayoutRequest, User.display_name)
        .join(User, User.id == PayoutRequest.host_id)
        .where(*_window(PayoutRequest.created_at, params))
    )
    statuses = report.fixed.get("statuses")
    if statuses:
        q = q.where(PayoutRequest.status.in_(statuses))
    elif params.payout_status:
        q = q.where(PayoutRequest.status == params.payout_status)
    if params.host_id:
        q = q.where(PayoutRequest.host_id == params.host_id)
    date_col = (
        PayoutRequest.processed_at
        if report.date_basis == "payout_processed"
        else PayoutRequest.created_at
    )
    sort_col = {
        "created_at": PayoutRequest.created_at,
        "amount_egp": PayoutRequest.amount_egp,
    }.get(params.sort or "", date_col)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = [
        {
            "payout_id": p.id,
            "created_at": _iso(p.created_at),
            "host_name": name,
            "amount_egp": _num(p.amount_egp),
            "payout_status": p.status,
            "provider": p.provider,
            "processed_at": _iso(p.processed_at),
            "failure_reason": p.failure_reason,
        }
        for p, name in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def payouts_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(
            PayoutRequest.status,
            func.count(),
            func.coalesce(func.sum(PayoutRequest.amount_egp), 0),
        )
        .where(*_window(PayoutRequest.created_at, params))
        .group_by(PayoutRequest.status)
    )
    rows = [
        {"payout_status": s, "count": c, "amount_egp": _num(a)}
        for s, c, a in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Users / KYC
# ---------------------------------------------------------------------------

async def users_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    counts_col = None
    if report.key == "guests":
        counts_col = (
            select(func.count(Booking.id))
            .where(Booking.guest_id == User.id)
            .scalar_subquery()
            .label("bookings_count")
        )
    elif report.key == "hosts":
        counts_col = (
            select(func.count(Unit.id))
            .where(Unit.host_id == User.id)
            .scalar_subquery()
            .label("listings_count")
        )
    cols = [User, counts_col] if counts_col is not None else [User]
    q = select(*cols).where(*_window(User.created_at, params))
    role = report.fixed.get("role") or params.role
    if role:
        q = q.where(User.role == role)
    if params.kyc_status:
        q = q.where(User.kyc_status == params.kyc_status)
    sort_col = {
        "created_at": User.created_at,
        "display_name": User.display_name,
    }.get(params.sort or "", User.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = []
    for r in (await session.execute(q)).all():
        u: User = r[0]
        extra = r[1] if counts_col is not None else None
        row = {
            "user_id": u.id,
            "display_name": u.display_name,
            "role": u.role,
            "kyc_status": u.kyc_status,
            "is_active": u.is_active,
            "created_at": _iso(u.created_at),
        }
        if report.key == "guests":
            row["bookings_count"] = extra
        elif report.key == "hosts":
            row["listings_count"] = extra
        rows.append(row)
    return await _finalize(report, params, rows)


async def kyc_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(User.kyc_status, func.count())
        .group_by(User.kyc_status)
    )
    rows = [
        {"kyc_status": s, "count": c}
        for s, c in (await session.execute(q)).all()
    ]
    rows.sort(key=lambda r: r["kyc_status"])
    return await _finalize(report, params, rows)


async def provider_docs(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(KycDocument, User.display_name)
        .join(User, User.id == KycDocument.user_id)
        .where(
            KycDocument.provider.is_not(None),
            *_window(KycDocument.created_at, params),
        )
        .order_by(KycDocument.created_at.desc())
        .limit(MAX_SCAN)
    )
    if params.status:
        q = q.where(KycDocument.status == params.status)
    rows = [
        {
            "document_id": d.id,
            "created_at": _iso(d.created_at),
            "user_name": name,
            "provider": d.provider,
            "status": d.status,
            "updated_at": _iso(d.updated_at),
        }
        for d, name in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def manual_review_docs(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Same actionable set as the admin manual KYC queue."""
    q = (
        select(KycDocument, User.display_name)
        .join(User, User.id == KycDocument.user_id)
        .where(
            or_(
                KycDocument.provider.is_(None)
                & KycDocument.status.in_(("pending",)),
                KycDocument.status == "manual_review",
            ),
            *_window(KycDocument.created_at, params),
        )
        .order_by(KycDocument.created_at.desc())
        .limit(MAX_SCAN)
    )
    if params.status:
        q = q.where(KycDocument.status == params.status)
    rows = [
        {
            "document_id": d.id,
            "created_at": _iso(d.created_at),
            "user_name": name,
            "document_type": d.document_type,
            "status": d.status,
            "provider": d.provider,
        }
        for d, name in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Listings
# ---------------------------------------------------------------------------

async def listings_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(
            Unit,
            UnitListing.title_en,
            UnitListing.title_ar,
            UnitListing.base_price_egp,
            User.display_name,
        )
        .outerjoin(UnitListing, UnitListing.unit_id == Unit.id)
        .join(User, User.id == Unit.host_id)
        .where(*_window(Unit.created_at, params))
    )
    if params.status:
        q = q.where(Unit.status == params.status)
    if params.host_id:
        q = q.where(Unit.host_id == params.host_id)
    if params.governorate:
        q = q.where(Unit.governorate == params.governorate)
    if params.city:
        q = q.where(Unit.city == params.city)
    if params.property_type:
        q = q.where(Unit.property_type == params.property_type)
    sort_col = {
        "created_at": Unit.created_at,
        "base_price_egp": UnitListing.base_price_egp,
    }.get(params.sort or "", Unit.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = [
        {
            "unit_id": u.id,
            "listing_title": title_en or title_ar,
            "host_name": name,
            "status": u.status,
            "property_type": u.property_type,
            "governorate": u.governorate,
            "city": u.city,
            "base_price_egp": _num(base_price),
            "created_at": _iso(u.created_at),
        }
        for u, title_en, title_ar, base_price, name in (
            await session.execute(q)
        ).all()
    ]
    return await _finalize(report, params, rows)


async def listings_grouped_status(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(Unit.status, func.count())
        .where(*_window(Unit.created_at, params))
        .group_by(Unit.status)
    )
    rows = [
        {"status": s, "count": c}
        for s, c in (await session.execute(q)).all()
    ]
    rows.sort(key=lambda r: r["status"] or "")
    return await _finalize(report, params, rows)


async def supply_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    by_city = report.fixed.get("group_by") == "city"
    cols = (
        [Unit.governorate, Unit.city]
        if by_city
        else [Unit.governorate]
    )
    q = (
        select(*cols, func.count())
        .group_by(*cols)
        .order_by(func.count().desc())
    )
    if params.status:
        q = q.where(Unit.status == params.status)
    if params.governorate and by_city:
        q = q.where(Unit.governorate == params.governorate)
    rows = []
    for r in (await session.execute(q)).all():
        row = {"governorate": r[0], "count": r[-1]}
        if by_city:
            row["city"] = r[1]
        rows.append(row)
    return await _finalize(report, params, rows)


async def listings_by_month(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    month = func.date_trunc("month", Unit.created_at)
    q = (
        select(month.label("m"), func.count())
        .where(*_window(Unit.created_at, params))
        .group_by(month)
        .order_by(month.desc())
    )
    rows = [
        {"month": m.strftime("%Y-%m"), "count": c}
        for m, c in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Adjustments / disputes / reviews
# ---------------------------------------------------------------------------

async def adjustments_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = select(CommercialAdjustment).where(
        *_window(CommercialAdjustment.created_at, params)
    )
    if params.status:
        q = q.where(CommercialAdjustment.status == params.status)
    if params.host_id or params.guest_id:
        q = q.where(
            CommercialAdjustment.user_id.in_(
                [v for v in (params.host_id, params.guest_id) if v]
            )
        )
    sort_col = {
        "created_at": CommercialAdjustment.created_at,
        "amount_egp": CommercialAdjustment.amount_egp,
    }.get(params.sort or "", CommercialAdjustment.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = [
        {
            "adjustment_id": a.id,
            "created_at": _iso(a.created_at),
            "booking_id": a.booking_id,
            "adjustment_type": a.adjustment_type,
            "category": a.category,
            "amount_egp": _num(a.amount_egp),
            "status": a.status,
            "reason": a.reason,
        }
        for a in (await session.execute(q)).scalars().all()
    ]
    return await _finalize(report, params, rows)


async def disputes_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = select(Dispute).where(*_window(Dispute.created_at, params))
    if params.status:
        q = q.where(Dispute.status == params.status)
    q = q.order_by(Dispute.created_at.desc()).limit(MAX_SCAN)
    rows = [
        {
            "dispute_id": d.id,
            "created_at": _iso(d.created_at),
            "booking_id": d.booking_id,
            "category": d.category,
            "status": d.status,
            "resolved_at": _iso(d.resolved_at),
        }
        for d in (await session.execute(q)).scalars().all()
    ]
    return await _finalize(report, params, rows)


async def disputes_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(Dispute.status, Dispute.category, func.count())
        .where(*_window(Dispute.created_at, params))
        .group_by(Dispute.status, Dispute.category)
    )
    rows = [
        {"status": s, "category": c, "count": n}
        for s, c, n in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def reviews_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(Review, UnitListing.title_en, UnitListing.title_ar)
        .outerjoin(UnitListing, UnitListing.unit_id == Review.unit_id)
        .where(*_window(Review.created_at, params))
    )
    if params.unit_id:
        q = q.where(Review.unit_id == params.unit_id)
    sort_col = {
        "created_at": Review.created_at,
        "rating": Review.rating,
    }.get(params.sort or "", Review.created_at)
    q = q.order_by(
        sort_col.desc() if params.order == "desc" else sort_col.asc()
    ).limit(MAX_SCAN)
    rows = [
        {
            "review_id": rv.id,
            "created_at": _iso(rv.created_at),
            "booking_id": rv.booking_id,
            "listing_title": te or ta,
            "reviewer_role": rv.reviewer_role,
            "rating": rv.rating,
            "is_hidden": rv.is_hidden,
            "published_at": _iso(rv.published_at),
        }
        for rv, te, ta in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def ratings_grouped(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = (
        select(
            Review.unit_id,
            func.count(),
            func.round(func.avg(Review.rating), 2),
            UnitListing.title_en,
            UnitListing.title_ar,
        )
        .outerjoin(UnitListing, UnitListing.unit_id == Review.unit_id)
        .where(*_window(Review.created_at, params))
        .group_by(Review.unit_id, UnitListing.title_en, UnitListing.title_ar)
        .order_by(func.count().desc())
        .limit(MAX_SCAN)
    )
    rows = [
        {
            "listing_title": te or ta,
            "unit_id": uid,
            "reviews_count": c,
            "avg_rating": float(avg) if avg is not None else None,
        }
        for uid, c, avg, te, ta in (await session.execute(q)).all()
    ]
    return await _finalize(report, params, rows)


async def moderation_list(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    q = select(ReviewReport).where(*_window(ReviewReport.created_at, params))
    if params.status:
        q = q.where(ReviewReport.status == params.status)
    q = q.order_by(ReviewReport.created_at.desc()).limit(MAX_SCAN)
    rows = [
        {
            "report_id": r.id,
            "created_at": _iso(r.created_at),
            "review_id": r.review_id,
            "reason": r.reason,
            "status": r.status,
            "resolved_at": _iso(r.resolved_at),
        }
        for r in (await session.execute(q)).scalars().all()
    ]
    return await _finalize(report, params, rows)


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

async def marketplace_overview(
    session: AsyncSession, report: ReportDef, params: ReportParams
) -> ReportResult:
    """Cross-domain KPI snapshot — same sources the Admin Overview uses."""
    async def _scalar(q) -> float:
        return float(await session.scalar(q) or 0)

    ledger_net = func.coalesce(
        func.sum(
            case(
                (LedgerEntry.entry_type == "credit", LedgerEntry.amount_egp),
                else_=-LedgerEntry.amount_egp,
            )
        ),
        0,
    )
    metrics: list[dict] = [
        {"metric": "users_total", "value": await _scalar(select(func.count(User.id)))},
        {
            "metric": "users_hosts",
            "value": await _scalar(
                select(func.count(User.id)).where(User.role == "host")
            ),
        },
        {
            "metric": "listings_total",
            "value": await _scalar(select(func.count(Unit.id))),
        },
        {
            "metric": "bookings_total",
            "value": await _scalar(select(func.count(Booking.id))),
        },
        {
            "metric": "collected_egp",
            "value": await _scalar(
                select(func.coalesce(func.sum(Payment.amount_egp), 0)).where(
                    Payment.status == "verified"
                )
            ),
        },
        {
            "metric": "stayos_revenue_egp",
            "value": await _scalar(
                select(ledger_net).where(
                    LedgerEntry.ledger_account == LedgerAccount.PLATFORM_REVENUE
                )
            ),
        },
        {
            # VAT payable = ledger-recognised VAT net of reversals — VAT
            # is recognised at capture; identical to Admin Earnings.
            "metric": "vat_payable_egp",
            "value": await _scalar(
                select(ledger_net).where(
                    LedgerEntry.ledger_account == LedgerAccount.VAT_PAYABLE
                )
            ),
        },
        {
            "metric": "funds_held_egp",
            "value": await _scalar(
                select(func.coalesce(func.sum(EscrowAccount.amount_egp), 0)).where(
                    EscrowAccount.status.in_(
                        [
                            EscrowStatus.CREATED,
                            EscrowStatus.HELD,
                            EscrowStatus.DISPUTED,
                        ]
                    )
                )
            ),
        },
        {
            # Host net inside still-open escrows — recognised host
            # obligation, restricted until check-in + 24h. Decomposed via
            # the canonical economics helper, never duplicated math.
            "metric": "host_funds_held_egp",
            "value": sum(
                (
                    Decimal(str(d["host_amount_egp"]))
                    for d in (
                        await finance_services.escrow_decompositions(
                            session, await _open_escrows(session, params)
                        )
                    ).values()
                ),
                Decimal(0),
            ),
        },
        {
            "metric": "host_payable_egp",
            "value": await _scalar(
                select(ledger_net).where(
                    LedgerEntry.ledger_account == LedgerAccount.HOST_PAYABLE
                )
            ),
        },
        {
            "metric": "payouts_paid_egp",
            "value": await _scalar(
                select(func.coalesce(func.sum(PayoutRequest.amount_egp), 0)).where(
                    PayoutRequest.status == PayoutStatus.COMPLETED
                )
            ),
        },
        {
            "metric": "refunded_egp",
            "value": await _scalar(
                select(func.coalesce(func.sum(Payment.refund_amount_egp), 0)).where(
                    Payment.refund_amount_egp.isnot(None)
                )
            ),
        },
    ]
    return await _finalize(report, params, metrics)


# ---------------------------------------------------------------------------
# Management report — executive aggregation over the same canonical facts
# ---------------------------------------------------------------------------


async def _open_escrows(session: AsyncSession, params: ReportParams):
    """Open escrows (created/held/disputed) — the funds-held set used by
    Admin Earnings, optionally windowed on escrow creation."""
    q = select(EscrowAccount).where(
        EscrowAccount.status.in_(_HELD_ESCROW_STATUSES),
        *_window(EscrowAccount.created_at, params),
    )
    return list((await session.execute(q.limit(MAX_SCAN))).scalars().all())


async def _ledger_nets(
    session: AsyncSession, accounts, params: ReportParams
) -> dict[str, dict[str, Decimal]]:
    """Gross credits / debits / signed net per ledger account, windowed on
    ledger recognition date (``ledger_entries.created_at``)."""
    signed = case(
        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount_egp),
        else_=-LedgerEntry.amount_egp,
    )
    q = (
        select(
            LedgerEntry.ledger_account,
            func.coalesce(
                func.sum(
                    case(
                        (
                            LedgerEntry.entry_type == LedgerEntryType.CREDIT,
                            LedgerEntry.amount_egp,
                        ),
                        else_=0,
                    )
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            LedgerEntry.entry_type == LedgerEntryType.DEBIT,
                            LedgerEntry.amount_egp,
                        ),
                        else_=0,
                    )
                ),
                0,
            ),
            func.coalesce(func.sum(signed), 0),
        )
        .where(
            LedgerEntry.ledger_account.in_(accounts),
            *_window(LedgerEntry.created_at, params),
        )
        .group_by(LedgerEntry.ledger_account)
    )
    out = {a: {"credit": Decimal(0), "debit": Decimal(0), "net": Decimal(0)} for a in accounts}
    for account, credit, debit, net in (await session.execute(q)).all():
        out[LedgerAccount(account)] = {
            "credit": Decimal(str(credit)),
            "debit": Decimal(str(debit)),
            "net": Decimal(str(net)),
        }
    return out


async def management_report(
    session: AsyncSession, params: ReportParams
) -> dict[str, Any]:
    """Executive management report — presentation aggregation composed
    entirely from the canonical facts (payments, ledger, escrows,
    payouts, booking economics). No independent financial math.

    With no filters the KPIs equal Admin Earnings exactly. When a date
    range is supplied each metric is windowed on its own canonical date
    basis (payment verified / ledger recognised / escrow created /
    booking created), declared in ``date_bases``.
    """
    verified_at = func.coalesce(Payment.verified_at, Payment.created_at)
    refunded_at = func.coalesce(Payment.refunded_at, Payment.created_at)

    async def _scalar(q) -> Decimal:
        return Decimal(str(await session.scalar(q) or 0))

    # ---- KPIs (canonical aggregate expressions) -------------------------
    collected = await _scalar(
        select(func.coalesce(func.sum(Payment.amount_egp), 0)).where(
            Payment.status == PaymentStatus.VERIFIED,
            *_window(verified_at, params),
        )
    )
    refunded = await _scalar(
        select(func.coalesce(func.sum(Payment.refund_amount_egp), 0)).where(
            Payment.refund_amount_egp.isnot(None),
            *_window(refunded_at, params),
        )
    )
    refund_pending = await _scalar(
        select(func.coalesce(func.sum(Payment.refund_amount_egp), 0)).where(
            Payment.status == PaymentStatus.REFUND_PENDING
        )
    )
    ledger = await _ledger_nets(
        session,
        (LedgerAccount.PLATFORM_REVENUE, LedgerAccount.VAT_PAYABLE, LedgerAccount.HOST_PAYABLE),
        params,
    )
    open_escrows = await _open_escrows(session, params)
    funds_held = sum(
        (Decimal(str(e.amount_egp)) for e in open_escrows), Decimal(0)
    )
    payouts_pending = await _scalar(
        select(func.coalesce(func.sum(PayoutRequest.amount_egp), 0)).where(
            PayoutRequest.status == PayoutStatus.PENDING,
            *_window(PayoutRequest.created_at, params),
        )
    )
    payouts_paid = await _scalar(
        select(func.coalesce(func.sum(PayoutRequest.amount_egp), 0)).where(
            PayoutRequest.status == PayoutStatus.COMPLETED,
            *_window(PayoutRequest.created_at, params),
        )
    )

    # ---- Composition of open escrows ------------------------------------
    # Booking economics inside held funds — recognised at capture, but
    # the CASH still sits under escrow control until check-in + 24h.
    # These are decomposition figures, never extra revenue/VAT on top.
    host_funds_held = Decimal(0)
    revenue_in_held = Decimal(0)
    vat_in_held = Decimal(0)
    escrow_rows: list[dict[str, Any]] = []
    for escrow in open_escrows:
        try:
            host_amount, vat = await finance_services._resolve_escrow_split(
                session, escrow.reservation_id, escrow.amount_egp
            )
        except Exception:
            continue
        host_amount = commercial.money(host_amount)
        vat = commercial.money(vat)
        share = commercial.money(
            Decimal(str(escrow.amount_egp)) - host_amount - vat
        )
        host_funds_held += host_amount
        revenue_in_held += share
        vat_in_held += vat
        escrow_rows.append(
            {
                "escrow_id": escrow.id,
                "booking_id": escrow.reservation_id,
                "status": str(escrow.status),
                "amount_egp": _num(escrow.amount_egp),
                "host_amount_egp": _num(host_amount),
                "platform_share_egp": _num(share),
                "vat_egp": _num(vat),
            }
        )

    # ---- Revenue by month (ledger recognition date) ---------------------
    month = func.date_trunc("month", LedgerEntry.created_at).label("m")
    signed = case(
        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount_egp),
        else_=-LedgerEntry.amount_egp,
    )
    rev_month_q = (
        select(month, func.coalesce(func.sum(signed), 0))
        .where(
            LedgerEntry.ledger_account == LedgerAccount.PLATFORM_REVENUE,
            *_window(LedgerEntry.created_at, params),
        )
        .group_by(month)
        .order_by(month)
    )
    revenue_by_month = [
        {"month": m.strftime("%Y-%m"), "amount_egp": _num(v)}
        for m, v in (await session.execute(rev_month_q)).all()
    ]

    # ---- VAT decomposition ----------------------------------------------
    # calculated = VAT on collected bookings in scope; reversed = the
    # canonical refund reversal; recognised = VAT_PAYABLE ledger net
    # (recognised at capture); payable = recognised − reversed = net.
    pay_escrow_q = (
        select(Payment, EscrowAccount)
        .outerjoin(EscrowAccount, EscrowAccount.reservation_id == Payment.booking_id)
        .where(
            Payment.vat_egp.isnot(None),
            Payment.status.in_(("verified", "refund_pending", "refunded")),
            *_window(Payment.created_at, params),
        )
        .limit(MAX_SCAN)
    )
    vat_calculated = Decimal(0)
    vat_reversed = Decimal(0)
    for payment, escrow in (await session.execute(pay_escrow_q)).all():
        vat_calculated += Decimal(str(payment.vat_egp or 0))
        eco = await finance_services.booking_economics(session, payment)
        vat_reversed += _refund_vat_reversal(payment, escrow, eco)
    vat_ledger = ledger[LedgerAccount.VAT_PAYABLE]

    # ---- Bookings --------------------------------------------------------
    bk_q = _apply_booking_filters(
        select(Booking, Unit.governorate).join(Unit, Unit.id == Booking.unit_id),
        params,
        {},
    ).where(*_window(Booking.created_at, params)).limit(MAX_SCAN)
    by_status: dict[str, int] = {}
    by_gov: dict[str, int] = {}
    total_bookings = 0
    for booking, gov in (await session.execute(bk_q)).all():
        by_status[str(booking.status)] = by_status.get(str(booking.status), 0) + 1
        if gov:
            by_gov[str(gov)] = by_gov.get(str(gov), 0) + 1
        total_bookings += 1

    # ---- Escrow lifecycle ------------------------------------------------
    esc_status_q = (
        select(EscrowAccount.status, func.count(), func.coalesce(func.sum(EscrowAccount.amount_egp), 0))
        .where(*_window(EscrowAccount.created_at, params))
        .group_by(EscrowAccount.status)
    )
    escrows_by_status = [
        {"status": str(st), "count": int(n), "amount_egp": _num(a)}
        for st, n, a in (await session.execute(esc_status_q)).all()
    ]

    # ---- Refunds / adjustments ------------------------------------------
    adj_q = (
        select(CommercialAdjustment, User.display_name)
        .outerjoin(User, User.id == CommercialAdjustment.created_by_id)
        .where(*_window(CommercialAdjustment.created_at, params))
        .order_by(CommercialAdjustment.created_at.desc())
        .limit(200)
    )
    adjustments = [
        {
            "adjustment_id": a.id,
            "created_at": _iso(a.created_at),
            "booking_id": a.booking_id,
            "adjustment_type": a.adjustment_type,
            "amount_egp": _num(a.amount_egp),
            "status": a.status,
            "reason": a.reason,
            "actor": name,
        }
        for a, name in (await session.execute(adj_q)).all()
    ]

    # ---- Top bookings by guest total (verified payments) -----------------
    top_q = (
        select(Payment, Booking.status, UnitListing.title_en, UnitListing.title_ar)
        .join(Booking, Booking.id == Payment.booking_id)
        .join(Unit, Unit.id == Booking.unit_id)
        .outerjoin(UnitListing, UnitListing.unit_id == Unit.id)
        .where(
            Payment.status == PaymentStatus.VERIFIED,
            *_window(Payment.created_at, params),
        )
        .order_by(Payment.amount_egp.desc())
        .limit(8)
    )
    if params.governorate:
        top_q = top_q.where(Unit.governorate == params.governorate)
    if params.city:
        top_q = top_q.where(Unit.city == params.city)
    if params.status:
        top_q = top_q.where(Booking.status == params.status)
    top_bookings = []
    for payment, bstatus, title_en, title_ar in (await session.execute(top_q)).all():
        eco = await finance_services.booking_economics(session, payment)
        top_bookings.append(
            {
                "booking_id": payment.booking_id,
                "property": title_en or title_ar,
                "status": str(bstatus),
                "guest_total_egp": _num(eco.guest_total_egp),
                "host_net_egp": _num(eco.host_net_egp),
                "stayos_revenue_egp": _num(eco.platform_share_egp),
                "vat_egp": _num(eco.vat_egp),
            }
        )

    revenue_ledger = ledger[LedgerAccount.PLATFORM_REVENUE]
    host_ledger = ledger[LedgerAccount.HOST_PAYABLE]
    vat_payable = vat_ledger["net"]
    return {
        "generated_at": datetime.now(UTC).isoformat(),
        "period": {
            "date_from": _iso(params.date_from),
            "date_to": _iso(params.date_to),
        },
        "filters_applied": params.applied(),
        "kpis": {
            "collected_egp": _num(collected),
            "stayos_revenue_egp": _num(revenue_ledger["net"]),
            "vat_payable_egp": _num(vat_payable),
            "host_funds_held_egp": _num(host_funds_held),
            "host_payable_egp": _num(host_ledger["net"]),
            "funds_held_egp": _num(funds_held),
            "refunded_egp": _num(refunded),
            "payouts_pending_egp": _num(payouts_pending),
            "payouts_paid_egp": _num(payouts_paid),
            "refund_pending_egp": _num(refund_pending),
        },
        "revenue": {
            "gross_credits_egp": _num(revenue_ledger["credit"]),
            "debits_egp": _num(revenue_ledger["debit"]),
            "net_egp": _num(revenue_ledger["net"]),
            # Recognised revenue whose CASH still sits inside open
            # escrows — a funds-position fact, not pending recognition.
            "within_held_funds_egp": _num(revenue_in_held),
            "by_month": revenue_by_month,
        },
        "vat": {
            "calculated_egp": _num(vat_calculated),
            "recognised_egp": _num(vat_ledger["credit"]),
            "reversed_egp": _num(vat_ledger["debit"]),
            "reversed_calculated_egp": _num(vat_reversed),
            # Recognised VAT whose cash still sits inside open escrows.
            "within_held_funds_egp": _num(vat_in_held),
            "payable_egp": _num(vat_payable),
        },
        "bookings": {
            "total": total_bookings,
            "by_status": by_status,
            "by_governorate": [
                {"governorate": g, "count": c}
                for g, c in sorted(by_gov.items(), key=lambda kv: -kv[1])[:10]
            ],
        },
        "settlement": {
            "funds_held_egp": _num(funds_held),
            "escrows_held": len(open_escrows),
            # Recognised host obligation still restricted in escrow.
            "host_funds_held_egp": _num(host_funds_held),
            # Ledger HOST_PAYABLE net — released/eligible, net of paid.
            "host_payable_egp": _num(host_ledger["net"]),
            "payouts_pending_egp": _num(payouts_pending),
            "payouts_paid_egp": _num(payouts_paid),
            "escrows_by_status": escrows_by_status,
            "open_escrows": escrow_rows,
        },
        "refunds": {
            "refunded_egp": _num(refunded),
            "refund_pending_egp": _num(refund_pending),
            "vat_reversed_egp": _num(vat_reversed),
            "adjustments": adjustments,
        },
        "top_bookings": top_bookings,
        "date_bases": {
            "kpis": "payment_verified_or_recognised",
            "revenue": "ledger_recognised_at_capture",
            "vat": "ledger_recognised_at_capture",
            "bookings": "booking_created",
            "refunds": "refund_completed",
            "top_bookings": "payment_created",
        },
    }


_BUILDERS = {
    "marketplace_overview": marketplace_overview,
    "grouped_booking_status": grouped_booking_status,
    "recognition_by_month": recognition_by_month,
    "economics_by_month": economics_by_month,
    "vat_by_booking": vat_by_booking,
    "ledger_account_report": ledger_account_report,
    "payments_grouped": payments_grouped,
    "payouts_grouped": payouts_grouped,
    "users_list": users_list,
    "kyc_grouped": kyc_grouped,
    "listings_list": listings_list,
    "listings_grouped_status": listings_grouped_status,
    "supply_grouped": supply_grouped,
    "listings_by_month": listings_by_month,
    "bookings_list": bookings_list,
    "booking_financials": booking_financials,
    "host_earnings": host_earnings,
    "payments_list": payments_list,
    "adjustments_list": adjustments_list,
    "transactions_list": transactions_list,
    "payouts_list": payouts_list,
    "exceptions_list": exceptions_list,
    "provider_docs": provider_docs,
    "manual_review_docs": manual_review_docs,
    "disputes_list": disputes_list,
    "disputes_grouped": disputes_grouped,
    "reviews_list": reviews_list,
    "ratings_grouped": ratings_grouped,
    "moderation_list": moderation_list,
}


async def run_report(
    session: AsyncSession, key: str, params: ReportParams
) -> ReportResult:
    report = BY_KEY[key]
    return await _BUILDERS[report.builder](session, report, params)
