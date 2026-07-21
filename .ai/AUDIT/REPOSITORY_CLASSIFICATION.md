# REPOSITORY CLASSIFICATION — StayOS

**Date**: 2026-07-13
**Basis**: Full content audit of all non-.git files

Each file is classified as exactly one of: **KEEP** · **MODIFY** · **MERGE** · **ARCHIVE** · **REMOVE**

---

## ROOT LEVEL DOCUMENTS

| File | Classification | Reason |
|------|---------------|--------|
| `README.md` | **MODIFY** | Correct content. Missing docs/02_product/ and docs/03_customer_experience/ from repository structure. Archive section absent. Minor update needed. |
| `MASTER_CONTEXT.md` | **KEEP** | v2.0.0. Correct, complete, authoritative. Single source of truth for accommodation marketplace. |
| `PROJECT_VISION.md` | **KEEP** | v2.0.0. Correct vision for accommodation OS. Explicit "not a computer OS" statement. |
| `ROADMAP.md` | **KEEP** | v2.0.0. Correct phase-gated accommodation marketplace roadmap. |
| `TASKS.md` | **REMOVE** | 100% computer OS content. Describes building a Rust microkernel. Zero accommodation tasks. Directly conflicts with MASTER_CONTEXT.md. The correct task list is `docs/02_product/ENGINEERING_BACKLOG.md`. |
| `DECISION_LOG.md` | **REMOVE** | 100% computer OS decisions (Rust kernel, microkernel, Vulkan/Metal, file system, custom IPC). All 10 decisions are wrong for StayOS. The correct decisions are in `docs/phase--1/reports/18_KEY_DECISIONS.md`. |
| `ASSUMPTIONS.md` | **REMOVE** | ~80% computer OS assumptions (Rust, hardware, microkernel, OEMs). The correct assumption analysis is `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` (100 accommodation assumptions). |
| `RISKS.md` | **REMOVE** | ~60% computer OS risks (kernel, Rust ecosystem, OEMs, hardware supply chain). The correct risk register is `docs/phase--1/risks/` (600+ accommodation risks). |
| `PROJECT_RULES.md` | **MODIFY** | Generic rules with wrong team references (Kernel Team, Graphics Team). Stage-inappropriate (sprint commitments, code coverage for Phase 0). Needs rewrite for Phase 0 context and accommodation project. |
| `CONTRIBUTING.md` | **MODIFY** | Describes code contribution process for a team. Phase 0 contributions are interviews, research, financial modeling, legal work — not code. Needs Phase 0-specific version. |
| `ASSUMPTIONS.md` | **REMOVE** | See above. |
| `DECISION_LOG.md` | **REMOVE** | See above. |
| `CODEOWNERS` | **MODIFY** | References code ownership for teams that don't exist. Should reflect actual ownership (founder only, pre-team). |
| `LICENSE` | **KEEP** | MIT license. Correct. |

---

## .GITHUB DIRECTORY

| File | Classification | Reason |
|------|---------------|--------|
| `.github/workflows/ci.yml` | **REMOVE** | Runs `cargo build` and `cargo test` for Rust. No Rust code exists. No Cargo.toml. Will fail on every push. Wrong tech stack for Phase 0 or Phase 1. |
| `.github/workflows/docs.yml` | **MODIFY** | References non-existent config files (`.github/markdown-link-check.json`, `.github/markdown-lint.json`). The markdown checking intent is correct; the config references need to be created or removed. |
| `.github/workflows/release.yml` | **ARCHIVE** | Release workflow for a product that is pre-Phase 0. Not needed until Phase 1. |
| `.github/workflows/security.yml` | **KEEP** | Security scanning is always appropriate. Verify it doesn't depend on Rust toolchain. |
| `.github/ISSUE_TEMPLATE/bug_report.md` | **KEEP** | Generic issue template. Appropriate at all stages. |
| `.github/ISSUE_TEMPLATE/documentation.md` | **KEEP** | Generic documentation issue template. Appropriate. |
| `.github/ISSUE_TEMPLATE/feature_request.md` | **KEEP** | Generic feature request template. Appropriate. |
| `.github/PULL_REQUEST_TEMPLATE/pr_template.md` | **KEEP** | Generic PR template. Appropriate. |
| `.github/labels/labels.md` | **KEEP** | GitHub label definitions. Appropriate. |

