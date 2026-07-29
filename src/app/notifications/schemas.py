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
