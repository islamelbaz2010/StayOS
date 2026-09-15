#!/usr/bin/env python3
"""Create an isolated acceptance Guest fixture.

Creates a single Guest user (role=guest, kyc=verified) for acceptance testing.
Idempotent — safe to run multiple times.

Run ONLY against local/dev database.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_acceptance_guest.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # noqa: E402

from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://ahmed@localhost:5432/stayos",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

ACCEPTANCE_GUEST_ID = "seed-accept-gues-0000-000000000001"


async def create_acceptance_guest(session: AsyncSession) -> None:
    result = await session.execute(
        text("SELECT role, kyc_status FROM auth.users WHERE id = :id"),
        {"id": ACCEPTANCE_GUEST_ID},
    )
    existing = result.fetchone()
    if existing:
        # Idempotent repair: the fixture must always be guest/verified.
        # A previous acceptance session may have upgraded it to host —
        # restore the intended fixture state without touching anything else.
        if existing.role != "guest" or existing.kyc_status != "verified":
            await session.execute(
                text("""
                    UPDATE auth.users
                    SET role = 'guest', kyc_status = 'verified', updated_at = now()
                    WHERE id = :id
                    """),
                {"id": ACCEPTANCE_GUEST_ID},
            )
            print(
                f"Acceptance Guest repaired (was role={existing.role}, "
                f"kyc={existing.kyc_status}): {ACCEPTANCE_GUEST_ID}"
            )
        else:
            print(f"Acceptance Guest already exists: {ACCEPTANCE_GUEST_ID}")
        return

    await session.execute(
        text("""
            INSERT INTO auth.users (id, phone_number, email, firebase_uid,
                                    display_name, locale, role, kyc_status,
                                    is_active, created_at, updated_at)
            VALUES (:id, :phone, :email, NULL,
                    :display_name, 'en', 'guest', 'verified',
                    true, now(), now())
        """),
        {
            "id": ACCEPTANCE_GUEST_ID,
            "phone": "+201000000001",
            "email": "acceptance-guest@stayos.test",
            "display_name": "Acceptance Guest",
        },
    )
    print(f"Created Acceptance Guest: {ACCEPTANCE_GUEST_ID}")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await create_acceptance_guest(session)
        await session.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
