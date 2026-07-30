# DELIVERY BLOCKER MATRIX — StayOS

**Source document:** `TECHNICAL_AUDIT_REPORT.md`  
**Audit date:** 2026-07-30  
**Author:** Executive Delivery Auditor  
**Purpose:** Reclassify every technical-audit finding by delivery impact for sprint and release planning.

---

## 1. Executive Summary

Every finding from `TECHNICAL_AUDIT_REPORT.md` has been reclassified into one of five delivery-impact buckets. The matrix is evidence-based, using the sprint and release data in `STAYOS_IMPLEMENTATION_BASELINE.md`, the engineering backlog, and the `MASTER_EXECUTION_BOARD.md` Sprint 0 exit criteria.

**Headline counts:**

| Delivery classification | Count | Meaning |
|------------------------|-------|---------|
| **Execution Blocker** | 7 | Engineering cannot start on a track until these are resolved. |
| **Sprint Blocker** | 28 | Work can start, but the planned sprint cannot be completed. |
| **Release Blocker** | 4 | Development is not blocked, but Alpha/Beta cannot ship. |
| **Production Blocker** | 2 | Release-candidate work is not blocked, but production deployment is. |
| **Future Enhancement** | 3 | Can be safely deferred. |
| **TOTAL** | **44** | — |

**Key consequence:** Implementation cannot start today. Sprint 0 is blocked by governance items from the master board and by technical execution blockers in Terraform/CI. Alpha and production are blocked by a deep backlog of unbuilt features.

---

## 2. Reclassification Methodology

For each finding the following evidence was used:

* `STAYOS_IMPLEMENTATION_BASELINE.md` requirement traceability matrix (REQ-IDs with sprints and releases).
* `STAYOS_IMPLEMENTATION_BASELINE.md` epic coverage matrix (E-01 through E-23, status and sprint).
* `STAYOS_IMPLEMENTATION_BASELINE.md` production-readiness matrix.
* `docs/system-design/04_API_SPECIFICATION.md` and `05_DATABASE_DESIGN.md`.
* `MASTER_EXECUTION_BOARD.md` Sprint 0 critical path, open blockers, and exit criteria (EXIT-01 through EXIT-22).
* `docs/ENGINEERING_MASTER_PLAN.md` and `docs/system-design/14_ENGINEERING_BACKLOG.md` for S2+ task mapping.

The "Previous Severity" values are taken directly from `TECHNICAL_AUDIT_REPORT.md`. The "Delivery Classification" is the new single category assigned by this audit.

---

## 3. Full Reclassification Matrix

