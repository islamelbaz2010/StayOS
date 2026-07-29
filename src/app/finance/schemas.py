from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.shared.schemas import BaseResponse


class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str | None
    wallet_type: str
    currency: str
    balance_egp: int
    available_balance_egp: int


class EscrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str
    host_id: str
    amount_egp: int
    status: str
    hold_until: datetime | None
    released_at: datetime | None
    refunded_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LedgerEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    wallet_id: str | None
    escrow_id: str | None
    ledger_account: str
    account_type: str
    entry_type: str
    amount_egp: int
    balance_after: int
    description: str | None
    created_at: datetime


class FinancialTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str | None
    transaction_type: str
    amount_egp: int
    status: str
    provider: str | None
    provider_ref: str | None
    idempotency_key: str | None
    provider_metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class PayoutRequestCreate(BaseModel):
    amount_egp: int = Field(..., gt=0)
    bank_account_info: dict[str, Any]


class PayoutRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    wallet_id: str
    host_id: str
    amount_egp: int
    status: str
    provider: str | None
    provider_ref: str | None
    processed_at: datetime | None
    failure_reason: str | None
    created_at: datetime
    updated_at: datetime


class PayoutProcessRequest(BaseModel):
    provider: str = "paymob"


class PayoutListResponse(BaseResponse):
    data: list[PayoutRequestResponse]


class LedgerListResponse(BaseResponse):
    data: list[LedgerEntryResponse]


class EscrowListResponse(BaseResponse):
    data: list[EscrowResponse]


class WebhookResponse(BaseResponse):
    message: str = "processed"
