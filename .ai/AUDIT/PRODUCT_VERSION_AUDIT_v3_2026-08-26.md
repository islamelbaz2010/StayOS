# PRODUCT_VERSION_AUDIT_v3_2026-08-26.md

**Role:** Senior Product/Engineering Auditor  
**Scope:** Repository-grounded audit of StayOS product versions (V1 → V2 → V3 → V4+)  
**Date:** 2026-08-26  
**Mandate:** No implementation, deployment, commit, or push.

---

## PART 1 — CURRENT PRODUCT

### 1.1 Product Definition

| Attribute | Decision Truth | Product Truth | Source |
|-----------|----------------|---------------|--------|
| Name | StayOS | StayOS | `DECISION_LOG.md` DEC-001; code |
| Category | AI-powered, two-sided accommodation marketplace for MENA | Accommodation marketplace with rule-based features only; no AI/ML in production code | `DECISION_LOG.md` DEC-001, DEC-008; `src/app/` |
| "OS" meaning | Business metaphor: "operating system of accommodation" | Same, reflected in docs and code description | `DECISION_LOG.md` DEC-001 |
| Launch market | Egypt proof-of-concept; Egypt–GCC corridor as business | Product localized for Egypt (EGP, Arabic, Cairo/Alexandria seed); no GCC supply yet | `DECISION_LOG.md` DEC-002; `src/app/config.py` |
| Primary user | Arabic-speaking Egyptian domestic travelers; GCC travelers visiting Egypt | Guest app built; no real users | `PRODUCT_CANON.md` §9 |
| Supply side | Property managers, hotels, resort operators, individual hosts | Host onboarding + admin import/claim flows built; no real hosts onboarded | `PRODUCT_CANON.md` §9 |

### 1.2 Target User & Problem

| User | Problem StayOS Solves | Evidence |
|------|----------------------|----------|
| Guest | English-first OTAs exclude Arabic speakers; no local payment rails; low trust in listings | Arabic-first web/mobile, manual Vodafone Cash/bank payment, KYC/verification status | `PRODUCT_CANON.md` §2, §13 |
| Host / PM | Limited distribution channels; no Arabic-first property management tools | Host dashboard, listing creation, calendar, KYC queue | `USER_STORIES.md` US-H01–H04 |
| Field Staff | Need offline task tracking for turnover | Ops ticket endpoints, local-first design referenced | `USER_STORIES.md` US-F01–F04 |
| Finance | Need ledger auditability | Double-entry ledger schemas + `src/app/finance/` | `USER_STORIES.md` US-FI01–FI02 |

### 1.3 Value Proposition

**Claimed:** Arabic-first, trust-verified, locally payable accommodation marketplace for MENA.  
**Verified in repository:** Arabic/RTL UI, geospatial search, manual EGP payment proof upload, KYC/verification scaffolding, host/listing management, double-entry ledger.  
**Not verified:** Real transaction #1, real listings, real customer NPS, real payment provider live integration.

### 1.4 Intended vs Actual Stage

| Stage | Intended | Actual |
|-------|----------|--------|
| Phase 0 (Customer Validation) | Active — 50 traveler + 30 host interviews + 10 manual transactions | Not executed; 0 interviews/0 transactions confirmed |
| Phase 1 (MVP / Closed Alpha) | Build after Phase 0 gates clear | Built ahead of gates; code ~88–90% complete per `epos/PROJECT_STATE.md` |
| Closed Alpha | 50–100 listings, 10 manual transactions | 0 real listings; 0 real transactions; Railway/Vercel live but not commercially active |

### 1.5 Actual Current Implementation

| Layer | State |
|-------|-------|
| Backend API | FastAPI monolith, 12 routers mounted, 491 tests defined, 22 Alembic migrations |
| Web frontend | Next.js 14 App Router, 15+ routes, bilingual/RTL |
| Mobile app | React Native + Expo, 9 screens, EAS/APK build artifacts |
| Database | PostgreSQL + PostGIS schema, migrations through 022 |
| Deployment | Railway backend + Vercel frontend live; Terraform/AWS not applied |
| Integrations | Twilio OTP not configured; S3 not configured; Paymob not integrated; Akedly not wired |
| Supply | CSV import + admin claim/approve flows built; no real owner-authorized listings |
| Legal/commercial | Draft ToS/Privacy/Host Agreement/Cancellation/Refund + V1 Payment Policy; no legal entity/account |

