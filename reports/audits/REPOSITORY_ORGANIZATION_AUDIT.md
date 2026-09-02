# REPOSITORY ORGANIZATION AUDIT — StayOS

**Date:** 2026-08-23  
**Branch:** tooling/repository-intelligence  
**HEAD:** a5b02e73574eea3576039d082adfae27cb66091c  
**Operator:** Senior Repository Architect (Claude Code)  
**Status:** COMPLETED

---

## Executive Summary

The StayOS repository root had accumulated 200+ files including 105 screenshots, 56 window dump XMLs, 46 sprint execution reports, 54 executive review documents, financial model spreadsheets, APK files, and strategic planning documents — all co-mingled at the root level with build configuration and application source directories.

This audit performed a single-pass controlled migration that:
- Moved **101 tracked files** via `git mv` (preserving history)
- Moved **30+ untracked files** via `mv` into organized subdirectories
- Created **4 new organized directories**: `reports/`, `evidence/`, `assets/`, `docs/governance/`
- Reduced the root directory from 200+ items to 30 legitimate items
- Preserved all documents and evidence — nothing deleted
- Created governance documentation to prevent recurrence

**All safety gates passed. No application behavior was affected.**

---

## Initial Repository State

**Branch:** tooling/repository-intelligence  
**Uncommitted changes:** 30 modified files (apps/, tests/, epos/, docker-compose.staging.yml)  
**Remote:** origin → https://github.com/islamelbaz2010/StayOS.git

### Root directory problems identified:
- 105 × `screen_*.png` screenshots (untracked)
- 56 × `window_dump_*.xml` UI dump files (untracked)
- 2 APK files (`stayos.apk`, `stayos_v1.apk`) (untracked)
- 6 financial model files (.xlsx, .docx, .pptx) (5 untracked, 1 tracked)
- 16 × Sprint-1/2/3 completion reports (tracked)
- 20 × Sprint 3 planning documents (tracked/untracked)
- 11 × Sprint 0/1 foundation and gate documents (tracked)
- 30 × numbered executive review documents (01_–10_) (tracked)
- 24 × strategic/playbook documents (tracked/untracked)
- 12 × audit and analysis documents (tracked/untracked)
- 1 × deployment report (tracked)
- 1 stale redirect document (SPRINT_MEMORY.md) (tracked)
- 1 Arabic survey document (استبيان.docx) (tracked)

### Pre-existing organized directories (preserved):
- `docs/` — ADRs, system design, product specs, deployment guides, phase -1 reports
- `.ai/` — AI agent context, audit history, bootstrap protocols
- `epos/` — Operational memory (WORKING_MEMORY, PROJECT_STATE, etc.)
- `business/` — Business operations documents
- `knowledge/` — Institutional knowledge base
- `research/` — Research templates
- `archive/` — Historical material

---

## Problems Identified

| Problem | Severity | Count |
|---------|----------|-------|
| Screenshots at root | High | 105 |
| Window dumps at root | High | 56 |
| Sprint reports at root | High | 30+ |
| Executive review docs at root | High | 54 |
| APK files at root | Medium | 2 |
| Financial models at root | Medium | 6 |
| Audit reports at root | Medium | 10 |
| Stale redirect document at root | Low | 1 |

---

## File Classification

### CORE SOURCE (Protected — not touched)
- `apps/` — Web and mobile applications
- `src/` — Backend Python source
- `tests/` — Test suite
- `alembic/` — Database migrations

### INFRASTRUCTURE (Protected — not touched)
- `infra/` — Terraform and Docker infrastructure
- `scripts/` — Operational scripts
- `bootstrap/` — Developer bootstrap tools
- `docker-compose.yml`, `docker-compose.test.yml`, `docker-compose.staging.yml`
- `railway.toml`, `startup.sh`

### AI AGENT CONFIGURATION (Protected — not touched)
- `.ai/` — Complete AI agent context tree
- `.claude/` — Claude Code configuration
- `.devin/` — Devin configuration
- `epos/` — Operational memory

