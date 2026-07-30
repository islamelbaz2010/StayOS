# Identity Verification Guide — StayOS

**Domain**: Trust & Safety
**Audience**: Trust & Safety, Host Success, Support, Engineering
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: KYC, identity, verification, BR-ID-01, BR-ID-02, AWS-Textract, Rekognition, fraud, national-ID, passport

---

## Purpose

This article explains what identity verification is, why it's mandatory for all users, what the technical system does, how to handle verification failures, edge cases, and escalation rules. It is the complete reference for anyone who interacts with the verification process — from the system configuration level to the support agent helping a host complete their KYC.

---

## Background

Identity verification (KYC — Know Your Customer) is the foundational trust mechanism for StayOS. Without it:
- A host cannot know who is entering their property
- StayOS cannot pursue legal remedies against a guest who causes damage
- Fraud prevention is impossible (no identity = no fraud accountability)
- Regulatory compliance for financial transactions may be compromised

The Egyptian accommodation market has operated largely without identity verification. Guests at informal rentals are often strangers to the host who paid by cash. This creates a high-risk environment for hosts. StayOS's KYC requirement is a competitive differentiator — a host who joins StayOS knows their guests are verified. This is a selling point, not a burden.

**Business Rules**:
- **BR-ID-01**: Every guest must complete identity verification before making their first booking
- **BR-ID-02**: Payout bank account details must match the verified legal name exactly

---

## Core Concept: The Verification System

StayOS's verification system uses two AWS services in sequence:

```
User submits ID document photo
          ↓
AWS Textract (OCR)
Extracts: Name, ID number, date of birth, expiry date
          ↓
User submits selfie photo
          ↓
AWS Rekognition (Face Comparison)
Compares: Selfie face to face in the ID document
          ↓
Match confidence ≥ 90% → VERIFIED
Match confidence 70–89% → MANUAL REVIEW
Match confidence < 70% → REJECTED
```

---

## Detailed Explanation

### Step 1: Document Submission

**Accepted documents**:
- Egyptian National ID Card (بطاقة الرقم القومي) — primary for Egyptian nationals
- Egyptian Passport (جواز السفر المصري) — for Egyptians who don't have a current national ID
- Gulf Cooperation Council (GCC) National ID — for UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman citizens
- International Passport (non-Egyptian nationals)

**Not accepted**:
- Driver's license (not a secure identity document in Egypt)
- Expired documents
- Photos of photos (user must photograph the physical document, not a screen)

**Document quality requirements**:
- All four corners of the document visible
- Text must be legible (no blur, no glare)
- No covering of any field with fingers
- Adequate lighting (no shadows over text or photo)

---

### Step 2: OCR Extraction (AWS Textract)

Textract processes the document and extracts:
- Full legal name (Arabic for Egyptian IDs, as printed on document)
- Identity number (the 14-digit national ID number for Egyptian IDs)
- Date of birth
- Document expiry date

**Extracted name is the legal name for all future use** — it cannot be changed without a new verification. This is the name that must match payout account details (BR-ID-02).

**Textract failure cases**:
- Low image quality: "Your ID photo is unclear. Please photograph again in good lighting with all corners visible."
- Document type not recognized: Escalate to manual review
- Handwritten notes on document (some older Egyptian IDs had handwritten additions): Escalate to manual review

---

### Step 3: Selfie Comparison (AWS Rekognition)

After document extraction, the user is prompted to take a live selfie:

**Selfie requirements**:
- Face clearly visible, not obscured by sunglasses or mask
- Adequate lighting (face not in shadow)
- Neutral expression, face directly toward camera
- No other people in the frame

Rekognition compares the selfie face to the face photograph on the ID document.

**Confidence thresholds**:
| Confidence | Decision | Action |
|-----------|---------|--------|
| ≥90% | VERIFIED | Account activated immediately |
| 70–89% | MANUAL REVIEW | Trust & Safety reviews within 4 hours |
| <70% | REJECTED | User prompted to retry with clearer photos |

