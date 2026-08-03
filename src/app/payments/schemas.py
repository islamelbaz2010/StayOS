from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaymentProofPresignRequest(BaseModel):
    filename: str
    content_type: str


class PaymentProofPresignResponse(BaseModel):
    upload_url: str
    proof_key: str


class PaymentProofUpload(BaseModel):
    s3_key: str
    url: str


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
    nights: int
    reference_number: str
    proof_s3_key: str | None
    proof_url: str | None
    proof_uploaded_at: datetime | None
    verified_at: datetime | None
    verified_by: str | None
    rejected_at: datetime | None
    rejected_by: str | None
    reject_reason: str | None
    cancelled_at: datetime | None
    instructions: str
    created_at: datetime
    updated_at: datetime


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
    reference_number: str
    proof_url: str | None
    proof_uploaded_at: datetime | None
    created_at: datetime
    updated_at: datetime
