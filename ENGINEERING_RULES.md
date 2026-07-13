# ENGINEERING_RULES.md — Engineering Rules

**Read [`CONTEXT.md`](CONTEXT.md) before this file.**

Project identity and phase status: [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md)

These rules apply to all engineers and AI agents writing code for StayOS. They are non-negotiable unless an explicit ADR in `docs/architecture/adr/` creates an exception.

---

## 1. Phase Gate Rule (Immutable)

**No Phase 1 application code is written while Phase 0 is active.**

Phase 0 permits:
- Python repository tooling under `tools/`
- GitHub Actions workflows under `.github/workflows/`
- Test fixtures and scaffolding
- Documentation (any `.md` file)
- Infrastructure-as-code templates (no live provisioning)

Phase 0 does NOT permit:
- Any code implementing FC-01 through FC-07 features
- Any database schema intended for production use
- Any service deployment
- Any payment integration code

Phase 0 gate conditions: [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)

---

## 2. Feature Build Order (When Phase 1 Unlocks)

Strict. Source: [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md)

```
Sprint 1: FC-01 (AuthGate + KYC)   — P0, critical path, no dependencies
Sprint 2: FC-02 (Spatial Search)   — P1, parallel with FC-04 backend
Sprint 2: FC-04 (PMS Core)         — P2, parallel with FC-02 UI
Sprint 3: FC-03 (Reservation)      — P0, requires FC-01 + FC-02 + FC-04
Sprint 4: FC-05 (OpsManager)       — P0, requires FC-03
Sprint 5: FC-06 (Treasury)         — P1, requires FC-03
Sprint 6: FC-07 (Incident Console) — P2, requires FC-01 + FC-03
```

Do not begin a feature until its direct dependencies are merged and tested.

---

## 3. Business Rules Are Implementation Constraints

The rules in [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) are not guidelines — they are constraints that every implementation must enforce. Key rules:

- **BR-ID-01**: Enforce KYC `VERIFIED` status at the API middleware layer, not in application logic per-endpoint.
- **BR-INV-01**: Calendar writes must use ACID transactions with row-level isolation locking. No exceptions.
- **BR-OPS-01**: Checkout event hooks must be synchronous — turnover ticket creation cannot be deferred.
- **BR-FIN-01**: Escrow T+24h lock must be enforced in the financial engine, not in UI logic.
- **BR-FIN-03**: Payout halt on routing config errors must be atomic — all pending payouts stop, not just the affected host.

Every PR that touches a service boundary must reference the business rules it enforces.

---

## 4. Code Style

### Python (tooling / CI)

| Tool | Config | Purpose |
|------|--------|---------|
| ruff | `pyproject.toml` | Linting |
| mypy | `pyproject.toml` | Type checking (strict mode) |
| pytest | `pyproject.toml` | Unit tests |
| bandit | `pyproject.toml` | Security static analysis |

- Target Python ≥ 3.11
- No `Any` type annotations without explicit justification in the same file
- Test coverage ≥ 80% for all tools code

### Comments

- Write no comments by default.
- Write a comment only when the WHY is non-obvious: a hidden constraint, a workaround for a specific external bug, a subtle concurrency invariant.
- Never write comments explaining WHAT the code does — well-named identifiers do that.
- Never write multi-paragraph docstrings or comment blocks.

### General

- No feature flags
- No backwards-compatibility shims for removed code
- No half-finished implementations (stub methods marked TODO are acceptable only in scaffold commits, not in feature PRs)
- No error handling for scenarios that cannot happen
- Validate only at system boundaries (user input, external API responses)

---

## 5. Commit Conventions

Source: [`docs/standards/commit_conventions.md`](docs/standards/commit_conventions.md)

Format: `type(scope): message`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that is neither feature nor fix |
| `test` | Adding or modifying tests |
| `docs` | Documentation only |
| `ci` | CI/CD configuration |
| `chore` | Tooling, dependencies, build system |
| `sprint` | Sprint-level deliverable commit |

Examples:
```
feat(authgate): implement E.164 phone parser with Twilio OTP dispatch
fix(reservation): add row-level lock on calendar write to prevent double-booking
docs(architecture): add ADR for payment processor choice
ci(security): add bandit scan to security workflow
```

---

## 6. PR Rules

Every PR must:

1. Reference the feature ID from `FEATURE_CATALOG.md` (e.g., "FC-01 Sprint 1").
2. List the business rules enforced (e.g., "Enforces BR-ID-01 via auth middleware").
3. Include tests covering: (a) the happy path, (b) the specific business rule it enforces.
4. Not modify `archive/` or `docs/archive/` content.
5. Not introduce new external dependencies without a corresponding ADR or explicit Founder approval.
6. Not resolve open conflicts — if a PR touches a conflicted area (payment processor, framework choice), it must surface the conflict in the PR description, not resolve it.

---

## 7. Database Rules

- **PostgreSQL** is the primary database. Do not introduce a second relational database without an ADR.
- **PostGIS** extension is required for all spatial queries (FC-02).
- All booking writes use ACID transactions with row-level isolation — this is enforced by BR-INV-01 and is non-negotiable.
- No application-level calendar locking. Locking must happen at the database transaction level.
- No database migrations for production without explicit Founder sign-off.

---

## 8. Security Rules

- All inputs from users or external APIs must be validated at the boundary.
- OTP tokens: 6-digit, Redis-cached, 5-minute TTL, single-use (invalidate on consumption).
- KYC status changes must be logged with timestamp and operator identity.
- No secrets in code or `.env` files committed to the repository.
- Run trufflehog scan locally before push (enforced in CI via `security.yml`).
- SQL queries must use parameterized statements. No string interpolation in queries.

---

## 9. Arabic RTL Requirements

Source: `DECISION_LOG.md` DEC-003

- RTL is the primary layout direction. LTR is a secondary concern.
- No UI component may be built without RTL support from the initial commit.
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`) over directional properties (`margin-left`, `padding-right`).
- Test every UI component in RTL before marking a PR ready for review.

---

## 10. Documentation Rules

- Every new file created in this repository must be added to [`docs/MANIFEST.md`](docs/MANIFEST.md).
- Every new file must be added to [`docs/DOCUMENT_MAP.md`](docs/DOCUMENT_MAP.md) under the correct domain.
- If the file becomes the canonical source for any topic, update [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md).
- Do not duplicate content that already exists in a canonical document — reference it instead.
- Never modify `docs/phase--1/` documents — Phase -1 is complete and read-only.

---

## 11. What Does Not Exist Yet

- No application code (Phase 0 is active)
- No ADRs (required before Phase 1 build begins)
- No production database schemas
- No deployed infrastructure

All rules above describe the target state for Phase 1 engineering. They are pre-written to guide the build once Phase 0 validation completes.
