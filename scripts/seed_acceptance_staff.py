#!/usr/bin/env python3
"""Create an isolated acceptance Staff fixture.

Creates a single Staff user (role=staff, kyc=verified) holding all six
scoped staff permissions so founder acceptance can exercise the full
staff surface without granting admin. Idempotent — safe to run multiple
times; repairs role/kyc/permission drift without duplicating rows.

Run ONLY against local/dev/staging databases.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_acceptance_staff.py
"""

import asyncio
import os
import sys
from uuid import uuid4

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

ACCEPTANCE_STAFF_ID = "seed-staff-0000-0000-000000000001"
ADMIN_SEED_ID = "seed-admin-0000-0000-000000000001"
STAFF_PERMISSIONS = (
    "listings",
    "kyc",
    "payments",
    "operations",
    "disputes",
    "discovery",
)


async def create_acceptance_staff(session: AsyncSession) -> None:
    result = await session.execute(
        text("SELECT role, kyc_status FROM auth.users WHERE id = :id"),
        {"id": ACCEPTANCE_STAFF_ID},
    )
    existing = result.fetchone()
    if existing:
        if existing.role != "staff" or existing.kyc_status != "verified":
            await session.execute(
                text("""
                    UPDATE auth.users
                    SET role = 'staff', kyc_status = 'verified', updated_at = now()
                    WHERE id = :id
                    """),
                {"id": ACCEPTANCE_STAFF_ID},
            )
            print(
                f"Acceptance Staff repaired (was role={existing.role}, "
                f"kyc={existing.kyc_status}): {ACCEPTANCE_STAFF_ID}"
            )
        else:
            print(f"Acceptance Staff already exists: {ACCEPTANCE_STAFF_ID}")
    else:
        await session.execute(
            text("""
                INSERT INTO auth.users (id, phone_number, email, firebase_uid,
                                        display_name, locale, role, kyc_status,
                                        is_active, created_at, updated_at)
                VALUES (:id, :phone, :email, NULL,
                        :display_name, 'en', 'staff', 'verified',
                        true, now(), now())
                """),
            {
                "id": ACCEPTANCE_STAFF_ID,
                "phone": "+201000000004",
                "email": "acceptance-staff@stayos.test",
                "display_name": "Acceptance Staff",
            },
        )
        print(f"Created Acceptance Staff: {ACCEPTANCE_STAFF_ID}")

    for permission in STAFF_PERMISSIONS:
        result = await session.execute(
            text("""
                SELECT is_active FROM auth.staff_permissions
                WHERE user_id = :uid AND permission = :perm
                """),
            {"uid": ACCEPTANCE_STAFF_ID, "perm": permission},
        )
        row = result.fetchone()
        if row is None:
            await session.execute(
                text("""
                    INSERT INTO auth.staff_permissions
                        (id, user_id, permission, granted_by, is_active, created_at)
                    VALUES (:id, :uid, :perm, :granted_by, true, now())
                    """),
                {
                    "id": str(uuid4()),
                    "uid": ACCEPTANCE_STAFF_ID,
                    "perm": permission,
                    "granted_by": ADMIN_SEED_ID,
                },
            )
        elif not row.is_active:
            await session.execute(
                text("""
                    UPDATE auth.staff_permissions SET is_active = true
                    WHERE user_id = :uid AND permission = :perm
                    """),
                {"uid": ACCEPTANCE_STAFF_ID, "perm": permission},
            )


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await create_acceptance_staff(session)
        await session.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
