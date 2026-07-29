from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.auth.constants import KycDocumentType, KycStatus


class KycInitiateRequest(BaseModel):
    document_type: KycDocumentType
    document_number: str | None = None


class KycUploadUrls(BaseModel):
    front: str
    back: str
    selfie: str


class KycInitiateResponse(BaseModel):
    document_id: str
    upload_urls: KycUploadUrls
    expires_at: datetime


class KycDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    account_id: str | None
    document_type: KycDocumentType
    document_number: str | None
    status: KycStatus
    legal_name: str | None
    front_image_key: str | None
    back_image_key: str | None
    selfie_image_key: str | None
    verified_at: datetime | None
    rejected_at: datetime | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime


class KycStatusResponse(BaseModel):
    user_id: str
    kyc_status: KycStatus
    documents: list[KycDocumentResponse]


class KycSubmitResponse(BaseModel):
    document_id: str
    status: KycStatus
