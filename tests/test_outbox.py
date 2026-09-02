import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

from sqlalchemy import text

from app.shared.outbox import write_event


async def test_write_event_inserts_with_bound_parameters() -> None:
    session = AsyncMock()
    aggregate_id = uuid4()
    payload = {"key": "value"}

    await write_event(
        session=session,
        aggregate_type="property",
        aggregate_id=aggregate_id,
        event_type="created",
        payload=payload,
    )

    assert session.execute.called
    call_args = session.execute.call_args
    executed_statement = call_args[0][0]
    params = call_args[0][1]

    assert isinstance(executed_statement, type(text("")))
    assert params["aggregate_type"] == "property"
    assert params["aggregate_id"] == str(aggregate_id)
    assert params["event_type"] == "created"
    assert json.loads(params["payload"]) == payload
    created_at = params["created_at"]
    assert isinstance(created_at, datetime)
    assert created_at.tzinfo is UTC