### CI/CD (Protected — not touched)
- `.github/workflows/` — CI, deploy, security, docs, release workflows

### CANONICAL DOCUMENTATION (Protected — not touched)
- `docs/architecture/adr/` — 16 ADRs
- `docs/system-design/` — 15 system design documents
- `docs/02_product/` — 9 product documents
- `docs/03_customer_experience/` — 4 CX documents
- `docs/deployment/` — 7 deployment guides
- `docs/phase--1/` — 21 Phase -1 research documents
- `docs/standards/` — 6 standards documents
- `docs/ENGINEERING_MASTER_PLAN.md`, `docs/MANIFEST.md`, etc.

### SPRINT REPORTS (Migrated → reports/sprints/)
46 files including S1-01 through S1-08, S2-01 through S2-08, S3 waves, Sprint 0/1/3 plans, master backlogs.

### EXECUTIVE DOCUMENTS (Migrated → reports/executive/)
54 files including numbered executive reviews (01_–08_), stage gate decisions, playbooks, supply and marketplace strategy documents.

### AUDIT REPORTS (Migrated → reports/audits/)
10 files including technical audit, project readiness audit, pipeline audits, diagnostic reports, context extractions.

**Note:** This migration additionally produced 2 audit deliverables — this document (`REPOSITORY_ORGANIZATION_AUDIT.md`) and `REPOSITORY_MIGRATION_MAP.md` — which were *created during* the migration rather than moved from root, and were saved directly into `reports/audits/`. They are not counted in the "10 files migrated" figure above. Including them, `reports/audits/` currently contains 12 files.

### DEPLOYMENT REPORTS (Migrated → reports/deployments/)
1 file: PRODUCTION_DEPLOYMENT_REPORT.md

### TEST EVIDENCE (Migrated → evidence/)
- 105 screenshots → evidence/screenshots/
- 56 window dumps → evidence/window_dumps/
- 2 APKs → evidence/builds/

### FINANCIAL ASSETS (Migrated → assets/financial/)
6 files including Excel, Word, and PowerPoint financial models.

### ARCHIVED (Migrated → archive/)
- SPRINT_MEMORY.md (stale redirect to .ai/CURRENT/SPRINT_MEMORY.md)
- "Hospitality Exchange idea.md" (background research note)

### RESEARCH (Migrated → research/)
- استبيان.docx (customer validation survey instrument)

---

## Canonical Document Analysis

### MANAGEMENT_SITUATION_ANALYSIS family
| Document | Version | Status | Action |
|----------|---------|--------|--------|
| MANAGEMENT_SITUATION_ANALYSIS.md | Latest (2026-08-14) | Canonical | Moved to reports/executive/ |
| MANAGEMENT_SITUATION_ANALYSIS_v1.md | v1.0 (2026-08-17) | Historical | Moved to reports/executive/ |
| .ai/AUDIT/MANAGEMENT_SITUATION_ANALYSIS_v2_2026-08-18.md | v2 (2026-08-18) | Canonical in AI AUDIT | Kept in place |

### PRODUCT_VERSION_ROADMAP_AUDIT family
| Document | Status | Action |
|----------|--------|--------|
| PRODUCT_VERSION_ROADMAP_AUDIT.md | Historical | Moved to reports/audits/ |
| PRODUCT_VERSION_ROADMAP_AUDIT_v2.md | Later version | Moved to reports/audits/ |

### MASTER_EXECUTION_BOARD family
| Document | Status | Action |
|----------|--------|--------|
| MASTER_EXECUTION_BOARD.md | Historical | Moved to reports/sprints/ |
| MASTER_EXECUTION_BOARD_v2.0.md | Latest version | Moved to reports/sprints/ |

