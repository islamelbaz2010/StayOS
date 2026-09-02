# Repository Information Architecture — StayOS

**Version:** 1.0  
**Date:** 2026-08-23  
**Authority:** Senior Repository Architect  
**Status:** ACTIVE — Binding structural governance

---

## 1. Purpose

This document defines the official information architecture of the StayOS repository. It specifies where every category of file belongs, how to classify new files, and what must never appear in the root directory. All contributors and AI agents must follow this architecture.

---

## 2. Repository Principles

1. **Root directory = entry points only.** Only files with repository-wide build, runtime, or navigation significance belong at the root.
2. **One canonical home per active document.** Every document has exactly one correct location. No floating copies at root.
3. **AI-agent discoverability.** The `.ai/CURRENT/` tree is the single AI context layer. Agents start there.
4. **History is preserved.** No documents are deleted. Superseded content goes to `archive/`. Historical records go to `reports/`.
5. **Source code is protected.** Repository organization never restructures application source.

---

## 3. Root Directory Rules

The root directory MUST contain only:

| Category | Examples |
|----------|---------|
| Public identity | `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS` |
| Python build config | `pyproject.toml`, `requirements.txt`, `requirements-dev.txt`, `alembic.ini` |
| Deployment config | `docker-compose.yml`, `docker-compose.test.yml`, `docker-compose.staging.yml`, `railway.toml` |
| Shell entrypoint | `startup.sh` |
| Application directories | `apps/`, `src/`, `tests/`, `alembic/` |
| Infrastructure | `infra/`, `scripts/`, `tools/`, `bootstrap/` |
| Project intelligence | `.ai/`, `.claude/`, `.devin/`, `.github/`, `epos/` |
| Documentation | `docs/` |
| Knowledge | `business/`, `knowledge/`, `research/` |
| Organized output | `reports/`, `evidence/`, `assets/`, `archive/` |

In addition to the canonical project content above, the following items may legitimately exist at root. **They are not canonical project content** — they are local configuration, repository metadata, or generated/cache artifacts, and their presence does not indicate a compliance violation:

| Kind | Examples | Notes |
|------|---------|-------|
| Local configuration/support files | `.env`, `.env.example`, `.env.staging`, `.env.staging.example`, `.env.test`, `.gitignore`, `.easignore`, `.railwayignore` | Environment and tool config, not documentation or reports. |
| Repository metadata | `.git`, `.DS_Store` | Created by Git and the OS, not by contributors. |
| Generated/local cache artifacts | `.mypy_cache/`, `.pytest_cache/`, `.ruff_cache/`, `.venv/`, `dist/`, `htmlcov/`, `.coverage` | Reproducible build/test output. Must remain git-ignored (see §9) and must never be treated as a canonical project file or committed as project content. |

These may physically exist at root as local configuration, repository metadata, or generated/cache artifacts, but they are not canonical project content, and this does not relax the prohibition below.

The root MUST NOT contain:
- Sprint documents, completion reports, or execution plans
- Executive review documents or stage gate decisions  
- Screenshots, window dumps, or test evidence
- APK files or build artifacts
- Spreadsheets, Word documents, or PowerPoint presentations
- Audit reports, diagnostic reports, or analysis documents
- Supply, marketplace, or operations playbooks
- Any document that has a clear home in a subdirectory

---

## 4. Directory Ownership

### `.ai/` — AI Agent Context Layer
- **Owner:** Founder / AI governance
- **Contains:** Agent operating context, session records, audit reports, supply acquisition materials, bootstrap protocols
- **Subdirectories:**
  - `CURRENT/` — Active context loaded at every session
  - `AUDIT/` — All AI-generated audit and assessment reports
  - `BOOTSTRAP/` — Session start/end protocols
  - `DECISIONS/` — AI-authored decision records
  - `EXPORT/` — Compressed context bundles
  - `LOGS/` — Session logs (git-ignored)
  - `SUPPLY/` — Supply acquisition operating materials

### `epos/` — Operational Memory
- **Owner:** AI Runtime
- **Contains:** WORKING_MEMORY, PROJECT_STATE, SESSION_RECORD, NEXT_SPRINT, SPRINT_MEMORY, AUTHORITY, STARTUP/SHUTDOWN protocols, REGISTRY, KNOWLEDGE_BASE, PROJECT_REVIEW
- **Rule:** These are living working documents. Do not migrate them to `reports/`.

