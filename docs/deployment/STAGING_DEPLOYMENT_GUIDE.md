# StayOS Staging Deployment Guide

This guide deploys StayOS into a self-contained Docker Compose staging environment that mirrors the production architecture (PostgreSQL, Redis, FastAPI, Celery worker, Celery beat) without the AWS-managed services.

## 1. Prerequisites

- Docker Engine >= 24.0 and Docker Compose (plugin or standalone).
- Real values for every variable in `.env.staging.example`.
- A PostGIS-compatible PostgreSQL image (`postgis/postgis:16-3.3-alpine`).
- A valid RSA key pair for JWT signing.

## 2. Files Added for Staging

| File | Purpose |
| --- | --- |
| `docker-compose.staging.yml` | Staging service definitions with health checks, resource limits, and dependency ordering. |
| `.env.staging.example` | Template for all required environment variables. |
| `scripts/staging_start.sh` | One-command build + migrate + start. |
| `scripts/staging_stop.sh` | Graceful stop with optional `-v` for volume removal. |
| `scripts/staging_migrate.sh` | Run Alembic migrations. |
| `scripts/staging_rollback.sh` | Roll back one revision or to a specific Alembic revision. |
| `scripts/staging_seed.sh` | Create the first admin user in staging. |
| `scripts/staging_health.sh` | Verify containers and health endpoints. |

## 3. Quick Start

```bash
cp .env.staging.example .env.staging
# Fill .env.staging with real secrets, JWT keys, and provider credentials.
./scripts/staging_start.sh
./scripts/staging_seed.sh
```

The API is then available at `http://localhost:8000`.

## 4. Service Reference

| Service | Image | Purpose | Health Check |
| --- | --- | --- | --- |
| `postgres` | `postgis/postgis:16-3.3-alpine` | Primary database with PostGIS extension. | `pg_isready` |
| `redis` | `redis:7-alpine` | Cache, sessions, rate limiting, Celery broker/backend. | `redis-cli ping` |
| `api` | `stayos/api:staging` | FastAPI application server. | `urllib` request to `/health` |
| `worker` | `stayos/api:staging` | Celery worker consuming `high`, `default`, `low` queues. | `celery inspect ping` |
| `beat` | `stayos/api:staging` | Celery beat scheduler. | None (stateless scheduler) |
| `migrate` | `stayos/api:staging` | One-off Alembic migration runner. | N/A |

## 5. Dependency Ordering

```
postgres, redis (healthy)
    -> migrate (one-off)
    -> api, worker
redis, worker
    -> beat
```

`depends_on` with `condition: service_healthy` guarantees that the API and worker do not start until the backing stores are ready. The beat container depends on the worker so the scheduler does not publish tasks before a worker is online.

## 6. Environment and Secrets

- Copy `.env.staging.example` to `.env.staging` (ignored by Git).
- All third-party providers (Paymob, Stripe, Twilio, Meta, Firebase, AWS S3, Sentry) must have valid staging/sandbox credentials.
- JWT keys must be RS256 PEM strings.
- `CORS_ORIGINS` must list the staging front-end domains.

## 7. Database Migrations

Migrations run automatically during `./scripts/staging_start.sh`. To run manually:

```bash
./scripts/staging_migrate.sh
```

Rollback:

```bash
./scripts/staging_rollback.sh        # one revision
./scripts/staging_rollback.sh <rev>  # specific revision
```

## 8. Celery Worker and Beat

- Worker command: `celery -A app.celery_app worker -Q high,default,low --concurrency=2`.
- Beat command: `celery -A app.celery_app beat -s /tmp/celerybeat-schedule`.
- Beat schedule is defined in `src/app/celery_app.py`.
- A bug where notification task names did not match the beat schedule has been fixed in `src/app/notifications/tasks.py`.

## 9. Health and Metrics

The application exposes:

- `/health` - quick liveness
- `/health/ready` - readiness with DB/Redis checks
- `/health/deep` - deep readiness
- `/metrics` - Prometheus-style metrics
- `/version` - build/version information

Verify staging health:

```bash
./scripts/staging_health.sh
```

## 10. Provider Integration Notes

### Paymob

- Configure the staging Paymob integration with webhook URL `https://<staging-domain>/finance/webhooks/paymob`.
- Use `PAYMOB_HMAC_SECRET` to validate webhook signatures.

### Stripe

- Configure Stripe webhook endpoint for events `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled` at `https://<staging-domain>/finance/webhooks/stripe`.
- Use `STRIPE_WEBHOOK_SECRET`.

### Twilio Verify

- `TWILIO_VERIFY_SERVICE_SID` is required for OTP flows.

### Meta WhatsApp and Firebase

- `META_WHATSAPP_TOKEN` and `META_PHONE_NUMBER_ID` enable WhatsApp notifications.
- Firebase Admin SDK credentials enable Firebase ID token authentication.

### AWS S3

- `S3_LISTINGS_BUCKET` and `S3_KYC_BUCKET` must exist and be writable by the supplied AWS credentials.

## 11. Known Infrastructure Audit Findings Addressed

- `docker-compose.yml` did not include a `beat` service; `docker-compose.staging.yml` adds one.
- `.env.example` was missing `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and `STRIPE_WEBHOOK_SECRET`; these have been added.
- Notification Celery task names did not match the beat schedule; this has been fixed.
- `.env.staging` is now ignored to prevent secret leakage.

## 12. Differences from Production

| Aspect | Staging (Compose) | Production (Terraform) |
| --- | --- | --- |
| Compute | Local Docker containers | AWS ECS Fargate |
| Database | `postgis/postgis` container | AWS RDS PostgreSQL |
| Cache | Redis container | AWS ElastiCache Redis |
| Load balancer | None (localhost/direct) | AWS ALB with HTTPS |
| Secrets | `.env.staging` file | AWS Secrets Manager |
| Networking | Docker bridge | AWS VPC/private subnets |

## 13. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `api` exits on startup | Missing or invalid environment variables | Review `.env.staging` and `docker compose logs api` |
| Migrations fail | PostgreSQL not healthy or PostGIS extension missing | Wait for `postgres` health, then rerun `staging_migrate.sh` |
| Beat schedule not running | Worker not healthy | Check `docker compose logs worker` |
| Health check fails | DB/Redis unreachable | Verify `DATABASE_URL` and `REDIS_URL` point to service names |

## 14. Post-Deployment Verification

Run the operational readiness script and validation suite:

```bash
./scripts/staging_health.sh
ruff check src tests
mypy src
pytest tests
python3 -m build
```