---

## PART 2 — CAPABILITY INVENTORY

For each capability the state is one of: **PLANNED / DESIGNED / SCAFFOLDED / IMPLEMENTED / TESTED / DEPLOYED / REAL-WORLD VALIDATED**.

| Capability | State | Evidence | Note |
|------------|-------|----------|------|
| **FC-01: AuthGate & Identity** | | | |
| Phone OTP (Twilio) | IMPLEMENTED | `src/app/auth/router.py` `/otp/send`, `/otp/verify` | Not configured in production (`epos/PROJECT_STATE.md`) |
| Social OAuth (Firebase) | SCAFFOLDED | `src/app/auth/router.py` `/firebase` | No real Firebase credentials |
| JWT access/refresh | IMPLEMENTED / TESTED | `src/app/auth/services.py`; `tests/test_auth.py` | Live `/auth/dev-token` bypass works |
| KYC document upload | IMPLEMENTED | `src/app/kyc/router.py` `/initiate`, `/documents/{id}/submit` | No real OCR/biometric API |
| KYC admin review | IMPLEMENTED | `src/app/kyc/router.py` `/pending`, `/approve`, `/reject` | Manual review only |
| **FC-02: Spatial Search & Inventory Discovery** | | | |
| PostGIS geo search | IMPLEMENTED / TESTED | `src/app/listings/router.py` `/` search; `tests/test_listings.py` | Functional |
| Map rendering (web) | IMPLEMENTED | `apps/web/components/listings/ListingMap.tsx` | Refactored in working tree |
| Map rendering (mobile) | IMPLEMENTED | `apps/mobile/src/screens/ListingDetailScreen.tsx` `MapView` | Google Maps key optional; fallback exists |
| Smart location autocomplete | IMPLEMENTED | `src/app/favorites/router.py` `/locations/autocomplete` | Arabic normalization + aliases |
| Discovery engine (Airbnb/Booking/Google Places/OLX candidates) | IMPLEMENTED | `src/app/discovery/router.py` `/candidates`, `/runs` | Discovery only — no scraping/integration |
| **FC-03: Transactional Reservation Lifecycle** | | | |
| Booking creation | IMPLEMENTED / TESTED | `src/app/bookings/router.py` `POST /`; `tests/test_bookings.py` | Mobile `BookingScreen.tsx` calls it |
| Calendar concurrency lock | IMPLEMENTED / TESTED | `src/app/availability/router.py`; `tests/test_calendar_concurrency.py` | Exclusion constraint in migration 009 |
| Reservation state machine | IMPLEMENTED | `src/app/reservations/router.py` `/confirm`, `/cancel`, `/check-in`, `/check-out` | Dormant Stripe branch present but not active |
| Manual payment proof upload | IMPLEMENTED | `src/app/payments/router.py` `/proof`, `/proof/presign` | S3 path blocked without real credentials |
| Payment verification by admin | IMPLEMENTED | `src/app/payments/router.py` `/{id}/verify` | Manual verification flow |
| Commission calculation | IMPLEMENTED / TESTED | `src/app/finance/services.py` `handle_manual_payment_verified`; `tests/test_alpha_commission.py` | 4/10/2 + alpha incentives |
| **FC-04: PMS Core** | | | |
| Host listing creation | IMPLEMENTED | `src/app/listings/router.py` `POST /`; host web forms | Multi-step web form |
| Listing photo upload | IMPLEMENTED | `src/app/listings/router.py` `/{id}/photos`, `/{id}/photos/presign` | S3 blocked without credentials |
| Calendar management | IMPLEMENTED | `src/app/listings/router.py` `/{id}/calendar/*` | Host can set availability/pricing |
| Admin pending/approve/reject | IMPLEMENTED | `src/app/listings/router.py` `/admin/pending`, `/admin/{id}/approve` | Used for CSV import/claim flow |
| Host dashboard | IMPLEMENTED | `src/app/listings/router.py` `/host/dashboard` | Web dashboard exists |
| **FC-05: OpsManager Ticket Engine** | | | |
| Task creation/retrieval | IMPLEMENTED | `src/app/operations/router.py` `/tasks`, `/tasks/{id}` | Basic CRUD |
| Photo verification | SCAFFOLDED | `BUSINESS_RULES.md` BR-OPS-03; no native mobile camera integration confirmed | Not V1 blocker |
| Offline cache | DESIGNED | `BUSINESS_RULES.md`; `ENGINEERING_BACKLOG.md` references SQLite/Room | Not implemented for V1 |
| **FC-06: Treasury Ledger & Payouts** | | | |
| Double-entry ledger | IMPLEMENTED | `src/app/finance/services.py` ledger entries | Dormant Paymob/Stripe branches |
| Wallet/escrow endpoints | IMPLEMENTED | `src/app/finance/router.py` `/wallets`, `/escrow` | Not exercised with real funds |
| Payout request/process | IMPLEMENTED | `src/app/finance/router.py` `/payouts` | Manual for alpha |
| **FC-07: Incident Resolution Console** | | | |
| Incident console | SCAFFOLDED | `src/app/operations/router.py`; no dedicated incident router found | Not a V1 requirement per current intent |
| **Mobile Application** | | | |
| React Native + Expo scaffold | IMPLEMENTED / DEPLOYED | `apps/mobile/`, `StayOS-preview.apk`, `ADR-MOBILE-FRAMEWORK` | EAS build artifacts exist |
| 9 screens | IMPLEMENTED | `Home, Search, ListingDetail, Booking, Favorites, Trips, Account, Login, HostProfile` | `TouchableOpacity` book button committed |
| **Web Frontend** | | | |
| Guest search/listing/detail | IMPLEMENTED | `apps/web/app/[locale]/search`, `/listings/[unitId]` | Deployed on Vercel |
| Guest checkout page | IMPLEMENTED | `apps/web/app/[locale]/checkout/[bookingId]` | Payment instructions rendered |
| Host onboarding/listings | IMPLEMENTED | `apps/web/app/[locale]/host/listings/*` | Photo upload depends on S3 |
| Admin discovery/import/kyc/payments/pending | IMPLEMENTED | `apps/web/app/[locale]/admin/*` | Admin UI for ops |
| **Legal / Commercial** | | | |
| V1 Payment & Commission Policy | DOCUMENTED / DECIDED | `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` | Not committed to Git |
| ToS / Privacy / Host Agreement / Cancellation drafts | DOCUMENTED | `docs/legal/*` | Drafts only; no legal approval |
| **Supply** | | | |
| CSV import pipeline | IMPLEMENTED | `src/app/importer/router.py` `/preview`, `/confirm` | Accepts external image URLs |
| Admin claim/approve queue | IMPLEMENTED | `src/app/listings/router.py` `/admin/pending`, `/admin/{id}/approve` | No real listings imported |
| Supply tracker/outreach scripts | DOCUMENTED | `.ai/SUPPLY/` directory | Not committed |