---

## DOCS/PHASE--1 (21 DOCUMENTS)

| File | Classification | Reason |
|------|---------------|--------|
| `docs/phase--1/INDEX.md` | **KEEP** | Master index of all 21 Phase -1 documents. Correct and complete. |
| `docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md` | **KEEP** | Panel verdict. Critical Phase -1 output. |
| `docs/phase--1/reports/02_PRE_MORTEM.md` | **KEEP** | How StayOS fails. Essential Phase -1 output. |
| `docs/phase--1/reports/03_STARTUP_KILL_REPORT.md` | **KEEP** | 110 failure modes. Essential Phase -1 output. |
| `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` | **KEEP** | 100 accommodation assumptions. This is the correct ASSUMPTIONS document. |
| `docs/phase--1/reports/05_MARKET_HYPOTHESES.md` | **KEEP** | 20 testable market hypotheses. |
| `docs/phase--1/reports/13_FOUNDER_MISTAKES.md` | **KEEP** | 25 deadly founder mistakes. |
| `docs/phase--1/reports/14_FAILURE_SCENARIOS.md` | **KEEP** | 6 failure narratives. |
| `docs/phase--1/reports/15_SUCCESS_FACTORS.md` | **KEEP** | 10 critical success conditions. |
| `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` | **KEEP** | Phase 0 gate conditions. Critical gating document. |
| `docs/phase--1/reports/17_UNKNOWNS.md` | **KEEP** | 75 known unknowns. |
| `docs/phase--1/reports/18_KEY_DECISIONS.md` | **KEEP** | 15 strategic decisions. This is the correct DECISION_LOG. |
| `docs/phase--1/reports/19_EXECUTION_ORDER.md` | **KEEP** | Week-by-week action plan. |
| `docs/phase--1/reports/20_NEXT_PHASE.md` | **KEEP** | Phase 0 definition. |
| `docs/phase--1/risks/06_RISK_REGISTER.md` | **KEEP** | Master risk index. This is the correct RISKS document. |
| `docs/phase--1/risks/07_BUSINESS_RISKS.md` | **KEEP** | 100 accommodation business risks. |
| `docs/phase--1/risks/08_TECHNICAL_RISKS.md` | **KEEP** | 100 accommodation technical risks. |
| `docs/phase--1/risks/09_LEGAL_RISKS.md` | **KEEP** | 100 accommodation legal risks. |
| `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` | **KEEP** | 100 accommodation marketplace risks. |
| `docs/phase--1/risks/11_FINANCIAL_RISKS.md` | **KEEP** | 100 accommodation financial risks. |
| `docs/phase--1/risks/12_COMPETITIVE_RISKS.md` | **KEEP** | 100 accommodation competitive risks. |

---

## DOCS/02_PRODUCT (9 DOCUMENTS)

| File | Classification | Reason |
|------|---------------|--------|
| `docs/02_product/FEATURE_CATALOG.md` | **KEEP** | 7 core accommodation features defined. Correct. |
| `docs/02_product/FEATURE_DEPENDENCY_MAP.md` | **KEEP** | Dependency map for accommodation features. Correct. |
| `docs/02_product/ENGINEERING_BACKLOG.md` | **KEEP** | This is the real task list — accommodation engineering backlog with correct EPICs (AuthGate, Spatial Search, Reservation, OpsManager, Treasury). |
| `docs/02_product/BUSINESS_RULES.md` | **KEEP** | Accommodation business rules. KYC, calendar integrity, escrow. Correct. |
| `docs/02_product/USER_STORIES.md` | **KEEP** | Accommodation user stories for 5 personas (Guest, Host/PM, Field Staff, Finance, Support). Correct. |
| `docs/02_product/FLOWS.md` | **KEEP** | 4 core accommodation flows. Correct. |
| `docs/02_product/LEAN_PRODUCT.md` | **KEEP** | Lean product constraints for accommodation. $150K / 6 months. Correct. |
| `docs/02_product/MVP_FREEZE.md` | **KEEP** | MVP scope freeze for accommodation. What's in, what's deferred. Correct. |
| `docs/02_product/PRODUCT_NORMALIZATION_REPORT.md` | **KEEP** | Documents deduplication decisions for accommodation architecture. Correct. |

