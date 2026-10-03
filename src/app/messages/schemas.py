from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    sender_id: str | None
    sender_role: str
    content: str
    status: str
    automation_type: str | None
    created_at: datetime
    updated_at: datetime


class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    role: str
    last_read_at: datetime | None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str | None
    unit_id: str | None
    type: str
    status: str
    subject: str | None = None
    support_status: str | None = None
    context_booking_id: str | None = None
    participants: list[ParticipantResponse]
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse]


class ConversationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str | None
    unit_id: str | None
    type: str
    status: str
    subject: str | None = None
    support_status: str | None = None
    context_booking_id: str | None = None
    unread_count: int
    counterparty_name: str | None
    unit_title: str | None
    last_message: MessageResponse | None
    created_at: datetime
    updated_at: datetime


class MarkReadRequest(BaseModel):
    pass


class UnreadCountResponse(BaseModel):
    total_unread: int


class MessageTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    name: str
    body: str
    variables: list[str]
    category: str
    locale: str


class AutomatedMessageSend(BaseModel):
    template_key: str
    variables: dict[str, str] = Field(default_factory=dict)


class InquiryCreate(BaseModel):
    unit_id: str
    content: str = Field(..., min_length=1, max_length=4000)


class AdminContactCreate(BaseModel):
    """Admin/staff operational contact with one side of a booking."""

    booking_id: str
    target: str = Field(..., pattern="^(guest|host)$")
    content: str = Field(..., min_length=1, max_length=4000)


class SupportConversationCreate(BaseModel):
    """User-initiated StayOS Support thread.

    `booking_id` is optional context (e.g. opened from a booking detail
    page) — it is stored as `context_booking_id`, never as the
    reservation conversation's booking link."""

    subject: str | None = Field(default=None, max_length=200)
    booking_id: str | None = None
    content: str = Field(..., min_length=1, max_length=4000)


class SupportStatusUpdate(BaseModel):
    status: str = Field(
        ..., pattern="^(open|waiting_for_support|waiting_for_user|resolved)$"
    )
