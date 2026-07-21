# REPOSITORY AUDIT — StayOS

**Date**: 2026-07-13
**Branch**: tooling/document-extractor
**Auditor**: Claude Code (automated full-repository audit)
**Scope**: All non-.git files — documentation, business, tools, ai_agents, archive, research, src, scripts, tests, .github

---

## EXECUTIVE SUMMARY

The repository is in a **critical split state**. It has two incompatible personalities living side by side:

- **Layer A (Accommodation OS — CORRECT)**: README, MASTER_CONTEXT, PROJECT_VISION, ROADMAP, all 21 Phase -1 documents, all 9 docs/02_product/ documents, all 4 docs/03_customer_experience/ documents. These were updated to v2.0.0 on 2026-07-13 and correctly describe StayOS as an AI-powered accommodation marketplace for MENA.

- **Layer B (Computer OS — CATASTROPHICALLY WRONG)**: TASKS.md, DECISION_LOG.md, ASSUMPTIONS.md, RISKS.md. All four root-level operational documents were never updated and still describe building a computer operating system in Rust with microkernels, Vulkan/Metal, file system drivers, IPC, USB boot, and ISO image creation.

**These two layers directly contradict each other.** The correct strategic layer says "StayOS is NOT a computer OS." The operational layer underneath it describes 30 tasks to build a microkernel in Rust.

Additionally, the CI/CD pipeline (.github/workflows/ci.yml) runs `cargo build` and `cargo test` — there is no Rust code in the repository, there is no `Cargo.toml`, and there will not be at Phase 0. It will fail on every push.

---

## SECTION 1: PROBLEMS DETECTED

### 1.1 Catastrophic Documentation Contradiction

The four root-level operational documents describe a **computer operating system**:

| File | Problem |
|------|---------|
| `TASKS.md` | 30 tasks for microkernel core, process scheduler, memory management, file system, IPC, Vulkan/Metal graphics, window manager, compositor, display server, ISO image creation, USB boot support. Zero accommodation tasks. |
| `DECISION_LOG.md` | 10 decisions: Rust for kernel, microkernel architecture, custom file system (copy-on-write, snapshots), Vulkan/Metal UI framework, custom IPC, package manager. Zero accommodation decisions. |
| `ASSUMPTIONS.md` | TA-001 (Rust ecosystem), TA-002 (hardware performance for microkernel), TA-003 (Vulkan/Metal availability), TA-004 (kernel developer hiring), BA-004 (OEM partnership interest), ER-002 (hardware supply chain). Zero accommodation assumptions. |
| `RISKS.md` | TR-001 (Kernel Development Complexity, score 20 Critical), TR-002 (Rust ecosystem), TR-003 (microkernel performance), BR-003 (OEM partnerships), ER-002 (hardware supply chain). Zero accommodation risks — the 600+ real accommodation risks are in docs/phase--1/risks/ and are ignored here. |

**Severity**: CRITICAL. A new contributor, investor, or co-founder who reads TASKS.md would believe this team is building a desktop operating system in Rust.

### 1.2 Broken CI/CD Pipeline

- `ci.yml` runs `cargo build` and `cargo test` (Rust)
- No `Cargo.toml` exists in the repository
- No Rust source code exists (`src/` is empty)
- Every push to main or a PR will trigger a failing build
- Phase 0 requires zero code. Phase 1 requires a web platform (React/Next.js + Node.js/Python). Neither requires Rust.

**Severity**: CRITICAL. The CI pipeline fails on every commit.

### 1.3 Empty Skeleton Directories

| Directory | Status | Issue |
|-----------|--------|-------|
| `src/` | Empty | Exists as placeholder; README references it but nothing is there |
| `scripts/` | Empty | Exists but empty |
| `tests/` | Empty | Exists but empty |
| `.devin/workflows/` | Empty | Exists but empty |

These directories exist but contain nothing. They create the impression of a codebase that does not exist.

### 1.4 Template-Only Content with No Actual Work Product

The following folders contain only generic, unfilled templates — no actual StayOS research or analysis has been done:

