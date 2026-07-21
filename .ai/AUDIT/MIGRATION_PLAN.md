# MIGRATION PLAN — StayOS Repository

**Date**: 2026-07-13
**Purpose**: Exact file-by-file migration instructions for executing the refactor

This document is the execution companion to REPOSITORY_REFACTOR_PLAN.md. It lists the precise git commands, file operations, and content replacements needed.

---

## PHASE 1: CRITICAL REMOVALS

### Step 1: Remove the four wrong root-level documents

```bash
git rm TASKS.md
git rm DECISION_LOG.md
git rm ASSUMPTIONS.md
git rm RISKS.md
```

**Commit message**: `docs: remove computer-OS root documents (TASKS, DECISION_LOG, ASSUMPTIONS, RISKS)`

These four files described building a Rust microkernel. The correct versions live in docs/phase--1/. See REPOSITORY_AUDIT.md for full analysis.

---

### Step 2: Remove and replace the Rust CI workflow

```bash
git rm .github/workflows/ci.yml
```

Then create new `.github/workflows/ci.yml`:

```yaml
name: CI — Phase 0 Documentation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Verify required documents exist
        run: |
          for f in README.md MASTER_CONTEXT.md PROJECT_VISION.md ROADMAP.md; do
            [ -f "$f" ] && echo "✅ $f" || (echo "❌ Missing: $f" && exit 1)
          done

      - name: Verify phase--1 index exists
        run: |
          [ -f "docs/phase--1/INDEX.md" ] && echo "✅ Phase -1 index present" || exit 1

      - name: Count Phase -1 documents
        run: |
          COUNT=$(find docs/phase--1 -name "*.md" | wc -l)
          echo "Phase -1 documents: $COUNT"
          [ "$COUNT" -ge 21 ] && echo "✅ All Phase -1 documents present" || echo "⚠️ Expected 21+ documents"
```

**Commit message**: `ci: replace Rust cargo workflow with Phase 0 documentation validation`

---

## PHASE 2: CONTENT CORRECTIONS

### Step 3: Fix docs/standards/documentation_guide.md

**Change 1 — Replace Rust code example (around line 178-189)**:

Find and replace:
```
### Example: Creating a Window

```rust
use stayos::ui::Window;

let window = Window::new("My Window")
    .with_size(800, 600)
    .build()?;
```

This creates a new window with the specified dimensions.
```

Replace with:
```markdown
### Example: Documenting a Feature Section

```markdown
## FC-02: Spatial Search Engine

**Priority**: P1
**Sprint**: Sprint 2
**Story Points**: 8
**Dependencies**: FC-01 (AuthGate)

### Description
Geo-spatial search query engine incorporating map rendering and contextual filters.
```

This format is used for all feature documentation in `docs/02_product/`.
```

**Change 2 — Replace docs structure tree (around lines 303-329)**:

Find and replace the `docs/` tree block with the actual structure:
```
docs/
├── phase--1/                   # Phase -1: Founder Discovery (21 documents)
│   ├── INDEX.md                # Master index
│   ├── reports/                # 15 analysis reports
│   └── risks/                  # 7 risk documents (600+ risks)
├── 02_product/                 # Product specifications
│   ├── FEATURE_CATALOG.md
│   ├── MVP_FREEZE.md
│   ├── LEAN_PRODUCT.md
│   └── ...
├── 03_customer_experience/     # Customer journey and UX
│   ├── CUSTOMER_JOURNEY_BIBLE.md
│   ├── TRUST_FRAMEWORK.md
│   └── ...
├── architecture/               # Architecture Decision Records
│   └── adr/
├── standards/                  # This directory
└── templates/                  # Reusable prompt and doc templates
```

**Commit message**: `docs: fix documentation_guide.md — remove Rust examples, update directory structure`

---

### Step 4: Fix docs/standards/folder_conventions.md

**Change 1 — Replace directory name examples**:

Find:
```
src/
docs/
tests/
kernel/
user-space/
network-stack/
```

Replace with:
```
docs/
research/
business/
tools/
archive/
ai_agents/
```

**Change 2 — Replace file name examples**:

Find:
```
window-manager.rs
file-system.cpp
installation-guide.md
build-config.json
```

Replace with:
```
market_research.md
interview_template.md
competitor_research.md
feature_evaluation.md
```

