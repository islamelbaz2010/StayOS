import subprocess
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.main import _db_status, _redis_status
from app.operations import metrics as ops_metrics
from app.shared import redis as redis_state
from fastapi import Request


def test_metrics_collector_records_and_renders() -> None:
    collector = ops_metrics.MetricsCollector()
    collector.record_request("GET", "/units", 200, 0.123)
    collector.record_request("POST", "/reservations", 500, 0.456)
    output = collector.render_prometheus()
    assert "stayos_http_requests_total" in output
    assert "GET /units" in output
    assert "stayos_http_errors_total" in output
    assert "500" in output


@pytest.mark.asyncio
async def test_db_status_ok() -> None:
    session = AsyncMock()
    session.execute = AsyncMock()
    result = await _db_status(session)  # type: ignore[arg-type]
    assert result == "ok"


@pytest.mark.asyncio
async def test_db_status_error() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(side_effect=RuntimeError("db down"))
    result = await _db_status(session)  # type: ignore[arg-type]
    assert result == "error"


@pytest.mark.asyncio
async def test_redis_status_ok() -> None:
    client = AsyncMock()
    client.ping = AsyncMock(return_value=True)
    redis_state.redis_client = client
    result = await _redis_status()
    assert result == "ok"


@pytest.mark.asyncio
async def test_redis_status_error() -> None:
    client = AsyncMock()
    client.ping = AsyncMock(side_effect=RuntimeError("redis down"))
    redis_state.redis_client = client
    result = await _redis_status()
    assert result == "error"


@pytest.mark.asyncio
async def test_metrics_middleware_records_request() -> None:
    async def call_next(request: Request) -> MagicMock:
        response = MagicMock()
        response.status_code = 200
        return response

    request = MagicMock(spec=Request)
    request.method = "GET"
    request.url.path = "/health"
    await ops_metrics.metrics_middleware(request, call_next)  # type: ignore[arg-type]
    assert ops_metrics.collector.request_counts.get("GET /health", 0) >= 1


def test_backup_script_invokes_pg_dump(monkeypatch) -> None:
    from scripts import backup

    called = {}

    def _fake_run(cmd, env, check):
        called["cmd"] = cmd
        called["env"] = env

    monkeypatch.setattr(subprocess, "run", _fake_run)
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    monkeypatch.setenv("BACKUP_DIR", "/tmp/backups")

    with patch.object(backup, "backup_redis", return_value=None):
        result = backup.main()
    assert result == 0
    assert "pg_dump" in called["cmd"]


def test_restore_verify_script_skips_when_file_missing(monkeypatch) -> None:
    import sys

    from scripts import restore_verify

    monkeypatch.setattr(sys, "argv", ["restore_verify.py"])
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    result = restore_verify.main()
    assert result == 1
