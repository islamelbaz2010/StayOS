# MAKAZOH — Consolidated Release Verification Report

**Date:** 2026-10-10 (updated)
**Verified revision:** `main` = `006121e` (founder-accepted build, Railway deploy `27aca866` SUCCESS at this SHA)
**Verification branch:** `release/verification-006121e` → **PR #43**
**Last code commit:** `bcfc389` — this report document is committed on top; branch HEAD is the PR head.

---

## 1. Executive Summary & Recommendation

**Recommendation: CONDITIONAL GO** for continued staging operation; **NO-GO for public production launch** until the Blocked items in §7 are closed.

- No unresolved Critical findings in code or in the deployed attack surface.
- The production-exposed dev-token endpoint is **fixed in code** (explicit `DEV_TOKEN_ENABLED` opt-in, off by default, 404 in production regardless of flag) — pending merge + one staging env var to preserve QA login.
- The Next.js image-optimizer advisory is **reclassified** (see F6): the deployed Vercel surface was never exposed; the self-hosted residual is mitigated by pinning `sharp>=0.35.4` (libheif 1.23.5 ≥ patched 1.23.2).
- All automated checks pass: backend 1653 tests / 80.32% coverage, web 238 tests + production build + working image optimizer, mobile 15 tests.
- Payment webhook integrity verified in code; **live-mode payment capability is BLOCKED** pending provider-console confirmation.
- `main` has **no branch protection** — recommended settings in §8.

## 2. Repository & Deployment Identity

| Item | Evidence |
|---|---|
| Release HEAD | `006121e` on `origin/main`; Railway production deploy `27aca866` built from this SHA — **PASS** |
| Web deployment | Vercel (`web-amber-pi-98.vercel.app`), production serving current main — **PASS** |
| Backend deployment | Railway `stayos-demo-production.up.railway.app`, env vars present (names only, values not exposed) — **PASS** |
| Mobile QA APK | `StayOS-Android-QA-006121e.apk`, sha256 `cb496c30…cc692`, installed + QA'd on OPPO CPH2481 — **PASS** |
| Backend `ENVIRONMENT` on prod | `staging` (dev-token reachable — see F1) — **mislabel, see §7** |

## 3. Test Matrix (this cycle)

| Suite | Command | Result |
|---|---|---|
| Backend | `.venv/bin/pytest` | **1653 passed**, coverage **80.32%** (≥80 gate) — PASS |
| Backend lint | `ruff check src/ tests/` | clean — PASS |
| Backend types | `mypy src/` | 188 files, 0 errors — PASS |
| Backend SAST | `bandit -r src/ -ll` | no medium+ findings — PASS |
| Backend deps | `safety check` | clean on PR (python-jose removed) — PASS |
| Web tests | `vitest run` | 238/238 — PASS |
| Web types/lint | `tsc`, `eslint` | clean (pre-existing warnings only) — PASS |
| Web build | `next build` + `next start` | PASS; headers + `/_next/image` optimizer verified live (200 `image/jpeg`) |
| Mobile tests | `jest` | 15/15 — PASS |
| Mobile types | `tsc` | PASS |
| Android APK | CI workflow | PASS, artifact `StayOS-Android-QA-006121e.apk` |
| Markdown lint | `build-docs` job | PASS after doc fixes |

