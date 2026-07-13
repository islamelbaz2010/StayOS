# MVP_FREEZE.md

## 1. Executive Summary: MVP Definition
The Omni-Stay MVP is strictly defined as the **"Booking-to-Cleaning" core loop**. By focusing exclusively on enabling a Guest to book a stay and an Operator to manage the resulting turnover, we maximize immediate transaction volume and operational liquidity.

## 2. Included (The "Must-Haves")
* **Guest:** * Unified Search & Discovery (Location/Date/Guest filtering).
    * AuthGate (Phone/OTP + Social OAuth).
    * ReservationWorkflow (Instant booking + Stripe Payment Integration).
* **Host/PM:**
    * PropertyCommandCenter (Manual listing creation + Basic Media).
    * MultiCalendarPMS (Visualization of confirmed bookings).
* **Operations:**
    * OperationsFieldManager (Task assignment for cleanings).
    * TaskStepWizard (Basic cleaning checklist + photo upload).
* **Safety/Admin:**
    * SafetyOverride (Emergency Kill-Switch only).

## 3. Excluded (Deferred for Post-MVP)
* **Automated Pricing:** Manual base rates only; no Smart Pricing/Dynamic Algorithm.
* **Complex Finance:** No automated 1099-K tax generation; basic manual payout reporting.
* **Advanced Support:** No CRM incident triage; basic direct messaging only.
* **Field Maintenance:** No automated maintenance ticketing system (deferred to V1.1).
* **Advanced Marketing:** No coupon codes, loyalty points, or early-bird discounts.
* **Integrations:** No multi-channel sync (Airbnb/VRBO/etc); Direct bookings only.

## 4. Budget & ROI Optimization
* **Strategy:** Focus on "Direct Booking" to capture 100% of the platform fee without the technical debt of building third-party API adapters (Channel Managers) during the MVP phase.
* **ROI Impact:** * **High Transaction Velocity:** Direct booking engine minimizes friction for early adopters.
    * **Reduced Overhead:** By deferring maintenance and dynamic pricing, engineering focus is preserved for the critical payment and cleaning loops.
    * **Scalability:** The architecture for task assignment (OperationsFieldManager) is built on a service-oriented model, allowing for future maintenance and concierge modules without rebuilding the base.
