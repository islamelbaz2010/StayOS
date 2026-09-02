#!/bin/sh
set -x

echo "=== Installing PostGIS extension ==="
psql -U postgres -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;" || echo "WARN: PostGIS install failed, continuing..."

echo "=== Running migrations ==="
cd /app
PYTHONPATH=/app/src alembic upgrade head || echo "WARN: Migrations failed, continuing..."

echo "=== Starting API ==="
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
