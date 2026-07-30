#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: $ENV_FILE not found. Copy .env.staging.example to $ENV_FILE and fill in real values." >&2
    exit 1
fi

echo "[1/5] Building staging images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache

echo "[2/5] Starting infrastructure services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

echo "[3/5] Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile migrate run --rm migrate

echo "[4/5] Starting API, worker, and beat..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api worker beat

echo "[5/5] Waiting for API health endpoint..."
sleep 10
./scripts/staging_health.sh

echo "Staging environment is up."
