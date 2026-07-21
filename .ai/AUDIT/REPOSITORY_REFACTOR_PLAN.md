# REPOSITORY REFACTOR PLAN — StayOS

**Date**: 2026-07-13
**Based On**: REPOSITORY_AUDIT.md + REPOSITORY_CLASSIFICATION.md
**Priority**: Ordered by impact — highest-impact changes first

---

## OVERVIEW

The refactor eliminates the split between the correct accommodation narrative (README, MASTER_CONTEXT, docs/) and the wrong computer OS operational layer (TASKS, DECISION_LOG, ASSUMPTIONS, RISKS). After execution, no active file in the repository will describe a computer operating system.

The refactor is **documentation-only**. No code is written. No src/ code exists. No technical architecture is being changed. This is a document coherence operation.

---

## TIER 1: CRITICAL — DO FIRST (Computer OS Contamination)

These changes eliminate direct contradictions with MASTER_CONTEXT.md. A contributor reading any root-level document before these changes are made will believe StayOS is a Rust microkernel project.

### T1.1 — REMOVE TASKS.md

**Why**: 100% computer OS content. Microkernel, process scheduler, memory management, Vulkan/Metal, IPC, ISO image, USB boot. The correct task list already exists at `docs/02_product/ENGINEERING_BACKLOG.md`.

**Action**:
- Delete `TASKS.md`
- Add pointer in README.md: "For engineering tasks, see `docs/02_product/ENGINEERING_BACKLOG.md`"

**Replacement target**: `docs/02_product/ENGINEERING_BACKLOG.md` (already correct)

**Risk**: LOW. No loss of information — TASKS.md contains zero valid accommodation content.

---

### T1.2 — REMOVE DECISION_LOG.md

**Why**: 10 decisions about Rust kernel, microkernel architecture, Vulkan/Metal UI, custom file system, custom IPC mechanism. All wrong. The correct decisions are at `docs/phase--1/reports/18_KEY_DECISIONS.md`.

**Action**:
- Delete `DECISION_LOG.md`
- Add pointer in README.md: "For strategic decisions, see `docs/phase--1/reports/18_KEY_DECISIONS.md`"
- Create `DECISION_LOG.md` as a new accommodation-specific decision log (see T2.2 below)

**Replacement target**: `docs/phase--1/reports/18_KEY_DECISIONS.md` (15 correct accommodation decisions, already exists)

**Risk**: LOW. No valid information lost.

---

### T1.3 — REMOVE ASSUMPTIONS.md

**Why**: Technical assumptions about Rust ecosystem, hardware performance, Vulkan/Metal, microkernel overhead, OEM partnerships, hardware supply chain. Market assumptions about digital wellbeing and developer ecosystem growth. None apply to accommodation. The correct assumption analysis is at `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` (100 accommodation assumptions with danger ratings and validation methods).

**Action**:
- Delete `ASSUMPTIONS.md`
- Add pointer in README.md: "For assumption analysis, see `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md`"

**Replacement target**: `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` (already correct)

**Risk**: LOW. No valid information lost.

---

### T1.4 — REMOVE RISKS.md

**Why**: Risks for a computer OS project — kernel complexity, Rust ecosystem, microkernel performance, OEM partnerships, hardware supply chain. The correct risk register is `docs/phase--1/risks/06_RISK_REGISTER.md` and 6 accompanying documents (600+ accommodation-specific risks).

**Action**:
- Delete `RISKS.md`
- Add pointer in README.md: "For the risk register, see `docs/phase--1/risks/06_RISK_REGISTER.md`"

**Replacement target**: `docs/phase--1/risks/` directory (already correct)

**Risk**: LOW. No valid information lost.

---

### T1.5 — REMOVE .github/workflows/ci.yml

**Why**: Runs `cargo build`, `cargo test`, `cargo clippy`, `cargo fmt` (Rust). No Rust code exists. No Cargo.toml exists. This workflow will fail on every push to main.

**Action**:
- Delete `.github/workflows/ci.yml`
- Create a Phase 0-appropriate `ci.yml` that only validates documentation (markdown linting, link checking) — no build steps, because there is nothing to build

**Replacement**:
```yaml
name: CI — Phase 0 Documentation Validation

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
    - name: Validate markdown structure
      run: find docs/ -name "*.md" | head -5 && echo "Docs present"
```

**Risk**: LOW-MEDIUM. Deleting CI is safe since it's failing anyway. The replacement is minimal and correct for Phase 0.

---

## TIER 2: HIGH — DO SECOND (Wrong Content in Active Documents)

### T2.1 — MODIFY docs/standards/documentation_guide.md

**Specific changes**:
1. Line 182: Replace `use stayos::ui::Window;` Rust example with an accommodation-relevant example (e.g., a YAML config or a Markdown structure example)
2. Lines 303-329: Replace the docs structure tree (which references `kernel.md`, `ui.md`, `platform.md`, `installation.md`, `api/`) with the actual StayOS docs structure that currently exists

