#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: $ENV_FILE not found." >&2
    exit 1
fi

SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@stayos.com}"
SEED_ADMIN_PHONE="${SEED_ADMIN_PHONE:-+201000000000}"
SEED_ADMIN_NAME="${SEED_ADMIN_NAME:-Staging Admin}"

echo "Seeding staging admin user ($SEED_ADMIN_EMAIL / $SEED_ADMIN_PHONE)..."

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api python - <<PY
import asyncio
import os

os.environ.setdefault("ENVIRONMENT", "staging")

from app.database import AsyncSessionLocal
from app.auth import repository as auth_repository


async def main() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            user = await auth_repository.create_user(
                session,
                email=os.environ["SEED_ADMIN_EMAIL"],
                phone_number=os.environ["SEED_ADMIN_PHONE"],
                display_name=os.environ["SEED_ADMIN_NAME"],
                role="admin",
                kyc_status="verified",
                locale="ar",
            )
            await auth_repository.create_account(session, user_id=user.id)
    print(f"Created admin user id={user.id}")


asyncio.run(main())
PY

echo "Seed complete."
