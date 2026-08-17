import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def write_event(
    session: AsyncSession,
    aggregate_type: str,
    aggregate_id: UUID,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    query = text(
        """
        INSERT INTO outbox.outbox_events (id, aggregate_type, aggregate_id, event_type, payload, created_at)
        VALUES (:id, :aggregate_type, :aggregate_id, :event_type, :payload, :created_at)
        """
    )

    await session.execute(
        query,
        {
            "id": str(uuid4()),
            "aggregate_type": aggregate_type,
            "aggregate_id": str(aggregate_id),
            "event_type": event_type,
            "payload": json.dumps(payload),
            "created_at": datetime.now(UTC),
        },
    )
