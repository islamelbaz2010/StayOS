#!/usr/bin/env python3
"""Acceptance-environment booking residue cleanup.

Removes proven-obsolete test residue from the staging/acceptance database
while preserving the current acceptance fixture and any live records:

Phase 1 — terminal residue:
  Bookings in a terminal state (cancelled, rejected) whose guest is NOT part
  of the current acceptance fixture and which have no payment, no
  conversation and no review references. These are expired/rejected manual
  test requests left over from earlier staging iterations.

Phase 2 — contaminated records:
  Explicitly listed booking IDs whose lifecycle state is known-contaminated
  (e.g. accepted through a temporary authorization regression). Dependent
  messages, conversation participants, conversation and payment rows are
  removed first to preserve referential integrity; booking outbox events are
  retained as the audit trail.

Dry-run by default; pass --apply to execute.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/cleanup_acceptance.py [--apply]
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

# Current acceptance fixture identities — never touched by this script.
ACCEPTANCE_GUEST_IDS = {
    "seed-accept-gues-0000-000000000001",  # Acceptance Guest
}

# Bookings whose state is contaminated by the temporary admin-authorization
# regression on 2026-09-15 (~05:19-05:28 UTC), during which the Railway
# service briefly ran `main` and admin accept returned 200.
CONTAMINATED_BOOKING_IDS = {
    "7896af45-ad79-4d28-8741-942256fcd39b",  # accepted by admin via the gap
}


async def find_terminal_residue(session: AsyncSession) -> list[dict]:
    rows = (
        await session.execute(
            text(
                """
                SELECT b.id, b.status, b.guest_id
                FROM booking.bookings b
                WHERE b.status IN ('cancelled', 'rejected')
                  AND b.guest_id <> ALL(:keep_guests)
                  AND NOT EXISTS (
                      SELECT 1 FROM payment.payments p WHERE p.booking_id = b.id)
                  AND NOT EXISTS (
                      SELECT 1 FROM messaging.conversations c WHERE c.booking_id = b.id)
                  AND NOT EXISTS (
                      SELECT 1 FROM pms.reviews r WHERE r.booking_id = b.id)
                ORDER BY b.created_at
                """
            ),
            {"keep_guests": list(ACCEPTANCE_GUEST_IDS)},
        )
    ).all()
    return [dict(r._mapping) for r in rows]


async def delete_booking_tree(session: AsyncSession, booking_id: str) -> None:
    """Delete a booking and its dependent payment/conversation tree."""
    conv_ids = [
        r[0]
        for r in (
            await session.execute(
                text(
                    "SELECT id FROM messaging.conversations WHERE booking_id = :bid"
                ),
                {"bid": booking_id},
            )
        ).all()
    ]
    for cid in conv_ids:
        await session.execute(
            text("DELETE FROM messaging.messages WHERE conversation_id = :cid"),
            {"cid": cid},
        )
        await session.execute(
            text(
                "DELETE FROM messaging.conversation_participants "
                "WHERE conversation_id = :cid"
            ),
            {"cid": cid},
        )
    await session.execute(
        text("DELETE FROM messaging.conversations WHERE booking_id = :bid"),
        {"bid": booking_id},
    )
    await session.execute(
        text("DELETE FROM payment.payments WHERE booking_id = :bid"),
        {"bid": booking_id},
    )
    await session.execute(
        text("DELETE FROM booking.bookings WHERE id = :bid"), {"bid": booking_id}
    )


async def main() -> None:
    apply = "--apply" in sys.argv
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== cleanup_acceptance [{mode}] ===")

    async with AsyncSessionLocal() as session:
        async with session.begin():
            before = (
                await session.execute(
                    text("SELECT status, COUNT(*) FROM booking.bookings GROUP BY status")
                )
            ).all()
            print("before:", dict(before))

            residue = await find_terminal_residue(session)
            print(f"terminal residue candidates: {len(residue)}")
            for r in residue:
                print(f"  {r['id'][:8]} {r['status']:9} guest={r['guest_id'][:13]}")

            contaminated = [
                dict(r._mapping)
                for r in (
                    await session.execute(
                        text(
                            "SELECT id, status, guest_id FROM booking.bookings "
                            "WHERE id = ANY(:ids)"
                        ),
                        {"ids": list(CONTAMINATED_BOOKING_IDS)},
                    )
                ).all()
            ]
            print(f"contaminated candidates: {len(contaminated)}")
            for r in contaminated:
                print(f"  {r['id'][:8]} {r['status']:9} guest={r['guest_id'][:13]}")

            if not apply:
                print("dry-run only — pass --apply to delete")
                return

            for r in residue:
                await delete_booking_tree(session, r["id"])
            for r in contaminated:
                await delete_booking_tree(session, r["id"])

            after = (
                await session.execute(
                    text("SELECT status, COUNT(*) FROM booking.bookings GROUP BY status")
                )
            ).all()
            print("after:", dict(after))
            print(
                f"deleted {len(residue) + len(contaminated)} bookings "
                "(outbox events retained as audit trail)"
            )


if __name__ == "__main__":
    asyncio.run(main())