---

## PART 3 — V1 RECONSTRUCTION

### What V1 Is (per reconciled founder intent + evidence)

StayOS V1 = **Closed-alpha marketplace product** enabling a guest to search Arabic-first listings in Cairo/Alexandria, request a booking, receive manual payment instructions to a real StayOS-controlled account, upload proof, and have an admin verify the payment to confirm the booking. The first 1–10 transactions are computed manually with 4/10/2 commission (or alpha incentives) and processed via manual bank/Vodafone Cash transfers.

### V1 Required

| # | Requirement | Rationale |
|---|-------------|-----------|
| 1 | Guest can search/filter listings by location, dates, guests | Core discovery loop |
| 2 | Guest can view listing detail with photos, amenities, map, cancellation policy | Trust + conversion |
| 3 | Guest can register/login via OTP (or dev-token bypass for alpha) | Auth gate |
| 4 | Guest can submit booking request for available dates | Reservation engine |
| 5 | Host/admin can accept booking | Triggers payment instructions |
| 6 | Guest receives real StayOS payment instructions | Manual payment flow |
| 7 | Guest can upload payment proof (S3 or alternative) | Verification |
| 8 | Admin can verify payment and confirm booking | Completion of loop |
| 9 | Commission calculation matches V1 policy (4/10/2 or alpha incentives) | Financial integrity |
| 10 | Host can onboard and publish a verified listing | Supply creation |
| 11 | Legal docs accurately describe V1 manual flow | Risk mitigation |
| 12 | Real StayOS collection account replaces placeholder | Transaction #1 blocker |