**New structure to document**:
```
docs/
├── phase--1/           # Phase -1: Founder Discovery (21 documents)
├── 02_product/         # Product specifications
├── 03_customer_experience/  # Customer journey and UX
├── architecture/       # Architecture decisions (ADRs)
├── standards/          # Documentation and repository standards
└── templates/          # Reusable document templates
```

**Risk**: LOW. Minor edits to examples.

---

### T2.2 — MODIFY docs/standards/folder_conventions.md

**Specific changes**:
1. Replace directory name examples (`kernel/`, `user-space/`, `network-stack/`) with accommodation-relevant examples (`docs/`, `research/`, `business/`)
2. Replace file name examples (`window-manager.rs`, `file-system.cpp`) with accommodation-relevant examples (`market_research.md`, `interview_guide.md`)
3. Update the Project Structure tree to match actual repository structure

**Risk**: LOW.

---

### T2.3 — MODIFY ai_agents/ai_agent_documentation.md

**Specific changes**:
1. DevAgent usage examples: Replace "Generate a Rust function for process scheduling" with accommodation examples: "Generate a Python endpoint for property search", "Review this payment integration for security vulnerabilities"
2. DevAgent configuration: Replace "Language: Rust, C++, Python" with "Language: Python, JavaScript/TypeScript"
3. ResearchAgent usage: Replace "Conduct market research for OS market" with "Conduct market research for Egypt accommodation market"
4. Overall: Reorient agent descriptions toward Phase 0 research and Phase 1 web development context

**Risk**: LOW.

---

### T2.4 — MODIFY README.md

**Specific changes**:
1. Update Repository Structure section to include `docs/02_product/` and `docs/03_customer_experience/` (currently absent)
2. Update Key Documents table to include pointers to the product and customer experience docs
3. Add `archive/` to the structure (not currently listed)
4. Remove pointer to `TASKS.md` (being deleted) — replace with pointer to `docs/02_product/ENGINEERING_BACKLOG.md`
5. Remove pointer to `RISKS.md` (being deleted) — already points to correct Phase -1 risks

**Risk**: VERY LOW. Additive changes only.

---

### T2.5 — MODIFY PROJECT_RULES.md

**Specific changes**:
1. Remove all references to team-specific roles (Kernel Team, Graphics Team, Security Team, DevOps Team) that don't exist
2. Remove sprint commitments and daily standup rules — wrong stage
3. Remove code coverage requirements (>80%) — Phase 0 has no code
4. Replace with Phase 0-appropriate collaboration rules: interview conduct, research documentation standards, decision logging process, assumption tracking
5. Add a Phase gating note: "This document evolves as the project phases evolve. Rules for Phase 1+ (code, testing, deployment) will be added when Phase 0 gates clear."

**Risk**: LOW.

---

### T2.6 — MODIFY CONTRIBUTING.md

**Specific changes**:
1. Replace code contribution guidelines with Phase 0 contribution types: conducting customer interviews, documenting research findings, financial modeling, legal research, competitive analysis
2. Keep code of conduct section (appropriate at all stages)
3. Add a "Contributing at Phase 1+" section noting that code contribution guidelines will be added when Phase 0 gates clear
4. Remove prerequisites that assume development environment setup

**Risk**: LOW.

---

## TIER 3: MEDIUM — DO THIRD (Structural Improvements)

### T3.1 — CREATE DECISION_LOG.md (New Accommodation Version)

**Why**: The root-level DECISION_LOG.md is being removed (T1.2). The Phase -1 decision document exists but is not a living log. A root-level accommodation DECISION_LOG is useful.

**Content**:
- Format: Same structure as deleted version but with accommodation decisions
- Initial entries: Key decisions from Phase -1 (see 18_KEY_DECISIONS.md)
- Living document: will grow as Phase 0 decisions are made (legal structure, co-founder, payment processor)
- Section headers: Legal Structure, Team, Product, Technology, Market, Financial

**Risk**: LOW. New file, no information replaced.

---

### T3.2 — CREATE PHASE_0_TRACKER.md

**Why**: Phase 0 gate conditions are documented in ROADMAP.md but there is no active tracking document. Phase 0 has not started. A tracker is the most important operational document at this stage.

**Content**:
```markdown
# Phase 0 Gate Tracker

| Gate | Target | Kill Threshold | Status | Date |
|------|--------|----------------|--------|------|
| Traveler interviews | 50 completed | < 30 | NOT STARTED | — |
| Host interviews | 30 completed | < 20 | NOT STARTED | — |
| Manual transactions | 10 completed | < 5 | NOT STARTED | — |
| Guest NPS | ≥ 7.0/10 | < 5.0 | NOT STARTED | — |
| Host NPS | ≥ 7.0/10 | < 5.0 | NOT STARTED | — |
| Wedge identified | Specific, validated | Vague/generic | NOT STARTED | — |
| GCC guest % | > 20% organic | < 5% | NOT STARTED | — |
```