**Change 3 — Update Project Structure tree** to match the actual repository structure (matching README.md's correct description).

**Commit message**: `docs: fix folder_conventions.md — remove computer OS examples, reflect actual structure`

---

### Step 5: Fix ai_agents/ai_agent_documentation.md

**Change 1 — DevAgent usage examples**:

Find:
```
DevAgent: Generate a Rust function for process scheduling
DevAgent: Review this code for security vulnerabilities
DevAgent: Optimize this function for performance
```

Replace with:
```
DevAgent: Generate a Python endpoint for property search with geospatial filtering
DevAgent: Review this payment webhook handler for security vulnerabilities
DevAgent: Optimize this database query for calendar availability checks
```

**Change 2 — DevAgent configuration**:

Find:
```
- Language: Rust, C++, Python
- Context: StayOS codebase
```

Replace with:
```
- Language: Python, JavaScript/TypeScript
- Context: StayOS accommodation marketplace (see MASTER_CONTEXT.md)
```

**Change 3 — ResearchAgent usage examples**:

Find:
```
ResearchAgent: Conduct market research for OS market
ResearchAgent: Analyze competitor X's features
```

Replace with:
```
ResearchAgent: Conduct market research for Egypt online accommodation market
ResearchAgent: Analyze Booking.com's Egypt property coverage and Arabic UX
ResearchAgent: Synthesize customer interview findings from 50 traveler interviews
```

**Commit message**: `docs: fix ai_agent_documentation.md — replace computer OS examples with accommodation examples`

---

### Step 6: Update README.md

**Change 1 — Add missing directories to repository structure tree**:

After the existing tree block, the following are missing:

Add after `├── ai_agents/`:
```
├── docs/
│   ├── phase--1/          # Phase -1: Founder Discovery (21 documents)
│   ├── 02_product/        # Product specifications (9 documents)
│   ├── 03_customer_experience/  # Customer journey and UX (4 documents)
│   ├── architecture/      # System architecture decisions (ADRs)
│   ├── standards/         # Documentation and repository standards
│   └── templates/         # Reusable document templates
├── business/              # Business planning templates
├── research/              # Research templates and findings
├── archive/               # Archived and legacy documents
```

**Change 2 — Update Key Documents table**:

Add rows:
```
| [Feature Catalog](docs/02_product/FEATURE_CATALOG.md) | 7 core accommodation features |
| [MVP Freeze](docs/02_product/MVP_FREEZE.md) | Scope freeze for Phase 1 build |
| [Customer Journey Bible](docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md) | Full journey map for all actors |
| [Trust Framework](docs/03_customer_experience/TRUST_FRAMEWORK.md) | Trust and safety architecture |
| [Engineering Backlog](docs/02_product/ENGINEERING_BACKLOG.md) | Phase 1 engineering tasks |
```

**Change 3 — Update TASKS.md pointer** (TASKS.md is being deleted):

Find:
```
└── TASKS.md               # Current tasks and immediate actions
```

Replace with:
```
└── PHASE_0_TRACKER.md     # Active Phase 0 gate tracking
```

**Commit message**: `docs: update README.md — add missing directories, update key documents table`

---

### Step 7: Rewrite PROJECT_RULES.md

**Content**: Keep the document but replace the engineering-team-specific rules with Phase 0 appropriate rules.

**Keep**:
- Core Principles section (quality, security, user-centricity, collaboration) — universally applicable
- Professional Communication rules
- Documentation rules
- Appeals process

**Replace**:
- Sprint Commitment, Daily Standups, Release Criteria (Phase 0 has no sprints, no deployments)
- Code submission rules (Phase 0 has no code)
- Testing requirements (Phase 0 has no tests)
- All team references (Kernel Team, Graphics Team — these don't exist)

**Add**:
- Phase 0 Specific Rules section:
  - "All customer interview findings must be documented within 24 hours of the interview"
  - "All assumptions must be logged in `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` before acting on them"
  - "No technology decisions may be made until Phase 0 gates are cleared"
  - "All financial projections must cite source assumptions"

**Commit message**: `docs: rewrite PROJECT_RULES.md for Phase 0 context — remove engineering team rules, add discovery rules`

---

### Step 8: Rewrite CONTRIBUTING.md

**Content**: Replace code contribution content with Phase 0 contribution types.

**Structure**:
```
## Contributing at Phase 0 (Current)

Phase 0 contributions are research, not code:

1. **Customer Interview Contributions**
   - Conduct traveler interviews using /research/interviews/interview_template.md
   - Document findings within 24 hours

2. **Market Research Contributions**
   - Egypt accommodation market analysis
   - Competitor research (Booking.com, Airbnb, local OTAs)
   - Payment landscape research (Paymob, Fawry, Meeza)

3. **Financial Modeling Contributions**
   - Fill in business/financial/financial_model_template.md
   - Ground all projections in interview findings

4. **Legal Research Contributions**
   - Egypt Tourism Authority regulations
   - Payment licensing (Central Bank of Egypt)
   - Company formation options

## Contributing at Phase 1+ (Future)

Code contribution guidelines will be added when Phase 0 gates clear and tech stack is confirmed.
```

**Commit message**: `docs: rewrite CONTRIBUTING.md for Phase 0 — replace code contribution with research contribution guidelines`

---

## PHASE 3: STRUCTURAL IMPROVEMENTS

### Step 9: Create DECISION_LOG.md (Accommodation Version)

New file content structure:

```markdown
# Decision Log — StayOS

**Purpose**: Records strategic, legal, product, and technical decisions made as StayOS progresses.

**See also**: docs/phase--1/reports/18_KEY_DECISIONS.md (Phase -1 key decisions)

## Decision Format
[standard format]

## Phase -1 Decisions (Inherited)
[Summary of 15 decisions from 18_KEY_DECISIONS.md with links]

## Phase 0 Decisions
[Empty — to be filled as Phase 0 progresses]

### Pending Decisions (From Phase -1 Output)
- D01: Legal entity structure (Egypt LLC vs offshore holdco)
- D02: Co-founder decision
- D03: Payment processor primary partner (Paymob vs alternatives)
- D04: Market entry wedge (to be determined from interviews)
- D05: Initial supply geography (Cairo first vs beach properties first)
```

**Commit message**: `docs: create DECISION_LOG.md for accommodation (replaces deleted computer OS version)`

---

### Step 10: Create PHASE_0_TRACKER.md

```markdown
# Phase 0 Tracker — StayOS

**Phase**: 0 — Customer Validation
**Status**: LOCKED (gate conditions not met)
**Last Updated**: 2026-07-13

## Gate Conditions

| Gate | Target | Kill Threshold | Status | Count | Notes |
|------|--------|----------------|--------|-------|-------|
| Traveler interviews | 50 | < 30 | NOT STARTED | 0 / 50 | |
| Host/PM interviews | 30 | < 20 | NOT STARTED | 0 / 30 | |
| Manual transactions | 10 | < 5 | NOT STARTED | 0 / 10 | |
| Guest NPS | ≥ 7.0/10 | < 5.0 | NOT STARTED | — | |
| Host NPS | ≥ 7.0/10 | < 5.0 | NOT STARTED | — | |
| Wedge identified | Specific, validated | Vague | NOT STARTED | — | |
| GCC guest % | > 20% organic | < 5% | NOT STARTED | — | |

## Milestone Status

### M0.1: Legal and Structural Foundation (Week 1–4)
- [ ] Trademark search: StayOS (Egypt, KSA, UAE)
- [ ] Tourism lawyer retained
- [ ] Legal entity structure decided
- [ ] Egypt Tourism Authority meeting scheduled
- [ ] Payment processor meetings: Paymob, Fawry
- [ ] WhatsApp Business API application submitted

### M0.2: Co-founder and Team (Week 1–6)
- [ ] Co-founder decision made
- [ ] Hospitality industry advisor secured
- [ ] Legal/regulatory advisor secured

### M0.3: Customer Discovery — Travelers (Week 2–8)
- [ ] Interview script designed
- [ ] 50 traveler interviews conducted
- [ ] Synthesis report produced

### M0.4: Customer Discovery — Hosts (Week 2–8)
- [ ] Host interview script designed
- [ ] 30 host/PM interviews conducted
- [ ] Synthesis report produced

### M0.5: Manual Pilot — 10 Real Transactions (Week 4–10)
- [ ] 3–5 verified property listings sourced
- [ ] 10 bookings completed
- [ ] Guest and host NPS collected

## Phase 0 is LOCKED until ALL gate conditions are met.
```

**Commit message**: `docs: create PHASE_0_TRACKER.md — active gate condition tracking for Phase 0`

---

### Step 11: Remove empty directories

```bash
rmdir src tests
```

Or keep as empty `.gitkeep` if you want to preserve the git tracking:
```bash
# Option A: Remove completely
git rm -r src/ tests/

# Option B: Convert to empty tracked directories
touch src/.gitkeep tests/.gitkeep
git add src/.gitkeep tests/.gitkeep
git rm --cached src tests  # if they were tracked
```

Recommendation: Remove completely. Phase 0 has no code. When Phase 1 begins, recreate with the correct tech stack (not Rust).

**Commit message**: `chore: remove empty src/ and tests/ directories (Phase 0 is pre-code)`

---

### Step 12: Fix .github/workflows/docs.yml

Create `.github/markdown-link-check.json`:
```json
{
  "ignorePatterns": [
    {"pattern": "^mailto:"},
    {"pattern": "^http://localhost"}
  ],
  "timeout": "20s",
  "retryOn429": true,
  "aliveStatusCodes": [200, 206]
}
```

Create `.github/markdown-lint.json`:
```json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false
}
```

**Commit message**: `ci: add missing markdown lint/check config files for docs.yml workflow`

---

### Step 13: Archive/clean docs/archive/generated/

```bash
git mv docs/archive/generated/EXTRACTION_REPORT.md archive/generated/EXTRACTION_REPORT.md
git mv docs/archive/generated/FILES_CREATED.md archive/generated/FILES_CREATED.md
```

Or simply delete if the content has zero value (they contain "Total documents created: 0").

**Commit message**: `chore: move tool output reports from docs/archive to archive/`

---

### Step 14: Archive research/risk/risk_template.md

```bash
git mv research/risk/risk_template.md archive/risk_template.md
```

**Commit message**: `chore: archive risk_template.md — superseded by 600+ risks in docs/phase--1/risks/`

---

### Step 15: Update CODEOWNERS

Replace all team references with sole owner:
```
# StayOS — Code Owners
# Phase 0: Sole founder
* @islamelbaz2010
```

---

## PHASE 4: ENHANCEMENTS

### Step 16: Create research/interviews/INTERVIEW_GUIDE.md

Based on ROADMAP.md Milestones 0.3 and 0.4. This is Phase 0's most important operational document.

Key sections:
- Traveler interview script (50 interviews)
- Host/property manager interview script (30 interviews)
- Hypotheses to test (from ROADMAP.md)
- Data recording template
- Synthesis methodology

---

### Step 17: Create CLAUDE.md

Standard project context file for AI-assisted development sessions.

Content:
- What StayOS is (accommodation marketplace, not computer OS)
- Current phase (Phase 0, LOCKED — gates not met)
- What NOT to do (write code, design database schemas, build before validating)
- What TO help with (research, documentation, analysis, interview synthesis)
- Key documents to read first (MASTER_CONTEXT.md, ROADMAP.md, docs/phase--1/INDEX.md)

---

## TOTAL EXECUTION ESTIMATE

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| Phase 1: Critical Removals | 5 tasks | 2 hours |
| Phase 2: Content Corrections | 6 tasks | 4 hours |
| Phase 3: Structural Improvements | 7 tasks | 3 hours |
| Phase 4: Enhancements | 2 tasks | 2 hours |
| **Total** | **20 tasks** | **~11 hours** |

---

## ESTIMATED IMPACT SUMMARY

| Metric | Before | After |
|--------|--------|-------|
| Files with computer OS content | 8 | 0 |
| Root-level wrong documents | 4 | 0 |
| Broken CI workflows | 1 | 0 |
| Missing Phase 0 tracker | Yes | No |
| Correct DECISION_LOG | No | Yes |
| README accuracy | 70% | 100% |
| Repository coherence (accommodation vs computer OS) | SPLIT | UNIFIED |

---

## FINAL SUMMARY COUNTS

| Category | Count |
|----------|-------|
| Files to MODIFY | 9 |
| Files to ARCHIVE | 4 |
| Files to REMOVE/DELETE | 6 |
| Files to CREATE (new) | 5 |
| Files to KEEP unchanged | 56 |
| **Total files touched** | **24** |

**Estimated execution time**: 1.5 working days (11 hours total)

---

*End of Migration Plan*