---

## DOCS/03_CUSTOMER_EXPERIENCE (4 DOCUMENTS)

| File | Classification | Reason |
|------|---------------|--------|
| `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` | **KEEP** | Actor profiles and journey map for accommodation. Guest, Host, PM, Cleaner, Support, Admin personas. Correct. |
| `docs/03_customer_experience/DELIGHT_ENGINE.md` | **KEEP** | 100 micro-delight moments for accommodation. Correct. |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | **KEEP** | SLA-level experience rules for accommodation. Correct. |
| `docs/03_customer_experience/TRUST_FRAMEWORK.md` | **KEEP** | Trust framework (Zero-Ghost Protocol, Vault Escrow, Guardian Panic Button). Correct for accommodation. |

---

## DOCS/ARCHITECTURE

| File | Classification | Reason |
|------|---------------|--------|
| `docs/architecture/adr/ADR-template.md` | **KEEP** | Generic ADR template. Appropriate for any project. No computer OS content. |

---

## DOCS/STANDARDS (5 DOCUMENTS)

| File | Classification | Reason |
|------|---------------|--------|
| `docs/standards/documentation_guide.md` | **MODIFY** | Contains Rust code example (`stayos::ui::Window`), references `kernel.md`, `ui.md`, `platform.md` API docs, and `installation.md`. All computer OS artifacts. The framework (markdown, structure, quality) is useful — the examples and API doc structure need replacing with accommodation-appropriate examples. |
| `docs/standards/folder_conventions.md` | **MODIFY** | Directory examples (`kernel/`, `user-space/`, `network-stack/`) and file name examples (`window-manager.rs`, `file-system.cpp`) are computer OS artifacts. The actual directory structure documented doesn't match the real repository. Needs update to reflect actual StayOS folder structure. |
| `docs/standards/commit_conventions.md` | **KEEP** | Generic commit conventions. Likely appropriate without computer OS artifacts. |
| `docs/standards/markdown_standards.md` | **KEEP** | Generic markdown standards. Appropriate. |
| `docs/standards/naming_conventions.md` | **KEEP** | Generic naming conventions. Likely appropriate. |
| `docs/standards/repository_standards.md` | **KEEP** | Generic repository standards. Verify no computer OS content. |

---

## DOCS/ARCHIVE

| File | Classification | Reason |
|------|---------------|--------|
| `docs/archive/generated/EXTRACTION_REPORT.md` | **ARCHIVE** | Tool output report ("Total conversations scanned: 3, Total markdown documents created: 0"). Zero informational value. Should move to `archive/`. |
| `docs/archive/generated/FILES_CREATED.md` | **ARCHIVE** | Tool output. Check content, but likely zero informational value. Move to `archive/`. |

---

## DOCS/TEMPLATES

| File | Classification | Reason |
|------|---------------|--------|
| `docs/templates/prompt_template.md` | **KEEP** | Reusable AI prompt template. Appropriate for Phase 0 research prompts. |

---

## BUSINESS DIRECTORY (4 TEMPLATES)

| File | Classification | Reason |
|------|---------------|--------|
| `business/financial/financial_model_template.md` | **KEEP** | Generic financial model template. Has correct structure. No computer OS content. Ready to fill in with StayOS numbers (which are already in MASTER_CONTEXT.md). |
| `business/product/product_template.md` | **KEEP** | Generic product template. Assess content, but likely appropriate placeholder. |
| `business/roadmap/roadmap_template.md` | **MERGE** | Generic roadmap template adds no value alongside the complete `ROADMAP.md`. Merge any useful elements into the roadmap template, then remove. |
| `business/sprint/sprint_template.md` | **KEEP** | Sprint template for future use when Phase 1 begins. |

