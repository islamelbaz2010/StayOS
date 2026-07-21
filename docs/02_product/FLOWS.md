# FLOWS.md

## 1. Unified Search, Booking, and Payment Processing Flow

```
[Unauthenticated User] ──► Discovery Search (Dates, Geospatial Geofence)
        │
        ▼
[AuthGate Triggered] ────► Unified Identity Handshake (OTP/SSO Validation)
        │
        ▼
[KYC Verification Gate] ──► Front/Back ID Image Capture ──► OCR Profiler Processing
        │
        ▼
[Reservation Workflow] ──► Atomic Database Inventory Calendar Lease Lock
        │
        ▼
[Stripe Gateway Protocol] ──► Payment Hold Authorization ──► Transaction Ledger Registration
        │
        ▼
[Terminal Confirmation] ──► Generate Booking Ref ID ──► Distribute Notification Payloads

```

## 2. Automated Checkout-to-Turnover Operations Loop

```
[Clock Time: 11:00 AM] ──► Guest Checkout Hook Event / Manual App Signal
        │
        ▼
[OpsManager Scheduler] ──► Query Location Pool ──► Auto-Generate Assignment Ticket
        │
        ▼
[Field App Handshake] ──► Cleaner Shift Ingestion ──► Accept Priority Queue Card
        │
        ▼
[TaskStepWizard Sequence] ─► Step Checklists ──► Local Image Storage Array Write
        │
        ▼
[Data Sync Execution] ──► Local SQLite/Sandbox Cache Pipeline Upload to S3 Engine
        │
        ▼
[PMS Core State Switch] ─► Set Unit Inventory Status ──► "Clean & Ready for Check-In"

```

## 3. Financial Escrow Settlement and Payout Routine

```
[Guest Check-In Date] ──► System Captures Valid Entry Pin / Smart Lock Handshake
        │
        ▼
[Escrow Trigger Protocol] ─► Initiate T+24 Hours Countdown Security Hold Timeframe
        │
        ▼
[Tax Deduction Engine] ──► Query Regional Geo-Boundary ──► Split Regional Occupancy Taxes
        │
        ▼
[Financial Batch Scheduler] ► Aggregate Unlocked Host Balances ──► Format ACH/Direct Wire
        │
        ▼
[Treasury API Execution] ─► Dispatch Transfer Payload to Processing Network Vendor

```

## 4. Support Case Triage and Relocation Management Flow

```
[Incident Log Signal] ──► Field Staff Safety Hazard Log / Guest Lockout Action
        │
        ▼
[Resolution Dashboard] ──► Generate CRM Ticket Object ──► Initiate Dedicated SLA Timer
        │
        ▼
[Context Aggregate View] ─► Interleave Chat History + Active IoT Connectivity Streams
        │
        ▼
[Relocation Routine] ────► Query Nearby Platform Inventory (Matching Tier/Pricing Matrix)
        │
        ▼
[Inventory Reassignment] ─► Transfer Initial Ledger Balance ──► Issue New Smart Digital Key

```

---