### V1 Optional

- Reviews (explicitly deferred to V1.1)
- Map pin clustering (basic map exists)
- AI/ML features (Phase 3+)
- Automated KYC OCR (manual review for alpha)
- Real-time messaging (email/WhatsApp templates exist; live chat deferred)

### Explicitly Excluded from V1

| Item | Evidence |
|------|----------|
| Channel manager integrations (Airbnb/Booking.com/VRBO) | `MVP_FREEZE.md` §3; founder chat Aug 25 |
| Dynamic pricing / ML pricing | `MVP_FREEZE.md` §3; `DECISION_LOG.md` DEC-008 |
| Automated maintenance matrix | `MVP_FREEZE.md` §3 |
| Advanced treasury controls (W-8BEN/1099-K) | `MVP_FREEZE.md` §3 |
| Integrated CRM dashboards | `MVP_FREEZE.md` §3 |
| AI/ML launch claims | `DECISION_LOG.md` DEC-008 |
| Host app (separate from PMS web) | Chat extraction |
| Reviews for V1 | Chat extraction; `NEXT_SPRINT.md` |

### Deferred

| Item | Return Trigger |
|------|----------------|
| Paymob automated integration | After Paymob confirms marketplace/split + legal clarity |
| AWS/S3 real credentials | After Paymob coordination / legal clarity |
| Stripe activation | If/when international card volume justifies it |
| Field staff offline mobile app | 50+ active units / Phase 2 |
| Incident console | Post-alpha / Phase 2 |

### Frozen

| Item | Evidence |
|------|----------|
| V1 commercial rates 4/10/2 | `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` §2 |
| Payment Model A (Guest → StayOS account → Host) | V1 policy §3 |
| Manual alpha procedure for first 1–10 transactions | V1 policy §4 |
| Akedly for OTP | Chat extraction; `TWILIO_*` placeholders remain |
| Airbnb/Booking.com = discovery only | Chat extraction Aug 25 |

### Unknown

- Actual supply lead contact status.
- Actual legal counsel engagement.
- Actual Paymob request sent.
- Actual founder collection account.

---

## PART 4 — V1 COMPLETION MATRIX