| Directory | Content | Problem |
|-----------|---------|---------|
| `business/financial/` | Generic financial model template | No actual StayOS financial model |
| `business/product/` | Generic product template | No product work product |
| `business/roadmap/` | Generic roadmap template | Duplicates ROADMAP.md with no content |
| `business/sprint/` | Generic sprint template | No sprints exist at Phase 0 |
| `research/market/` | Market research template | No actual market research |
| `research/competitor/` | Competitor template | No actual competitor analysis |
| `research/interviews/` | Interview template | No actual interviews (Phase 0 hasn't started) |
| `research/feature_evaluation/` | Feature evaluation template | No actual feature evaluations |
| `research/risk/` | Risk template | Duplicates phase--1/risks/ with no content |

**Severity**: MEDIUM. These are placeholders, not problems per se, but they create false structure and imply work has been done that hasn't.

### 1.5 Standards Documents Reference Computer OS Architecture

| File | Problem |
|------|---------|
| `docs/standards/documentation_guide.md` | Contains Rust code example: `use stayos::ui::Window;` — references a non-existent computer OS UI API. Also describes documentation structure with `kernel.md`, `ui.md`, `platform.md` API docs that will never exist. |
| `docs/standards/folder_conventions.md` | Examples reference `kernel/`, `user-space/`, `network-stack/`, `window-manager.rs`, `file-system.cpp` — all computer OS directory and file naming. |

**Severity**: HIGH. Standards documents defining how the project organizes itself still describe a computer OS.

### 1.6 AI Agent Documentation References Wrong Context

`ai_agents/ai_agent_documentation.md` defines a `DevAgent` that generates Rust kernel code:
- Usage examples: "Generate a Rust function for process scheduling"
- Configuration: "Language: Rust, C++, Python"
- Context: "StayOS codebase"
- ResearchAgent references "OS market"

**Severity**: MEDIUM. This document is pre-Phase 1 planning, but references a Rust codebase that doesn't exist and won't exist.

### 1.7 PROJECT_RULES.md Describes Wrong Team and Wrong Stage

`PROJECT_RULES.md` defines rules for a multi-person engineering team (Kernel Team, Graphics Team, Security Team, DevOps Team, daily standups, code reviews, sprint commitments). The project has:
- 1 person
- No code
- No team
- Phase 0 not started
- Gate conditions for Phase 1 not met

**Severity**: MEDIUM. Rules reference a team structure and development stage that is 18+ months away.

### 1.8 GitHub Workflows Reference Non-Existent Configuration

- `docs.yml` references `.github/markdown-link-check.json` (does not exist)
- `docs.yml` references `.github/markdown-lint.json` (does not exist)
- `release.yml` and `security.yml` likely reference similar non-existent configs

**Severity**: LOW-MEDIUM. Workflows may fail silently or on edge cases.

### 1.9 README Repository Structure Is Outdated

`README.md` describes the repository structure but omits:
- `docs/02_product/` (9 files, completely missing from the structure)
- `docs/03_customer_experience/` (4 files, completely missing from the structure)
- `business/` directory
- `archive/` directory

**Severity**: MEDIUM. New contributors reading README will not find the product documentation.

### 1.10 CONTRIBUTING.md Describes Code Contribution at Phase 0

`CONTRIBUTING.md` provides guidelines for code contributions, testing requirements (>80% coverage), and code review processes. None of this applies at Phase 0. Phase 0 contributions are: interviews, market research, financial modeling, legal research.

**Severity**: LOW. Confusing for anyone who discovers the repository during Phase 0.

---

## SECTION 2: DUPLICATE DOCUMENTATION

| Duplicate Pair | Status |
|---------------|--------|
| `RISKS.md` (computer OS risks) vs `docs/phase--1/risks/` (accommodation risks) | CONFLICT — two completely different risk registers for different products |
| `ASSUMPTIONS.md` (computer OS assumptions) vs `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` (accommodation assumptions) | CONFLICT — 16 computer OS assumptions vs 100 accommodation assumptions |
| `DECISION_LOG.md` (computer OS decisions) vs `docs/phase--1/reports/18_KEY_DECISIONS.md` (accommodation decisions) | CONFLICT — 10 wrong decisions vs 15 correct decisions |
| `TASKS.md` (computer OS tasks) vs `docs/02_product/ENGINEERING_BACKLOG.md` (accommodation tasks) | CONFLICT — 30 wrong tasks vs correct accommodation engineering backlog |
| `docs/02_product/LEAN_PRODUCT.md` vs `archive/legacy/phase-3-customer/LEAN_PRODUCT.md` | Duplicate, legacy correctly archived |
| `docs/02_product/MVP_FREEZE.md` vs `archive/legacy/phase-3-customer/MVP_FREEZE.md` | Duplicate, legacy correctly archived |
| `docs/02_product/ENGINEERING_BACKLOG.md` vs `archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md` | Duplicate, legacy correctly archived |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` vs `archive/legacy/phase-3-customer/EXPERIENCE_RULES.md` | Duplicate, legacy correctly archived |
| `business/roadmap/` (empty template) vs `ROADMAP.md` (complete, correct) | Redundant — template adds no value |
| `research/risk/` (empty template) vs `docs/phase--1/risks/` (600 risks catalogued) | Redundant — template adds no value |

---

## SECTION 3: MISSING DOCUMENTATION

The following documents are referenced or implied but do not exist:

| Missing Document | Why Needed |
|-----------------|-----------|
| `PHASE_0_TRACKER.md` | Phase 0 gate conditions tracked in ROADMAP.md but no active tracking document |
| `docs/02_product/PHASE_1_SPEC.md` | Phase 1 product specification (what to build, not just the MVP freeze) |
| `research/interviews/INTERVIEW_GUIDE.md` | Phase 0 requires 80 interviews — no actual interview guide exists |
| `research/market/EGYPT_MARKET.md` | Phase -1 references market data but no primary research document exists |
| `research/competitor/BOOKING_COM.md` | Identified as key competitor; no analysis exists |
| `research/competitor/AIRBNB_EGYPT.md` | Identified as key competitor; no analysis exists |
| `CLAUDE.md` | Standard project context file for AI-assisted development; absent |
| `docs/phase--1/reports/06_RISK_REGISTER.md` | INDEX.md lists this as the master risk register but file path is `risks/06_RISK_REGISTER.md` |
| `.github/markdown-link-check.json` | Referenced in docs.yml workflow |
| `.github/markdown-lint.json` | Referenced in docs.yml workflow |
| `docs/02_product/GLOSSARY.md` | Feature catalog uses dense jargon (OpsManager, AuthGate, PMS Core) without definitions |
| `CODEOWNERS` | Exists but references teams that don't exist yet |

---

## SECTION 4: ACCOMMODATION OS VERIFICATION

The following question was asked: Does the repository represent StayOS as an **Accommodation Operating System** rather than a Computer Operating System?

**Answer: Partially. The core narrative documents are correct. The operational documents are not.**

### Correctly Represents Accommodation OS

- `README.md`: Explicitly states "OS does not mean Linux, Windows, or any computer operating system." Defines StayOS as accommodation marketplace for MENA. ✅
- `MASTER_CONTEXT.md` v2.0.0: Correctly defines StayOS as accommodation marketplace. States "It is NOT a computer operating system." ✅
- `PROJECT_VISION.md` v2.0.0: Correctly frames "OS" as business metaphor. States "StayOS is not a computer operating system." ✅
- `ROADMAP.md` v2.0.0: Correctly describes accommodation marketplace phases. ✅
- `docs/phase--1/` (21 documents): All content about accommodation market in Egypt/MENA. ✅
- `docs/02_product/` (9 documents): All about accommodation platform features. ✅
- `docs/03_customer_experience/` (4 documents): All about accommodation customer experience. ✅

### Does NOT Represent Accommodation OS

- `TASKS.md`: 100% computer OS content. Builds microkernel. ❌
- `DECISION_LOG.md`: 100% computer OS decisions. Chooses Rust kernel. ❌
- `ASSUMPTIONS.md`: ~80% computer OS assumptions. Hardware, microkernel, OEMs. ❌
- `RISKS.md`: ~60% computer OS risks. Kernel, Rust, OEMs, hardware supply chain. ❌
- `docs/standards/documentation_guide.md`: References Rust code examples, kernel API docs. ❌
- `docs/standards/folder_conventions.md`: References kernel/, network-stack/ directories. ❌
- `.github/workflows/ci.yml`: Runs Rust compiler. ❌
- `ai_agents/ai_agent_documentation.md`: References Rust kernel code generation. ❌

---

## SECTION 5: COMPUTER OS TERMINOLOGY INVENTORY

Every occurrence of computer OS terminology found in **active (non-archive) files**:

### TASKS.md (30+ occurrences — entire document is wrong)
- Microkernel core, boot process, trap handling, system calls, kernel panic
- Process scheduler, context switching, memory management, paging, virtual memory
- File system service, file system interface, file system mounting
- Device driver loading, device enumeration, Vulkan/Metal, hardware acceleration
- Window manager, compositor, display server, IPC mechanism, inter-process communication
- ISO image creation, USB boot support
- Kernel Team, Graphics Team, Storage Team, Network Team, UI Team

### DECISION_LOG.md (10 wrong decisions)
- DEC-001: Rust for kernel development
- DEC-003: Microkernel-Inspired Architecture, monolithic kernel, hybrid kernel, exokernel
- DEC-004: IPC mechanism, Unix Domain Sockets, DBus, message passing, shared memory
- DEC-005: Vulkan/Metal backend, GTK, Qt
- DEC-006: File system, ext4, ZFS, Btrfs, APFS, copy-on-write
- DEC-007: Package manager (SPM), apt/dnf, Flatpak/Snap, Nix
- DEC-008: Mandatory access control, SELinux, AppArmor, secure boot, verified boot

### ASSUMPTIONS.md (8 wrong assumptions)
- TA-001: Rust ecosystem maturity for OS development
- TA-002: Hardware performance for microkernel overhead
- TA-003: Vulkan/Metal availability on target platforms
- TA-004: Rust/systems developer talent availability
- BA-004: OEM partnership interest in pre-installing StayOS
- EA-002: Hardware supply chain stability

### RISKS.md (8 wrong risks)
- TR-001: Kernel Development Complexity (Risk Score: 20 Critical)
- TR-002: Rust Ecosystem Limitations
- TR-003: Performance Targets Not Met (microkernel overhead)
- BR-003: OEM Partnership Failure, Hardware OEMs
- ER-002: Hardware Supply Chain Disruption (hardware suppliers, hardware requirements)
- Various references: "OS development is notoriously complex", "Hire experienced kernel developers"

### docs/standards/documentation_guide.md (5 occurrences)
- `use stayos::ui::Window;` (Rust code example, line 182)
- `kernel.md`, `ui.md`, `platform.md` (API doc structure)
- `installation_guide.md` (implies installable OS)

### docs/standards/folder_conventions.md (6 occurrences)
- `kernel/`, `user-space/`, `network-stack/` (directory examples)
- `window-manager.rs`, `file-system.cpp` (file name examples)

### .github/workflows/ci.yml (entire file is wrong)
- `cargo build`, `cargo test`, `cargo clippy`, `cargo fmt`
- Install Rust, Cargo.lock references
- `actions-rs/toolchain@v1`

### ai_agents/ai_agent_documentation.md
- DevAgent: "Generate a Rust function for process scheduling"
- Configuration: "Language: Rust, C++, Python"
- "Conduct research on OS market" (ResearchAgent example)
- "OS development" (multiple references)

### PROJECT_RULES.md (indirect — references teams that don't exist)
- Kernel Team, Graphics Team, Security Team (implied by context)
- Sprint commitments, daily standups (wrong stage)

---

## SECTION 6: WHAT IS CORRECT AND SHOULD BE PROTECTED

The following documents are correct, coherent, and must not be modified during refactoring:

| Document | Why Correct |
|----------|------------|
| `README.md` | Correctly defines StayOS. Clear "OS ≠ Linux" statement. |
| `MASTER_CONTEXT.md` v2.0.0 | Single source of truth. Accommodation marketplace. |
| `PROJECT_VISION.md` v2.0.0 | Correct vision. Business metaphor for OS explained. |
| `ROADMAP.md` v2.0.0 | Correct phase-gated roadmap for accommodation marketplace. |
| All 21 `docs/phase--1/` documents | Complete, correct Phase -1 discovery work. |
| `docs/02_product/FEATURE_CATALOG.md` | Correct accommodation features (AuthGate, Spatial Search, PMS). |
| `docs/02_product/MVP_FREEZE.md` | Correct accommodation MVP scope. |
| `docs/02_product/LEAN_PRODUCT.md` | Correct lean product for accommodation. |
| `docs/02_product/ENGINEERING_BACKLOG.md` | Correct accommodation engineering tasks. |
| `docs/02_product/BUSINESS_RULES.md` | Correct accommodation business rules. |
| `docs/02_product/USER_STORIES.md` | Correct accommodation user stories. |
| `docs/02_product/FLOWS.md` | Correct accommodation flows. |
| `docs/02_product/FEATURE_DEPENDENCY_MAP.md` | Correct feature dependency. |
| `docs/02_product/PRODUCT_NORMALIZATION_REPORT.md` | Correct normalization report. |
| `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` | Correct customer journey for accommodation. |
| `docs/03_customer_experience/DELIGHT_ENGINE.md` | Correct 100 delight moments for accommodation. |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | Correct experience SLAs for accommodation. |
| `docs/03_customer_experience/TRUST_FRAMEWORK.md` | Correct trust framework for accommodation. |
| `archive/` (entire directory) | Correctly archived legacy content. |

---

*End of Repository Audit*
