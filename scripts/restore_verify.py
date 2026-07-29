#!/usr/bin/env python3
"""Restore a PostgreSQL backup into a temporary database and verify it."""

import os
import subprocess
import sys
from urllib.parse import urlparse


def _parsed_db_url() -> urlparse:
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        raise SystemExit("DATABASE_URL is not set")
    return urlparse(db_url)


def _pg_env(parsed: urlparse, db_name: str | None = None) -> dict[str, str]:
    env = os.environ.copy()
    if parsed.hostname:
        env["PGHOST"] = parsed.hostname
    if parsed.port:
        env["PGPORT"] = str(parsed.port)
    if parsed.username:
        env["PGUSER"] = parsed.username
    if parsed.password:
        env["PGPASSWORD"] = parsed.password
    if db_name:
        env["PGDATABASE"] = db_name
    return env


def restore_and_verify(backup_file: str) -> int:
    parsed = _parsed_db_url()
    original_db = parsed.path.lstrip("/") or "stayos"
    verify_db = f"{original_db}_verify_{os.getpid()}"

    try:
        # Create temporary verification database
        subprocess.run(
            ["createdb", verify_db],
            env=_pg_env(parsed),
            check=True,
        )

        # Restore the backup
        subprocess.run(
            ["psql", "--dbname", verify_db, "--file", backup_file],
            env=_pg_env(parsed, verify_db),
            check=True,
        )

        # Verify core schema objects exist
        check_sql = """
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('auth', 'pms', 'reservation', 'finance', 'notify', 'outbox', 'security')
        ORDER BY schemaname, tablename;
        """
        result = subprocess.run(
            ["psql", "--dbname", verify_db, "--command", check_sql, "--tuples-only"],
            env=_pg_env(parsed, verify_db),
            capture_output=True,
            text=True,
            check=True,
        )

        if not result.stdout.strip():
            raise SystemExit("Verification failed: no expected tables found")

        print("Restore verification passed")
        print(result.stdout)
        return 0
    finally:
        subprocess.run(
            ["dropdb", "--if-exists", verify_db],
            env=_pg_env(parsed),
            check=False,
        )


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <backup.sql>")
        return 1
    backup_file = sys.argv[1]
    if not os.path.exists(backup_file):
        print(f"Backup file not found: {backup_file}")
        return 1
    return restore_and_verify(backup_file)


if __name__ == "__main__":
    sys.exit(main())