| Requirement | Evidence | State | Verification | Blocking? | Source |
|-------------|----------|-------|--------------|-----------|--------|
| Guest search by location/dates/guests | `src/app/listings/router.py` `GET /api/v1/listings`; `apps/web/app/[locale]/search` | IMPLEMENTED / TESTED | Unit tests; web UI exists | No | `PRODUCT_CANON.md` FC-02 |
| Guest listing detail view | `apps/web/app/[locale]/listings/[unitId]/page.tsx`; `apps/mobile/src/screens/ListingDetailScreen.tsx` | IMPLEMENTED | UI exists; mobile uses `TouchableOpacity` | No | `USER_STORIES.md` US-G01 |
| Guest OTP login | `src/app/auth/router.py` `/otp/send`, `/otp/verify` | IMPLEMENTED / NOT CONFIGURED | `epos/PROJECT_STATE.md` Session 006: OTP not configured in prod | Yes (production login) | `PRODUCT_CANON.md` FC-01 |
| Guest dev-token bypass | `src/app/auth/router.py` `/dev-token` | IMPLEMENTED / DEPLOYED | Live per Session 006 | No (interim) | `epos/PROJECT_STATE.md` |
| Guest booking request | `src/app/bookings/router.py` `POST /api/v1/bookings`; `apps/mobile/src/screens/BookingScreen.tsx` | IMPLEMENTED / TESTED | 491 tests include `test_bookings.py` | Maybe (Aug 25 failure unverified) | `USER_STORIES.md` US-G03 |
| Host/admin accept booking | `src/app/reservations/router.py` `/{id}/confirm` | IMPLEMENTED | Code path exists | No | `USER_STORIES.md` US-H02 |
| Payment instructions (real account) | `src/app/payments/services.py` `_MANUAL_INSTRUCTIONS_*` | IMPLEMENTED / FAKE | Placeholder account; not real | **Yes** | V1 Payment Policy §1 |
| Payment proof upload | `src/app/payments/router.py` `/proof/presign`, `/proof` | IMPLEMENTED / S3 BLOCKED | S3 500 in production; no non-S3 path | **Yes** | `USER_STORIES.md` US-G03 |
| Admin payment verification | `src/app/payments/router.py` `/{id}/verify` | IMPLEMENTED | Confirms booking | No | V1 Payment Policy §4 |
| Commission 4/10/2 in code | `src/app/config.py`; `src/app/finance/services.py`; `tests/test_alpha_commission.py` | IMPLEMENTED / TESTED | 491 tests include alpha commission | No | V1 Payment Policy §2 |
| Host onboarding / listing creation | `apps/web/app/[locale]/host/listings/new`; `src/app/listings/router.py` `POST /` | IMPLEMENTED | Web flow exists | No | `USER_STORIES.md` US-H01 |
| Admin import/claim/approve | `src/app/importer/router.py` `/preview`, `/confirm`; `src/app/listings/router.py` `/admin/*` | IMPLEMENTED | CSV import accepts external image URLs | No | Sprint 3 scope |
| KYC document upload/review | `src/app/kyc/router.py` `/initiate`, `/documents/{id}/submit`, `/approve`, `/reject` | IMPLEMENTED / MANUAL | No OCR/biometric API | No (for alpha) | `PRODUCT_CANON.md` FC-01 |
| Legal docs (ToS/Privacy/Host/Cancel) | `docs/legal/*` | DRAFTED | Not legally approved | **Yes** (publishability) | V1 Payment Policy |
| Real StayOS collection account | Placeholder in `src/app/payments/services.py` | NOT OBTAINED | First transaction impossible | **Yes** | `epos/NEXT_SPRINT.md` |
| Legal counsel (CBE/PDPL/platform role) | `LEGAL_COUNSEL_REVIEW_CHECKLIST.md` | NOT RETAINED | Real-money legality unresolved | **Yes** | V1 Payment Policy §5 |
| `refund_days = 5` in cancellation notification | `src/app/notifications/templates.py`; `src/app/reservations/services.py` | BUG | Template has `{{refund_days}}`; payload omits it | **Yes** | V1 Payment Policy §1 |
| Railway backend live | `src/app/main.py` `/health`; `epos/PROJECT_STATE.md` | DEPLOYED | Session 006 confirmed reachable | No | `epos/PROJECT_STATE.md` |
| Vercel frontend live | `apps/web/` | DEPLOYED | Session 006 confirmed reachable | No | `epos/PROJECT_STATE.md` |

---

## PART 5 — V1 EXIT CRITERIA

Use existing project criteria where available.

### From `PRODUCT_CANON.md` / `MVP_FREEZE.md` / `epos/`

| Criterion | Source | Current Status |
|-----------|--------|----------------|
| Closed alpha: 50–100 verified listings in Cairo/Alexandria | `DEC-017`; `epos/NEXT_SPRINT.md` | 0 real listings — **NOT MET** |
| 10 manual transactions completed | `ROADMAP.md`; Phase 0 gate | 0 — **NOT MET** |
| Booking completion ≤ 3 clicks / ≤ 3 screens | `EXPERIENCE_RULES.md` | Mobile: Home → Search → ListingDetail → Booking = 4 screens. Web: similar. **PARTIALLY MET** |
| Search results load ≤ 2 seconds | `EXPERIENCE_RULES.md` | Not load-tested — **NOT VERIFIED** |
| WhatsApp initial response ≤ 30 seconds | `EXPERIENCE_RULES.md` | WhatsApp provider not configured — **NOT MET** |
| Refund processed ≤ 24 hours | `EXPERIENCE_RULES.md` | V1 policy says 5 business days; conflict with threshold. **CONFLICT** |
| Uptime ≥ 99.5% | `EXPERIENCE_RULES.md` | No production uptime history — **NOT VERIFIED** |
| Guest NPS ≥ 7.0 | Phase 0 gate | No customers — **NOT MET** |
| Host NPS ≥ 7.0 | Phase 0 gate | No hosts — **NOT MET** |
| Wedge identified | Phase 0 gate | Not verified — **NOT MET** |
| Backend 491 tests passing | Repository | 491 tests defined; last claimed pass 472 at `9fd5f63` — **NOT REVERIFIED THIS SESSION** |
| Lint/type clean | `epos/PROJECT_STATE.md` | Not re-run this session — **NOT VERIFIED** |

