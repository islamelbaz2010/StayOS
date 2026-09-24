from datetime import date, datetime

from pydantic import BaseModel


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
    payments_verified_amount_egp: int
    payments_refunded_amount_egp: int
    payouts_pending: int
    payouts_pending_amount_egp: int
    escrows_held: int
    kyc_pending_documents: int
    disputes_open: int
    disputes_in_review: int
    maintenance_open: int
    tasks_pending: int
    tasks_overdue: int


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
    payment_amount_egp: int | None
    accommodation_amount_egp: int | None
    guest_service_fee_egp: int | None
    cleaning_fee_egp: int | None
    reference_number: str | None
    payment_deadline_at: datetime | None
    proof_uploaded_at: datetime | None
    verified_at: datetime | None
    refund_amount_egp: int | None
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
