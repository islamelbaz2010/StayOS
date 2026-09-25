from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.shared.schemas import BaseResponse, Money


class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str | None
    wallet_type: str
    currency: str
    balance_egp: Money
    available_balance_egp: Money


class EscrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str
    host_id: str
    amount_egp: Money
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
    amount_egp: Money
    balance_after: Money
    description: str | None
    created_at: datetime


class FinancialTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str | None
    transaction_type: str
    amount_egp: Money
    status: str
    provider: str | None
    provider_ref: str | None
    idempotency_key: str | None
    provider_metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class PayoutRequestCreate(BaseModel):
    amount_egp: Money = Field(..., gt=0)
    bank_account_info: dict[str, Any]


class PayoutRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    wallet_id: str
    host_id: str
    amount_egp: Money
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


class PaymentIntentRefundRequest(BaseModel):
    # Optional override for intents whose provider transaction id was never
    # persisted (pre-fix rows). When omitted the stored transaction_ref
    # is used.
    provider_transaction_id: str | None = None


class PaymentIntentRefundResponse(BaseResponse):
    payment_intent_id: str
    status: str
    refund_provider_ref: str | None = None


class WebhookResponse(BaseResponse):
    message: str = "processed"