| Finding ID | Previous Severity | Delivery Classification | Reason | Affected Sprint | Can be deferred? | Recommended milestone |
|------------|-------------------|-------------------------|--------|-----------------|------------------|-----------------------|
| **ARC-01** | HIGH | Execution Blocker | AWS primary region does not match ADR-007; Terraform backend, provider, and CI all use `me-south-1` while ADR-007 says `me-central-1`. `MASTER_EXECUTION_BOARD.md` CP-1 / BLK-04 cannot close until this is decided. | S0 (foundation) | NO | Sprint |
| **INF-01** | HIGH | Execution Blocker | Invalid HCL in `infra/terraform/main.tf` (`Project var.project_name` missing `=`) causes `terraform validate`/`plan` to fail. No infrastructure can be provisioned. | S0 | NO | Sprint |
| **INF-02** | MEDIUM | Execution Blocker | S3 backend references `dynamodb_table = "stayos-terraform-locks"` but no `aws_dynamodb_table` resource is defined. State locking cannot be established. | S0 | NO | Sprint |
| **INF-03** | HIGH | Execution Blocker | `deploy-staging.yml` and `deploy-prod.yml` contain `subnet-xxx` / `sg-xxx` placeholders and require unconfigured GitHub Secrets. CI/CD cannot run. | S0 | NO | Sprint |
| **INF-04** | HIGH | Execution Blocker | Same as ARC-01 (region mismatch). Infrastructure provisioning is blocked until the region decision is committed. | S0 | NO | Sprint |
| **INF-05** | MEDIUM | Execution Blocker | `aws_acm_certificate` in `alb.tf` uses DNS validation but no Route 53 zone or validation records are defined; `terraform apply` will hang/fail. | S0 | NO | Sprint |
| **MOB-01** | CRITICAL | Execution Blocker | No mobile framework selected and zero mobile code. `MASTER_EXECUTION_BOARD.md` BLK-03 blocks all of Track D. | S0 | NO | Sprint |
| **ARC-05** | MEDIUM | Sprint Blocker | Frontend is only a four-page scaffold; `MASTER_EXECUTION_BOARD.md` EXIT-09/10/11/12 require Next.js on Vercel, RTL, typed API client, and OTP login. | S0 | NO | Sprint |
| **FE-01** | CRITICAL | Sprint Blocker | Only 5 pages, no product components, no API client, no auth/booking/host UI. Same root cause as ARC-05, assessed at CRITICAL severity. | S0 | NO | Sprint |
| **FE-02** | MEDIUM | Sprint Blocker | Translation JSON files exist but no i18n middleware/config; `MASTER_EXECUTION_BOARD.md` EXIT-10 requires `/ar/` RTL + `/en/` LTR confirmed. | S0 | NO | Sprint |
| **BCK-01** | HIGH | Sprint Blocker | No listing photo upload. `MASTER_EXECUTION_BOARD.md` EXIT-16 expects a photo test, and `STAYOS_IMPLEMENTATION_BASELINE.md` REQ-021 is S3. | S0 / S3 | NO | Sprint |
| **BCK-02** | HIGH | Sprint Blocker | Egyptian wallet payment methods (Fawry/Meeza/Vodafone/InstaPay) not configured. `MASTER_EXECUTION_BOARD.md` EXIT-19 requires `paymob_iframe_url` in reservations; baseline REQ-062-065 is S5. | S0 / S3 | NO | Sprint |
| **DB-01** | HIGH | Sprint Blocker | `pms.unit_photos` table missing. Same root cause as BCK-01; S0/S3 deliverable. | S0 / S3 | NO | Sprint |
| **BCK-05** | HIGH | Sprint Blocker | Redis rate-limiter pipeline commands are not awaited; rate limiting may silently fail. S0 security hardening. | S0 | NO | Sprint |
| **SEC-02** | HIGH | Sprint Blocker | Same as BCK-05 (rate limiter ineffective). S0 security hardening. | S0 | NO | Sprint |
| **BCK-06** | MEDIUM | Sprint Blocker | Bare `except Exception: pass` in audit/auth/finance/kyc hides failures and can leak unmasked PII. S0 hardening. | S0 | NO | Sprint |
| **SEC-03** | MEDIUM | Sprint Blocker | Same as BCK-06 (exception swallowing). S0 hardening. | S0 | NO | Sprint |
| **SEC-01** | HIGH | Sprint Blocker | AWS Secrets Manager runtime fetch is not implemented. `MASTER_EXECUTION_BOARD.md` EXIT-18 requires secrets loaded from AWS SM on startup. | S0 | NO | Sprint |
| **SEC-04** | LOW | Sprint Blocker | CORS allows all methods and headers. `MASTER_EXECUTION_BOARD.md` EXIT-20 explicitly requires "CORS wildcard eliminated". | S0 | NO | Sprint |
| **DOC-01** | MEDIUM | Sprint Blocker | `.venv` is not populated; `bandit`/`safety` run on system Python 3.14 and fail. QA Foundation track cannot rely on reproducible tooling. | S0 | NO | Sprint |
| **DOC-02** | MEDIUM | Sprint Blocker | `safety check` cannot scan dependencies (`pkg_resources` missing). CI security scan step is non-functional. | S0 | NO | Sprint |
| **TST-01** | MEDIUM | Sprint Blocker | 13,865 pytest warnings indicate unawaited coroutines in `rate_limit.py` and `audit.py`; S0 CI should be clean. | S0 | NO | Sprint |
| **TST-02** | HIGH | Sprint Blocker | Web/mobile/E2E test coverage is 0%. `MASTER_EXECUTION_BOARD.md` EXIT-21 requires Playwright smoke 3/3 green in CI. | S0 | NO | Sprint |
| **TST-03** | HIGH | Sprint Blocker | `bandit` and `safety` fail to run on Python 3.14. CI security gates cannot pass. | S0 | NO | Sprint |
| **ARC-02** | HIGH | Sprint Blocker | `pg_trgm`/`unaccent` not installed; `docs/system-design/14_ENGINEERING_BACKLOG.md` EPC-03-003 is an S2 deliverable. | S2 | NO | Sprint |
| **DB-04** | HIGH | Sprint Blocker | Same as ARC-02 (trigram extensions missing). S2 search deliverable. | S2 | NO | Sprint |
| **DB-05** | MEDIUM | Sprint Blocker | `pms.pricing_tiers` missing; `docs/system-design/05_DATABASE_DESIGN.md` and `14_ENGINEERING_BACKLOG.md` EPC-03-001 list it as S2. | S2 | NO | Sprint |
| **API-03** | MEDIUM | Sprint Blocker | Missing `POST /listings/{id}/photos`, `PUT /listings/{id}/pricing`, all `/api/v1/admin/*`, and `/api/v1/stream/*`. Baseline maps photo/pricing to S3, admin/stream to S6. | S3 / S6 | NO | Sprint |
| **ARC-03** | MEDIUM | Sprint Blocker | FCM / push notifications not implemented. `STAYOS_IMPLEMENTATION_BASELINE.md` E-19 is S4 and BLOCKED. | S4 | NO | Sprint |
| **BCK-04** | MEDIUM | Sprint Blocker | Device-token endpoint missing. Same root cause as ARC-03; S4/REQ-057. | S4 | NO | Sprint |
| **MOB-02** | HIGH | Sprint Blocker | Device-token table missing. Same as ARC-03/BCK-04; S4. | S4 | NO | Sprint |
| **DB-02** | MEDIUM | Sprint Blocker | `auth.device_tokens` table missing. Same as ARC-03; S4. | S4 | NO | Sprint |
| **BCK-03** | MEDIUM | Sprint Blocker | Admin / incident-console endpoints missing. `STAYOS_IMPLEMENTATION_BASELINE.md` admin screens SCR-057-069 are S6. | S6 | NO | Sprint |
| **ARC-04** | MEDIUM | Sprint Blocker | Real-time messaging / SSE not implemented. `STAYOS_IMPLEMENTATION_BASELINE.md` E-08/E-20 is S6. | S6 | NO | Sprint |
| **DB-03** | MEDIUM | Sprint Blocker | Messaging and reviews schemas not created. Same as ARC-04; S6/S7. | S6 / S7 | NO | Sprint |
| **API-02** | MEDIUM | Release Blocker | Pagination uses offset/limit instead of the cursor-based contract in `04_API_SPECIFICATION.md`. Does not block S0-S1, but the public API cannot be frozen for Alpha without it. | S2 / S3 | NO | Alpha |
| **SEC-06** | MEDIUM | Release Blocker | CSP `script-src 'self'` will block Paymob iframe and Stripe redirects, breaking the Alpha payment flow. | S3 / S4 | NO | Alpha |
| **FE-03** | HIGH | Release Blocker | `npm audit` reports 18 high/critical CVEs in Next.js/postcss/minimatch. Cannot ship a vulnerable frontend to Alpha. | S0 | NO | Alpha |
| **DOC-03** | HIGH | Release Blocker | Same as FE-03 (frontend dependency CVEs). | S0 | NO | Alpha |
| **INF-06** | MEDIUM | Production Blocker | WAF, CloudFront, auto-scaling, alerting, log aggregation, and backup scheduling are not defined. Required for production readiness. | S7 / S8 | NO | Production |
| **SEC-07** | MEDIUM | Production Blocker | `python-jose` is a known source of JWT CVEs; cannot be in a production release. | S7 / S8 | NO | Production |
| **API-01** | LOW | Future Enhancement | Error response format is not RFC 7807. No consumers are built yet; can be aligned later. | N/A | YES | Future |
| **SEC-05** | LOW | Future Enhancement | HSTS always enabled regardless of environment. Only a local-dev nuisance; can be gated later. | N/A | YES | Future |
| **TST-04** | LOW | Future Enhancement | Backend coverage is uneven in Celery tasks and notifications. 80% gate is met; tests can be backfilled. | N/A | YES | Future |