**Note:** The `EXPERIENCE_RULES.md` refund threshold (≤ 24 hours) conflicts with the V1 Payment Policy (5 business days). This is a requirement conflict requiring founder input.

---

## PART 6 — REMAINING V1 WORK

### P0 — Required for Current Gate (First Real Transaction)

| # | Work | Owner | Evidence of Blockage |
|---|------|-------|----------------------|
| 1 | Obtain real StayOS collection account; replace placeholder in `src/app/payments/services.py` | Founder | Placeholder text lines 31–49 |
| 2 | Populate `refund_days=5` in `booking.cancelled` notification payload | Engineering | `src/app/reservations/services.py` does not include `refund_days` in `extra` |
| 3 | Resolve or document `EXPERIENCE_RULES.md` refund threshold conflict (24h vs 5 business days) | Founder/Product | `EXPERIENCE_RULES.md` vs V1 policy |
| 4 | Engage Egyptian legal counsel on CBE PSP, PDPL/KYC, platform role | Founder | `LEGAL_COUNSEL_REVIEW_CHECKLIST.md` open |
| 5 | Confirm or configure Akedly/Twilio OTP in production | Founder + Engineering | `epos/PROJECT_STATE.md` OTP not configured |
| 6 | Secure first 10 real owner-authorized listings | Founder/Operations | `.ai/SUPPLY/SUPPLY_TRACKER.csv` unverified |
| 7 | Verify BookingScreen API failure from Aug 25 and fix root cause | Engineering | Chat report; not reproduced in repo |

### P1 — Important After First Transaction

| # | Work | Owner |
|---|------|-------|
| 1 | Commit uncommitted working tree (34+ modified, many untracked) | Engineering |
| 2 | Provide real AWS credentials or implement non-S3 payment-proof upload | Founder + Engineering |
| 3 | Send `PAYMOB_REQUIREMENTS_REQUEST.md` | Founder |
| 4 | Update `.ai/CURRENT` docs from `epos/` and `docs/legal/` | Product/Documentation |
| 5 | Update `AGENTS.md`/`CLAUDE.md` to reflect DEC-011 | Governance |
| 6 | Retest mobile booking flow end-to-end on physical OPPO device | QA/Engineering |
| 7 | Complete legal doc entity/registration details | Founder + Legal |

### P2 — Later

| # | Work |
|---|------|
| 1 | Map pin clustering enhancements |
| 2 | Reviews (V1.1) |
| 3 | AI pricing (Phase 3+) |
| 4 | Channel manager sync (future partnership) |
| 5 | Incident console (FC-07) |
| 6 | Real-time messaging (SSE/WebSocket) |

### Nice-to-Have

- Dark mode support (currently forced light).
- Google Maps key configured in mobile build.
- Automated KYC OCR/biometric.

---

## PART 7 — MATURITY STATES

| State | Definition | Current Status |
|-------|------------|----------------|
| **Code complete** | All V1 features implemented in code | **Mostly true** — core booking, payment (manual), host onboarding, admin, mobile, web are implemented. Missing: `refund_days` wiring, real account placeholder. |
| **Test complete** | All tests passing, coverage acceptable | **491 tests defined**; last verified pass count 472 at commit `9fd5f63`. **Not re-verified this session.** |
| **Deployment ready** | Live environment, credentials configured | **Partially true** — Railway/Vercel live; OTP/S3/payment provider credentials not configured. |
| **Pilot ready** | Real supply + real users can transact | **False** — 0 real listings; 0 real transactions; placeholder collection account; legal counsel not engaged. |
| **Commercially validated** | Closed alpha transactions completed, NPS targets met | **False** — 0 transactions; no NPS data. |
| **Production proven** | Scaled, stable, real revenue | **False** — not reached. |

