# StayOS Staging / Closed Beta Runbook

## 1. Start Staging

```bash
./scripts/staging_start.sh
```

This builds images, starts PostgreSQL and Redis, runs Alembic migrations, and then starts API, worker, and beat.

## 2. Stop Staging

```bash
./scripts/staging_stop.sh
```

Remove volumes as well:

```bash
./scripts/staging_stop.sh -v
```

## 3. View Logs

```bash
docker compose -f docker-compose.staging.yml logs -f api
docker compose -f docker-compose.staging.yml logs -f worker
docker compose -f docker-compose.staging.yml logs -f beat
docker compose -f docker-compose.staging.yml logs -f postgres
docker compose -f docker-compose.staging.yml logs -f redis
```

## 4. Database Migrations

Run migrations:

```bash
./scripts/staging_migrate.sh
```

Rollback one revision:

```bash
./scripts/staging_rollback.sh
```

## 5. Create an Admin User

```bash
SEED_ADMIN_EMAIL=admin@stayos.com SEED_ADMIN_PHONE=+201000000000 \
  ./scripts/staging_seed.sh
```

## 6. Health Verification

```bash
./scripts/staging_health.sh
```

Manual checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/ready
curl http://localhost:8000/metrics
curl http://localhost:8000/version
```

## 7. Celery Worker Inspection

Enter the worker container:

```bash
docker compose -f docker-compose.staging.yml exec worker bash
```

Inspect workers and queues:

```bash
celery -A app.celery_app inspect active
celery -A app.celery_app inspect scheduled
celery -A app.celery_app inspect registered
```

## 8. Redis Inspection

```bash
docker compose -f docker-compose.staging.yml exec redis redis-cli
docker compose -f docker-compose.staging.yml exec redis redis-cli INFO keyspace
```

## 9. PostgreSQL Inspection

```bash
docker compose -f docker-compose.staging.yml exec postgres psql -U stayos -d stayos
```

List schemas:

```sql
\dn
```

## 10. Backup

Run the backup script against the running PostgreSQL and Redis containers:

```bash
docker compose -f docker-compose.staging.yml exec api python scripts/backup.py
```

Or from the host, with `DATABASE_URL` and `REDIS_URL` set:

```bash
python scripts/backup.py
```

## 11. Restore and Verify

```bash
python scripts/restore_verify.py <backup_file>
```

## 12. Scaling Workers

For higher load, increase the worker concurrency or run an additional worker service:

```bash
docker compose -f docker-compose.staging.yml up -d --scale worker=2
```

Make sure `REDIS_URL` and `DATABASE_URL` support multiple concurrent connections.

## 13. Common Incidents

### API container keeps restarting

1. `docker compose -f docker-compose.staging.yml logs api`
2. Check for missing env vars or invalid `DATABASE_URL` / `REDIS_URL`.
3. Ensure PostgreSQL and Redis are healthy.

### Migrations fail

1. Restore from backup.
2. Identify the failing revision in `alembic/versions`.
3. Fix the migration or apply a manual fix, then run `staging_migrate.sh`.

### Celery tasks not processing

1. Check worker logs for broker connection errors.
2. Verify `REDIS_URL` is reachable.
3. Run `celery -A app.celery_app inspect ping`.

### Webhooks not received

1. Confirm the staging host is reachable from the internet.
2. Check Paymob/Stripe webhook URLs point to `/finance/webhooks/paymob` and `/finance/webhooks/stripe`.
3. Verify webhook secrets.

## 14. Contact / Escalation

- Engineering lead / on-call is responsible for deployment and rollback decisions.
- Keep provider sandbox dashboards open during closed beta to verify transactions.