## 4. Security Findings Register

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| F1 | **High** → resolved | `/auth/dev-token` reachable on production because the deployed service runs `ENVIRONMENT=staging` (the env allowlist can't distinguish real staging from mislabeled prod) | live curl 401-vs-404 probe; `auth/router.py` guard | **FIXED in code** (`cc2bfa4`): endpoint now requires `DEV_TOKEN_ENABLED=true` **and** an allowed env; production always 404 even if flag is accidentally set. Regression tests: staging+flag-unset→404, dev+flag-unset→404, prod+flag-set→404. **Owner action:** set `DEV_TOKEN_ENABLED=true` on the *staging* Railway service to keep QA login working after deploy |
| F2 | **High** | Historical credential in git history — type: cloud-provider API key (location: committed config/doc file in a historical commit; scrubbed from tree at HEAD but retained in history). Value never printed | gitleaks history scan, 10 hits classified (others = fixtures/placeholders) | **OPEN — owner rotation required.** Provider-side action: revoke the exposed key in the provider console and issue a replacement; then optionally rewrite history (destructive — founder decision). Removing the file is not sufficient |
| F3 | Medium → resolved | `python-jose` CVE-2026-85394 (algorithm confusion) | safety scan | **FIXED** — PyJWT 2.x (`c7fbee9`); was not exploitable (pinned `algorithms=["RS256"]`) |
| F4 | Medium → resolved | Web missing security headers | curl on Vercel | **FIXED** — `next.config.mjs`; `camera=(self)` preserves KYC selfie |
| F5 | Medium → resolved | Scanning gaps: TruffleHog unpinned, Bandit scanned wrong path, no CodeQL | workflow review | **FIXED** — `security.yml`, `codeql.yml` |
| F6 | ~~Low~~ **corrected: High-in-package / Low-deployed** | GHSA-2xp9-vwfh-vxw4 (libheif AVIF RCE via `sharp` in `next` image optimizer, `>=10 <15.5.24`). Installed: `next@14.2.35` — in affected range. **Deployed surface: Vercel managed platform is explicitly not affected.** Residual: self-hosted `standalone` builds auto-installing vulnerable sharp; `remotePatterns` includes user-content S3 hosts → precondition would be real. Note: `images.formats` restricts **output** only — it did **not** close the input vector | advisory + sythelabs analysis + `npm ls`; sharp absent from lockfile (optional dep) | **MITIGATED** — `sharp>=0.35.4` pinned (`7872989`), bundles libheif 1.23.5 ≥ patched 1.23.2; optimizer verified working under `next start`. Residual action: schedule Next.js upgrade to ≥15.5.24 as a dedicated task |
| F7 | Info | Mobile deps: 74 vulns, overwhelmingly Expo build tooling (not shipped in APK) | `npm audit` | Documented |
| F8 | Info → resolved | 103 ruff + 193 strict-mypy + 9 markdown-lint errors — pre-existing, CI gates never ran (pull_request-only triggers) | CI logs | **FIXED** (ruff, docs) / **BASELINED** (mypy per-module — only observed codes suppressed in 33 files; everything else stays strict; documented tech debt) |

**Payment integrity (code-verified):** Paymob HMAC-SHA512 + Stripe signature with timestamp tolerance; server-authoritative amounts; webhook rejects bad signatures; idempotency enforced — **PASS**.

**PR diff review (63 files):** all backend/test changes are mechanical — import sorting, unused-import/variable removal, `timezone.utc`→`UTC`, local alias renames (`Guest`→`guest_u`, SQL aliases unchanged), `TYPE_CHECKING`/quoted annotations, walrus narrowing, str→bytes literal equivalence in CSV fixture, noqa markers on intentional patterns (boto3 kwarg names, section-grouped test imports). **No UI, business-rule, API-contract, or schema changes.** Regression coverage: 1653 backend tests + 238 web + 15 mobile, all green.

**NOT RUN:** OWASP ZAP baseline (no binary/Docker locally). **BLOCKED:** error monitoring/alerting config, backup/restore freshness, live payment-mode confirmation — need provider/console access.

## 5. Files Changed on `release/verification-006121e`

`next.config.mjs` (headers), `security.yml`, `codeql.yml` (new), `pyproject.toml` (deps + mypy baseline), `requirements.txt`, `auth/services.py` + `test_auth.py` (PyJWT), `auth/router.py` + `config.py` + `.env*.example` (dev-token gate), `messages/services.py` (narrowing), `apps/web/package.json`+lock (`sharp>=0.35.4`), 5 docs (lint fixes), ~45 backend/test files (mechanical ruff fixes — pytest-verified).

## 6. Before / After

| Gate | Before | After |
|---|---|---|
| Backend CI on PR | FAIL (ruff → mypy → misc → safety) | **PASS** |
| build-docs lint | FAIL (pre-existing docs) | **PASS** |
| Web security headers | missing | emitted + verified |
| dev-token on prod | reachable (env mislabel) | 404 by default; opt-in flag |
| Vulnerable auth dep | python-jose 3.5.0 | PyJWT 2.13 |
| libheif via sharp | unpinned (vuln path if self-hosted) | sharp ≥0.35.4 / libheif 1.23.5 |

## 7. Blockers (require founder/provider action)

1. **Set `DEV_TOKEN_ENABLED=true`** on the Railway *staging* service after this merges — otherwise mobile QA login stops working. Also correct the prod service `ENVIRONMENT=staging` mislabel (it currently *is* the staging backend; confirm intended split).
2. **Rotate the exposed cloud-provider API key** (F2): revoke + reissue in the provider console; optional history rewrite is a separate founder decision.
3. **Confirm payment provider live vs sandbox** in provider console; confirm payout/refund capability + merchant onboarding.
4. **Legal/tax/e-invoicing** — external professional confirmation required.
5. **Monitoring/backup evidence** — Sentry/alert config + latest backup/restore record.
6. **Schedule Next.js ≥15.5.24 upgrade** — dedicated task; the sharp pin is an interim mitigation, not the upstream fix.

## 8. Release Governance

`main` is **unprotected** (404 on protection API). Recommend: require PR review, require CI+Security+CodeQL checks, block force-push/direct-push. Not changed — requires admin approval.

## 9. Checks Not Performed

ZAP/dynamic active scan (tooling unavailable); live charge/refund tests (prohibited); provider-console verification (access required); DNS/infra changes (authorization required).