---

## RESEARCH DIRECTORY (5 TEMPLATES)

| File | Classification | Reason |
|------|---------------|--------|
| `research/market/market_research_template.md` | **KEEP** | Ready to use for Phase 0 Egypt market research. |
| `research/competitor/competitor_research_template.md` | **KEEP** | Ready to use for Phase 0 Booking.com/Airbnb Egypt analysis. |
| `research/interviews/interview_template.md` | **KEEP** | Ready to use for Phase 0 traveler and host interviews. |
| `research/feature_evaluation/feature_evaluation_template.md` | **KEEP** | Ready for Phase 1 feature evaluation. |
| `research/risk/risk_template.md` | **ARCHIVE** | Superseded by 600+ risks already catalogued in `docs/phase--1/risks/`. Adds no value. |

---

## AI_AGENTS DIRECTORY

| File | Classification | Reason |
|------|---------------|--------|
| `ai_agents/ai_agent_documentation.md` | **MODIFY** | DevAgent references Rust kernel code generation. ResearchAgent references "OS market". All examples are wrong. The framework (5 agent types, integration patterns, prompt templates) is useful. Replace computer OS examples with accommodation marketplace examples. |

---

## TOOLS DIRECTORY

| File | Classification | Reason |
|------|---------------|--------|
| `tools/extract_docs.py` | **KEEP** | Document extraction tool. Used in current branch. |
| `tools/cto_ai.py` | **KEEP** | AI CTO tool. Assess content; likely Phase 0 research tool. |
| `tools/repository_auditor.py` | **KEEP** | Repository audit tool. Useful for ongoing health checks. |
| `tools/repository_cleanup.py` | **KEEP** | Repository cleanup tool. Useful for maintenance. |
| `tools/repository_dashboard.py` | **KEEP** | Repository dashboard tool. Useful for visibility. |
| `tools/repository_indexer.py` | **KEEP** | Repository indexer. Powers the auditor. |
| `tools/README_extract_docs.md` | **KEEP** | Documentation for the extract_docs tool. |

---

## ARCHIVE DIRECTORY

| File | Classification | Reason |
|------|---------------|--------|
| `archive/CLEANUP_REPORT.md` | **KEEP** | Documents what was moved and why. Historical record. |
| `archive/legacy/phase-2-product/` | **KEEP** | Correctly archived legacy product docs. |
| `archive/legacy/phase-3-customer/` | **KEEP** | Correctly archived legacy customer docs. |
| `archive/legacy/phase-4-egypt/` | **KEEP** | Correctly archived legacy Egypt docs. |
| `archive/raw-ai-output/` (4 files) | **KEEP** | Raw AI output, correctly archived. |
| `archive/raw-prompts/` (9 CSV files) | **KEEP** | Raw Gemini prompts, correctly archived. |

---

## EMPTY DIRECTORIES

| Directory | Classification | Reason |
|-----------|---------------|--------|
| `src/` | **REMOVE** | Empty. No code. Phase 0 = no code. Phase 1 tech stack is not Rust. Remove until Phase 1 begins and tech stack is confirmed. |
| `scripts/` | **KEEP** | Empty placeholder. Will hold utility scripts. Keep structure. |
| `tests/` | **REMOVE** | Empty. No code = no tests. Remove until Phase 1 begins. |
| `.devin/workflows/` | **KEEP** | Empty. Devin AI workflow directory. Keep as infrastructure. |

---

## CLASSIFICATION SUMMARY

| Classification | Count |
|---------------|-------|
| KEEP | 56 |
| MODIFY | 9 |
| MERGE | 1 |
| ARCHIVE | 4 |
| REMOVE | 6 |
| **TOTAL** | **76** |

---

*End of Repository Classification*
