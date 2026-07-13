# 10 — Security Model

**Cross-references**: [08_RBAC.md](08_RBAC.md) · [09_EXTERNAL_SERVICES.md](09_EXTERNAL_SERVICES.md) · [ADR-006](../architecture/adr/ADR-006-authentication-strategy.md) · [ADR-007](../architecture/adr/ADR-007-deployment-strategy.md) · [ADR-009](../architecture/adr/ADR-009-storage-strategy.md) · [ENGINEERING_RULES.md](../../ENGINEERING_RULES.md)

---

## 1. Threat Model

### 1.1 Attacker Profiles

| Profile | Goal | Likelihood | Impact |
|---------|------|-----------|--------|
| **Fraudulent Host** | List fake properties, collect deposits, never host | HIGH (Egyptian market) | HIGH |
| **Fraudulent Guest** | Book and dispute fraudulently to extract refunds | MEDIUM | MEDIUM |
| **Payment Fraud** | Use stolen cards or wallet credentials | HIGH | HIGH |
| **Account Takeover** | Steal guest/host account for fraudulent bookings | MEDIUM | HIGH |
| **Data Scraper** | Extract listing data and user contacts for competitors | LOW | MEDIUM |
| **Insider Threat** | Employee or contractor misuses admin access | LOW | HIGH |
| **External API Attacker** | Exploit API endpoints for data exfiltration or DoS | MEDIUM | MEDIUM |

### 1.2 Trust Boundaries

```
Internet (untrusted)
    ↓
AWS WAF + ALB (edge)
    ↓
FastAPI application (partially trusted — all input validated)
    ↓
Internal services: Celery, Redis, PostgreSQL (trusted — VPC-only)
    ↓
External APIs: Paymob, Stripe, Meta, Firebase (third-party trusted)
```

Data never flows from external APIs directly into the database without validation and sanitization in the service layer.

---

## 2. OWASP Top 10 Controls

| OWASP Category | Control Implemented |
|---------------|-------------------|
| **A01 Broken Access Control** | RBAC (role claim + ownership check), no direct object references in public APIs, audit log |
| **A02 Cryptographic Failures** | TLS 1.3 enforced; SSE-KMS for KYC bucket; bcrypt not needed (Firebase manages passwords); no PII in logs |
| **A03 Injection** | SQLAlchemy parameterized queries only; Pydantic validates all inputs; no raw SQL in application code |
| **A04 Insecure Design** | Threat model documented; trust boundaries enforced; escrow before payout; KYC before host |
| **A05 Security Misconfiguration** | Bandit in CI; WAF rules; S3 bucket policies block public; no default credentials |
| **A06 Vulnerable Components** | Safety in CI (dependency vulnerability scan); Dependabot on GitHub; no abandoned packages |
| **A07 Auth Failures** | Firebase token verification; OTP rate limiting; session revocation on ban |
| **A08 Data Integrity Failures** | Webhook HMAC verification (Paymob, Stripe); Outbox pattern prevents lost events |
| **A09 Security Logging** | All auth failures logged to CloudWatch; audit log for admin actions; Sentry for exceptions |
| **A10 Server-Side Request Forgery** | No URL-fetching endpoints; S3 pre-signed URLs scoped; Google Maps API key restricted by referrer |

---

## 3. PII Classification and Handling

| Data Element | Classification | Storage | Access | Retention |
|-------------|---------------|---------|--------|-----------|
| Phone number | PII — Sensitive | PostgreSQL (encrypted at rest via RDS) | Auth service only | 7 years post-account closure |
| Email address | PII | PostgreSQL | Auth service + notification | 7 years |
| Display name | PII | PostgreSQL | Auth service | 7 years |
| National ID scan | PII — Highly Sensitive | S3 KYC bucket (SSE-KMS) | Auth service + Admin only | 7 years (legal requirement) |
| Biometric similarity score | PII — Sensitive | PostgreSQL `kyc_records` | Auth service + Admin | 7 years |
| Bank account details | PII — Financial | Paymob/Stripe vault (not stored in StayOS DB) | Finance service via API | Managed by Paymob/Stripe |
| GPS coordinates of unit | Business data | PostgreSQL | All authenticated users | Indefinite (listing data) |
| Booking history | Business data | PostgreSQL | Guest/host (own), Admin (all) | 7 years |
| WhatsApp phone | PII (same as phone) | Meta systems only | Notification service | Managed by Meta |

**PII in logs**: Prohibited. Logs contain only UUIDs, event types, and error codes. No phone numbers, emails, or names in any log statement.

**PII in Celery tasks**: Task arguments must not contain PII. Pass UUIDs only; the task handler fetches PII from the database on execution.

---

## 4. KYC Security

### 4.1 Document Upload Security

- Upload via S3 pre-signed PUT URL (generated server-side, scoped to specific S3 key, 15-minute TTL)
- No document data passes through StayOS servers — uploaded directly from browser to S3
- S3 key format: `kyc/{user_id}/{timestamp}/{document_type}.jpg` — no guessable paths
- KYC bucket has no public access. Documents accessed only via server-side `get_object` with IAM role

### 4.2 KYC Verification Chain

