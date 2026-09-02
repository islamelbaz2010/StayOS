# StayOS — Terms of Service (V1 Draft)

**Status:** DRAFT — NOT legal advice, NOT approved for publication. Written by an AI drafting assistant for founder and legal-counsel review. Every bracketed `[FOUNDER DECISION REQUIRED]` or `[LEGAL REVIEW REQUIRED]` marker must be resolved before this document is published or relied upon.

**Basis:** This draft describes only what the current StayOS product actually does, per repository inspection on 2026-08-24 (see `LEGAL_GAP_REGISTER.md` for the full evidence trail). It does not invent features, guarantees, or legal conclusions.

**Version:** V1 Draft · **Languages:** English (below) / Arabic (`§ النسخة العربية` at the end of this file)

---

## 0. Legal Entity

[FOUNDER DECISION REQUIRED — the operating legal entity for StayOS (company name, registration number, registered address) is not established in this repository. Egyptian Consumer Protection Law No. 181/2018 (Art. 37) requires a remote-contract supplier to disclose its name, address, phone, email, commercial registration number, and tax card before contracting with a consumer. This section cannot be finalized until that entity exists and its registration details are provided.]

---

## 1. Acceptance of These Terms

By creating an account, browsing listings, or making a booking on StayOS (the "Platform"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Platform.

## 2. Eligibility

You must be at least 18 years old and legally capable of entering into a binding contract under the laws of Egypt to use the Platform as a Guest or Host. [FOUNDER DECISION REQUIRED — confirm minimum age and any additional eligibility rule, e.g. Egypt-resident-only for V1 Closed Alpha.]

## 3. Account Registration & Phone Verification

3.1 Creating an account requires a valid phone number. Verification is performed via a one-time passcode ("OTP") sent to that number. [LEGAL REVIEW REQUIRED — confirm whether Egyptian law imposes any specific requirement on SMS-based identity verification for a consumer marketplace; none identified in this drafting pass.]

3.2 You are responsible for maintaining the confidentiality of your account and for all activity under it. You must notify StayOS promptly of any unauthorized use.

3.3 You must provide accurate registration information and keep it up to date.

## 4. Guest Responsibilities

4.1 Provide accurate information when creating a booking request (dates, number of guests).

4.2 Pay for confirmed bookings using the payment method presented at booking time (see § 8, Payment Process).

4.3 Comply with the individual property's house rules as communicated by the Host, and with applicable law during your stay.

4.4 Do not use the Platform for any purpose other than booking genuine accommodation.

## 5. Host Responsibilities

5.1 Only list a property you own or are authorized to list. A separate **Host Agreement / Owner Authorization** governs the specific representations you make about your authority to list (see `STAYOS_HOST_AGREEMENT_V1_DRAFT.md`).

5.2 Ensure listing information — description, amenities, pricing, availability, photos — is accurate and current.

5.3 Honor confirmed bookings. Respond to booking requests in a timely manner.

5.4 Comply with all laws applicable to operating short-term accommodation in your jurisdiction. **StayOS does not verify regulatory or tourism-licensing compliance of any listed property** — this is the Host's sole responsibility. [LEGAL REVIEW REQUIRED — Egypt's short-term-rental regulatory position is unresolved per the repository's own Phase-1 legal risk register (`docs/phase--1/risks/09_LEGAL_RISKS.md`, LEG-016 to LEG-030); that document explicitly states it is not legal advice and recommends retaining Egyptian tourism-law counsel. This Terms draft cannot and does not resolve that question.]

## 6. Listing Accuracy

Hosts are solely responsible for the accuracy of listing content. StayOS's administrative review (§ 15) checks listings for completeness and policy compliance before publication but is **not** a warranty of accuracy, legality, or fitness for purpose. [FACT, code-verified: admin review is a manual approve/reject workflow (`listings/router.py` `admin/pending`, `admin/{unit_id}/approve`) — it does not perform automated fact-checking of listing content.]

## 7. Booking Requests & Confirmation

7.1 A booking request does not guarantee accommodation. [FACT, code-verified: `bookings/services.py` — a booking is created in `requested` status and must be moved to `accepted` by the Host or an admin, then to `confirmed`, before it is a confirmed booking.]

7.2 The Host (or an admin) may accept or reject a booking request.

7.3 A booking becomes **confirmed** only after both (a) Host acceptance and (b) payment verification by StayOS (§ 8.4). [FACT, code-verified: `bookings/services.py` moves status to `confirmed` only on payment verification following acceptance.]

## 8. Payment Process

8.1 **Payment method.** At present, guest payment is processed manually: you receive payment instructions (bank transfer or Vodafone Cash), you make the transfer, you submit the transaction reference and upload proof of payment, and StayOS's administrative team reviews and verifies that proof. [FACT, code-verified: `src/app/payments/` — `PaymentMethod.MANUAL` is the only payment method defined; no Paymob or Stripe guest-payment integration is active.]

8.2 **StayOS does not currently process card payments and does not act as a payment institution.** [FOUNDER DECISION REQUIRED / LEGAL REVIEW REQUIRED — confirm this characterization is consistent with how StayOS wishes to be regulatorily positioned, and whether manually collecting and relaying bank-transfer references triggers any Egyptian payment-services or e-commerce disclosure obligation. Not resolved in this drafting pass.]

8.3 **StayOS is updated per the Payment & Commission Policy sprint (2026-08-24): the Guest transfers the payment to an account StayOS controls, not directly to the Host's own account.** [FACT, code-verified: `_build_instructions()` in `src/app/payments/services.py` shows the Guest one fixed bank account, not a per-host account, and no field for a Host's own bank details exists anywhere except on `finance.PayoutRequest` — which is where the Host later receives money *from* StayOS. This is the design the product was already built around; only a real account number and a commission-deduction step are missing, both addressed in `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`.] **This is not an escrow arrangement in the regulated-custodial sense** — StayOS holds the funds only briefly, manually, before forwarding the Host's share; whether this triggers Egyptian Central Bank payment-facilitator licensing is an open, unresolved question. [LAWYER REVIEW REQUIRED — see `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 5 for the specific Central Bank of Egypt Law 194/2020 / June 2025 PSP-licensing question this raises, and the lower-risk alternative structure considered alongside it.]

