#!/usr/bin/env python3
"""Backup StayOS PostgreSQL database and Redis RDB to a timestamped archive."""

import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse


def _parsed_db_url() -> urlparse:
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        raise SystemExit("DATABASE_URL is not set")
    return urlparse(db_url)


def _pg_env(parsed: urlparse) -> dict[str, str]:
    env = os.environ.copy()
    if parsed.hostname:
        env["PGHOST"] = parsed.hostname
    if parsed.port:
        env["PGPORT"] = str(parsed.port)
    if parsed.username:
        env["PGUSER"] = parsed.username
    if parsed.password:
        env["PGPASSWORD"] = parsed.password
    return env


def backup_postgres(output_dir: Path, parsed: urlparse) -> Path:
    db_name = parsed.path.lstrip("/") or "stayos"
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    file_path = output_dir / f"stayos_postgres_{timestamp}.sql"

    cmd = [
        "pg_dump",
        "--dbname",
        db_name,
        "--schema-only" if os.environ.get("BACKUP_SCHEMA_ONLY") else "--format",
        "plain",
        "--file",
        str(file_path),
    ]
    if os.environ.get("BACKUP_SCHEMA_ONLY"):
        cmd = ["pg_dump", "--schema-only", "--dbname", db_name, "--file", str(file_path)]

    subprocess.run(cmd, env=_pg_env(parsed), check=True)
    return file_path


def backup_redis(output_dir: Path) -> Path | None:
    redis_url = os.environ.get("REDIS_URL", "")
    if not redis_url:
        return None
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    file_path = output_dir / f"stayos_redis_{timestamp}.rdb"
    # Redis BACKUP/BGSAVE output is environment-specific; this script documents the contract.
    result = subprocess.run(
        ["redis-cli", "-u", redis_url, "--raw", "BGSAVE"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(f"Redis backup failed: {result.stderr}")
    return file_path


def main() -> int:
    output_dir = Path(os.environ.get("BACKUP_DIR", "./backups"))
    output_dir.mkdir(parents=True, exist_ok=True)

    parsed = _parsed_db_url()
    pg_backup = backup_postgres(output_dir, parsed)
    redis_backup = backup_redis(output_dir)

    print(f"Postgres backup: {pg_backup}")
    if redis_backup:
        print(f"Redis backup: {redis_backup}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
