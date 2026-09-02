# StayOS — Host Agreement / Owner Authorization (V1 Draft)

**Status:** DRAFT — NOT legal advice, NOT approved for use. This is the single most important document in the package for the "first real listing" objective: it is what makes a listed property's authorization *real* rather than assumed.

**Critical distinction (must survive into the final version unchanged):** StayOS's product **verifies the identity of the person submitting KYC documents**. It does **not** verify that person's ownership of, or legal authority over, the specific property they list. These are three separate things, and this Agreement is the only place any of them is actually established:

1. **Identity verified** — confirmed by KYC (ID document analysis + selfie face-match). [FACT, code-verified: `src/app/kyc/services.py`.]
2. **Ownership verified** — **not performed by any code in this repository.** No ownership-document field, deed-verification step, or ownership-checking logic exists anywhere in the codebase.
3. **Authorized representative** (e.g., a property manager acting for an owner, not the owner themself) — **not distinguished anywhere in the code.** The system has no field for "acting on behalf of" or manager-vs-owner role.

Because (2) and (3) are not technically verified, this Agreement's authorization clause (§ 2) is the **entire legal basis** for StayOS treating a listing as owner-authorized. It must be signed/accepted by every host before their property is published, and its representations must be true statements the host is making, not things StayOS is asserting on their behalf.

---

## 1. Parties

This Agreement is between StayOS ([FOUNDER DECISION REQUIRED — legal entity name]) and the individual or entity submitting a property for listing ("Host").

## 2. Host Representations (the authorization itself)

By submitting a property for listing, the Host represents and warrants that:

