# 07 — EXECUTION CHECKLIST

**Board:** Executive Project Director, PMO Director  
**Date:** 2026-08-03  
**Purpose:** Minimum mandatory checklist before Closed Alpha launch

---

## 1. Engineering Checklist (Must be complete before launch)

### Infrastructure

- [ ] S3 listings bucket exists in AWS
- [ ] S3 KYC bucket exists in AWS
- [ ] CORS configured on listings bucket for browser uploads
- [ ] IAM role has s3:PutObject and s3:GetObject on both buckets
- [ ] Presigned PUT URL works from browser (test upload)
- [ ] Platform deployed to production
- [ ] Database migrations applied (all through current head)
- [ ] Redis running and connected
- [ ] Environment variables configured (Twilio, Firebase, AWS, Paymob, JWT keys)

### Supply Pipe

- [ ] Host can sign up with phone OTP
- [ ] Host can upload KYC documents (ID front, back, selfie)
- [ ] Host can create a listing (title, description, location, price, amenities)
- [ ] Host can upload listing photos via presigned S3 URL
- [ ] Host can set cover photo
- [ ] Host can set base price and minimum nights
- [ ] Host can block/unblock calendar dates
- [ ] Host can submit listing for review (DRAFT → PENDING_VERIFICATION)
- [ ] SMS notification sent to host on listing submission

### Admin Operations

- [ ] Admin can view pending KYC submissions
- [ ] Admin can approve KYC (sets kyc_status = VERIFIED)
- [ ] Admin can reject KYC with reason (sets kyc_status = REJECTED)
- [ ] SMS sent to host on KYC approval/rejection
- [ ] Admin can view pending listings (status = PENDING_VERIFICATION)
- [ ] Admin can approve listing (sets status = LISTED)
- [ ] Admin can reject listing with reason (sets status = UNLISTED)
- [ ] SMS sent to host on listing approval/rejection
- [ ] Admin can upload CSV file to bulk-create listings
- [ ] CSV import creates units and listings with correct data
- [ ] CSV import reports errors per row

### Search and Discovery

- [ ] Search page returns listings filtered by location
- [ ] Search page returns listings filtered by price range
- [ ] Search page returns listings filtered by property type
- [ ] Listing detail page shows photos, title, description, price, host info
- [ ] Listing detail page shows availability
- [ ] Only LISTED listings appear in search results

### Booking and Payment

- [ ] Guest can select check-in and check-out dates
- [ ] Guest can select number of guests
- [ ] Guest can initiate a booking
- [ ] Payment page loads (Paymob iframe or manual confirmation path)
- [ ] Paymob payment processes successfully (if integrated)
- [ ] Manual payment confirmation works (admin endpoint)
- [ ] Reservation is created with correct status
- [ ] Host is notified of new booking (SMS)
- [ ] Guest receives booking confirmation

### Notifications

- [ ] SMS sent on KYC submission
- [ ] SMS sent on KYC approval
- [ ] SMS sent on KYC rejection (with reason)
- [ ] SMS sent on listing submission
- [ ] SMS sent on listing approval
- [ ] SMS sent on listing rejection (with reason)
- [ ] SMS sent on new booking to host
- [ ] SMS sent on booking confirmation to guest

---

## 2. Supply Checklist (Must be complete before launch)

- [ ] Founder has a contact list of 100 potential hosts
- [ ] Contact list includes: name, phone, property area, number of units
- [ ] Contact list prioritized: personal network first, agencies second, cold contacts third
- [ ] Founder has identified 3–5 property management agencies to approach
- [ ] Founder has prepared the host pitch (commission rate, EGP payment, alpha status)
- [ ] Founder has prepared CSV template for agency data collection
- [ ] Founder has created 5 test listings with real photos and pricing
- [ ] 5 test listings are live and visible on search page

---

## 3. Demand Checklist (Must be complete before launch)

- [ ] Founder has a list of 10 warm contacts who will book
- [ ] Each warm contact has been told about StayOS and agreed to try it
- [ ] Founder has identified which listings to recommend to each warm contact
- [ ] Founder has prepared a guest pitch (personal recommendation, help with booking)
- [ ] Founder has a plan for social media promotion (which groups, which platforms, what message)

---

## 4. Operations Checklist (Must be complete before launch)

