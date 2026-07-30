# StayOS Closed Beta Checklist

## Founder

- [ ] Staging environment is deployed and stable.
- [ ] First real hosts are identified and invited.
- [ ] Closed beta terms of service and privacy policy are published.
- [ ] Payout/escrow process is understood and communicated to hosts.
- [ ] Support channels (WhatsApp/email) are monitored.
- [ ] Go/No-Go decision is documented with the operations team.

## Admin

- [ ] Admin user exists in staging (`./scripts/staging_seed.sh`).
- [ ] Admin dashboard can list users, units, and reservations.
- [ ] KYC review flow is functional.
- [ ] Host onboarding can be approved or rejected.
- [ ] Payout requests can be reviewed and processed.
- [ ] Audit logs are accessible and legible.

## Host

- [ ] Host can sign up and verify OTP.
- [ ] Host can complete KYC (national ID, address, tax ID).
- [ ] Host can create a unit with coordinates, photos, and amenities.
- [ ] Host can set calendar availability and pricing.
- [ ] Host can see booking requests and approve/reject them.
- [ ] Host can request a payout and view wallet/ledger.
- [ ] Host receives notifications for bookings and payouts.

## Guest

- [ ] Guest can sign up and verify OTP.
- [ ] Guest can search units by location and dates.
- [ ] Guest can view unit details and photos.
- [ ] Guest can create a reservation.
- [ ] Guest can complete payment via Paymob or Stripe.
- [ ] Guest receives booking confirmation and check-in instructions.
- [ ] Guest can cancel according to cancellation policy.

## Operations Team

- [ ] `/health`, `/health/ready`, `/metrics`, and `/version` are reachable.
- [ ] Logs are structured and PII is masked.
- [ ] Sentry is receiving errors.
- [ ] Redis, PostgreSQL, worker, and beat are healthy.
- [ ] Backups are configured and a restore has been verified.
- [ ] Rate limiting is active on public endpoints.

## Support Team

- [ ] Support can access user accounts and booking records.
- [ ] Refund/cancellation workflows are documented.
- [ ] Known issues and workarounds are in the runbook.
- [ ] Escalation path to engineering is defined.

## Finance Team

- [ ] Paymob integration is in sandbox/test mode.
- [ ] Stripe integration is in test mode.
- [ ] Webhook endpoints are configured and signatures verified.
- [ ] Escrow release and payout tasks run on Celery beat.
- [ ] A manual payout process is documented for closed beta.
- [ ] Financial reports can be exported from the ledger/escrow tables.

## Go / No-Go

| Criteria | Status | Owner |
| --- | --- | --- |
| All validation checks pass (ruff, mypy, pytest, build) | | Engineering |
| Staging health checks pass | | Operations |
| End-to-end booking and payment smoke test passes | | Product |
| KYC and payout flows validated | | Operations |
| Provider sandbox credentials tested | | Engineering |
| Backup and rollback tested | | Operations |
| Support and runbook ready | | Support |
| Founder approval | | Founder |

**Decision:**

- [ ] **Go** - Closed beta can start.
- [ ] **No-Go** - Address blockers and reschedule.