2.1 The Host is either (a) the legal owner of the property, or (b) a person with actual authority from the owner (e.g., a property manager, a family member with the owner's permission) to list the property and receive bookings on the owner's behalf.

2.2 If (b), the Host confirms they have obtained the owner's explicit permission to list the property on StayOS, to publish its photographs and details publicly, and to receive and accept booking requests on the owner's behalf.

2.3 The Host has the right to grant StayOS a license to publish the listing information and photographs supplied (§ 4).

2.4 The property is legally permitted to be used for short-term accommodation under applicable law. [LEGAL REVIEW REQUIRED — StayOS cannot itself confirm this; see the Terms of Service § 5.4 note on Egypt's unresolved short-term-rental regulatory position.]

2.5 All information (address, description, pricing, availability, amenities) and all photographs supplied are accurate and either owned by the Host or used with permission.

**These are representations the Host makes to StayOS — StayOS does not independently verify (2.1), (2.2), or (2.4) through any automated product feature.** **DECIDED (V1 host-authorization rule):** for the **first 1–10 listings**, sourced through the founder's personal network per the supply-acquisition strategy, the founder additionally **manually confirms ownership/authorization directly with the owner** before the listing is published — an operational safeguard performed outside the app, not a code feature. Listings sourced later through agencies, OLX, or other channels rely on this Agreement's declaration (§ 2) plus identity KYC (§ 5) alone, unless and until a documented ownership-verification feature is built (a P2 item, not required now).

## 3. StayOS's Role

StayOS publishes the listing on the Platform, facilitates booking requests, reviews listings for completeness before publication (§ 6, Terms of Service), and administers the manual payment-verification process described in the Cancellation & Refund Policy. StayOS is not a party to the accommodation contract between Host and Guest (see Terms of Service § 15–16).

## 4. License to Publish

The Host grants StayOS a non-exclusive, revocable (on listing removal) license to display the submitted listing information and photographs on the Platform for the purpose of operating the marketplace.

## 5. Documents Supplied for KYC

The Host will supply an identity document — passport, national ID, or driving license (`KycDocumentType`: `passport` / `national_id` / `driving_license`, confirmed by inspection of `src/app/auth/constants.py`) — and a selfie for face-match verification. These documents are processed as described in the Privacy Policy § 1 and § 8 (AWS Textract/Rekognition; open Egyptian data-protection licensing question).

## 6. Host Responsibilities

6.1 Keep listing availability, pricing, and details accurate and current.

6.2 Respond to booking requests in a timely manner.

6.3 Honor confirmed bookings; provide the accommodation as listed.

6.4 Comply with applicable law (tax, tourism licensing, safety) for operating the property. [LEGAL REVIEW REQUIRED — same unresolved regulatory area as Terms of Service § 5.4.]

## 7. Guest Access

The Host is responsible for arranging guest check-in/check-out and property access; StayOS has no code-level role in this (no digital key, access-code, or check-in feature was found in the repository).

## 8. Cancellation Obligations

Governed by `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`. **DECIDED:** if the Host cancels a confirmed, paid booking, the Guest is refunded 100% (accommodation amount + guest service fee), and StayOS retains no commission on that booking. This is not an additional monetary penalty on the Host — it is the forfeiture of commission StayOS would otherwise have earned. **A Host who cancels 2 or more confirmed bookings during the alpha phase triggers manual admin review of their listing(s).**

## 9. Payment / Payout Terms

9.1 Guest payment is collected per the manual flow described in the Terms of Service § 8.

9.2 **Host payout — DECIDED:** the Guest pays into a StayOS-controlled account (§ 9.1 above, Terms of Service § 8.3–8.5). After StayOS verifies the Guest's payment, StayOS forwards the Host's share — net of commission (§ 9.3) — **within 3 business days of verification.** For V1/alpha, this forwarding is a **manual transfer executed by StayOS operations**, not an automated payout; the code contains a complete automated version of this (`finance` module: wallet, ledger, Paymob/Stripe/internal payout) that is not yet wired to the live flow.

9.3 **Commission — DECIDED, StayOS's official V1 rate:** **10% of the accommodation subtotal + 2% platform fee**, both deducted from the Host's payout (a separate 4% fee is added to what the Guest pays, not deducted from the Host). **Alpha promotional incentive:** the first 3 completed bookings per Host are charged **0% Host commission**; the 2% platform fee still applies for those bookings. Found already configured identically across every environment file (`src/app/config.py`) and adopted here as final for V1 — see `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 2 for rationale.

## 10. StayOS Service Role (restated)

StayOS provides the marketplace, publication, booking-workflow, and payment-verification service described above. StayOS does not manage the property, does not provide hospitality services, and is not the accommodation provider. [Same founder/counsel confirmation flag as Terms of Service § 15.]

## 11. Suspension / Removal

StayOS may remove a listing or suspend a Host account for inaccurate information, fraud, failed/expired KYC, repeated cancellations (2+, per § 8), or violation of this Agreement or the Terms of Service. **DECIDED:** removal/suspension is an admin action (existing capability — listing reject/unpublish, account deactivation); the Host is notified with a reason via the existing notification channel. Appeal, for V1, is a direct request to StayOS support — no separate in-app appeal workflow is built or required at this scale.

## 12. Termination

Either party may terminate this Agreement; the Host may withdraw a listing at any time (§ 13). **DECIDED:** termination does not affect bookings already confirmed prior to termination, which remain governed by this Agreement and the Cancellation & Refund Policy.

## 13. Withdrawal of Authorization

**DECIDED:** the Host may withdraw their authorization and request listing removal at any time via the in-app "unpublish" action (`unpublish_listing`, existing code, no change needed) — no separate support request is required.

## 14. Dispute Resolution

Same position as Terms of Service § 19 and § 23 — governing law and forum require legal counsel input, not assumed here.

## 15. Authorization Duration

**DECIDED:** this authorization remains in effect while the listing is published on the Platform, and is renewed implicitly each time the Host updates or republishes the listing — no fixed-term/explicit-renewal model for V1.

---

## § النسخة العربية — اتفاقية المضيف / تفويض المالك (مسودة النسخة الأولى)

**تمييز جوهري (يجب أن يبقى دون تغيير في النسخة النهائية):** يتحقق منتج StayOS من **هوية** الشخص الذي يقدّم مستندات KYC. **ولا يتحقق من ملكيته أو تفويضه القانوني بالعقار المحدد الذي يُدرجه.** هذه ثلاثة أمور منفصلة:
1. **التحقق من الهوية** — عبر KYC (تحليل مستند الهوية + مطابقة الصورة الشخصية).
2. **التحقق من الملكية** — **غير موجود في أي جزء من الكود.**
3. **الممثل المفوَّض** (كمدير عقارات ينوب عن مالك) — **غير مُميَّز في الكود** أيضًا.

لأن (2) و(3) غير مُتحقق منهما تقنيًا، فإن بند التفويض في هذه الاتفاقية (البند 2) هو **الأساس القانوني الكامل** لاعتبار StayOS أن أي إعلان مُفوَّض من مالكه. يجب أن يوافق عليه كل مضيف قبل نشر عقاره، وأن تكون إقراراته تصريحات يقدمها المضيف نفسه، لا افتراضات تُقرّها StayOS نيابة عنه.

### 1. الأطراف
هذه الاتفاقية بين StayOS ([قرار مطلوب من المؤسس — اسم الكيان القانوني]) والشخص أو الجهة التي تُقدّم عقارًا للإدراج ("المضيف").

### 2. إقرارات المضيف (التفويض نفسه)
بتقديم عقار للإدراج، يقر المضيف ويضمن أنه:
2.1 إما (أ) المالك القانوني للعقار، أو (ب) شخص لديه تفويض فعلي من المالك (كمدير عقارات أو أحد أفراد الأسرة بإذن المالك) لإدراج العقار واستقبال الحجوزات نيابة عن المالك.
2.2 في حال (ب)، يؤكد المضيف حصوله على إذن صريح من المالك لإدراج العقار على StayOS ونشر صوره وتفاصيله علنًا واستقبال طلبات الحجز نيابة عنه.
2.3 يملك المضيف الحق في منح StayOS ترخيصًا لنشر بيانات الإعلان والصور المقدَّمة.
2.4 يُسمح قانونًا باستخدام العقار للإيجار قصير المدى وفق القانون المعمول به. [مطلوب مراجعة قانونية.]
2.5 جميع البيانات والصور المقدَّمة دقيقة ومملوكة للمضيف أو مستخدمة بإذن.

**هذه إقرارات يقدمها المضيف لـ StayOS — ولا تتحقق StayOS بشكل مستقل من (2.1) أو (2.2) أو (2.4) عبر أي ميزة آلية.** **قرار نهائي:** بالنسبة لأول 1-10 إعلانات (المصدر الشخصي للمؤسس)، يؤكد المؤسس التفويض/الملكية مباشرة مع المالك يدويًا قبل النشر. الإعلانات اللاحقة عبر الوكالات أو مصادر أخرى تعتمد على الإقرار وKYC فقط حتى بناء ميزة توثيق ملكية مستقبلية.

### 3. دور StayOS
تنشر StayOS الإعلان، وتُسهّل طلبات الحجز، وتراجع الإعلانات قبل النشر، وتدير عملية التحقق اليدوي من الدفع. StayOS ليست طرفًا في عقد الإقامة بين المضيف والضيف.

### 4. ترخيص النشر
يمنح المضيف StayOS ترخيصًا غير حصري وقابلاً للإلغاء (عند إزالة الإعلان) لعرض بيانات الإعلان والصور المقدَّمة على المنصة.

### 5. المستندات المقدَّمة لـ KYC
يقدّم المضيف مستند هوية — جواز سفر أو بطاقة رقم قومي أو رخصة قيادة — وصورة شخصية للمطابقة.

### 6. مسؤوليات المضيف
الحفاظ على دقة بيانات الإعلان، الرد على طلبات الحجز في وقت مناسب، الالتزام بالحجوزات المؤكدة، الامتثال للقوانين المعمول بها (الضرائب، التراخيص السياحية، السلامة). [مطلوب مراجعة قانونية بخصوص الوضع التنظيمي غير المحسوم.]

### 7. وصول الضيف
يتحمل المضيف مسؤولية ترتيب دخول/خروج الضيف والوصول للعقار؛ لا يوجد دور برمجي لـ StayOS في هذا حاليًا.

### 8. التزامات الإلغاء
يحكمها سياسة الإلغاء والاسترداد المنفصلة. **قرار نهائي:** عند إلغاء المضيف لحجز مؤكد ومدفوع، يُسترد للضيف 100% (المبلغ الكامل + رسوم الخدمة)، ولا تحتفظ StayOS بأي عمولة على ذلك الحجز. **إلغاء المضيف لحجزين مؤكدين أو أكثر خلال مرحلة الإصدار التجريبي يُفعّل مراجعة إدارية يدوية لإعلاناته.**

### 9. شروط الدفع / السداد للمضيف
9.1 يُجمع دفع الضيف وفق المسار اليدوي الموضح في شروط الخدمة.
9.2 **سداد المضيف — قرار نهائي:** يدفع الضيف إلى حساب تديره StayOS، وبعد التحقق من الدفع تُحوّل StayOS نصيب المضيف (بعد خصم العمولة) **خلال 3 أيام عمل من التحقق**، يدويًا في مرحلة الإصدار الأول.
9.3 **العمولة — قرار نهائي ونسبة StayOS الرسمية للإصدار الأول:** 10% من نصيب المضيف + 2% رسوم منصة (تُخصم من نصيب المضيف)، بالإضافة إلى 4% تُضاف على دفعة الضيف منفصلة. **حافز النسخة التجريبية:** أول 3 حجوزات مكتملة لكل مضيف تُحتسب بعمولة 0% من نصيب المضيف، مع استمرار خصم 2% رسوم المنصة.

### 10–15
دور StayOS (تكرار، مطلوب مراجعة قانونية لصياغته النهائية) — **محسوم**؛ التعليق/الإزالة (إجراء إداري + دعم فني للاستئناف، لا سير عمل استئناف داخل التطبيق) — **محسوم**؛ الإنهاء (لا يؤثر على الحجوزات المؤكدة سابقًا) — **محسوم**؛ سحب التفويض (عبر إلغاء النشر داخل التطبيق) — **محسوم**؛ مدة التفويض (تلقائية طالما الإعلان منشور) — **محسوم**؛ تسوية النزاعات — **[مطلوب مراجعة قانونية]** (القانون الحاكم والجهة القضائية لم يُحسما). التفاصيل الكاملة بنفس المضمون الوارد في النسخة الإنجليزية أعلاه.
