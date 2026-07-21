# EPOS STARTUP PROTOCOL — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Created**: 2026-07-21

Every AI session working on StayOS must execute this protocol before any task.

---

## Step 1 — Confirm You Are in the Right Project

Read `epos/REGISTRY.md`.  
Confirm: Project = StayOS, Registry ID = EPOS-PROJ-001.

---

## Step 2 — Load Historical Source

Read in this order:

1. `SPRINT_MEMORY.md` — Current State
2. `MASTER_PROJECT_MEMORY.md` — Historical Context

Do not reconstruct history from previous chats, git history, or commit messages.

---

## Step 3 — Load Project State

Read `epos/PROJECT_STATE.md`.

Confirm:
- Current phase
- Active sprint
- Confirmed decisions
- Open conflicts
- Permitted vs blocked work

---

## Step 4 — Load Authority Rules

Read `epos/AUTHORITY.md`.

Confirm you understand:
- What decisions require founder approval
- What work is gated behind Phase 0 clearance
- What conflicts must not be resolved by AI

---

## Step 5 — Check Knowledge Base

Read `epos/KNOWLEDGE_BASE.md`.

Use this to answer: What do I already know? What do I need to read from source documents?

---

## Step 6 — Load Next Sprint

Read `epos/NEXT_SPRINT.md`.

Understand the prioritized work queue before accepting any task.

---

## Step 7 — Validate Task

Before executing any task, confirm:

- [ ] Task is within Phase 0 permitted scope
- [ ] Task does not conflict with any confirmed decision
- [ ] Task does not resolve any open conflict without founder instruction
- [ ] Task does not write `src/` application code
- [ ] Task does not modify `docs/phase--1/*`

---

## Step 8 — Output Startup Confirmation

State:

```
EPOS STARTUP — StayOS — Session [date]
Phase: Phase 0 — Customer Validation (ACTIVE)
Gates: 10 transactions / 80 interviews — [progress]
Active Branch: [branch name]
Task Queue: [next task from NEXT_SPRINT.md]
Startup: COMPLETE
```

---

## On Startup Failure

If any required file is missing or unreadable:

1. Report the missing file
2. Do not proceed with tasks
3. Request founder action to restore the missing file
