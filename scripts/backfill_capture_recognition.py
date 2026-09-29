"""Controlled backfill: capture-time revenue/VAT recognition.

Posts ``escrow_recognize`` transactions (revenue + VAT ledger entries)
for every still-open escrow created under the legacy release-time
model. Idempotent — safe to re-run; each recognised escrow is guarded by
its ``escrow-recognize`` idempotency key plus a ledger-existence check.

Usage:
    DATABASE_URL=... python scripts/backfill_capture_recognition.py          # dry-run
    DATABASE_URL=... python scripts/backfill_capture_recognition.py --apply  # commit
"""
import argparse
import asyncio
import os
import sys

sys.path.insert(0, "src")

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.finance import services as finance_services


async def main(apply: bool) -> None:
    url = os.environ["DATABASE_URL"]
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    eng = create_async_engine(url)
    async with AsyncSession(eng) as session:
        if apply:
            result = await finance_services.backfill_capture_recognition(session)
            await session.commit()
        else:
            # Dry-run: run inside a rolled-back transaction so the ledger
            # reflects nothing, but the report shows what WOULD change.
            result = await finance_services.backfill_capture_recognition(session)
            await session.rollback()
    print(f"mode={'APPLY' if apply else 'DRY-RUN'}")
    print(f"recognised={len(result['recognised'])} skipped={len(result['skipped'])}")
    for row in result["recognised"]:
        print(
            "  recognised booking=%s escrow=%s status=%s amount=%s"
            % (
                row["reservation_id"],
                row["escrow_id"],
                row["escrow_status"],
                row["amount_egp"],
            )
        )
    for row in result["skipped"]:
        print("  skipped booking=%s reason=%s" % (row["reservation_id"], row["reason"]))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="commit the backfill")
    args = parser.parse_args()
    asyncio.run(main(args.apply))
