# StayOS Go-Live Checklist

## Domain and TLS

- [ ] Production domain is registered and DNS points to the load balancer.
- [ ] HTTPS certificate is installed and auto-renews.
- [ ] HTTP redirects to HTTPS.
- [ ] HSTS and security headers are verified.

## Infrastructure

- [ ] AWS ECS task definitions use pinned image digests.
- [ ] RDS PostgreSQL is multi-AZ or has a read replica if needed.
- [ ] ElastiCache Redis has automatic failover enabled.
- [ ] S3 buckets block public access and enforce server-side encryption.
- [ ] Secrets Manager values are rotated and access is IAM-restricted.
- [ ] Terraform state is in S3 with DynamoDB locking.

## Application

- [ ] `ENVIRONMENT=production` is set.
- [ ] `LOG_LEVEL` is `INFO` or `WARNING`.
- [ ] `CORS_ORIGINS` is limited to production front-end domains.
- [ ] Sentry sample rates are appropriate for production load.
- [ ] Rate limits are enabled.
- [ ] Celery beat schedule matches production task requirements.

## Payments

- [ ] Paymob production credentials and webhook HMAC secret are configured.
- [ ] Stripe production secret key and webhook secret are configured.
- [ ] Webhook URLs point to `https://api.stayos.com/finance/webhooks/*`.
- [ ] Escrow release, refund, and payout flows are tested with small real transactions.
- [ ] Payout provider accounts are verified and linked.

## Communications

- [ ] Twilio production Verify service is active.
- [ ] Meta WhatsApp business account is approved and phone number is live.
- [ ] Firebase project is production and app bundles are configured.
- [ ] Email/SMS notification templates are final.

## Monitoring and Operations

- [ ] CloudWatch and Sentry dashboards are set up.
- [ ] On-call rotation is active.
- [ ] Backup schedules are running.
- [ ] Disaster recovery plan is tested.
- [ ] Runbook is distributed to the operations team.

## Legal and Compliance

- [ ] Terms of service, privacy policy, and host terms are live.
- [ ] KYC/data retention policies comply with local regulations.
- [ ] Audit logging is enabled and retained.
- [ ] PCI/Sensitive payment data handling follows provider guidelines.

## Launch Sequence

1. [ ] Final production deployment window agreed.
2. [ ] Database migrations run during maintenance window.
3. [ ] Smoke tests against production `/health/ready`.
4. [ ] Founder and support team online during first 4 hours.
5. [ ] Monitor Sentry, CloudWatch, and provider dashboards.
6. [ ] Go/No-Go call 2 hours after launch.