---

## 4. Execution Blockers

These 7 findings prevent engineering tracks from starting. They are the highest-priority pre-Sprint 0 items.

1. **ARC-01 / INF-04 — AWS region mismatch**  
   The master board lists `BLK-04 AWS region undecided` with a Day 1 SLA. Terraform, S3 backend, and GitHub Actions all currently use `me-south-1`, contradicting ADR-007's primary `me-central-1`. Until the region is decided and the files updated, no infrastructure code can be applied.

2. **INF-01 — Terraform HCL syntax error**  
   `infra/terraform/main.tf` is syntactically invalid. `terraform validate` will fail immediately, so no `plan`/`apply` is possible.

3. **INF-02 — DynamoDB lock table missing**  
   The S3 backend references a state-lock table that is not provisioned in the same codebase. Without it, only local (non-locked) state is possible, which is not a team-safe execution path.

4. **INF-03 — CI/CD placeholder values**  
   `deploy-staging.yml` and `deploy-prod.yml` use `subnet-xxx` and `sg-xxx` placeholders and depend on unconfigured GitHub Secrets. The CI/CD track cannot run.

5. **INF-05 — ALB certificate with no DNS validation**  
   `aws_acm_certificate` for `api.stayos.com` is configured for DNS validation with no Route 53 zone or validation records. `terraform apply` will fail or hang.

