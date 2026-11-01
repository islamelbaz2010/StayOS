# MAKAZOH Pre-Launch Kit

Lead ops, email templates, content concepts, and market-validation framework
for the pre-launch phase. **Nothing here is published or sent without founder
approval.** No launch date is stated anywhere until the founder confirms one.

---

## 1. Lead lifecycle & ops

Statuses: `NEW → CONTACTED → QUALIFIED → INVITED → ONBOARDED` or `NOT_A_FIT`.

- Leads arrive via `/api/v1/public/leads/{host,guest}` and land in
  `marketing.host_leads` / `marketing.guest_leads` (QA-verified).
- Admin views: `GET /api/v1/admin/leads` (filter `kind`, `status`, `city`, `q`),
  `PATCH .../status`, `POST .../notes`, `GET .../export.csv`,
  `GET .../summary`. Admin-role only — no new staff permissions granted.
- Duplicate contact → same lead returned (`created:false`), never a second row.
- Honeypot `website` field silently accepts bots without storing.

## 2. Email templates (configured, not yet live)

Requires a sender (Resend/SMTP). Until credentials exist these are templates
only — **delivery NOT tested**. Sender: `hello@makazoh.com` (verify mailbox exists).

### 2a. Host acknowledgement — EN
Subject: `You're on the MAKAZOH Founding Host list`
> Hi {name}, thanks for registering your property ({city}, {property_type}).
> We're preparing MAKAZOH for launch and will contact you about onboarding
> before bookings open. — The MAKAZOH team

### 2b. Host acknowledgement — AR
Subject: `تم تسجيلك في قائمة المضيفين المؤسسين لمكازه`
> مرحباً {name}، شكراً لتسجيل عقارك ({city}، {property_type}). نستعد لإطلاق
> مكازه وسنتواصل معك بخصوص الانضمام قبل فتح الحجوزات. — فريق مكازه

### 2c. Guest waitlist — EN
Subject: `You're on the MAKAZOH waitlist`
> Hi {name}, you're on the list. We'll let you know the moment stays open
> for booking — first in Egypt, then the region.

### 2d. Guest waitlist — AR
Subject: `أنت في قائمة انتظار مكازه`
> مرحباً {name}، أنت الآن في القائمة. سنعلمك فور فتح الإقامات للحجز —
> مصر أولاً ثم المنطقة.

### 2e. Internal notification (new host lead)
Subject: `[MAKAZOH] New host lead — {city}, {units_count} units`
> Name {name} · Phone {phone} · Property {property_type} · UTM {utm_source}.
> Review in admin: /api/v1/admin/leads?kind=HOST&status=NEW

## 3. Content launch kit (~18 concepts)

Direction: 9:16 vertical, 15–30 s for short-form; hook in first 1.5 s; single
CTA ("Register as a Founding Host" / "Join the waitlist"); captions required
(sound-off viewing); bilingual captions where noted. Use only licensed
photography or genuine app screen recordings — no fabricated screens, prices,
ratings, or availability.

### Brand awareness

**BV1 — "The scroll-stopping stay" (Reel/TikTok, 20 s)**
- Objective: brand recall. Audience: 25–45 Egyptian travellers.
- Hook: "Imagine booking your whole weekend in 30 seconds."
- Shots: coastal establishing → quick cuts of property details → brand mark.
- CTA: "MAKAZOH — coming soon. Join the waitlist." AR: "مكازه — قريباً. انضم للقائمة."

**BV2 — "Cairo to the coast" (Reel, 15 s)**
- Objective: destination aspiration. Hook: "One app. Every escape."
- Shots: city → desert road → sea. Overlay destination names EN/AR.
- CTA: waitlist.

**BV3 — "What is MAKAZOH?" (Reel, 25 s)**
- Objective: explain the product honestly. Hook: "A new way to stay in Egypt."
- Shots: app UI only where verified + text overlays of the three-step flow
  (Discover → Book → Stay), labelled "launching soon".
- CTA: waitlist.

**BV4 — "The founders' promise" (Reel, 20 s)**
- Objective: trust. Hook: "We're building this for how you actually travel."
- Shots: team/workspace B-roll, no feature claims; end-card mark + waitlist.

