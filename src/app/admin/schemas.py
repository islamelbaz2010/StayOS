from datetime import date, datetime

from pydantic import BaseModel, Field

from app.shared.schemas import Money


class AdminOverviewResponse(BaseModel):
    """Marketplace operations snapshot for the admin console.

    All counts/sums are computed directly from the live tables — no
    invented business definitions. ``None`` where a section does not
    apply to the caller's permissions.
    """

    users_total: int
    users_guests: int
    users_hosts: int
    hosts_kyc_verified: int
    listings_total: int
    listings_listed: int
    listings_pending_verification: int
    listings_pending_changes: int
    listings_rejected: int
    listings_by_governorate: dict[str, int]
    bookings_total: int
    bookings_requested: int
    bookings_accepted: int
    bookings_confirmed: int
    bookings_completed: int
    bookings_cancelled: int
    bookings_rejected: int
    upcoming_checkins_7d: int
    payments_pending: int
    payments_proof_uploaded: int
    payments_verified: int
    payments_verified_amount_egp: Money
    payments_refund_pending_amount_egp: Money = 0
    payments_refunded_amount_egp: Money
    payouts_pending: int
    payouts_pending_amount_egp: Money
    payouts_paid_amount_egp: Money = 0
    escrows_held: int
    escrows_held_amount_egp: Money = 0
    host_payable_egp: Money = 0
    platform_revenue_egp: Money = 0
    vat_egp: Money = 0
    kyc_pending_documents: int
    disputes_open: int
    disputes_in_review: int
    maintenance_open: int
    tasks_pending: int
    tasks_overdue: int


class AdminUserListItem(BaseModel):
    id: str
    display_name: str | None
    email: str | None
    phone_number: str | None
    role: str
    kyc_status: str
    is_active: bool
    created_at: datetime


class AdminListingListItem(BaseModel):
    id: str
    title: str
    host_id: str
    status: str
    governorate: str
    city: str
    has_pending_changes: bool
    created_at: datetime


class BookingFinancialContextResponse(BaseModel):
    """Investigation view for a single booking: booking + payment +
    escrow/transactions/ledger context joined across modules."""

    booking_id: str
    booking_status: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    requested_at: datetime | None
    accepted_at: datetime | None
    cancelled_at: datetime | None
    cancel_reason: str | None
    guest_id: str
    guest_name: str | None
    guest_phone: str | None
    host_id: str
    host_name: str | None
    host_phone: str | None
    unit_id: str
    unit_title: str | None
    unit_city: str | None
    unit_governorate: str | None
    unit_cover_image: str | None
    payment_id: str | None
    payment_status: str | None
    payment_method: str | None
    payment_amount_egp: Money | None
    accommodation_amount_egp: Money | None
    guest_service_fee_egp: Money | None
    cleaning_fee_egp: Money | None
    reference_number: str | None
    payment_deadline_at: datetime | None
    proof_uploaded_at: datetime | None
    verified_at: datetime | None
    refund_amount_egp: Money | None
    refunded_at: datetime | None
    reject_reason: str | None
    escrow: dict | None = None
    # Canonical booking economics + funds/payout state — computed by the
    # finance module's commercial engine, never recomputed in the UI.
    financials: dict | None = None
    payout: dict | None = None
    transactions: list[dict] = []
    disputes: list[dict] = []


class DisputeContextResponse(BaseModel):
    """Admin investigation view for a single dispute: the dispute itself
    plus the full booking/payment/escrow context so the case can be
    worked without jumping across unrelated screens."""

    dispute: dict
    reporter: dict | None = None
    booking: BookingFinancialContextResponse | None = None


class AdjustmentCreateRequest(BaseModel):
    """Create a commercial adjustment. ``requested_by_id`` set → the
    record is a host/guest request entering at ``pending`` and requires
    an explicit approve/reject decision; unset → the admin's own action,
    created already ``approved`` (the admin IS the decision)."""

    adjustment_type: str = Field(
        description="host_credit | host_debit | guest_credit | guest_debit"
    )
    category: str = Field(
        description="adjustment | compensation | promotion | fee_waiver"
    )
    amount_egp: Money = Field(gt=0)
    reason: str = Field(min_length=1)
    booking_id: str | None = None
    user_id: str | None = None
    listing_id: str | None = None
    requested_by_id: str | None = None
    internal_note: str | None = None
    customer_note: str | None = None


class AdjustmentDecisionRequest(BaseModel):
    approve: bool


class AdjustmentResponse(BaseModel):
    id: str
    booking_id: str | None
    user_id: str | None
    listing_id: str | None
    adjustment_type: str
    category: str
    amount_egp: Money
    reason: str
    internal_note: str | None
    customer_note: str | None
    status: str
    requested_by_id: str | None
    created_by_id: str
    decided_by_id: str | None
    decided_at: datetime | None
    applied_at: datetime | None
    financial_transaction_id: str | None
    created_at: datetime
    updated_at: datetime
