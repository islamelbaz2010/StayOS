#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down "$@"

echo "Staging environment stopped."