```
User uploads doc → S3 KYC bucket
    → S3 event notification → SQS → Lambda trigger
    → Textract: extract fields (name, ID number, expiry)
    → Rekognition: compare document photo with selfie
    → Score stored in kyc_records (NOT the document content — OCR result in JSONB only)
    → If score ≥ 90: pending_review OR auto-approve (ADMIN configurable threshold)
    → Admin reviews marginal cases (80–89%)
    → Status update → event emitted → user notified via WhatsApp
```

### 4.3 Document Retention

KYC documents in S3 are subject to lifecycle policy: move to S3 Glacier after 90 days (reduces cost), delete after 7 years (regulatory requirement). A deletion notice is sent to the user before deletion.

---

## 5. Encryption

### 5.1 In Transit

- TLS 1.3 enforced on all external connections (ALB → client, ALB → services)
- TLS 1.2 minimum for internal service connections
- AWS Certificate Manager (ACM) for certificate management
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 5.2 At Rest

| Data | Encryption |
|------|-----------|
| PostgreSQL (RDS) | AWS RDS encryption at rest (AES-256) |
| Redis (ElastiCache) | ElastiCache encryption at rest |
| S3 listings bucket | SSE-S3 (AES-256) |
| S3 KYC bucket | SSE-KMS with Customer Managed Key (CMK) — separate key per environment |
| S3 ops bucket | SSE-S3 |
| Secrets Manager | KMS-encrypted by default |
| CloudWatch Logs | KMS-encrypted log groups |

---

## 6. Secrets Management

All secrets stored in **AWS Secrets Manager**. No secrets in:
- Environment variables (except non-sensitive config like feature flags)
- Docker images
- Git repository (TruffleHog scans every push — see CI)
- Application logs

**Secret rotation**: Paymob, Stripe, and Twilio credentials rotated every 90 days using Secrets Manager rotation Lambda.

**Namespace structure**:
```
stayos/
  paymob/api_key
  paymob/hmac_secret
  stripe/secret_key
  stripe/webhook_secret
  twilio/account_sid
  twilio/auth_token
  firebase/service_account         ← JSON blob
  google_maps/api_key
  meta/whatsapp_token
  db/postgres_url                  ← includes password
  redis/url
```

**Access**: Each ECS task has an IAM role granting access only to the secrets it needs. The notification service cannot read payment secrets. Principle of least privilege.

---

## 7. Input Validation and Injection Prevention

### 7.1 API Input Validation

All API inputs validated by **Pydantic v2** models before reaching any service logic:
- Phone numbers: validated to E.164 format via `phonenumbers` library
- Dates: `check_in < check_out`, minimum 1 night, maximum 365 nights
- Price amounts: positive integer, maximum 1,000,000 EGP
- UUIDs: strict UUID format validation
- Strings: maximum length enforced, no HTML or script tags (strip via `bleach`)
- File upload sizes: max 10MB per photo, max 20 photos per listing (enforced in pre-signed URL generation)

### 7.2 SQL Injection Prevention

- All database queries use SQLAlchemy 2.0 with parameterized expressions
- Raw SQL is permitted only in Alembic migrations (DDL) — not in application code
- PostGIS spatial queries use GeoAlchemy2 functions — never string interpolation

### 7.3 Webhook Payload Validation

- Paymob: HMAC-SHA512 verification before any processing
- Stripe: `stripe.WebhookSignature.verify_header()` with timestamp tolerance (300 seconds)
- Any webhook with invalid signature → `400 Bad Request` + security log entry

---

## 8. Rate Limiting and DoS Protection

### 8.1 AWS WAF Rules

- Managed rules: AWSManagedRulesCommonRuleSet, AWSManagedRulesBotControlRuleSet
- Rate-based rule: block IPs with > 2,000 requests per 5 minutes
- Geo-restriction: Not applied in Phase 1 (GCC travelers must be able to access from any country)
- SQL injection detection rule: block payloads matching SQLi patterns

### 8.2 Application-Level Rate Limiting

Redis sliding window counters on all endpoints. See [04_API_SPECIFICATION.md §9](04_API_SPECIFICATION.md) for limits.

---

## 9. Security in CI/CD

Every pull request and main branch push runs:

| Tool | What it checks |
|------|---------------|
| `bandit` | Python security static analysis (hardcoded secrets, subprocess calls, pickle) |
| `safety` | Python dependency vulnerability scan (known CVEs in requirements.txt) |
| `trufflehog` | Git history secrets scan (API keys, tokens, passwords in commits) |
| `ruff` | Catches security anti-patterns (assert statements in security code, etc.) |

Security checks are **blocking** — a PR with a bandit HIGH severity finding cannot be merged.

---

## 10. Incident Response

| Severity | Examples | Response Time | Action |
|---------|---------|--------------|--------|
| P0 | Payment processing down, data breach | 15 minutes | PagerDuty → Founder |
| P1 | Double-booking, KYC bypass, fraud signal | 1 hour | Slack alert → team |
| P2 | WhatsApp outage, search degraded | 4 hours | Monitoring → log |
| P3 | Single user issue, cosmetic bug | Next sprint | Ticket |

**Kill-switch protocol**: Admin can delist any unit, suspend any user, or halt all new bookings via the Incident Console. These actions require two-admin confirmation for irreversible actions (suspend platform-wide booking).