- [ ] Founder has access to admin KYC review page
- [ ] Founder has access to admin listing verification page
- [ ] Founder has access to admin CSV import page
- [ ] Founder has access to manual payment confirmation endpoint
- [ ] Founder has a WhatsApp group created for hosts
- [ ] Founder has prepared WhatsApp message templates (Arabic) for all notification events
- [ ] Founder has a spreadsheet or notebook for daily metrics log
- [ ] Founder has a document for operations playbook (starts empty, updated daily)
- [ ] Founder has engineering team's WhatsApp contact for bug reports
- [ ] Founder has tested the full admin workflow: KYC review → listing review → CSV import

---

## 5. Trust & Safety Checklist (Must be complete before launch)

- [ ] Only verified hosts (kyc_status = VERIFIED) can have listings approved
- [ ] Only LISTED listings appear in search (no DRAFT or PENDING_VERIFICATION)
- [ ] All test listings have real photos (not stock images)
- [ ] All test listings have accurate addresses
- [ ] Founder has a process for fraud detection (manual review of every listing)
- [ ] Founder has a process for handling disputes (personal mediation)
- [ ] Escrow model is configured (funds held until check-in, not released immediately)

---

## 6. Finance Checklist (Must be complete before launch)

- [ ] Paymob account is activated (or manual confirmation plan is documented)
- [ ] Founder has access to Paymob dashboard (or bank statement for manual verification)
- [ ] Founder has a process for calculating host payouts (90% of booking value)
- [ ] Founder has host bank account details for at least 5 test hosts
- [ ] Founder has tested a manual payout (bank transfer to a test host)
- [ ] Escrow and ledger tables are configured in database

---

## 7. Launch Readiness Sign-Off

| Category | Owner | Status | Sign-Off Date |
|----------|-------|--------|---------------|
| Engineering | CTO | | |
| Supply | Founder | | |
| Demand | Founder | | |
| Operations | Founder | | |
| Trust & Safety | Founder | | |
| Finance | Founder | | |

**All categories must be signed off before Closed Alpha begins.**

---

## 8. Post-Launch Daily Checklist (Founder runs this every day during alpha)

### Morning

- [ ] Platform is accessible (open website, verify search works)
- [ ] All pending KYC submissions reviewed (approve/reject)
- [ ] All pending listing submissions reviewed (approve/reject)
- [ ] All WhatsApp messages from hosts and guests responded to
- [ ] 5 host outreach calls made
- [ ] Daily metrics logged (signups, listings, bookings, searches)

### Afternoon

- [ ] Any pending payment confirmations processed
- [ ] Any pending payouts processed (for completed stays)
- [ ] Photo uploads completed for listings that need them
- [ ] 2–3 warm contacts contacted for guest bookings
- [ ] Operations playbook updated with today's lessons

### Evening

- [ ] Platform still accessible (quick check)
- [ ] Engineering sync message sent (bugs, priorities)
- [ ] Daily log completed

---

## 9. Weekly Checklist (Founder runs this every Sunday)

- [ ] Weekly metrics compiled (live listings, verified hosts, bookings, revenue, payouts)
- [ ] Board status report sent (1-page summary)
- [ ] Host newsletter sent to WhatsApp group
- [ ] Operations playbook reviewed and updated
- [ ] Next week's targets set
- [ ] Host feedback survey sent (3 questions via WhatsApp)
- [ ] Guest feedback survey sent to anyone who checked out this week
- [ ] Engineering sync completed (Monday morning)

---

## 10. NOT on the Checklist (Explicitly excluded from alpha)

- [ ] ~~Unclaimed listing creation~~ — Founder creates listings manually
- [ ] ~~Claim review and ownership transfer~~ — Not needed for alpha
- [ ] ~~Duplicate detection~~ — Not needed for 50 listings
- [ ] ~~Support ticket system~~ — WhatsApp is sufficient
- [ ] ~~WhatsApp Business API~~ — SMS via Twilio is sufficient
- [ ] ~~Map-based search~~ — List view is sufficient
- [ ] ~~Host dashboard~~ — Founder manages listings for hosts
- [ ] ~~Reviews and ratings~~ — Manual feedback collection
- [ ] ~~Google/Apple OAuth~~ — Phone OTP is sufficient
- [ ] ~~CloudFront CDN~~ — Direct S3 access is sufficient
- [ ] ~~Automated payouts~~ — Manual bank transfers
- [ ] ~~Quality score algorithm~~ — Manual review is sufficient
- [ ] ~~Photo reverse-image search~~ — Manual review is sufficient
- [ ] ~~Cancellation policy UI~~ — Founder handles cancellations manually
- [ ] ~~Account suspension UI~~ — Founder suspends via direct database action if needed