### `docs/` — Canonical Documentation
- **Owner:** Engineering + Product
- **Contains:** ADRs, system design, product specifications, deployment guides, phase reports, standards
- **Subdirectories:**
  - `architecture/adr/` — Architecture Decision Records
  - `system-design/` — System design documents
  - `02_product/` — Product specifications and features
  - `03_customer_experience/` — CX design documents
  - `deployment/` — Deployment guides and checklists
  - `phase--1/` — Phase -1 Founder Discovery outputs
  - `standards/` — Code and documentation standards
  - `governance/` — Repository structure and governance (this file)
  - `templates/` — Document templates

### `reports/` — Historical Reports and Records
- **Owner:** Engineering + Management
- **Subdirectories:**
  - `sprints/` — Sprint execution plans, backlogs, completion reports, master execution boards
  - `executive/` — Executive reviews, stage gate decisions, playbooks, supply strategy, marketplace strategy
  - `audits/` — Technical audits, project readiness audits, diagnostic reports, duplicate analysis
  - `deployments/` — Deployment reports

### `evidence/` — Test and Validation Evidence
- **Owner:** QA / Engineering
- **Contains:** Artifacts generated during mobile validation, device testing, or build processes
- **Subdirectories:**
  - `screenshots/` — `screen_*.png` from device testing sessions
  - `window_dumps/` — `window_dump_*.xml` from ADB UI dump commands
  - `builds/` — APK files and build release artifacts

### `assets/` — Non-code, Non-documentation Files
- **Owner:** Founder
- **Subdirectories:**
  - `financial/` — Financial model spreadsheets (.xlsx), Word documents (.docx), presentations (.pptx)

### `archive/` — Preserved Historical Material
- **Owner:** All
- **Contains:** Superseded documents, stale redirects, legacy content, raw AI output, raw prompts
- **Rule:** Files go to archive when they are demonstrably superseded but must be preserved for traceability.

### `business/` — Business Operations
- **Owner:** Operations
- **Contains:** Operations playbooks, financial templates, business model documents, roadmap templates

### `knowledge/` — Institutional Knowledge Base
- **Owner:** Founder
- **Contains:** Domain knowledge organized by topic (customer success, finance, marketplace, hospitality, etc.)

### `research/` — Research Templates and Instruments
- **Owner:** Founder
- **Contains:** Interview templates, market research templates, survey documents, feature evaluation frameworks

---

## 5. Documentation Classification Rules

When a new document is created, classify it:

| Type | Home |
|------|------|
| Architecture decision | `docs/architecture/adr/` |
| System design | `docs/system-design/` |
| Product specification | `docs/02_product/` |
| Deployment guide | `docs/deployment/` |
| Standard or convention | `docs/standards/` |
| Sprint execution plan or backlog | `reports/sprints/` |
| Sprint completion report | `reports/sprints/` |
| Executive review or decision | `reports/executive/` |
| Stage gate decision | `reports/executive/` |
| Go-to-market playbook | `reports/executive/` |
| Technical audit | `reports/audits/` |
| Diagnostic report | `reports/audits/` |
| Deployment report | `reports/deployments/` |
| Device screenshot | `evidence/screenshots/` |
| UI XML dump | `evidence/window_dumps/` |
| APK build | `evidence/builds/` |
| Spreadsheet / model | `assets/financial/` |
| Survey / questionnaire | `research/` |
| Superseded document | `archive/` |
| AI session audit | `.ai/AUDIT/` |
| AI agent context | `.ai/CURRENT/` |

---

## 6. Canonical Document Rules

- Every document family has exactly ONE canonical version with a clear home.
- Version suffixes (`_v1`, `_v2`, `_FINAL`, `_DRAFT`) indicate historical versions.
- The most-referenced, most-current version is canonical — not necessarily the highest version number.
- Historical versions remain accessible in their original location (not deleted).
- Do not auto-rename canonical documents for cosmetic reasons.

---

## 7. Archive Rules

