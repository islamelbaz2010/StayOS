# EPOS SHUTDOWN PROTOCOL — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Created**: 2026-07-21

Every AI session working on StayOS must execute this protocol at session end.

---

## Step 1 — Update Working Memory

Update `epos/WORKING_MEMORY.md`:

- Mark completed tasks
- Record new decisions made during this session (if any)
- Record new open questions or blockers discovered
- Record any conflicts identified

---

## Step 2 — Update Sprint Memory

If significant work occurred this session, update `SPRINT_MEMORY.md` with:

- What was accomplished
- What decisions were confirmed or rejected
- What remains open

---

## Step 3 — Update Master Project Memory

If this session changes the project's historical state, update `MASTER_PROJECT_MEMORY.md`:

- New confirmed decisions
- Superseded decisions
- Phase state changes

---

## Step 4 — Update Project State

Update `epos/PROJECT_STATE.md`:

- Reflect any phase changes
- Reflect any decision changes
- Update the Active Sprint field if the sprint changed
- Update Open Items

---

## Step 5 — Write Session Record

Create or update `epos/SESSION_RECORD.md` with:

- Session date
- Session theme
- Work performed
- Decisions made (if any)
- Open items carried forward
- Files modified

---

## Step 6 — Update Registry

Update `epos/REGISTRY.md` Session History table with this session entry.

---

## Step 7 — Output Shutdown Confirmation

State:

```
EPOS SHUTDOWN — StayOS — Session [date]
Work Completed: [summary]
Decisions Made: [list or none]
Files Modified: [list]
Open Items: [count]
Session Record: epos/SESSION_RECORD.md
Shutdown: COMPLETE
```

---

## On Shutdown Failure

If an update cannot be written (file error, permission, etc.):

1. Report the failure clearly
2. State what was not persisted
3. The next session must treat missing state as unknown and re-verify before acting