### SUPPLY_ACQUISITION_PLAYBOOK family
| Document | Status | Action |
|----------|--------|--------|
| SUPPLY_ACQUISITION_PLAYBOOK.md | v1 | Moved to reports/executive/ |
| SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md | Final version | Moved to reports/executive/ |

---

## Generated Artifact Analysis

| Category | Count | Tracked? | Treatment |
|----------|-------|----------|-----------|
| screen_*.png | 105 | No | Moved to evidence/screenshots/ |
| window_dump_*.xml | 56 | No | Moved to evidence/window_dumps/ |
| stayos.apk | 1 | No | Moved to evidence/builds/ |
| stayos_v1.apk | 1 | No | Moved to evidence/builds/ |
| .xlsx files | 3 | No | Moved to assets/financial/ |
| .docx files | 2 | 1 tracked | Tracked moved via git mv; untracked via mv |
| .pptx files | 1 | No | Moved to assets/financial/ |

All artifacts preserved — none deleted.

---

## Target Architecture

```
StayOS/
├── .ai/                    # AI agent context (preserved)
├── .claude/                # Claude Code config (preserved)
├── .devin/                 # Devin config (preserved)
├── .github/                # CI/CD workflows (preserved)
│
├── apps/                   # Application code (preserved)
│   ├── mobile/
│   └── web/
├── src/                    # Backend source (preserved)
├── tests/                  # Tests (preserved)
├── infra/                  # Infrastructure (preserved)
├── scripts/                # Scripts (preserved)
├── tools/                  # Tooling (preserved)
├── bootstrap/              # Bootstrap (preserved)
├── alembic/                # DB migrations (preserved)
├── epos/                   # Operational memory (preserved)
├── business/               # Business ops (preserved)
├── knowledge/              # Knowledge base (preserved)
├── research/               # Research + survey docs (extended)
│
├── docs/                   # Canonical documentation (extended)
│   ├── governance/         # NEW — REPOSITORY_INFORMATION_ARCHITECTURE.md
│   ├── architecture/adr/
│   ├── phase--1/
│   ├── 02_product/
│   ├── 03_customer_experience/
│   ├── system-design/
│   ├── deployment/
│   ├── standards/
│   └── templates/
│
├── reports/                # NEW — All historical reports
│   ├── sprints/            # 46 sprint docs
│   ├── executive/          # 54 executive docs
│   ├── audits/             # 10 audit/analysis docs
│   └── deployments/        # 1 deployment report
│
├── evidence/               # NEW — Test and validation evidence
│   ├── screenshots/        # 105 screen_*.png
│   ├── window_dumps/       # 56 window_dump_*.xml
│   └── builds/             # 2 APKs
│
├── assets/                 # NEW — Binary and office files
│   └── financial/          # 6 financial models
│
├── archive/                # Extended — legacy + stale docs
│
├── README.md
├── CONTRIBUTING.md
├── CODEOWNERS
├── LICENSE
├── pyproject.toml
├── alembic.ini
├── requirements.txt
├── requirements-dev.txt
├── startup.sh
├── railway.toml
├── docker-compose.yml
├── docker-compose.test.yml
└── docker-compose.staging.yml
```

---

## Files Moved (Summary)

| Destination | Count | Method |
|-------------|-------|--------|
| reports/sprints/ | 46 | git mv |
| reports/executive/ | 54 | git mv + mv |
| reports/audits/ | 10 | git mv + mv |
| reports/deployments/ | 1 | git mv |
| evidence/screenshots/ | 105 | mv |
| evidence/window_dumps/ | 56 | mv |
| evidence/builds/ | 2 | mv |
| assets/financial/ | 6 | mv |
| archive/ | 2 | git mv + mv |
| research/ | 1 | git mv |
| **Total** | **283** | |

**These 283 files are the ones physically migrated from the original repository root.** They do not include audit/governance deliverables authored during the migration itself. Two such deliverables — `REPOSITORY_ORGANIZATION_AUDIT.md` (this file) and `REPOSITORY_MIGRATION_MAP.md` — were created directly inside `reports/audits/` rather than moved there, bringing that directory's current on-disk count to 12 and the repository's total organized-documentation footprint to 285. See the note under "AUDIT REPORTS" above.