**Why 90% threshold?** Below 90% confidence creates meaningful false-negative risk (rejecting real users) and false-positive risk (accepting users who aren't who they claim). 90% is the operational threshold that balances these risks. Manual review handles the 70–89% gray zone.

---

### Step 4: Manual Review Process

Manual review is triggered when confidence is 70–89% or when Textract could not fully process the document.

**Manual review steps**:
1. Trust & Safety team member receives a notification of the pending review
2. Views the submitted document photo and selfie side by side
3. Visually compares the face in the selfie to the face in the ID
4. Checks: Is the name extracted correctly? Does the document look genuine? Any signs of tampering?
5. Decision: APPROVE (account activated) or REJECT (user prompted to resubmit with better photos)

**Manual review SLA**: 4 business hours. During high-volume periods, maximum 8 hours.

**Manual review red flags** (trigger REJECT):
- Document appears digitally altered (inconsistent fonts, pixels that don't match)
- Photo on ID appears different age/appearance than the selfie in a way that could indicate the ID is not the user's
- ID number does not conform to Egyptian national ID format (if applicable)
- Expiry date has passed

**Manual review approval factors**:
- Lighting was poor but the faces clearly match
- Document quality was low but text is legible enough to extract identity
- The confidence score is 70–89% due to a technical factor (angle, lighting) not an identity mismatch

---

### Step 5: Verified State and KYC Persistence

Once verified:
- User's account status: VERIFIED
- Verified name stored in the system (the exact legal name from the document)
- The KYC record is permanent — it does not expire or require renewal in Stage 1

**Re-verification triggers** (future Stage 2/3):
- Payout bank account name doesn't match KYC name (BR-ID-02 enforcement)
- Trust & Safety suspects identity fraud and initiates a re-verification request
- User changes their account name (triggers automatic re-verification request)

---

## Edge Cases and Special Scenarios

### Edge Case 1: Minors
Egyptian law allows minors (under 18) to have national ID cards from age 16. A minor booking is only permitted under the Family-Only category with an adult who is also verified on the booking. Standalone bookings by minors are not permitted.

**System behavior**: Date of birth is extracted. If the user is under 18, the verification is flagged for manual review with a note that the booking must be a family booking with a verified adult as primary booker.

### Edge Case 2: Married Women with Name Changes
Egyptian women may have different names on their national ID vs. their bank account (maiden name vs. married name). This creates a BR-ID-02 conflict.

**Resolution**: Request both the national ID (as the primary identity document) and the marriage certificate (to document the name change). Payout bank account may use the married name if the marriage certificate is on file. This exception must be documented in the host's account record.

### Edge Case 3: Non-Egyptian Guests with Passports Not in Arabic
International passport holders submit their passport in English or their native language. Textract processes Latin-alphabet documents. The extracted name is in the language of the passport.

**No special handling required**: The system works normally. The stored legal name is in the document's language.

### Edge Case 4: GCC National ID for Saudi Arabia
Saudi Arabian national IDs have a different format from Egyptian IDs. The system must be configured to recognize the Saudi national ID layout. If Textract fails to process a valid Saudi ID: escalate to manual review immediately. Do not reject the user — the Saudi market is a strategic priority.

### Edge Case 5: Expired Document
System extracts expiry date. If expired: automatic rejection. Message: "Your [document type] expired on [date]. Please provide a current, valid identity document."

### Edge Case 6: User Claims They Lost Their ID
Host or guest contacts support claiming they have no valid ID document. Response: "Unfortunately, identity verification is required for all StayOS users. This is a mandatory step to protect both guests and hosts on our platform. Once you have a valid ID document (national ID or passport), we'd be happy to help you complete your verification."

Do not make exceptions to the KYC requirement regardless of circumstances. BR-ID-01 is non-negotiable.

---

## Common Failure Patterns and Fixes

| Failure | Root Cause | Fix to Tell User |
|---------|-----------|-----------------|
| "Document not recognized" | Photo taken at an angle, not flat | "Lay your ID flat on a dark surface and photograph from directly above." |
| "Unable to read text" | Glare from lighting | "Move away from direct light sources. Natural indirect light works best." |
| "Face comparison failed" | Selfie taken in low light or at angle | "Take your selfie in bright light, facing directly forward." |
| "Name extracted incorrectly" | Document quality issue | "Manual review will verify your name — no action needed. We'll respond within 4 hours." |
| "Document appears expired" | Old photo of expired document submitted | "Please photograph your current, valid ID." |

---

## Decision Tree: KYC Resolution

```
User cannot complete KYC. What is the failure?

Photo quality issue (blur, glare, angle)?
  → Provide specific photo guidance. Ask user to retry.

Document not recognized?
  → Is it an accepted document type? 
        NO → List accepted documents. Request appropriate document.
        YES → Escalate to manual review.

Face comparison confidence <70%?
  → Ask user to retry selfie in better light, facing directly forward.
  → If second attempt also fails: Escalate to manual review with both attempts.

Manual review outcome: REJECT?
  → Document appears altered or face doesn't match: do not approve.
  → Notify user: "We were unable to verify your identity with the provided documents."
  → If user disputes: Escalate to Trust & Safety lead.

Manual review outcome: APPROVE?
  → Activate account. Notify user verification is complete.
```

---

## Fraud Signals in KYC

Trust & Safety team watches for these signals during manual review:

**Signal 1: Digital Alteration**
Pixels that don't match the surrounding document. Font inconsistencies. Gradient artifacts around a photo. An ID that "looks too clean" for its stated age.

**Signal 2: The Wrong Face**
The face in the selfie is much younger or older than the face on the ID in a way that suggests a different person (borrowing a family member's ID).

**Signal 3: Bulk Account Creation**
Multiple accounts created in a short time from the same IP address or device. Even if each KYC passes individually, the pattern is suspicious. Flag for Trust & Safety investigation.

**Signal 4: Name Mismatch with Payout Account**
If a host whose verified name is "Mohamed Ahmed Salem" provides a payout account in the name "Rana Khalil," this is not a name change scenario — it's a third-party account scenario (potentially money laundering). Freeze the account and escalate to Trust & Safety.

---

## Real-World Scenarios

### Scenario A: The Host Stuck in Verification for 3 Days
Host onboards enthusiastically, reaches verification step, submits their ID, gets "manual review" message, and hears nothing for 3 days. They contact support.

**Root cause**: Manual review SLA (4 hours) was not met. This is an operations failure.

**Response**: Apologize. Immediately review their pending verification. If the documents are valid, approve on the spot. Apply a goodwill credit for the delay. Review why the SLA was missed.

**Prevention**: Build a manual review queue visibility dashboard. If any manual review is >4 hours without action, an alert fires to the Trust & Safety team.

### Scenario B: The Elderly Host Without a Smartphone
A host (age 68) wants to list their property. They own a basic mobile phone, not a smartphone. They cannot use the app to take a photo of their ID and selfie.

**Current capability**: The verification system requires a mobile device with camera capability. Desktop-only options are not available in Stage 1.

**Practical solution for Stage 1**: A team member visits the host in person (or arranges a family member to assist), takes the photos using the StayOS app on a team device, completes the verification process with the host present. This is a manual assisted onboarding process.

**Flag for Stage 2**: Build an assisted verification workflow for users who cannot complete digital verification independently.

### Scenario C: The Guest Who Failed Verification Three Times
A guest attempts KYC three times with consistently low face match scores. They contact support claiming the app "doesn't work."

**Correct response**:
1. Review all three attempts in the manual review system
2. Ask the guest to send photos directly via WhatsApp for manual comparison (bypassing the automated system)
3. If the WhatsApp photos clearly show the same person as the ID: approve manually and log the exception
4. If the WhatsApp photos also don't match: Trust & Safety investigation. This may be a synthetic identity or borrowed identity situation.

---

## Best Practices

1. **Never tell a user their KYC was rejected without telling them what to do next.** "Verification failed" with no path forward creates frustration and abandonment. "Verification failed — here are three steps to fix it" keeps the user in the funnel.

2. **Manual review decisions must be documented.** Every manual APPROVE or REJECT must include the reviewer's name, the specific reason, and the evidence they relied on. Undocumented decisions cannot be audited or appealed.

3. **Treat KYC failures as a product feedback loop.** If 15% of users fail on the first attempt because of glare, that's a UX problem (the guidance before photo submission is insufficient), not a user error. Fix the guidance.

4. **Protect KYC data aggressively.** Verified identity documents are among the most sensitive personal data StayOS holds. Access must be restricted to Trust & Safety team only. Support agents should see "VERIFIED" status, not the actual documents. Engineering should handle these with appropriate data classification.

5. **Verify payout routing at onboarding, not at first payout.** A host who completes KYC on Day 1 and discovers their payout account name doesn't match on Day 45 (first payout) is furious. Validate BR-ID-02 compliance during onboarding while the host is engaged and motivated to fix things.

---

## Common Mistakes

**Mistake 1: Making exceptions to KYC for "trusted" individuals**
"This host is a friend of someone I know" is not a basis for waiving identity verification. BR-ID-01 applies to everyone. No exceptions. The trust framework's value comes from its universality.

**Mistake 2: Approving borderline manual reviews to hit onboarding targets**
If the confidence score is 72% and the documents look suspicious, the right answer is REJECT, not APPROVE to increase verified user count. One fraudulent verified user does more damage than 10 legitimate users who need to resubmit their documents.

**Mistake 3: Not telling users how long manual review takes**
A user who submitted verification and received "we're reviewing this" but no timeline expectation will contact support after 30 minutes wondering what's happening. Always communicate the SLA: "Manual review typically takes up to 4 business hours."

**Mistake 4: Storing verification photos outside secure storage**
KYC photos must be stored in a compliant, access-controlled storage system (encrypted at rest, access audit logs). Storing them in a shared Google Drive or Slack channel is a data breach.

---

## FAQs

**Q: Can a user change their verified name?**
A: No. The verified name comes from a government-issued ID. If a user's legal name has genuinely changed (marriage, court order), they must submit the new ID and the supporting documentation (marriage certificate or court order). This triggers a full re-verification.

**Q: How long do we retain KYC documents?**
A: Minimum retention period under Egyptian anti-money laundering regulations (to be confirmed by legal counsel). Working assumption for Stage 1: retain for 5 years after account closure. Legal counsel must confirm this.

**Q: What if a government authority requests access to our KYC records?**
A: Any government request for user identity data must go directly to the Founder and legal counsel before any disclosure. StayOS does not provide user data to authorities without a valid legal basis (court order, regulatory requirement). Under no circumstances should support agents or team members provide KYC data in response to an informal request.

**Q: What is our acceptance rate target for KYC?**
A: Target: ≥85% of users who start KYC complete it successfully within 24 hours. Below this suggests UX friction that needs product attention. Monitor weekly during Stage 1 onboarding.

---

## Checklist

### KYC System Audit (Monthly)
- [ ] Manual review queue cleared (no pending reviews >4 hours)
- [ ] KYC acceptance rate calculated (starts vs. completions)
- [ ] Most common failure reasons identified and documented
- [ ] All manual REJECT decisions reviewed for consistency
- [ ] Any fraud signals from the month investigated and documented
- [ ] Payout routing verification at onboarding confirmed functional

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-ID-01, BR-ID-02
- `src/app/auth/models.py` — User verification state
- `src/app/kyc/services.py` — KYC workflow implementation
- `src/app/kyc/tasks.py` — Textract and Rekognition async tasks
- AWS Textract documentation
- AWS Rekognition documentation

## Related Documents

- `knowledge/trust/fraud_detection.md`
- `knowledge/customer_success/host_lifecycle.md`
- `knowledge/finance/payout_operations.md` — BR-ID-02 enforcement
- `knowledge/training/support_training.md`
