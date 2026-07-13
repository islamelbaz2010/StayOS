# ENGINEERING_BACKLOG.md

## 1. EPIC: Core Platform Foundations (P0)
### Feature: AuthGate
* **Story:** As a user, I want to authenticate via phone/social to access platform features.
  * **Task:** Implement OAuth provider integration (Google, Apple, Facebook).
    * **Subtask:** Configure Firebase/Auth0 project credentials.
    * **Subtask:** Build OAuth callback handlers for mobile/web.
  * **Task:** Build OTP SMS verification service.
    * **Subtask:** Integrate Twilio/SMS API.
    * **Subtask:** Implement 6-digit verification logic.
    * **Subtask:** Set up rate-limiting for OTP requests.

---

## 2. EPIC: Guest & Booking Engine (P0)
### Feature: ReservationWorkflow
* **Story:** As a Guest, I want to book a property and pay securely.
  * **Task:** Build Reservation State Machine.
    * **Subtask:** Define state transitions (Pending -> Authorized -> Confirmed).
    * **Subtask:** Implement locking logic for overlapping dates.
  * **Task:** Integrate Payment Gateway (Stripe).
    * **Subtask:** Create PaymentIntents API endpoint.
    * **Subtask:** Handle Webhook events for payment success/failure.
    * **Subtask:** Implement 3D Secure fallback.

---

## 3. EPIC: Operational Field Management (P0)
### Feature: OperationsFieldManager
* **Story:** As a Cleaner, I want to view my tasks and report completion.
  * **Task:** Develop Task Queue API.
    * **Subtask:** Define GraphQL schema for task fetching.
    * **Subtask:** Implement geolocation filtering for unit lookup.
  * **Task:** Build Step-by-Step Cleaning Wizard.
    * **Subtask:** Create form-state management for checklist items.
    * **Subtask:** Integrate camera API for mandatory verification photos.

### Feature: TaskStepWizard
* **Story:** As a Cleaner, I want to provide photographic proof of task completion.
  * **Task:** Implement Image Processing Pipeline.
    * **Subtask:** Configure S3 storage with lifecycle policies.
    * **Subtask:** Build image optimization service (resize/compress).

---

## 4. EPIC: Property Management & Finance (P1)
### Feature: FinancialEngine
* **Story:** As a Finance user, I want to automate host payouts.
  * **Task:** Develop Payout Ledger Processor.
    * **Subtask:** Implement cron-job for daily settlement batching.
    * **Subtask:** Configure ACH/Direct Deposit routing logic.
  * **Task:** Build Tax Withholding Module.
    * **Subtask:** Implement geo-fenced tax calculation service.
    * **Subtask:** Generate 1099-K reporting data templates.

---

## 5. EPIC: Support & Safety (P2)
### Feature: ResolutionConsole
* **Story:** As a Support agent, I want to triage incidents.
  * **Task:** Build Ticket Triage Dashboard.
    * **Subtask:** Implement SLA timer service with Redis.
    * **Subtask:** Create CRM integration hooks for chat history.

### Feature: SafetyOverride
* **Story:** As an Admin, I want to trigger global system overrides in an emergency.
  * **Task:** Implement Global Kill-Switch service.
    * **Subtask:** Create master API gatekeeper to reject new reservations.
    * **Subtask:** Build emergency notification push-service.
