from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.shared.schemas import Money


class PaymentProofPresignRequest(BaseModel):
    filename: str
    content_type: str


class PaymentProofPresignResponse(BaseModel):
    upload_url: str
    proof_key: str


class PaymentProofDownloadResponse(BaseModel):
    download_url: str
    expires_in: int


class PaymentProofUpload(BaseModel):
    s3_key: str
    # Kept optional for older clients; the server treats the s3_key as the
    # source of truth since the proof bucket is private (P0-3).
    url: str | None = None


class PaymentVerifyRequest(BaseModel):
    reject_reason: str | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    guest_id: str
    host_id: str
    unit_id: str
    status: str
    method: str
    provider: str | None = None
    checkout_url: str | None = None
    amount_egp: Money
    # Guests receive the all-inclusive stay amount (accommodation +
    # cleaning, which internally contains the StayOS share) as the single
    # Accommodation line. ``include_breakdown`` (staff/admin) restores the
    # pure accommodation component and the internal economics fields.
    accommodation_amount_egp: Money | None = None
    guest_service_fee_egp: Money | None = None
    cleaning_fee_egp: Money | None = None
    # VAT on the taxable booking amount — the payer's own tax line,
    # visible to the guest. Internal economics stay breakdown-gated.
    vat_egp: Money | None = None
    nights: int
    reference_number: str
    payment_deadline_at: datetime | None = None
    proof_rejection_count: int = 0
    proof_s3_key: str | None
    proof_url: str | None
    proof_uploaded_at: datetime | None
    verified_at: datetime | None
    verified_by: str | None
    rejected_at: datetime | None
    rejected_by: str | None
    reject_reason: str | None
    cancelled_at: datetime | None
    refund_amount_egp: Money | None = None
    refunded_at: datetime | None = None
    instructions: str
    unit_title: str | None = None
    unit_cover_image: str | None = None
    created_at: datetime
    updated_at: datetime


class BookingQuote(BaseModel):
    """Guest-facing price quote for a unit + date range.

    Computed by the same routine that prices the actual payment so the
    amount a guest sees before booking always matches the amount charged.
    All-inclusive model (final Founder commercial decision): the response
    carries only Accommodation — the final price containing nightly rate,
    cleaning, StayOS economics and VAT — and Total, which is the same
    amount. No VAT line, no cleaning line, no fee lines, no internal
    economics. "Prices include all fees"."""

    unit_id: str
    check_in: str
    check_out: str
    nights: int
    # Final all-inclusive guest price — identical to total_egp.
    accommodation_egp: Money
    total_egp: Money


class InternalQuote(BaseModel):
    """Full internal quote — used by payment creation and host/admin
    surfaces. Never serialized on a guest-facing endpoint."""

    unit_id: str
    check_in: str
    check_out: str
    nights: int
    nightly_rate_egp: Money
    accommodation_egp: Money
    cleaning_fee_egp: Money
    taxable_amount_egp: Money
    vat_egp: Money
    total_egp: Money


class PaymentReturnStatusResponse(BaseModel):
    """Minimal status payload for a guest returning from hosted checkout
    without an authenticated session. Scoped by an unguessable per-checkout
    return token — exposes only what the returning payer needs to see."""

    booking_id: str
    payment_id: str
    payment_status: str
    booking_status: str
    amount_egp: Money
    reference_number: str
    verified_at: datetime | None = None


class PaymentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    guest_id: str
    host_id: str
    unit_id: str
    status: str
    method: str
    amount_egp: Money
    refund_amount_egp: Money | None = None
    reference_number: str
    payment_deadline_at: datetime | None = None
    refunded_at: datetime | None = None
    proof_rejection_count: int = 0
    proof_s3_key: str | None = None
    proof_url: str | None
    proof_uploaded_at: datetime | None
    reject_reason: str | None = None
    unit_title: str | None = None
    unit_cover_image: str | None = None
    # Linked-stay context so guests can bucket payments as upcoming/completed
    # without a second request. Public fields — booking dates are visible to
    # the guest who made the booking.
    check_in: date | None = None
    check_out: date | None = None
    booking_status: str | None = None
    # Host-facing earnings fields — populated only by the host-scoped
    # endpoint (``GET /payments/host``); None on guest/admin lists so guest
    # total-only pricing and internal economics stay hidden.
    host_net_egp: Money | None = None
    platform_fee_egp: Money | None = None
    funds_status: str | None = None
    funds_held_egp: Money | None = None
    expected_payout_at: datetime | None = None
    payout_status: str | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
