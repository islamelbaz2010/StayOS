# StayOS Production Risk Register

## Critical

### 1. RDS PostgreSQL does not explicitly enable PostGIS

- **Problem:** The Terraform RDS definition uses `engine = "postgres"` and does not create a parameter group that guarantees the `postgis` extension required by migration `001_create_schemas` and `geoalchemy2` geometry columns.
- **Impact:** Migration `CREATE EXTENSION postgis` can fail on RDS, blocking all deployments.
- **Probability:** Medium-High.
- **Recommended fix:** Add an RDS `aws_db_parameter_group` with `rds.custom_pg_extensions` enabled and confirm the master user can create `postgis`; test migrations against an RDS instance before production.
- **Priority:** P0.

### 2. `app.security.secrets.SecretsManager` AWS backend is unimplemented

- **Problem:** `SecretsManager.get` falls back to `SecretNotFoundError` when an ARN is supplied, and `__init__` defaults `secret_arn` to `settings.SENTRY_DSN` for all secrets.
- **Impact:** In production, if `AWS_SECRETS_ARN_*` variables are set, the application cannot retrieve secrets from AWS Secrets Manager and crashes on startup.
- **Probability:** High if Secrets Manager is used.
- **Recommended fix:** Implement `boto3` `get_secret_value` calls per ARN and remove the `SENTRY_DSN` default. Until then, inject all secrets as environment variables.
- **Priority:** P1.

## High

### 3. Celery beat schedule references did not match notification task names

- **Problem:** `app.celery_app.py` scheduled `app.notifications.tasks.process_*` while the tasks were registered with `name="notifications.process_*"`.
- **Impact:** Pending notification retry and outbox tasks were never triggered by the scheduler.
- **Probability:** Certain (already present before fix).
- **Recommended fix:** Fixed in `src/app/notifications/tasks.py` by removing explicit task names. Verify in staging with `celery -A app.celery_app inspect registered`.
- **Priority:** P1.

### 4. Terraform ECS task definitions only inject `DATABASE_URL` and `REDIS_URL`

- **Problem:** `infra/terraform/ecs.tf` exposes `DATABASE_URL` and `REDIS_URL` as secrets, but other required secrets (Firebase, Twilio, Paymob, Stripe, S3, Sentry, JWT) are only listed in `secrets.tf` and not attached to the task definition.
- **Impact:** ECS tasks fail to start because `pydantic-settings` requires those values.
- **Probability:** High.
- **Recommended fix:** Add remaining secrets to the `secrets` block of `api` and `worker` container definitions in `ecs.tf`.
- **Priority:** P1.

### 5. `.env.example` was missing required variables

- **Problem:** `.env.example` did not contain `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, or `STRIPE_WEBHOOK_SECRET`.
- **Impact:** New environments fail to start or Stripe webhooks cannot be verified.
- **Probability:** High for new deployments.
- **Recommended fix:** Fixed in `.env.example` and `.env.staging.example`. Audit other environment templates for completeness.
- **Priority:** P2.

## Medium

### 6. No `beat` service in development `docker-compose.yml`

- **Problem:** The development compose only defines `api` and `worker`; periodic Celery tasks do not run in local development unless started manually.
- **Impact:** Developers may miss scheduled-task failures.
- **Probability:** Medium.
- **Recommended fix:** Add a `beat` service to `docker-compose.yml` or document how to run `celery beat` locally.
- **Priority:** P2.

### 7. Dockerfile does not define a `HEALTHCHECK`

- **Problem:** The image has no built-in `HEALTHCHECK` instruction.
- **Impact:** Orchestrators rely on compose-level or load-balancer health checks only.
- **Probability:** Low-Medium.
- **Recommended fix:** Add `HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"` to the Dockerfile.
- **Priority:** P2.

### 8. Terraform ElastiCache single node with `automatic_failover_enabled = false`

- **Problem:** The Redis cluster is a single cache.t3.micro node without failover.
- **Impact:** Redis outage stops Celery, sessions, rate limiting, and caching.
- **Probability:** Medium.
- **Recommended fix:** For production, use a multi-node replication group with automatic failover enabled.
- **Priority:** P2.

## Low

### 9. `docker-compose.yml` mounts host `src` and uses `--reload` implicitly

- **Problem:** Development compose mounts `src` and `alembic` and runs `uvicorn` directly without `--reload`; staging should never use host mounts.
- **Impact:** Staging could accidentally use development bind mounts if `docker-compose.yml` is reused.
- **Probability:** Low (separate `docker-compose.staging.yml` now exists).
- **Recommended fix:** Use `docker-compose.staging.yml` for staging; keep `docker-compose.yml` for development.
- **Priority:** P3.

### 10. `backup.py` uses `redis-cli BGSAVE` without persistence check

- **Problem:** The backup script triggers `BGSAVE` but does not wait for or verify the resulting RDB file.
- **Impact:** Redis backup may be incomplete if the command is run concurrently or persistence is disabled.
- **Probability:** Low.
- **Recommended fix:** Wait for `LASTSAVE` to change or use `SAVE` in a maintenance window; copy the RDB from the container.
- **Priority:** P3.

## Risk Summary

| Severity | Count | Status |
| --- | --- | --- |
| Critical | 2 | 1 fixed, 1 needs Terraform verification |
| High | 3 | 2 fixed, 1 needs ECS task update |
| Medium | 3 | Documented |
| Low | 2 | Documented |