6. **MOB-01 — No mobile framework or code**  
   `MASTER_EXECUTION_BOARD.md` `BLK-03` explicitly states the mobile framework decision blocks all of Track D. No scaffold, no iOS/Android directories, no chosen framework.

**Gating decision:** Resolve all of the above before any track can be considered unblocked for Sprint 0.

---

## 5. Sprint Blockers

These 28 findings will prevent the planned sprint from being completed, but work on other tracks can proceed once Execution Blockers are cleared.

### 5.1 Sprint 0 blockers (16 findings)

Sprint 0 is "Engineering Foundation." Its exit criteria (`MASTER_EXECUTION_BOARD.md` EXIT-09 through EXIT-21) directly depend on the following:

* **Frontend foundation:** ARC-05, FE-01, FE-02
* **Photo upload readiness:** BCK-01, DB-01
* **Payment iframe readiness:** BCK-02
* **Security hardening:** BCK-05, BCK-06, SEC-01, SEC-02, SEC-03, SEC-04
* **Reproducible tooling / QA:** DOC-01, DOC-02, TST-01, TST-02, TST-03

### 5.2 Sprint 2 blockers (3 findings)

* **ARC-02 / DB-04 — `pg_trgm`/`unaccent` missing**  
  The engineering backlog EPC-03-003 is an S2 deliverable.
* **DB-05 — `pms.pricing_tiers` missing**  
  Engineering backlog EPC-03-001 is an S2 deliverable.

### 5.3 Sprint 3 / Sprint 6 blockers (1 finding)

* **API-03 — Missing photo, pricing, admin, and stream endpoints**  
  The photo/pricing parts are required for S3 PMS; the admin/stream parts are required for S6.

