# MAKAZOH — Consolidated Release Verification Report

**Date:** 2026-10-10
**Verified revision:** `main` = `006121e` (founder-accepted build, Railway deploy `27aca866` SUCCESS at this SHA)
**Verification branch:** `release/verification-006121e` → **PR #43** (all checks green at `e0874d8`)

---

## 1. Executive Summary & Recommendation

**Recommendation: CONDITIONAL GO** for continued staging operation; **NO-GO for public production launch** until the Blocked items in §7 are closed.

- No unresolved Critical findings in code.
- One **High** finding (dev-token endpoint reachable on production — staging-mode, requires founder decision).
- All automated checks pass: backend 1650 tests / 80.32% coverage, web 238 tests + production build, mobile 15 tests.
- Payment webhook integrity verified in code; **live-mode payment capability is BLOCKED** pending provider-console confirmation.
- `main` has **no branch protection** — recommended settings in §8.

## 2. Repository & Deployment Identity

| Item | Evidence |
|---|---|
| Release HEAD | `006121e` on `origin/main`; Railway production deploy `27aca866` built from this SHA — **PASS** |
| Web deployment | Vercel (`web-amber-pi-98.vercel.app`), production serving current main — **PASS** |
| Backend deployment | Railway `stayos-demo-production.up.railway.app`, env vars present (names only, values not exposed) — **PASS** |
| Mobile QA APK | `StayOS-Android-QA-006121e.apk`, sha256 `cb496c30…cc692`, installed + QA'd on OPPO CPH2481 — **PASS** |

## 3. Test Matrix (this cycle)

| Suite | Command | Result |
|---|---|---|
| Backend | `.venv/bin/pytest` | **1650 passed**, coverage **80.32%** (≥80 gate) — PASS |
| Backend lint | `ruff check src/ tests/` | clean — PASS (after fix commit `fdfd551`) |
| Backend types | `mypy src/` | 188 files, 0 errors — PASS (after baseline `e39a342`) |
| Backend SAST | `bandit -r src/ -ll` | no medium+ findings — PASS |
| Backend deps | `safety check` | clean on PR (python-jose removed) — PASS |
| Web tests | `vitest run` | 238/238 — PASS |
| Web types/lint | `tsc`, `eslint` | clean (pre-existing warnings only) — PASS |
| Web build | `next build` | PASS; headers verified live on `next start` |
| Mobile tests | `jest` | 15/15 — PASS |
| Mobile types | `tsc` | PASS |
| Android APK | CI workflow | PASS, artifact `StayOS-Android-QA-006121e.apk` |

## 4. Security Findings Register

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| F1 | **High** | `/auth/dev-token` reachable on production (401 w/o valid user, but endpoint exposed — staging-mode flag on prod deploy) | live curl vs Railway URL | **OPEN — founder decision required** (disable in prod env or gate by env=production) |
| F2 | **High** | Credential in git history (API key found in historical commit; scrubbed from tree at HEAD but history retains it) | gitleaks `git log` scan, 10 hits classified | **OPEN — rotation required**; removal from latest file is not sufficient |
| F3 | **Medium** | `python-jose` CVE-2026-85394 (algorithm confusion) | safety scan CI | **FIXED** — migrated to PyJWT 2.x (`c7fbee9`); code already pinned `algorithms=["RS256"]` so it was not exploitable |
| F4 | **Medium** | Web lacked security headers (CSP/XFO/nosniff/Permissions-Policy) | curl headers on Vercel | **FIXED** — `next.config.mjs` headers, verified live (`camera=(self)` preserves KYC selfie) |
| F5 | **Medium** | Secret/dep scanning gaps: TruffleHog unpinned, Bandit scanned wrong path | workflow review | **FIXED** — `security.yml`, `codeql.yml` |
| F6 | **Low** | Web deps: 10 vulns incl. `next@14.2.35` advisories (image-optimizer RCE has no patched 14.x release yet) | `npm audit` | **OPEN — monitor**; consider AVIF disable or upgrade when 14.x patch ships |
| F7 | **Info** | Mobile deps: 74 vulns, overwhelmingly Expo build-tooling (not shipped in APK) | `npm audit` | Documented |
| F8 | **Info** | 103 ruff + 193 strict-mypy errors — pre-existing, CI gate never ran (pull_request-only trigger) | CI logs | **FIXED** (ruff) / **BASELINED** (mypy per-module, documented tech debt) |

**Payment integrity (code-verified):** Paymob HMAC-SHA512 + Stripe signature with timestamp tolerance; server-authoritative amounts; webhook rejects bad signatures; idempotency enforced — **PASS**.

**NOT RUN:** OWASP ZAP baseline (no binary/Docker available locally). Error monitoring/alerting, backup/restore freshness, and live payment-mode confirmation: **BLOCKED** (need provider/console access).

## 5. Files Changed on `release/verification-006121e`

`next.config.mjs`, `security.yml`, `codeql.yml` (new), `pyproject.toml` (deps + mypy baseline), `requirements.txt`, `auth/services.py` + `test_auth.py` (PyJWT), `messages/services.py` (mypy narrowing), ~45 backend files (ruff autofix — mechanical, pytest-verified).

## 6. Before / After

| Gate | Before | After |
|---|---|---|
| Backend CI on PR | FAIL (ruff 103 → mypy 193 → misc 2 → safety 1) | **PASS** |
| Web security headers | missing | emitted + verified |
| Vulnerable auth dep | python-jose 3.5.0 | PyJWT 2.13 |

## 7. Blockers (require founder/provider action)

1. **dev-token in production** — confirm intent; disable or re-gate.
2. **Rotate the credential exposed in git history** (type/location on file; value never printed).
3. **Confirm payment provider live vs sandbox** in provider console; confirm payout/refund capability + merchant onboarding.
4. **Legal/tax/e-invoicing** — external professional confirmation required (code review cannot establish compliance).
5. **Monitoring/backup evidence** — provide Sentry/alert config + latest backup/restore record.

## 8. Release Governance

`main` is **unprotected** (404 on protection API). Recommend: require PR review, require CI+Security+CodeQL checks, block force-push/direct-push. Not changed — requires admin approval.

## 9. Checks Not Performed

ZAP/dynamic active scan (tooling unavailable); live charge/refund tests (prohibited); provider-console verification (access required); DNS/infra changes (authorization required).
