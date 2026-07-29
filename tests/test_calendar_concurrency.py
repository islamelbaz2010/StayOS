import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.listings.models import Unit
from app.reservations.repository import acquire_calendar_lock
from app.shared.exceptions import ConflictError
from sqlalchemy.exc import IntegrityError


@pytest.mark.asyncio
async def test_acquire_calendar_lock_raises_conflict_on_integrity_error() -> None:
    session = AsyncMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock(
        side_effect=IntegrityError("insert", None, Exception("overlap"))
    )

    unit = Unit(
        id=str(uuid.uuid4()),
        host_id="host-1",
        property_type="apartment",
        status="active",
        governorate="Cairo",
        city="Cairo",
        coordinates=None,
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
    )

    async def _execute(stmt):
        result = MagicMock()
        if "Unit" in str(type(stmt)) or "units" in str(stmt):
            result.scalar_one_or_none = MagicMock(return_value=unit)
        else:
            result.scalar_one_or_none = MagicMock(return_value=None)
        return result

    session.execute = _execute

    with pytest.raises(ConflictError):
        await acquire_calendar_lock(
            session,  # type: ignore[arg-type]
            unit.id,
            "res-1",
            date(2026, 8, 1),
            date(2026, 8, 4),
        )