### 5.4 Sprint 4 blockers (4 findings)

* **ARC-03, BCK-04, MOB-02, DB-02 — Push / device-token stack missing**  
  `STAYOS_IMPLEMENTATION_BASELINE.md` E-19 (Mobile Notifications) is S4 and currently BLOCKED because the `auth.device_tokens` table and registration endpoint do not exist.

### 5.5 Sprint 6 / Sprint 7 blockers (3 findings)

* **BCK-03 — Admin endpoints missing**  
* **ARC-04 — Messaging / SSE missing**  
* **DB-03 — Messaging and reviews schemas missing**  
  Baseline E-08 (Messaging) and E-09 (Reviews) are S6/S7.

---

## 6. Release Blockers

These 4 findings do not stop sprint work, but the Alpha/Beta release cannot ship until they are resolved.

1. **API-02 — Offset pagination instead of cursor**  
   The API specification requires cursor-based pagination. Shipping a public Alpha with offset pagination is a contract-breaking change later. Fix before Alpha.

2. **SEC-06 — CSP blocks Paymob iframe**  
   The current CSP `script-src 'self'` will break the Paymob iframe and Stripe redirects in the booking flow. The Alpha payment path cannot work until this is corrected.

3. **FE-03 / DOC-03 — Frontend dependency CVEs**  
   `npm audit` reports 18 high/critical vulnerabilities. A vulnerable Next.js build cannot be released to users.

---

## 7. Production Blockers

These 2 findings are acceptable for a Beta/RC build but must be resolved before production deployment.

1. **INF-06 — Missing operational infrastructure**  
   WAF, CloudFront, auto-scaling, alerting, log aggregation, and backup scheduling are absent. The `STAYOS_IMPLEMENTATION_BASELINE.md` production-readiness matrix marks these as NOT DONE.

2. **SEC-07 — `python-jose` dependency**  
   `python-jose` has a history of JWT vulnerabilities and is less maintained than `PyJWT`/`joserfc`. It cannot remain in the production artifact.

---

## 8. Future Enhancements

These 3 findings can be safely deferred beyond the current delivery plan.

1. **API-01 — RFC 7807 error format**  
   The current custom error shape works for internal consumers. Align to RFC 7807 when external clients or SDKs are built.

2. **SEC-05 — HSTS always enabled**  
   Only affects local development; gate by environment when convenient.

3. **TST-04 — Uneven backend coverage**  
   Overall coverage is 80.42%; add tests for Celery tasks and notification providers after the release gate is cleared.

---

## 9. Critical Path

The following `MASTER_EXECUTION_BOARD.md` critical-path nodes are directly tied to reclassified findings:

| Critical Path Node | Master Board Task | Affected Finding(s) |
|--------------------|-------------------|---------------------|
| CP-1 | A-04 AWS Region Decision | ARC-01, INF-04 |
| CP-2 | E-01 Fix Terraform | INF-01, INF-02, INF-05 |
| CP-3 | E-02 GitHub Secrets | INF-03 |
| CP-4 | E-03 Terraform Apply | INF-01, INF-02, INF-05 |
| CP-5 | E-04 Secrets Manager | SEC-01 |
| CP-6 | B-08 Wire Secrets in Code | SEC-01 |
| CP-7 | E-05 First Deployment | INF-03 |
| CP-9 | F-03+F-04 E2E Smoke Tests | TST-02 |
| CP-10 | F-06 Smoke in CI | TST-02, TST-03 |
| CP-11 | EXIT-22 Sprint 1 Authorized | All unresolved S0 Sprint/Execution blockers |

---

## 10. Recommended Sprint Order

The order is derived from the dependency chain in the master board and the baseline. It does not invent new work; it only sequences the existing findings.

1. **Sprint 0 — Engineering Foundation**  
   Resolve all 7 Execution Blockers first, then the 16 Sprint 0 blockers. This unblocks the CI/CD, frontend, backend hardening, and QA tracks.