A document goes to `archive/` when it:
- Contains an explicit redirect to a newer canonical location
- Has been superseded by a later document that replaces it
- Is a stale working file with no active reference
- Is raw AI output or raw prompt material not incorporated elsewhere

A document does NOT go to archive simply because:
- It is old
- It has an old date
- It is a completion report (those go to `reports/sprints/`)

---

## 8. Evidence Rules

All test evidence is organized under `evidence/`:
- Screenshots from mobile device sessions → `evidence/screenshots/`
- ADB window dump XMLs → `evidence/window_dumps/`
- APK release builds → `evidence/builds/`

Evidence files are NOT tracked by git by default (they are reproducible or locally generated). Only add to git if the evidence is required for an audit or release attestation.

---

## 9. Generated Artifact Rules

Generated artifacts are classified as:

| Artifact | Treatment |
|----------|-----------|
| `screen_*.png` | `evidence/screenshots/` — untracked |
| `window_dump_*.xml` | `evidence/window_dumps/` — untracked |
| `*.apk` | `evidence/builds/` — untracked unless a release artifact |
| `htmlcov/` | git-ignored build output — do not commit |
| `dist/` | git-ignored build output |
| `.coverage` | git-ignored |

---

## 10. AI-Agent Rules

AI agents working on this repository MUST:
1. Start from `.ai/BOOTSTRAP/START_SESSION.md` and load `.ai/CURRENT/` first.
2. Treat `epos/` as the operational runtime memory — update it during sessions.
3. Write new session audit reports to `.ai/AUDIT/` with date-stamped names.
4. Place new documentation in the correct `docs/` subdirectory.
5. Place sprint-related reports in `reports/sprints/`.
6. Never place reports, plans, screenshots, or artifacts at the repository root.
7. Read this document before creating any new file to determine the correct location.

---

## 11. Naming Principles

- Use `SCREAMING_SNAKE_CASE.md` for reports and governance documents (matches project convention).
- Use `kebab-case.md` for standards and templates.
- Use `ADR-NNN-description.md` for architecture decisions.
- Use `YYYY-MM-DD` date suffixes for audit files (e.g., `STAYOS_AUDIT_2026-08-23.md`).
- Do not use version numbers in filenames unless tracking multiple canonical versions that must coexist.

---

## 12. Migration History

| Date | Action | Scope |
|------|--------|-------|
| 2026-08-23 | Initial information architecture migration | Moved 101 tracked files + 30 untracked files from root. Created `reports/`, `evidence/`, `assets/` directories. Root reduced from 200+ items to ~30 legitimate items. |

---

## 13. What MUST NOT Be Placed in Root

Never place at root:
- `*_COMPLETION_REPORT.md`
- `SPRINT*.md`, `S[0-9]-*.md`
- `MASTER_*.md`
- `screen_*.png`
- `window_dump_*.xml`
- `*.apk`, `*.ipa`
- `*.xlsx`, `*.docx`, `*.pptx`
- `*_AUDIT*.md` (not a technical config file)
- `*_REVIEW.md`, `*_PLAN.md`, `*_PLAYBOOK.md`
- `*_ANALYSIS.md`, `*_REPORT.md` (not a build-system report file)

---

## 14. Contributor Decision Guide

**"Where does this new file belong?"**

1. Is it application source code? → `apps/`, `src/`, `tests/`
2. Is it an ADR? → `docs/architecture/adr/`
3. Is it a system or product design document? → `docs/system-design/` or `docs/02_product/`
4. Is it a sprint plan, backlog, or completion report? → `reports/sprints/`
5. Is it an executive review, playbook, or stage gate decision? → `reports/executive/`
6. Is it an audit or diagnostic report? → `reports/audits/`
7. Is it a deployment report? → `reports/deployments/`
8. Is it a device screenshot or window dump? → `evidence/screenshots/` or `evidence/window_dumps/`
9. Is it a financial model or presentation? → `assets/financial/`
10. Is it superseded? → `archive/`
11. Is it AI session context? → `.ai/CURRENT/` or `.ai/AUDIT/`
12. Is it operational AI memory? → `epos/`
13. Is it a knowledge base article? → `knowledge/`
14. Is it a research instrument or template? → `research/`

If none of the above apply, ask before placing at root.
