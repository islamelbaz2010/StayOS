# BUSINESS_RULES.md

## 1. Core Identity & Platform Compliance (KYC)

* **Rule BR-ID-01 (Mandatory Verification):** No guest user profile may access checkout features, and no host profile may accept listings until a digital identification audit status returns `VERIFIED` from the automated compliance service.
* **Rule BR-ID-02 (Identity Structural Alignment):** The full legal name bound to the host profile configuration asset must perfectly match the legal name declared within the payout routing setup and the uploaded financial forms.

## 2. Inventory Management & Calendar Integrity

* **Rule BR-INV-01 (Atomic Calendar Isolation):** Under no conditions shall overlapping confirmed reservations be written to a single unit configuration within the database architecture. The database must apply an atomic exclusion lock to preventing race conditions during concurrent booking sessions.
* **Rule BR-INV-02 (Status Dependencies):** A unit data object status cannot switch to `READY_FOR_OCCUPANCY` unless its correlated field turnover ticket holds a `CLOSED` state verification marker.

## 3. Operational Scheduling & Field Automation

* **Rule BR-OPS-01 (Automated Ticket Dispatch):** The conclusion of a guest stay sequence must immediately spawn a high-priority turnover ticket in `UNASSIGNED` status within the automated workforce assignment engine.
* **Rule BR-OPS-02 (Operational Clearance Windows):** All cleaning tickets generated from scheduled checkout events must specify an operational target resolution window window bounded by a standard 4-hour processing limit following checkout.
* **Rule BR-OPS-03 (Mandatory Photographic Integrity):** The operations field application cannot transition any ticket object into `VERIFICATION_PENDING` or `CLOSED` statuses unless the request payload includes a full geometric set of required photographic validation arrays.

## 4. Financial Controls & Ledger Compliance

* **Rule BR-FIN-01 (Escrow Time Lock):** Gross reservation booking yields accrued from guest transactions are locked in platform escrow and barred from distribution engines until exactly 24 hours post-check-in date.
* **Rule BR-FIN-02 (Automated Taxation Interleaving):** Every individual financial reservation ledger transaction must dynamically query local geofence coordinate boundaries to identify municipal tax liabilities, split off regional occupancy allocations, and reserve them within isolated corporate ledger registries.
* **Rule BR-FIN-03 (Payout Execution Halts):** Any modification or error state detected inside the tax status fields or routing profile configurations of an enterprise host profile halts all pending payment dispatch batches instantly, locking associated capital within escrow systems.

## 5. Incident Management & Support Escapes

* **Rule BR-SUP-01 (SLA Severity Vectoring):** Support case vectors initialized via safety hazard alerts or structural lockout events are automatically categorized as `CRITICAL_SLA_BREACH` risks, shifting to the front of support routing queues.

---