import json
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession


async def write_event(
    session: AsyncSession,
    aggregate_type: str,
    aggregate_id: UUID,
    event_type: str,
    payload: dict,
) -> None:

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