---

## PART 8 — V2 / V3 / V4+

Only reconstruct versions supported by project decisions.

### V2 (Post-Closed Alpha, Pre-PMF)

| Feature | Evidence |
|---------|----------|
| Real-time messaging (SSE/WebSocket) | `DEC-014` SSE + Redis pub/sub; Sprint 5/6 design |
| Host calendar/pricing dashboard refinements | `NEXT_SPRINT.md` scope |
| Reviews | `NEXT_SPRINT.md` V1.1 unless time allows |
| Automated KYC OCR/biometric | `DECISION_LOG.md` DEC-006; manual for now |
| B2B SaaS billing | `DECISION_LOG.md` DEC-010 proposed |
| GCC expansion planning | `DECISION_LOG.md` DEC-002; Phase 3 |

### V3 (PMF / Scale)

| Feature | Evidence |
|---------|----------|
| AI/ML dynamic pricing | `DECISION_LOG.md` DEC-008; 50K+ transactions |
| Demand forecasting | `DECISION_LOG.md` DEC-008 |
| Fraud detection | `DECISION_LOG.md` DEC-008 |
| Personalized search | `DECISION_LOG.md` DEC-008 |
| Channel manager sync (Airbnb/Booking.com) | Future partnership only; rejected for V1 |

### V4+ (Regional / Platform)

| Feature | Evidence |
|---------|----------|
| GCC supply launch (Saudi/UAE) | `DECISION_LOG.md` DEC-002; 18–36 months |
| Advanced treasury controls | `MVP_FREEZE.md` §3 deferred |
| Field operations full offline-first app | `ENGINEERING_BACKLOG.md` |
| Incident console / CRM | `PRODUCT_CANON.md` FC-07 |

---

## PART 9 — VERSION BOUNDARY TABLE

| Capability | V1 | V2 | V3 | V4+ | Unknown |
|------------|----|----|----|-----|---------|
| Guest search + listing detail | ✅ | | | | |
| Guest booking + manual payment | ✅ | | | | |
| Host onboarding + listing creation | ✅ | | | | |
| Admin import/claim/approve | ✅ | | | | |
| KYC document upload + manual review | ✅ | | | | |
| Mobile app (React Native) | ✅ | | | | |
| Web frontend (Next.js) | ✅ | | | | |
| Manual commission calculation | ✅ | | | | |
| OTP (Twilio/Akedly) | ✅ (manual/placeholder) | | | | |
| Reviews | | ✅ | | | |
| Real-time messaging | | ✅ | | | |
| Paymob automated integration | | ✅ | | | |
| AI pricing | | | ✅ | | |
| Demand forecasting | | | ✅ | | |
| Fraud detection | | | ✅ | | |
| Channel manager sync | | | | ✅ | |
| GCC expansion | | | | ✅ | |
| Advanced treasury controls | | | | ✅ | |
| Full field operations offline app | | | | ✅ | |
| Incident console | | | | ✅ | |

---

## PART 10 — AUDIT DIAGNOSIS

### Current Product Bottleneck

**Supply acquisition is the bottleneck.** Engineering has built a capable marketplace platform, but there are 0 real owner-authorized listings and 0 transactions. No amount of feature polish will unblock the closed alpha without founder/ops acquiring and verifying real supply.

### Technical Bottleneck

**Real-money plumbing is incomplete:**
1. Placeholder collection account in payment instructions.
2. S3 credentials missing → payment-proof upload blocked (unless non-S3 path added).
3. OTP not configured in production → normal guest login broken (dev-token bypass is only interim).
4. `refund_days` not wired in cancellation notification → broken guest-facing message.

### Validation Bottleneck

**Phase 0 customer validation has not been executed.** No 50 traveler interviews, no 30 host interviews, no 10 manual transactions, no NPS data. The product is being built before market validation.