2. **Sprint 1 — Backend Core Completion**  
   Resolve the remaining backend Sprint 0 fallout (photo upload, Paymob iframe, AWS SM integration, CSP tuning) and begin the S2 search foundation.

3. **Sprint 2 — Search & PMS Foundation**  
   Address ARC-02, DB-04, DB-05, and API-02 (if not deferred). Complete PostGIS + `pg_trgm` + pricing-tier work.

4. **Sprint 3 — PMS Photo / Pricing / Reservation Payment**  
   Address the S3 portion of API-03, BCK-01, BCK-02, DB-01, and SEC-06.

5. **Sprint 4 — Notifications & Mobile Push**  
   Address ARC-03, BCK-04, MOB-02, DB-02.

6. **Sprint 5 — Finance Payouts & Operations Beta**  
   Complete the S5 finance/operations features not covered by the report findings.

7. **Sprint 6 — Admin, Messaging, Reviews**  
   Address ARC-04, BCK-03, DB-03.

8. **Sprint 7–8 — Production Hardening**  
   Address INF-06 and SEC-07 before production.

---

## 11. Recommended Release Order

| Release | Gate condition | Findings that must be resolved |
|---------|---------------|-------------------------------|
| **Alpha** | All S0-S4 Sprint blockers + Release blockers | ARC-05, FE-01, FE-02, BCK-01, BCK-02, DB-01, BCK-05, BCK-06, SEC-01, SEC-04, DOC-01, DOC-02, TST-01, TST-02, TST-03, ARC-02, DB-04, DB-05, API-03 (S3 part), ARC-03, BCK-04, MOB-02, DB-02, API-02, SEC-06, FE-03, DOC-03 |
| **Beta** | All S5-S6 Sprint blockers | BCK-03, ARC-04, DB-03, and the S6 part of API-03 |
| **Production** | All Production blockers + security/ops hardening | INF-06, SEC-07 |

---

## 12. Final Recommendation

Do not start Sprint 0 implementation today. The following must close before Day 1 kickoff:

1. Sign the implementation baseline and commit `DEC-011` (governance — from `MASTER_EXECUTION_BOARD.md`).
2. Decide AWS primary region and update Terraform/CI.
3. Fix `infra/terraform/main.tf` syntax and add the missing DynamoDB lock table.
4. Replace `subnet-xxx`/`sg-xxx` placeholders and provision GitHub Secrets.
5. Choose the mobile framework (ADR-016) so Track D can start.

After those execution gates, the Sprint 0 blockers can be worked in parallel across the backend, frontend, QA, and infrastructure tracks. Alpha cannot be released until the full S0-S4 Sprint blocker set and the Release blockers are cleared.

---

## 13. Final Decision

| Question | Answer | Evidence |
|----------|--------|----------|
| **Can implementation start today?** | **NO** | `MASTER_EXECUTION_BOARD.md` has 6 open blockers (BLK-01 through BLK-06). The technical audit adds 7 Execution Blockers (region, Terraform syntax, lock table, CI placeholders, certificate DNS, mobile framework). |
| **Can Sprint 0 start?** | **NO** | Same as above; Sprint 0 cannot start until execution blockers are resolved. `MASTER_EXECUTION_BOARD.md` states all Day 1 blockers must close first. |
| **Can Sprint 1 start?** | **NO** | Sprint 0 is not complete; 16 Sprint 0 blockers and 22 unverified exit criteria remain. |
| **Can Alpha release?** | **NO** | S0-S4 Sprint blockers, missing frontend/mobile, missing payments/photos/push, and Release blockers (CVEs, CSP, API pagination) are unresolved. |
| **Can Production release?** | **NO** | All Alpha/Beta blockers remain, plus Production blockers (WAF/CloudFront/auto-scaling/alerting, `python-jose`). |
