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
    unread_count: int
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