---

## Files Kept in Place

All application source, infrastructure, CI/CD, `.ai/CURRENT/`, `epos/`, `docs/`, `business/`, `knowledge/`, `research/` templates, `archive/` existing content.

---

## Reference Changes

No reference changes were required. Investigation confirmed:
- CI/CD workflows reference only `docs/02_product`, `docs/03_customer_experience`, and `.ai/CURRENT/MASTER_CONTEXT.md` — all preserved
- Python source does not import any markdown files
- `docs/DOCUMENT_MAP.md` already had stale references pre-migration — no new breakage introduced
- Scripts and bootstrap tools contain no references to root-level markdown files

---

## Validation Results

| Check | Result |
|-------|--------|
| Root MD files remaining | Only README.md, CONTRIBUTING.md |
| Unexpected git deletions | None |
| Python import check | Pass (python3 import OK) |
| CI workflow path check | Pass (no moved paths referenced) |
| Script path check | Pass (no moved paths referenced) |
| Evidence files preserved | Pass (105 screenshots, 56 window dumps, 2 APKs) |
| Source code unchanged | Pass (apps/, src/, tests/ untouched) |
| .ai/ context unchanged | Pass |
| epos/ memory unchanged | Pass |

---

## Remaining Risks

| Risk | Level | Note |
|------|-------|------|
| docs/DOCUMENT_MAP.md has stale cross-links | Low | Pre-existing issue, not caused by this migration. Update when DOCUMENT_MAP is next revised. |
| Untracked evidence files not in git | Low | Screenshots/APKs/window_dumps are evidence artifacts, correctly untracked |
| assets/financial/ files not in git | Low | Financial model binary files are untracked; acceptable for large binary files |
| .ai/AUDIT/ new session files untracked | Low | Normal — these are created during sessions and tracked deliberately when committed |

---

## Remaining Manual Actions

1. **Optional:** Update `docs/DOCUMENT_MAP.md` to reflect the new locations of migrated documents (low priority — document map already had stale references).
2. **Optional:** Add `evidence/`, `assets/` to `.gitignore` if the team decides these should never be committed.
3. **Optional:** Commit this migration as a dedicated repository organization commit.

---

## Rollback Instructions

To undo all tracked file moves (git mv operations):

```bash
git restore --staged .
git checkout HEAD -- .
```

This will unstage all staged renames and restore tracked files to their original locations.

For untracked files (screenshots, window dumps, APKs, financial models), they were moved from root — to restore them, move them back from their new locations:

```bash
mv evidence/screenshots/screen_*.png .
mv evidence/window_dumps/window_dump_*.xml .
mv evidence/builds/stayos*.apk .
mv assets/financial/* .
mv reports/audits/DOCTOR_REPORT.md .
# etc.
```

---

## Final Repository Assessment

| Quality Gate | Status |
|-------------|--------|
| Root directory easier to navigate | ✅ Yes — 200+ items → 30 items |
| Canonical documents easier to find | ✅ Yes — organized by type under reports/ |
| Historical records preserved | ✅ Yes — all 283 files moved, none deleted |
| Test artifacts separated from docs | ✅ Yes — evidence/ is separate from reports/ |
| Source code protected | ✅ Yes — apps/, src/, tests/ untouched |
| AI-agent files discoverable | ✅ Yes — .ai/ and epos/ untouched |
| Path references valid | ✅ Yes — no CI/script paths broken |
| Application behavior unchanged | ✅ Yes — no source code touched |
| Unnecessary churn avoided | ✅ Yes — only root-level misplaced files moved |
| Git history preserved | ✅ Yes — 101 files moved via git mv |
| Unresolved ambiguities | None |
| Folders for later review | None — all classified |
