# LEAN_PRODUCT.md

## 1. The $150K / 6-Month Constraint
To survive and scale, we must prioritize features that drive immediate transaction volume. Technical debt is acceptable; downtime is not.

## 2. Core Feature Set (Revenue & Growth)
* **Direct Booking Flow:** Bypassing all channel managers to keep 100% platform commission. 
* **Instant Verification (OTP + ID Capture):** Trust is our only barrier to entry. We solve this instantly to accelerate user onboarding.
* **Unified Operations Task Manager:** Eliminating manual property turnover coordination. If the space isn't clean, we don't have a product.

## 3. The Growth Engine (Network Effect)
* **Automated Review Loop:** Prompting for feedback post-checkout. Reviews = Social Proof = Trust = Growth.
* **Referral Link Generator:** Simple "Refer a Guest/Host" functionality embedded in the user dashboard.

## 4. Cut/Deferred (The "Do Not Build" List)
* **Everything not in the core booking-to-turnover loop.**
* **Dynamic Pricing:** Use manual pricing tools until we have 1,000+ bookings to justify the algorithm cost.
* **Complex Support:** Use a third-party ticketing widget (Zendesk/Intercom) instead of building a custom dashboard.
* **Advanced Analytics:** Google Analytics + basic SQL dashboarding only.

## 5. Execution Strategy: 6-Month Sprint
* **Month 1:** Core Authentication (AuthGate) + Property Listing (CRUD).
* **Month 2:** Booking Engine (ReservationWorkflow) + Stripe Integration.
* **Month 3:** Field Operations (OpsManager) + Task Wizard (MVP).
* **Month 4:** Testing, Audit, and Beta Launch to 10 properties.
* **Month 5:** User feedback iteration, Bug-stomping.
* **Month 6:** Public Go-Live + Growth hacking (Referral program).
