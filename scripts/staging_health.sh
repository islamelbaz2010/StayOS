#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

echo "Checking staging service health..."

# Verify all expected containers are running
for svc in postgres redis api worker beat; do
    status=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q "$svc" 2>/dev/null || true)
    if [[ -z "$status" ]]; then
        echo "ERROR: $svc is not running." >&2
        exit 1
    fi
    echo "OK: $svc container found"
done

# Verify health/readiness/metrics/version endpoints from inside the API container
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api python - <<'PY'
import json
import urllib.request

base = "http://localhost:8000"
endpoints = [
    ("/health", "health"),
    ("/health/ready", "readiness"),
    ("/health/deep", "deep health"),
    ("/metrics", "metrics"),
    ("/version", "version"),
]

for path, label in endpoints:
    try:
        with urllib.request.urlopen(f"{base}{path}", timeout=10) as resp:
            status = resp.getcode()
            body = resp.read().decode("utf-8")
            if status >= 400:
                print(f"FAIL: {label} ({path}) -> HTTP {status}")
                raise SystemExit(1)
            print(f"OK: {label} ({path}) -> HTTP {status}")
    except Exception as exc:
        print(f"FAIL: {label} ({path}) -> {exc}")
        raise SystemExit(1)

print("All health checks passed.")
PY
