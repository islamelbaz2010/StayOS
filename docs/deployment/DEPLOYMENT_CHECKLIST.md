# StayOS Deployment Checklist

Use this checklist before and during every staging or production deployment.

## Pre-Deployment

- [ ] `.env.staging` (or `.env.production`) is populated with real values.
- [ ] `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are valid RS256 PEM strings.
- [ ] Third-party provider credentials are active and set to sandbox/staging:
  - [ ] Paymob API key, HMAC secret, integration ID, iframe ID
  - [ ] Stripe secret key and webhook secret
  - [ ] Twilio account SID, auth token, Verify service SID
  - [ ] Meta WhatsApp token and phone number ID
  - [ ] Firebase project ID, client email, private key
  - [ ] AWS access key/secret and S3 bucket names
  - [ ] Sentry DSN
- [ ] Database URL points to the correct host and database name.
- [ ] Redis URL points to the correct host and logical DB.
- [ ] CORS origins include the intended front-end domains.
- [ ] Docker images build cleanly:
  - [ ] `docker compose -f docker-compose.staging.yml build`
- [ ] Latest application image is tagged (`stayos/api:staging` or ECR URI).

## Migration

- [ ] A database backup exists before migration.
- [ ] Migration runs cleanly:
  - [ ] `alembic upgrade head` in the migrate container
- [ ] Rollback revision is identified in case of failure.

## Deployment

- [ ] Infrastructure services are healthy:
  - [ ] PostgreSQL
  - [ ] Redis
- [ ] API container starts and passes health check.
- [ ] Worker container starts and passes `celery inspect ping`.
- [ ] Beat container starts without errors.
- [ ] Logs show no errors for startup, migrations, or Celery connection.

## Post-Deployment

- [ ] `./scripts/staging_health.sh` returns all checks OK.
- [ ] `/health/ready` returns `{"status": "ok"}`.
- [ ] `/metrics` is reachable.
- [ ] Test transactions are processed through each provider in sandbox mode:
  - [ ] Paymob payment flow and webhook
  - [ ] Stripe payment intent and webhook
  - [ ] Twilio OTP send/verify
  - [ ] Meta WhatsApp notification
  - [ ] Firebase ID token authentication
- [ ] A backup is successfully created:
  - [ ] `python scripts/backup.py`
- [ ] Sentry receives a test event (if configured).

## Rollback Trigger

- [ ] Rollback is initiated if any critical check fails or payment webhooks are not processed correctly.
