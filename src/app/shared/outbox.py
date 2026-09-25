import json
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _json_default(value):
    # Money is Decimal internally — outbox payloads carry it as a number.
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def to_json_safe(payload: Any) -> Any:
    """Normalize a payload for JSON storage — Decimals become numbers."""
    return json.loads(json.dumps(payload, default=_json_default))


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
            "payload": json.dumps(payload, default=_json_default),
            "created_at": datetime.now(UTC),
        },
    )