### Scope Risk

- **Feature creep risk is currently low** — founder explicitly excluded reviews, AI, host app, channel managers, redesign.
- **Documentation/scope drift risk is medium** — `.ai/CURRENT` docs are stale and describe a different state than the repository.
- **MVP scope is actually smaller than full FC-07** — FC-05, FC-06, FC-07 are partially implemented; the V1 alpha can run without them if operations are manual.

### Stale Assumptions

1. **"No deployed environment"** — stale as of Aug 24; Railway/Vercel are live.
2. **"Payment processor conflict unresolved"** — stale; V1 policy resolves to manual + Paymob target, Stripe dormant.
3. **"Mobile framework undecided"** — stale; `ADR-MOBILE-FRAMEWORK` exists.
4. **"0% commission for all alpha bookings"** — stale; canonical 4/10/2 with alpha incentives for first 3 host / 10 guest bookings.
5. **"Booking CTA non-tappable"** — likely stale; code uses `TouchableOpacity`, but Aug 25 failure requires root-cause verification.

### Conflicts

1. `EXPERIENCE_RULES.md` refund ≤24h vs V1 Payment Policy 5 business days.
2. `AGENTS.md`/`CLAUDE.md` Phase 0 block vs `DEC-011` authorizing engineering.
3. `PRODUCT_CANON.md`/`TECH_STACK.md` list Paymob/Stripe unresolved vs V1 policy and implementation.
4. `PRODUCT_CANON.md` lists FC-05/FC-06/FC-07 in MVP scope, but current intent defers much of this to manual/Phase 2.
5. `.ai/CURRENT` canonical docs vs `epos/` current memory.

---

## PART 11 — MANAGEMENT INPUT

### V1 Readiness

**Engineering readiness: ~85–90%.**  
**Operational readiness: ~5%.**  
**Commercial/legal readiness: ~10%.**  

The product is code-close to a closed alpha, but it cannot transact until a real collection account, legal counsel, and real listings exist.

### Critical Remaining Work (in order)

1. **Founder obtains real StayOS collection account and replaces placeholder.** Nothing substitutes for this.
2. **Engineering fixes `refund_days` notification payload.** Tiny change; prevents broken cancellation UX.
3. **Founder engages Egyptian legal counsel** on CBE PSP, PDPL/KYC, platform role.
4. **Founder/ops secures first 10 real listings** with manual ownership confirmation.
5. **Configure or replace Twilio OTP** with Akedly in production.
6. **Commit the uncommitted working tree** before any further work.
7. **Resolve refund timing conflict** between `EXPERIENCE_RULES.md` and V1 Payment Policy.

### Single Most Important Blocker

**Real StayOS collection account.** Without it, the guest cannot pay, the admin cannot verify, and transaction #1 cannot occur.

### What NOT to Build Now

- Do **not** implement Paymob/Stripe automated integration.
- Do **not** build reviews.
- Do **not** build AI/ML pricing or recommendations.
- Do **not** build channel manager sync.
- Do **not** build a separate host mobile app.
- Do **not** redesign the UI.
- Do **not** add new features until the first real transaction succeeds.

---

## PART 12 — PERSISTENCE / HANDOFF

### What to Persist

This audit report itself should be persisted in the existing `.ai/AUDIT/` directory, which is the established audit convention for this project. No new memory system should be created.

### What NOT to Persist

- Do not create a new `.ai/AUDIT`-adjacent directory.
- Do not duplicate this content into `epos/` unless explicitly instructed.
- Do not commit or push this file without explicit instruction.

### Handoff to Next Session

The next agent/session should:
1. Read this audit and the `DECISION_RECONCILIATION_2026-08-26.md`.
2. Treat `epos/PROJECT_STATE.md` Session 006 and `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` as the current operational/commercial authority.
3. Treat `.ai/CURRENT` canonical docs as stale pending refresh.
4. Verify the Aug 25 booking-confirmation failure before assuming the mobile booking flow works.
5. Confirm whether the real collection account, legal counsel, and supply leads have progressed.

---

**End of audit.**

*This document is an assessment artifact only. It does not authorize, implement, deploy, or modify the product.*
