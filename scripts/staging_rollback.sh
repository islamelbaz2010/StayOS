#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

REVISION="${1:--1}"

echo "Rolling back to revision $REVISION..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile migrate run --rm migrate alembic downgrade "$REVISION"

echo "Rollback complete."
