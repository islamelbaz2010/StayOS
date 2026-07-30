# StayOS Staging Rollback Plan

## 1. Rollback Triggers

A rollback should be initiated when any of the following occur during or after a deployment:

- `/health/ready` fails continuously.
- Database migration fails and cannot be fixed within 15 minutes.
- Payment webhooks are not processed or signature verification fails.
- Critical application error rate spikes.
- Customer-facing flows (login, booking, payment) fail in staging.
- Data integrity issue detected in the database.

## 2. Rollback Steps

### Step 1: Stop application containers

```bash
./scripts/staging_stop.sh
```

### Step 2: Restore the database

If a migration caused the issue, roll back to the previous Alembic revision:

```bash
./scripts/staging_rollback.sh <previous_revision>
```

If data was corrupted, restore from a backup:

```bash
python scripts/restore_verify.py <backup_file>
```

### Step 3: Revert application code

If the issue is in the application image:

```bash
docker pull stayos/api:<previous-tag>
docker tag stayos/api:<previous-tag> stayos/api:staging
./scripts/staging_start.sh
```

Or revert the Git commit and rebuild:

```bash
git checkout <previous-commit>
docker compose -f docker-compose.staging.yml build --no-cache
./scripts/staging_start.sh
```

### Step 4: Verify rollback

```bash
./scripts/staging_health.sh
```

Run a smoke test:

```bash
curl -f http://localhost:8000/health/ready
curl -f http://localhost:8000/metrics
```

### Step 5: Notify stakeholders

- Founder / product lead
- Operations / support team
- Finance team if payments were impacted

## 3. Rollback Validation

- [ ] `/health` returns `ok`.
- [ ] `/health/ready` confirms DB and Redis connectivity.
- [ ] `/metrics` is reachable.
- [ ] Login flow works.
- [ ] A test booking can be created.
- [ ] Test payment is processed or webhook test succeeds.
- [ ] No errors in Sentry.

## 4. Post-Rollback Actions

- Root cause analysis within 24 hours.
- Update runbook with any new failure mode.
- Fix forward and redeploy only after successful local and staging tests.

## 5. Production Rollback Notes

For production (Terraform / ECS):

1. Revert the image tag in the ECS task definition to the previous ECR digest.
2. Roll back RDS using a snapshot if database corruption occurred.
3. Use the AWS CLI or Terraform to force a new deployment.
4. Validate via target-group health checks and `/health/ready`.