**VP1 — Mark reveal (static/Story, 1080×1080 + 1080×1920)**
- Lime `M` mark on dark field, one line: "Stays, reimagined. / الإقامات، بشكلٍ جديد."
- Caption: pre-launch announcement + waitlist link.

**VP2 — Destination grid (static, 1080×1350)**
- 4 editorial city/coast tiles labelled *illustrative*. Caption: destinations
  we'll serve — Cairo, Alex, North Coast, Red Sea.

**VP3 — "Soon" teaser (static/Story)**
- Dark background, countdown-free "Launching soon" — **no date**. CTA waitlist.

**BC1 — Carousel "5 stays we can't wait to list" (5 slides)**
- Objective: saves + shares. Slides: apt / villa / chalet / serviced / resort,
  each with a benefit line and the *illustrative* disclaimer on the last slide.

**BC2 — Carousel "MAKAZOH in 4 screens" (4 slides)**
- Only genuine UI screenshots (verify each before use). Last slide: CTA.

### Host acquisition

**HV1 — "Your property. More possibilities." (Reel, 25 s)**
- Objective: host signups. Audience: owners + small PMCs.
- Hook: "Your empty weeks could be earning."
- Shots: empty apartment → calendar filling (animated, labelled conceptual)
  → form. CTA: "Become a Founding Host."
- AR hook: "عقارك. إمكانيات أكثر."

**HV2 — "One dashboard" (Reel, 20 s)**
- Objective: tool value. Hook: "Bookings, calendar, guests — one place."
- Shots: real dashboard screens only. CTA: founding host form.

**HV3 — "PMC vs solo owner" (Reel, 25 s)**
- Objective: segment both audiences. Hook: "5 units or 50 — same tools."
- Split-screen narrative; CTA founding hosts.

**HV4 — "Priority review" (Reel, 15 s)**
- Objective: urgency without false scarcity. Hook: "Founding hosts get
  priority onboarding." CTA founding host form.

**HP1 — Founder-host card (static)** — headline + 3 perks, form link/QR.
**HP2 — "List it once, reach everyone" (static)** — bilingual reach benefit.
**HP3 — Before/after calendar (static)** — conceptual fill, labelled.

**HC1 — Carousel "Why hosts join early" (4 slides)** — priority review,
  onboarding session, feedback channel, early visibility + honest terms note.
**HC2 — Carousel "Owner checklist" (5 slides)** — photos, pricing, calendar,
  house rules, payout readiness (informational, no commitments).

## 4. Market validation framework

### Host qualification (call script, ~7 min)
1. Property type, city, unit count, current listing channels?
2. Readiness: furnished/photo-ready? Renovation timeline?
3. Decision authority: owner / manager / agent?
4. Current occupancy and biggest pain (no-shows, pricing, channel fees)?
5. WhatsApp/email preference + best contact time?
6. Would you onboard in the first month after launch?

### Lead scoring (0–100)
- Units: 1–2=10, 3–10=20, 11+=30
- Location (target city): Cairo/Alex/NC/Sokhna/Hurghada=20, other=10
- Readiness: ready_now=25, needs_furnishing=15, under_renovation=8, exploring=3
- Authority: owner/PMC decision-maker=15, agent=8
- Reachable + responsive on first contact: +10
- ≥70 → priority call; 40–69 → nurture; <40 → quarterly follow-up.

### Weekly report template
- Host leads new / cumulative; by status; by city; top property types
- Guest waitlist new / cumulative; top preferred destinations
- Funnel: page_views → host_form_start → submit → success (conversion %)
- UTM: top source/medium/campaign
- Interviews held; score distribution; objections heard
- Actions next week; blockers needing founder decision

*Report only measured data — no projected market sizes.*

## 5. Founder approval gates (unchanged)

DNS cutover · public deploy · social accounts + posting · ads spend ·
bulk email · financial incentives/commission terms · public launch date.
Social handles don't exist yet — creating them is a founder action.

## 6. Env/config to enable on the VPS at cutover

- `CORS_ORIGINS` must include `https://makazoh.com,https://www.makazoh.com`
  (public site → api.makazoh.com posts).
- Sender domain for `hello@makazoh.com` (Resend or SMTP) + SPAM-safe DNS
  (SPF/DKIM) — founder sets these with the email provider.
- `DOMAIN_ROOT=makazoh.com` already the compose default; Caddy auto-TLS.
