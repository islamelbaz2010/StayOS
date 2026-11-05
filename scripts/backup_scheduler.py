#!/usr/bin/env python3
"""Long-running backup scheduler for the MAKAZOH production stack.

Runs ``scripts/backup.py`` on an interval inside the backup container,
then prunes archives older than ``BACKUP_RETENTION_DAYS``. One-shot mode
is available for smoke tests:

    BACKUP_RUN_ONCE=1 python scripts/backup_scheduler.py

Env:
    DATABASE_URL             required — passed through to pg_dump.
    REDIS_URL                optional — enables the Redis BGSAVE step.
    BACKUP_DIR               default ``/backups``.
    BACKUP_INTERVAL_SECONDS  default ``86400`` (daily).
    BACKUP_RETENTION_DAYS    default ``30``.
    BACKUP_RUN_ONCE          set to ``1`` to run a single cycle and exit.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path

BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", "/backups"))
INTERVAL = int(os.environ.get("BACKUP_INTERVAL_SECONDS", "86400"))
RETENTION_DAYS = int(os.environ.get("BACKUP_RETENTION_DAYS", "30"))
RUN_ONCE = os.environ.get("BACKUP_RUN_ONCE") == "1"


def run_backup() -> bool:
    env = dict(os.environ, BACKUP_DIR=str(BACKUP_DIR))
    result = subprocess.run(
        [sys.executable, "scripts/backup.py"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        # Log only stderr's last line — never the env.
        last = (result.stderr or "unknown error").strip().splitlines()[-1]
        print(f"[backup_scheduler] backup FAILED: {last}", flush=True)
        return False
    for line in result.stdout.strip().splitlines():
        print(f"[backup_scheduler] {line}", flush=True)
    return True


def prune() -> None:
    cutoff = datetime.now(UTC) - timedelta(days=RETENTION_DAYS)
    removed = 0
    for path in BACKUP_DIR.glob("stayos_*"):
        if path.is_file() and datetime.fromtimestamp(path.stat().st_mtime, UTC) < cutoff:
            path.unlink()
            removed += 1
    if removed:
        print(f"[backup_scheduler] pruned {removed} expired archives", flush=True)


def main() -> int:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    print(
        f"[backup_scheduler] starting dir={BACKUP_DIR} interval={INTERVAL}s retention={RETENTION_DAYS}d",
        flush=True,
    )
    while True:
        run_backup()
        prune()
        if RUN_ONCE:
            return 0
        time.sleep(INTERVAL)


if __name__ == "__main__":
    sys.exit(main())