Also tracks Milestone 0.1 (Legal), 0.2 (Team), 0.3 (Traveler Discovery), 0.4 (Host Discovery), 0.5 (Manual Pilot).

**Risk**: LOW. New file.

---

### T3.3 — MODIFY .github/workflows/docs.yml

**Why**: References non-existent config files (`.github/markdown-link-check.json`, `.github/markdown-lint.json`).

**Action**:
- Create `.github/markdown-link-check.json` with appropriate configuration
- Create `.github/markdown-lint.json` with appropriate configuration
- Or: simplify docs.yml to not depend on missing config files

**Risk**: LOW.

---

### T3.4 — REMOVE src/ and tests/ directories

**Why**: Empty directories. No code at Phase 0. Misleading placeholder. Remove until Phase 1 begins.

**Action**: Delete `src/` and `tests/`

**Risk**: VERY LOW. Empty directories.

---

### T3.5 — ARCHIVE docs/archive/generated/ contents

**Why**: `EXTRACTION_REPORT.md` and `FILES_CREATED.md` are tool output files ("Total conversations scanned: 3, Total markdown documents created: 0"). Zero informational value to the project.

**Action**: Move to `archive/generated/` (or delete entirely)

**Risk**: VERY LOW.

---

### T3.6 — ARCHIVE research/risk/risk_template.md

**Why**: Superseded by 600+ risks already in `docs/phase--1/risks/`. A blank template adds no value alongside a complete risk register.

**Action**: Move to `archive/`

**Risk**: VERY LOW.

---

### T3.7 — MODIFY CODEOWNERS

**Why**: References code owners for roles that don't exist. At Phase 0 with 1 person, CODEOWNERS should reflect reality.

**Action**: Update to assign all ownership to @islamelbaz2010

**Risk**: VERY LOW.

---

## TIER 4: LOW — DO LAST (Enhancements)

### T4.1 — CREATE research/interviews/INTERVIEW_GUIDE.md

**Why**: Phase 0 requires 80 interviews. No interview guide exists. Templates directory has a template but no StayOS-specific guide.

**Content**: Based on ROADMAP.md Milestones 0.3 and 0.4 interview target mixes and hypotheses to test.

---

### T4.2 — CREATE CLAUDE.md

**Why**: Standard project context file for AI-assisted development. Provides Claude with project rules, context, and how to help.

**Content**: Phase 0 focus, accommodation marketplace context, key decisions, what to avoid (writing code, building before validating), what to help with (research, documentation, analysis).

---

### T4.3 — UPDATE business/roadmap/roadmap_template.md or MERGE

**Why**: Generic template alongside a complete ROADMAP.md adds clutter.

**Action**: Either delete the template (ROADMAP.md supersedes it) or convert it to a template for future market expansion roadmaps (Phase 3+).

---

## EXECUTION ORDER SUMMARY

```
Day 1 (Critical Removals — 2 hours):
  T1.1  Delete TASKS.md
  T1.2  Delete DECISION_LOG.md  
  T1.3  Delete ASSUMPTIONS.md
  T1.4  Delete RISKS.md
  T1.5  Delete/replace ci.yml

Day 2 (Wrong Content in Active Docs — 4 hours):
  T2.1  Fix documentation_guide.md
  T2.2  Fix folder_conventions.md
  T2.3  Fix ai_agent_documentation.md
  T2.4  Update README.md
  T2.5  Rewrite PROJECT_RULES.md
  T2.6  Rewrite CONTRIBUTING.md

Day 3 (Structural Improvements — 3 hours):
  T3.1  Create DECISION_LOG.md (accommodation version)
  T3.2  Create PHASE_0_TRACKER.md
  T3.3  Fix docs.yml workflow
  T3.4  Remove src/, tests/
  T3.5  Archive docs/archive/generated/
  T3.6  Archive research/risk/risk_template.md
  T3.7  Fix CODEOWNERS

Day 4 (Enhancements — 2 hours):
  T4.1  Create INTERVIEW_GUIDE.md
  T4.2  Create CLAUDE.md
  T4.3  Merge/remove roadmap_template.md
```

---

## VALIDATION CHECKLIST

After execution, verify:

- [ ] `grep -r "kernel\|microkernel\|vulkan\|IPC\|ISO image\|cargo build" --include="*.md" .` returns zero results outside `archive/`
- [ ] `grep -r "Kernel Team\|Graphics Team\|Storage Team" --include="*.md" .` returns zero results
- [ ] All documents referenced in README.md exist
- [ ] `.github/workflows/ci.yml` either doesn't exist or doesn't reference Rust toolchain
- [ ] `TASKS.md`, `DECISION_LOG.md`, `ASSUMPTIONS.md`, `RISKS.md` no longer exist at root level
- [ ] `PHASE_0_TRACKER.md` exists and reflects current status (all NOT STARTED)
- [ ] `DECISION_LOG.md` exists and contains accommodation decisions only
- [ ] README.md repository structure matches actual directory tree

---

*End of Refactor Plan*
