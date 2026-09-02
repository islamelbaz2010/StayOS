# SPRINT 3 FRONTEND PLAN — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Define all frontend pages, components, API hooks, and routes required for Sprint 3 P0 stories.

---

## 1. Current Frontend Stack

- **Framework:** Next.js 14 with App Router (`apps/web/app/[locale]/`)
- **Styling:** Tailwind CSS with custom brand colors
- **i18n:** next-intl with Arabic (ar) as default locale, RTL support
- **Auth:** Firebase phone auth + custom JWT tokens
- **Data fetching:** TanStack Query (React Query)
- **Components:** Custom component library in `apps/web/components/`

---

## 2. Current Pages

| Route | Page | Status |
|-------|------|--------|
| `/[locale]` | Landing page with search form | Done |
| `/[locale]/search` | Search results page | Done |
| `/[locale]/listings/[unitId]` | Listing detail page | Done |
| `/[locale]/auth/login` | Phone OTP login | Done |
| `/[locale]/host` | Host dashboard placeholder | Stub — "coming soon" |
| `/[locale]/host/bookings` | Host bookings management | Done |

---

## 3. New Pages Required

### 3.1 Host Pages (S3-003, S3-004, S3-007)

| Route | Page | Story | Priority |
|-------|------|-------|----------|
| `/[locale]/host/listings` | Host listings list | S3-003 | P0 |
| `/[locale]/host/listings/new` | Listing creation form | S3-003 | P0 |
| `/[locale]/host/listings/[id]/edit` | Listing edit form | S3-003 | P0 |
| `/[locale]/host/listings/[id]/photos` | Photo management | S3-004 | P0 |
| `/[locale]/host/listings/[id]/calendar` | Calendar management | S3-006 | P0 (backend done, frontend needed) |
| `/[locale]/host/kyc` | KYC upload page | S3-002 | P0 (backend done, frontend needed) |

#### Listing Creation Form (`host/listings/new/page.tsx`)

**Sections:**
1. **Basic Info:** Title, description, property_type (dropdown from `PropertyType` enum)
2. **Location:** Governorate (dropdown), city, district, address_line, coordinates (map picker or lat/lng inputs)
3. **Property Details:** max_guests, bedrooms, bathrooms, amenities (multi-select), cultural_tags (multi-select)
4. **Pricing:** base_price_egp, weekend_multiplier, cleaning_fee_egp, min_nights, max_nights
5. **House Rules:** house_rules, check_in_instructions, policies
6. **Photos:** Upload component (presigned S3 URL → upload → create photo record)
7. **Submit:** Save as draft or submit for review

**Validation:**
- Title: required, 10–200 chars
- Description: required, 50–5000 chars
- Governorate + City: required
- Base price: required, > 0
- Max guests: required, 1–20
- At least 1 photo required for submit-for-review

**API calls:**
- `POST /api/v1/listings` — create listing
- `POST /api/v1/listings/{unit_id}/photos/presign` — get presigned URL
- `PUT` to S3 presigned URL — upload photo
- `POST /api/v1/listings/{unit_id}/photos` — create photo record
- `POST /api/v1/listings/{id}/submit-for-review` — submit

#### Host Listings List (`host/listings/page.tsx`)

- Table/card view of host's listings
- Columns: thumbnail, title, status badge, price, actions (edit, photos, calendar, submit)
- Filter by status (DRAFT, PENDING_VERIFICATION, LISTED, UNLISTED)
- API: `GET /api/v1/listings?host_only=true`

#### KYC Upload Page (`host/kyc/page.tsx`)

- Step 1: Initiate KYC (calls `POST /api/v1/kyc/initiate`)
- Step 2: Upload ID front, back, selfie (presigned S3 URLs)
- Step 3: Submit (calls `POST /api/v1/kyc/documents/{id}/submit`)
- Status display: UNVERIFIED → PENDING → VERIFIED/REJECTED

### 3.2 Admin Pages (S3-009 through S3-015)

| Route | Page | Story | Priority |
|-------|------|-------|----------|
| `/[locale]/admin` | Admin dashboard home | All admin | P0 |
| `/[locale]/admin/kyc` | KYC review queue | S3-009 | P0 |
| `/[locale]/admin/listings` | Listing verification queue | S3-010 | P0 |
| `/[locale]/admin/import` | CSV import page | S3-011 | P0 |
| `/[locale]/admin/listings/unclaimed` | Unclaimed listing creation | S3-012 | P0 |
| `/[locale]/admin/claims` | Claim review queue | S3-013 | P0 |
| `/[locale]/admin/duplicates` | Duplicate review queue | S3-014 | P0 |
| `/[locale]/admin/tickets` | Support ticket queue | S3-015 | P0 |

