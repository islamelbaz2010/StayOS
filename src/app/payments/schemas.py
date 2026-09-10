from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
    amount_egp: int
    accommodation_amount_egp: int | None = None
    guest_service_fee_egp: int | None = None
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
    refund_amount_egp: int | None = None
    instructions: str
    unit_title: str | None = None
    unit_cover_image: str | None = None
    created_at: datetime
    updated_at: datetime


class BookingQuote(BaseModel):
    """Guest-facing price quote for a unit + date range.

    Computed by the same routine that prices the actual payment so the
    total a guest sees before booking always matches the amount charged."""

    unit_id: str
    check_in: str
    check_out: str
    nights: int
    nightly_rate_egp: int
    accommodation_egp: int
    cleaning_fee_egp: int
    service_fee_egp: int
    service_fee_waived: bool
    total_egp: int


class PaymentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    guest_id: str
    host_id: str
    unit_id: str
    status: str
    method: str
    amount_egp: int
    refund_amount_egp: int | None = None
    reference_number: str
    payment_deadline_at: datetime | None = None
    refunded_at: datetime | None = None
    proof_rejection_count: int = 0
    proof_s3_key: str | None = None
    proof_url: str | None
    proof_uploaded_at: datetime | None
    unit_title: str | None = None
    unit_cover_image: str | None = None
    created_at: datetime
    updated_at: datetime
