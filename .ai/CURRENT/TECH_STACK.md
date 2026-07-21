# TECH_STACK.md — Technology Choices

**Read [`CONTEXT.md`](CONTEXT.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md) before this file.**

This document records every technology choice mentioned across repository documents — flagged as Confirmed, Proposed (no ADR), or Conflicted (contradictory documents exist).

---

## 1. Confirmed Choices

These technologies appear consistently across authoritative documents and have no conflicts.

| Layer | Technology | Version / Notes | Source |
|-------|-----------|----------------|--------|
| Relational database | PostgreSQL | Primary DB for all services | `MASTER_CONTEXT.md`, `ENGINEERING_BACKLOG.md` |
| Spatial extension | PostGIS | FC-02 geo-queries | `ENGINEERING_BACKLOG.md` |
| OTP cache | Redis | 5-min TTL on OTP keys | `ENGINEERING_BACKLOG.md` FC-01 |
| SMS / OTP | Twilio | E.164 phone parsing, 6-digit tokens | `ENGINEERING_BACKLOG.md` |
| Social OAuth | Firebase Identity or Auth0 | Google + Apple SSO | `ENGINEERING_BACKLOG.md` |
| Maps | Google Maps API | Map rendering, pin clustering | `MASTER_CONTEXT.md` |
| Communications | WhatsApp Business API | Primary host-guest comms | `DECISION_LOG.md` DEC-009 |
| File storage | AWS S3 | Field app photo uploads | `ENGINEERING_BACKLOG.md` |
| Mobile offline DB | SQLite / Room | Local-first field staff app | `ENGINEERING_BACKLOG.md` |
| Cloud hosting region | AWS or GCP — Middle East region | To minimize latency for MENA users | `MASTER_CONTEXT.md` |

---

## 2. Proposed (No ADR — Decision Required Before Build)

These technologies are referenced in `MASTER_CONTEXT.md` or other documents but have no architecture decision record resolving the choice.

| Layer | Candidates | Blocker | Required Action |
|-------|-----------|---------|----------------|
| Frontend framework | React **or** Next.js | No ADR | Write ADR in `docs/architecture/adr/` before scaffold |
| Backend language | Node.js **or** Python (Django/FastAPI) | No ADR | Write ADR in `docs/architecture/adr/` before scaffold |
| Social OAuth provider | Firebase Identity **or** Auth0 | No ADR (two candidates in same doc) | Resolve in ADR or treat as implementation detail |

---

## 3. CONFLICTED — Do Not Implement Until Resolved

### CONFLICT-001: Payment Processor (CRITICAL)

This is the most critical unresolved conflict in the repository. It blocks Phase 1 FC-03 implementation entirely.

| Document | Processor Named | Context |
|----------|----------------|---------|
| `DECISION_LOG.md` DEC-004 | **Paymob** | Accepted decision — primary processor for Egypt |
| `MASTER_CONTEXT.md` | **Paymob** | Listed as primary payment integration |
| `FLOWS.md` (Flow 1) | **Stripe** | "Stripe Gateway Protocol" in the booking flow diagram |
| `ENGINEERING_BACKLOG.md` FC-03 Task 2 | **Stripe** | "Stripe Merchant Platform Payment Intents" in task specification |
| `MVP_FREEZE.md` §2 | **Stripe** | "third-party secure payment processing gateways (Stripe)" |
| `LEAN_PRODUCT.md` | **Stripe** | References Stripe in product documentation |

**Analysis**: DEC-004 is an accepted decision naming Paymob. However, every engineering document (FLOWS.md, ENGINEERING_BACKLOG.md, MVP_FREEZE.md) references Stripe. The accepted decision and the engineering documents are directly contradictory.

**Required action**: Founder must make an explicit ADR in `docs/architecture/adr/` that resolves this. The ADR should consider:
- Paymob: Egyptian payment rails (Fawry, Meeza, Vodafone Cash, InstaPay) — aligned with Arabic-first and local market strategy
- Stripe: Global coverage, mature developer experience, but limited Egyptian payment method support
- Possible resolution: Paymob for Egyptian rails + Stripe for international card payments (not a single choice)

**Do not write payment integration code until this ADR exists.**

---

## 4. AI/ML Technology (Deferred — Phase 3+)

Source: `DECISION_LOG.md` DEC-008

| Phase | AI Capability |
|-------|-------------|
| Phase 0 | Zero AI — manual operations only |
| Phase 1 | Rule-based pricing only (no ML) |
| Phase 2 | ML features at 50K+ transactions |
| Phase 3+ | Demand forecasting, personalization, fraud detection |

Do not add any ML library, LLM API, or vector database dependency to Phase 1 code.

---

## 5. Local Egyptian Payment Rails (Context for Payment Conflict)

Source: `MASTER_CONTEXT.md`

These payment methods are referenced as differentiators and must be supported regardless of which primary processor is chosen:

| Method | Type |
|--------|------|
| Fawry | Cash and card at retail kiosks |
| Meeza | Egyptian debit card network |
| Vodafone Cash | Mobile wallet |
| InstaPay | Egyptian instant bank transfer |

Paymob supports these natively. Stripe does not support Fawry, Meeza, or Vodafone Cash as of the knowledge cutoff.

---

## 6. CI Toolchain (Current — Phase 0)

These tools are active in the GitHub Actions workflows under `.github/workflows/`:

| Tool | Purpose | Workflow |
|------|---------|---------|
| ruff | Python linting | `ci.yml` |
| mypy | Python type checking | `ci.yml` |
| pytest | Python unit tests | `ci.yml` |
| bandit | Python security static analysis | `security.yml` |
| safety | Python dependency vulnerability scan | `security.yml` |
| trufflehog | Secrets scan | `security.yml` |

---

## 7. Resolution Checklist (Pre-Phase-1)

Before any Phase 1 engineering sprint begins, the following ADRs must be written in `docs/architecture/adr/`:

- [ ] ADR: Frontend framework — React vs Next.js
- [ ] ADR: Backend language — Node.js vs Python
- [ ] ADR: Payment processor — Paymob vs Stripe vs hybrid (CRITICAL)
- [ ] ADR: OAuth provider — Firebase Identity vs Auth0

Each ADR must follow the template in `docs/architecture/` and be merged to main before the relevant feature sprint begins.