#### Admin Layout (`admin/layout.tsx`)

- Sidebar navigation with links to all admin pages
- `ProtectedRoute allowedRoles={["admin"]}`
- Badge counts for pending items (KYC, listings, claims, duplicates, tickets)

#### KYC Review Queue (`admin/kyc/page.tsx`)

- Table: applicant name, phone, document type, submitted date, status, actions
- Actions: View documents (open S3 URLs), Approve, Reject (with reason modal)
- Filter: status (PENDING, APPROVED, REJECTED)
- API: `GET /api/v1/admin/kyc`, `POST /api/v1/admin/kyc/{id}/approve`, `POST /api/v1/admin/kyc/{id}/reject`

#### Listing Verification Queue (`admin/listings/page.tsx`)

- Table: listing title, host name, location, photos count, submitted date, status, actions
- Actions: View listing detail, Approve, Reject (with reason)
- Filter: status (PENDING_VERIFICATION, LISTED, UNLISTED, SUSPENDED)
- API: `GET /api/v1/admin/listings`, `POST /api/v1/admin/listings/{id}/approve`, `POST /api/v1/admin/listings/{id}/reject`

#### CSV Import (`admin/import/page.tsx`)

- Drag-and-drop CSV file upload
- CSV template download link
- Preview parsed rows before confirm
- Import results: success count, failure count, error details per row
- API: `POST /api/v1/admin/listings/import` (multipart form data)

#### Unclaimed Listing Creation (`admin/listings/unclaimed/page.tsx`)

- Same form as host listing creation but:
  - No host selection (host_id = NULL)
  - Generates claim link after creation
  - Claim link displayed with copy button
- API: `POST /api/v1/admin/listings/unclaimed`, `GET /api/v1/admin/listings/{id}/claim-link`

#### Claim Review Queue (`admin/claims/page.tsx`)

- Table: listing title, claimant name, claimant phone, KYC status, submitted date, actions
- Actions: View claim documents, View claimant KYC, Approve (transfer ownership), Reject (with reason)
- API: `GET /api/v1/admin/claims`, `POST /api/v1/admin/claims/{id}/approve`, `POST /api/v1/admin/claims/{id}/reject`

#### Duplicate Review Queue (`admin/duplicates/page.tsx`)

- Card view showing side-by-side comparison of two listings
- Display: photos, title, location, host, price
- Actions: Merge into #1, Merge into #2, Dismiss (not duplicate)
- API: `GET /api/v1/admin/duplicates`, `POST /api/v1/admin/duplicates/{id}/merge`, `POST /api/v1/admin/duplicates/{id}/dismiss`

#### Support Ticket Queue (`admin/tickets/page.tsx`)

- Table: subject, reporter, priority, status, assignee, created date, actions
- Actions: View detail, Assign, Escalate, Close
- Filter: status, priority, assignee
- API: `GET /api/v1/admin/tickets`, `POST /api/v1/admin/tickets`, `PATCH /api/v1/admin/tickets/{id}`

### 3.3 Public Claim Page

| Route | Page | Story | Priority |
|-------|------|-------|----------|
| `/[locale]/claim/[token]` | Public claim submission page | S3-013 | P0 |

- Displays listing info (title, location, photos)
- Requires login (redirect to auth if not authenticated)
- Requires KYC verification before claim submission
- Form: ownership documents upload, notes
- API: `GET /api/v1/listings/claim/{token}`, `POST /api/v1/listings/{id}/claim`

---