8.4 Payment proof is reviewed by a StayOS administrator. Approval moves the booking to `confirmed` and triggers commission calculation and Host payout per § 8.5; rejection returns the payment to `pending` for you to resubmit proof, or the booking may be cancelled per § 10.

8.5 **The Guest pays a StayOS-controlled account. StayOS deducts its commission and forwards the net amount to the Host within 3 business days of verification.** **DECIDED (Legal & Commercial Decision Gate, 2026-08-24):** the standard V1 commission is **10% (Host-side) + 2% (platform, Host-side) + 4% (Guest-side service fee)** — this is now StayOS's official V1 rate. **During the closed alpha, two limited promotional incentives apply:** the first 3 completed bookings per Host are charged 0% Host commission (the 2% platform take still applies), and the first 10 completed guest bookings globally are charged 0% guest service fee. See `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 2 for the rationale.

8.6 A 4% service fee is added to the Guest's payment; this fee is non-refundable if the Guest initiates a cancellation, and refundable in full if StayOS, the Host, or property unavailability causes the cancellation (see `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` § 11).

8.7 **Off-platform payment is not supported for a booking made through StayOS.** StayOS's payment verification and cancellation protections apply only to payments made through the Platform's instructed account — this describes how the product works, not a penalty clause.

## 9. Cancellation & Refunds

Governed by the separate **Cancellation & Refund Policy** (`STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`), incorporated into these Terms by reference. [FACT, code-verified: `unit_listings.cancellation_policy` is presently a free-text label (default `"FLEXIBLE"`) with no refund-percentage or deadline logic attached anywhere in the codebase — the operative rules must be defined by the founder before real transactions, not assumed from the label.]

## 10. No-Show

**DECIDED:** a Guest no-show (not arriving without cancelling) is declared by the Host and confirmed by StayOS admin; no refund applies. A Host no-show (property inaccessible on arrival) is treated as a Host failure — see `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` §§ 6–7 — and the Guest is refunded in full.

