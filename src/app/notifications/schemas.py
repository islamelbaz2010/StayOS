from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    event_type: str
    channel: str
    recipient: str
    locale: str
    status: str
    retry_count: int
    subject: str | None
    body: str
    error: str | None
    sent_at: datetime | None
    created_at: datetime


class InAppNotificationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_type: str
    category: str
    subject: str | None
    body: str
    locale: str
    read_at: datetime | None
    created_at: datetime
    # Related booking id when the source event's aggregate is a Booking —
    # lets the UI deep-link the notification to the booking detail.
    booking_id: str | None = None


class InAppNotificationList(BaseModel):
    items: list[InAppNotificationItem]
    unread_count: int


class MarkAllReadResponse(BaseModel):
    marked: int
