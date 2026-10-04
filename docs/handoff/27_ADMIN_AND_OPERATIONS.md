# 27 — Admin & Operations

## Admin console (`/admin`, role=staff+permission or admin)
`AdminLayout` (sidebar) gates: overview, pending listings, listings, users,
KYC, bookings, reports (+management), earnings, support queue, finance,
field staff, disputes, imports, CMS, discovery supply, settings.
Sidebar visibility = `staff_permissions` grant map; `/admin` alone →
permission-aware overview.

## Operations (field ops)
`operations` module: `field_staff`, `operation_tasks`, `task_events`,
`maintenance_requests`, `property_readiness`, `recurring_maintenance` —
unit-ready / unit-blocked workflow. `/field` mobile-friendly task surface
for field staff (no admin console access).

## Key enforcement
- Admin routes require `staff`/`admin`; every console area ALSO checks its
  permission server-side — the sidebar is UX, not the boundary.
- Staff support queue requires `operations` permission.
- Audit logging on admin writes (`security/audit.py`).

## Reports
`/admin/reports` — financial, settlement, management (Model-B economics
reference), unit performance; exports via `S3_REPORTS_BUCKET`.
