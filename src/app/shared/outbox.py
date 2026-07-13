from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import json


async def write_event(
    session: AsyncSession,
    aggregate_type: str,
    aggregate_id: UUID,
    event_type: str,
    payload: dict,
) -> None:
    from app.shared.models import Base
    
    query = """
    INSERT INTO outbox.outbox_events (aggregate_type, aggregate_id, event_type, payload, created_at)
    VALUES (:aggregate_type, :aggregate_id, :event_type, :payload, :created_at)
    """
    
    await session.execute(
        query,
        {
            "aggregate_type": aggregate_type,
            "aggregate_id": str(aggregate_id),
            "event_type": event_type,
            "payload": json.dumps(payload),
            "created_at": datetime.utcnow(),
        },
    )