## 4. New Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `ListingForm` | `components/listings/ListingForm.tsx` | Reusable form for create/edit (host + admin) |
| `PhotoUploader` | `components/listings/PhotoUploader.tsx` | Presigned URL upload, drag-reorder, cover selection |
| `PhotoGallery` | `components/listings/PhotoGallery.tsx` | Display photos in grid with cover badge |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | Colored badge for listing/KYC/ticket statuses |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Admin navigation sidebar |
| `AdminQueueTable` | `components/admin/AdminQueueTable.tsx` | Reusable table for queue pages |
| `RejectModal` | `components/admin/RejectModal.tsx` | Modal with reason textarea for reject actions |
| `CsvUploader` | `components/admin/CsvUploader.tsx` | Drag-drop CSV upload with preview |
| `ClaimDetail` | `components/admin/ClaimDetail.tsx` | Side-by-side listing + claimant info |
| `DuplicateCompare` | `components/admin/DuplicateCompare.tsx` | Side-by-side listing comparison |
| `TicketDetail` | `components/admin/TicketDetail.tsx` | Ticket detail with assignment controls |
| `KycUploader` | `components/kyc/KycUploader.tsx` | ID + selfie upload with presigned URLs |
| `HostSidebar` | `components/layouts/HostSidebar.tsx` | Host dashboard navigation |

---

## 5. New API Query Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useHostListings` | `lib/queries/listings.ts` | Fetch host's own listings |
| `useCreateListing` | `lib/queries/listings.ts` | Create listing mutation |
| `useUpdateListing` | `lib/queries/listings.ts` | Update listing mutation |
| `useSubmitForReview` | `lib/queries/listings.ts` | Submit listing for review |
| `usePresignPhoto` | `lib/queries/listings.ts` | Get presigned S3 URL |
| `useCreatePhoto` | `lib/queries/listings.ts` | Create photo record |
| `useDeletePhoto` | `lib/queries/listings.ts` | Delete photo |
| `useSetCoverPhoto` | `lib/queries/listings.ts` | Set cover photo |
| `useInitiateKyc` | `lib/queries/kyc.ts` | Initiate KYC |
| `useSubmitKyc` | `lib/queries/kyc.ts` | Submit KYC documents |
| `useKycStatus` | `lib/queries/kyc.ts` | Check KYC status |
| `useAdminKycQueue` | `lib/queries/admin.ts` | Admin KYC queue |
| `useAdminApproveKyc` | `lib/queries/admin.ts` | Approve KYC |
| `useAdminRejectKyc` | `lib/queries/admin.ts` | Reject KYC |
| `useAdminListingQueue` | `lib/queries/admin.ts` | Admin listing queue |
| `useAdminApproveListing` | `lib/queries/admin.ts` | Approve listing |
| `useAdminRejectListing` | `lib/queries/admin.ts` | Reject listing |
| `useAdminImportCsv` | `lib/queries/admin.ts` | CSV import |
| `useAdminCreateUnclaimed` | `lib/queries/admin.ts` | Create unclaimed listing |
| `useAdminClaimsQueue` | `lib/queries/admin.ts` | Claims queue |
| `useAdminApproveClaim` | `lib/queries/admin.ts` | Approve claim |
| `useAdminRejectClaim` | `lib/queries/admin.ts` | Reject claim |
| `useAdminDuplicates` | `lib/queries/admin.ts` | Duplicates queue |
| `useAdminMergeDuplicate` | `lib/queries/admin.ts` | Merge duplicates |
| `useAdminDismissDuplicate` | `lib/queries/admin.ts` | Dismiss duplicate |
| `useAdminTickets` | `lib/queries/admin.ts` | Tickets queue |
| `useAdminUpdateTicket` | `lib/queries/admin.ts` | Update ticket |
| `useClaimListing` | `lib/queries/listings.ts` | Public claim submission |

---

## 6. i18n Keys Required

New translation keys needed for:

- `host.listings.*` — listing creation, edit, list
- `host.kyc.*` — KYC upload
- `admin.*` — all admin pages
- `claim.*` — public claim page
- `listing.status.*` — status labels (DRAFT, PENDING_VERIFICATION, LISTED, etc.)
- `kyc.status.*` — KYC status labels
- `ticket.priority.*` — ticket priority labels
- `ticket.status.*` — ticket status labels

All keys must have Arabic (`ar`) and English (`en`) translations.

---

## 7. Routing and Access Control

### Host Pages
- All under `/[locale]/host/*`
- `ProtectedRoute allowedRoles={["host", "admin"]}`
- Host can only see/edit their own listings

### Admin Pages
- All under `/[locale]/admin/*`
- `ProtectedRoute allowedRoles={["admin"]}`
- Admin can see all listings, KYC, claims, duplicates, tickets

### Public Claim Page
- `/[locale]/claim/[token]`
- Requires authentication (redirect to login)
- Requires KYC verification (redirect to KYC upload if not verified)