## 11. Prohibited Conduct

You may not: use the Platform for any unlawful purpose; submit false identity, listing, or payment information; attempt to circumvent booking or payment through the Platform; harass or discriminate against other users; upload content you do not have rights to; attempt to access another user's account or StayOS's systems without authorization; or use automated means (bots, scrapers) against the Platform.

## 12. Fraud

Submitting falsified payment proof, falsified identity documents, or a listing for a property you are not authorized to list is fraud and may result in immediate account suspension, booking cancellation, and referral to law enforcement. [FOUNDER DECISION REQUIRED — confirm StayOS's actual escalation/reporting process, if any exists beyond admin rejection.]

## 13. Identity Verification (KYC)

13.1 Hosts must complete identity verification ("KYC") before publishing a non-draft listing. [FACT, code-verified: `listings/services.py` — publishing requires `user.kyc_status == VERIFIED`.]

13.2 KYC verifies the **identity** of the person submitting documents (via document analysis and a selfie-to-ID face match) — **it does not verify that the person owns or has legal authority over the specific property listed.** Ownership/authorization is a separate representation made in the Host Agreement (§ 5.1 above; see `STAYOS_HOST_AGREEMENT_V1_DRAFT.md`). [FACT, code-verified: `src/app/kyc/services.py` calls AWS Textract (`analyze_id`) and Rekognition (`compare_faces`) against submitted ID/selfie images — there is no separate property-ownership-verification step or data field anywhere in the codebase.]

## 14. Account Suspension & Listing Removal

StayOS may suspend an account or remove a listing for violation of these Terms, fraud, failed KYC, or at StayOS's reasonable discretion to protect the integrity of the Platform. [FOUNDER DECISION REQUIRED — define the actual suspension process/appeal path; not currently specified anywhere in the repository.]

## 15. Platform Role

**StayOS operates a marketplace connecting independent Hosts offering accommodation with Guests seeking accommodation. StayOS is not the accommodation provider, is not a party to the accommodation contract between Guest and Host, and does not own, operate, or manage any listed property.** [FOUNDER DECISION REQUIRED / LEGAL REVIEW REQUIRED — this is the single most consequential legal-positioning sentence in this entire document. It determines whether StayOS is treated in law as a mere intermediary/marketplace or as a supplier of accommodation services (with materially different consumer-protection, tax, and licensing consequences). It is stated here as the apparent intent based on the business-model description provided for this task, but **must be affirmatively confirmed by the founder and reviewed by Egyptian counsel** before publication — do not treat this sentence as settled.]

## 16. Host/Guest Relationship

The accommodation contract is between Guest and Host. StayOS is not responsible for a Host's or Guest's performance of that contract, except to the extent StayOS's own conduct (e.g., payment verification, listing publication) is at issue.

## 17. Limitation of Liability

[LEGAL REVIEW REQUIRED — a limitation-of-liability clause must not attempt to exclude liability that Egyptian Consumer Protection Law makes non-waivable (e.g., liability for defective/unsafe products or services, or misleading disclosures under Law 181/2018). Do not insert boilerplate "maximum extent permitted by law" language without counsel confirming what that extent actually is in Egypt. **Placeholder only** — full clause requires counsel drafting.]

## 18. Disclaimers

StayOS provides the Platform "as is." StayOS does not guarantee the accuracy of listings, the conduct of Hosts or Guests, or uninterrupted platform availability. [LEGAL REVIEW REQUIRED — same caveat as § 17: disclaimers cannot override mandatory consumer disclosures required under Law 181/2018 Arts. 36–37.]

## 19. Dispute Handling & Complaints

19.1 Disputes between Guest and Host about the accommodation itself should first be raised directly between the parties.

19.2 Disputes about payment verification, listing accuracy as reviewed by StayOS, or Platform conduct may be raised with StayOS at [FOUNDER DECISION REQUIRED — support contact channel].

19.3 [LEGAL REVIEW REQUIRED — Egyptian Consumer Protection Law provides a statutory consumer-complaint mechanism through the Consumer Protection Agency; confirm whether/how StayOS must reference or cooperate with it.]

## 20. Intellectual Property

The StayOS name, platform design, and software are the property of StayOS [FOUNDER DECISION REQUIRED — legal entity name] or its licensors. Listing content (photos, descriptions) remains the property of the Host, who grants StayOS a license to display it on the Platform for the purpose of operating the marketplace.

## 21. Communications

By using the Platform you consent to receive booking-, payment-, and account-related communications (SMS/OTP, notifications) necessary to operate the service. [FACT, code-verified: `src/app/notifications/templates.py` contains booking/cancellation/payment message templates in Arabic and English.]

## 22. Changes to These Terms

StayOS may update these Terms. [FOUNDER DECISION REQUIRED — define the notice mechanism and effective-date practice for changes.]

## 23. Governing Law

[LEGAL REVIEW REQUIRED — governing law and dispute forum (Egyptian courts vs. arbitration) must be set by counsel, not assumed.]

## 24. Contact Information

[FOUNDER DECISION REQUIRED — legal entity name, registered address, support email/phone.]

---

## § النسخة العربية — شروط الخدمة (مسودة النسخة الأولى)

**الحالة:** مسودة — هذا المستند **ليس استشارة قانونية** وغير معتمد للنشر. تمت صياغته بواسطة مساعد ذكاء اصطناعي للمراجعة من المؤسس والمستشار القانوني. يجب حسم كل إشارة "[قرار مطلوب من المؤسس]" أو "[مطلوب مراجعة قانونية]" قبل النشر.

### 0. الكيان القانوني
[قرار مطلوب من المؤسس — لا يوجد في المستودع كيان قانوني مُسجَّل لتشغيل StayOS (اسم الشركة، رقم السجل التجاري، العنوان). يُلزم قانون حماية المستهلك المصري رقم 181 لسنة 2018 (المادة 37) مقدّم الخدمة عن بُعد بالإفصاح عن اسمه وعنوانه ورقم هاتفه وبريده الإلكتروني ورقم سجله التجاري وبطاقته الضريبية قبل التعاقد مع المستهلك. لا يمكن إتمام هذا البند قبل تأسيس الكيان وتوفير بيانات تسجيله.]

### 1. قبول الشروط
باستخدامك منصة StayOS ("المنصة") لإنشاء حساب أو تصفح الإعلانات أو إتمام حجز، فإنك توافق على شروط الخدمة هذه. إن لم توافق، يرجى عدم استخدام المنصة.

### 2. الأهلية
يجب أن يكون عمرك 18 عامًا على الأقل وأن تكون أهلاً للتعاقد قانونًا بموجب القوانين المصرية. [قرار مطلوب من المؤسس — تأكيد الحد الأدنى للسن وأي شرط إضافي، مثل اقتصار المرحلة التجريبية المغلقة على المقيمين في مصر.]

### 3. تسجيل الحساب والتحقق عبر الهاتف
3.1 يتطلب إنشاء الحساب رقم هاتف صالح، ويتم التحقق منه عبر رمز تحقق لمرة واحدة (OTP). [مطلوب مراجعة قانونية — تأكيد عدم وجود متطلبات قانونية مصرية خاصة بالتحقق عبر الرسائل النصية لم يتم تحديدها في هذه الجولة من البحث.]
3.2 أنت مسؤول عن سرية حسابك وعن أي نشاط يتم من خلاله، ويجب إبلاغ StayOS فورًا عند أي استخدام غير مصرح به.
3.3 يجب تقديم بيانات تسجيل دقيقة وتحديثها باستمرار.

### 4. مسؤوليات الضيف
4.1 تقديم بيانات دقيقة عند إنشاء طلب حجز (التواريخ، عدد الضيوف).
4.2 سداد قيمة الحجوزات المؤكدة عبر وسيلة الدفع المعروضة وقت الحجز (انظر البند 8).
4.3 الالتزام بقواعد العقار كما يوضحها المضيف، وبالقوانين المعمول بها أثناء الإقامة.
4.4 عدم استخدام المنصة لأي غرض غير حجز إقامة حقيقية.

### 5. مسؤوليات المضيف
5.1 يجوز فقط إدراج عقار تملكه أو لديك تفويض بإدراجه — يحكم هذا التفويض اتفاقية منفصلة (انظر `STAYOS_HOST_AGREEMENT_V1_DRAFT.md`).
5.2 التأكد من دقة وحداثة بيانات الإعلان (الوصف، المرافق، الأسعار، التوفر، الصور).
5.3 الالتزام بالحجوزات المؤكدة والرد على طلبات الحجز في وقت مناسب.
5.4 الالتزام بجميع القوانين المعمول بها على تشغيل الإيجار قصير المدى في نطاقك القانوني. **لا تتحقق StayOS من الامتثال التنظيمي أو التراخيص السياحية لأي عقار مُدرَج** — هذه مسؤولية المضيف وحده. [مطلوب مراجعة قانونية — الوضع التنظيمي للإيجار قصير المدى في مصر لم يُحسم، وفق سجل مخاطر المرحلة (-1) الخاص بالمستودع نفسه، والذي ينص صراحة على أنه ليس استشارة قانونية.]

### 6. دقة الإعلان
يتحمل المضيف المسؤولية الكاملة عن دقة محتوى الإعلان. مراجعة StayOS الإدارية (البند 15) تتحقق من اكتمال البيانات والامتثال للسياسات قبل النشر، لكنها **ليست ضمانًا** للدقة أو المشروعية أو الملاءمة للغرض.

### 7. طلبات الحجز والتأكيد
7.1 طلب الحجز لا يضمن الإقامة.
7.2 يجوز للمضيف (أو المشرف) قبول أو رفض طلب الحجز.
7.3 يصبح الحجز "مؤكدًا" فقط بعد قبول المضيف والتحقق من الدفع من قِبل StayOS.

### 8. عملية الدفع
8.1 **طريقة الدفع الحالية:** يُعالَج دفع الضيف يدويًا حاليًا: تصلك تعليمات الدفع (تحويل بنكي أو فودافون كاش)، تقوم بالتحويل، ترسل رقم مرجع العملية وترفع إثبات الدفع، ويقوم فريق StayOS الإداري بمراجعة الإثبات والتحقق منه.
8.2 **لا تقوم StayOS حاليًا بمعالجة مدفوعات البطاقات ولا تعمل كمؤسسة دفع.** [قرار مطلوب من المؤسس / مطلوب مراجعة قانونية.]
8.3 **يُحدَّث هذا البند وفق قرار نموذج الدفع (24 أغسطس 2026): يحوّل الضيف المبلغ إلى حساب تديره StayOS، وليس مباشرة لحساب المضيف.** هذا ليس "ضمانًا" (escrow) بالمعنى التنظيمي المرخَّص — تحتفظ StayOS بالمبلغ لفترة قصيرة يدويًا قبل تحويل نصيب المضيف. [مطلوب مراجعة قانونية — هل يستوجب هذا ترخيص "مُيسِّر مدفوعات" بموجب قانون البنك المركزي رقم 194 لسنة 2020 وقواعد يونيو 2025؟ التفاصيل في `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`.]
8.4 تتم مراجعة إثبات الدفع من قِبل مشرف StayOS؛ الموافقة تُحوّل الحجز إلى "مؤكد" وتُفعّل حساب العمولة وسداد المضيف وفق البند 8.5، والرفض يعيده إلى "قيد الانتظار."
8.5 **يدفع الضيف إلى حساب تديره StayOS، وتخصم StayOS عمولتها وتُحوّل الصافي للمضيف خلال 3 أيام عمل من التحقق.** **قرار نهائي:** النسبة القياسية للإصدار الأول هي **10% (من نصيب المضيف) + 2% (منصة) + 4% (رسوم خدمة على الضيف)**. **خلال النسخة التجريبية المغلقة، تطبق حافزتان محدودتان:** أول 3 حجوزات مكتملة لكل مضيف تُحتسب بعمولة 0% من نصيب المضيف (مع الاستمرار في خصم 2% رسوم المنصة)، وأول 10 حجوزات ضيف عالميًا تُحتسب برسوم خدمة 0%.
8.6 تُضاف رسوم خدمة 4% لدفعة الضيف؛ غير قابلة للاسترداد عند إلغاء الضيف نفسه، وقابلة للاسترداد الكامل عند إلغاء StayOS أو المضيف أو عدم توفر العقار.
8.7 **الدفع خارج المنصة غير مدعوم** لأي حجز تم عبر StayOS؛ حماية التحقق من الدفع والإلغاء تسري فقط على الدفعات عبر الحساب المعتمد من المنصة.

### 9. الإلغاء والاسترداد
يحكمه سياسة الإلغاء والاسترداد المنفصلة (`STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`) وتُعد جزءًا من هذه الشروط.

### 10. عدم الحضور
**قرار نهائي:** عدم حضور الضيف دون إلغاء يُعلنه المضيف ويؤكده مشرف StayOS، ولا يوجد استرداد. عدم حضور المضيف أو تعذّر الوصول للعقار يُعامَل كفشل من المضيف مع استرداد كامل للضيف.

### 11. السلوك المحظور
يُحظر استخدام المنصة لأي غرض غير قانوني، أو تقديم بيانات هوية أو إعلان أو دفع مزيفة، أو محاولة الالتفاف على الحجز أو الدفع عبر المنصة، أو مضايقة أو التمييز ضد مستخدمين آخرين، أو رفع محتوى لا تملك حقوقه، أو محاولة الوصول لحساب مستخدم آخر أو أنظمة StayOS دون تصريح، أو استخدام وسائل آلية (بوتات، برامج جمع بيانات) ضد المنصة.

### 12. الاحتيال
تقديم إثبات دفع مزيف، أو مستندات هوية مزيفة، أو إعلان عن عقار لا تملك تفويضًا لإدراجه، يُعد احتيالًا وقد يؤدي لتعليق الحساب فورًا وإلغاء الحجز والإبلاغ للجهات المختصة. [قرار مطلوب من المؤسس.]

### 13. التحقق من الهوية (KYC)
13.1 يجب على المضيف إتمام التحقق من الهوية قبل نشر أي إعلان غير مسودة.
13.2 يتحقق KYC من **هوية** الشخص الذي يقدّم المستندات (عبر تحليل المستند ومطابقة الصورة الشخصية بالهوية) — **ولا يتحقق من ملكية أو تفويض ذلك الشخص بالعقار المحدد المُدرَج.** الملكية/التفويض إقرار منفصل ضمن اتفاقية المضيف.

### 14. تعليق الحساب وإزالة الإعلان
يجوز لـ StayOS تعليق حساب أو إزالة إعلان عند مخالفة هذه الشروط، أو الاحتيال، أو فشل KYC، أو وفق تقدير StayOS المعقول لحماية سلامة المنصة. [قرار مطلوب من المؤسس — تحديد إجراء التعليق/الاستئناف الفعلي.]

### 15. دور المنصة
**تُشغّل StayOS منصة تربط مضيفين مستقلين يعرضون إقامة بضيوف يبحثون عنها. StayOS ليست مقدّم الإقامة، وليست طرفًا في عقد الإقامة بين الضيف والمضيف، ولا تملك أو تدير أي عقار مُدرَج.** [قرار مطلوب من المؤسس / مطلوب مراجعة قانونية — هذه أهم جملة في الوضع القانوني لكامل المستند ويجب تأكيدها من المؤسس ومراجعتها من مستشار قانوني مصري قبل النشر.]

### 16–24
[نفس البنود الإنجليزية أعلاه من "علاقة المضيف بالضيف" حتى "معلومات التواصل" — تُترجم بنفس المضمون والتحفظات القانونية عند الاعتماد النهائي؛ تم اختصارها هنا لتفادي التكرار في مسودة المراجعة الأولى. **[مطلوب مراجعة قانونية]** لكل بند قبل النشر.]
