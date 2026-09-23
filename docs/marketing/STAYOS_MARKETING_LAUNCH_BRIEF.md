# StayOS — Marketing Launch Brief

Status: canonical handoff document for the Marketing team.
Scope: Egypt Alpha launch. Statements describing the shipped product are
facts verified against the current implementation; strategy items are
labeled **RECOMMENDED** or **WORKING DIRECTION**.

---

## 1. Product snapshot

- StayOS is a short-stay accommodation marketplace for Egypt (MENA-first).
- Guests search, book and pay for verified stays; hosts list and manage
  properties.
- Guest-facing pricing is all-inclusive — one total, no fee breakdown.
- Currency: EGP. Locales: Arabic (primary) and English.
- Payments: Paymob hosted checkout (TEST verified).
- Cancellation/refund, 24h post-check-in payout protection, host wallet
  and earnings surfaces are implemented and verified in TEST.

## 2. Brand foundation

- **Category:** accommodation marketplace / hospitality tech.
- **Promise:** a trustworthy, local-first way to book and host stays in
  Egypt. (**WORKING DIRECTION** — final promise statement is a Marketing
  deliverable.)
- **Proof points (factual, verified):** all-inclusive guest pricing,
  bilingual Arabic/English product, local payment rails (Paymob), host
  payout protection window, verified-host onboarding flow (KYC).

## 3. Brand personality

**RECOMMENDED:** warm, confident, uncluttered, editorial. Local fluency
without folklore clichés. Premium but approachable.

## 4. Positioning direction

**WORKING DIRECTION:** position against global OTAs on local fit —
Arabic-first UX, EGP pricing, Egyptian payment rails, local support —
rather than on price or inventory size.

## 5. Messaging architecture

- **North-star message (RECOMMENDED):** "Your Egypt, your stay" — local
  stays with local clarity.
- **Support pillars:** transparent all-in pricing · bilingual product ·
  trusted payments · host earnings clarity.

## 6. Target audiences

- Guests: Egyptian domestic travelers, regional (GCC/MENA) visitors,
  families and group travelers. (RECOMMENDED segmentation)
- Hosts: property owners and small operators in Egyptian destinations
  (Cairo, North Coast, Red Sea, Sinai, Upper Egypt).

## 7. Guest messaging

- All-inclusive price shown upfront; "includes all fees" framing.
- Verified hosts and stays; secure checkout via Paymob.
- Arabic-first experience.

## 8. Host messaging

- Earn from your property; earnings shown transparently in-product.
- Payout protection: funds release 24h after confirmed check-in
  (product fact).
- Listing, calendar, pricing and promotions tooling in-product.

## 9. Content pillars

**RECOMMENDED:** destination inspiration · hosting know-how · product
explainers (pricing clarity, payout protection) · guest stories ·
seasonal/occasion campaigns (Ramadan, summer North Coast, etc.).

## 10. Launch phases

- **Phase 0 — Alpha (current):** Egypt, EGP, Paymob TEST, seeded supply.
- **Phase 1 — Public beta (RECOMMENDED):** gated invite marketing,
  content engine live via CMS, waitlist/early-host recruitment.
- **Phase 2 — Launch:** full marketing activation once production payment
  credentials and legal sign-offs land.

## 11. Campaign structure

**RECOMMENDED:** always-on destination content + burst campaigns around
seasons/holidays + host-acquisition track. Campaign pages are built as
CMS pages (`/p/<slug>`) — no engineering required.

## 12. Social content direction

**RECOMMENDED:** bilingual short-form video of properties/destinations,
host testimonials, "how pricing works" explainers. Visual identity per
`STAYOS_BRAND_CI_BRIEF.md`.

## 13. Website content requirements

- Editable marketing pages: home sections, about, how-it-works, host
  landing, guest landing, help/FAQ, contact — all via CMS-Lite.
- Structured blocks: hero, heading+text, image+text, feature cards, CTA,
  FAQ, testimonial, banner/announcement, gallery, rich text.
- Both locales for every published block.

## 14. SEO content requirements

- Per-page localized title + meta description via CMS SEO fields.
- Canonical + robots controls available (marketing-safe fields only).
- Product/listing pages remain system-generated; CMS covers editorial.

## 15. Email/CRM content requirements

**WORKING DIRECTION:** transactional emails are product-owned templates;
marketing email (newsletter, win-back) can source copy from CMS page
content and reuse block structures.

## 16. PR / influencer / partner direction

**RECOMMENDED:** Egyptian travel creators, hospitality-tech press,
host-community partners. Do not announce production payment capability
before provider approvals land.

## 17. KPI framework

**RECOMMENDED:** north star = completed stays. Supporting: signup→booking
conversion, listing supply growth, content-attributed traffic, CAC by
channel, host activation rate.

## 18. Launch asset checklist

- CMS pages: home hero, about, how-it-works, guest landing, host landing,
  FAQ, contact — drafted, previewed, published (both locales).
- SEO metadata on every published page.
- Brand kit: logo lockups, palette, type, social templates.
- Launch announcement copy (en + ar).

## 19. Public marketing guardrails

- Never quote internal fee percentages (12%/6%+6%) or host economics
  publicly — guest-facing price is all-inclusive only.
- No claims about "escrow" or fund custody beyond approved wording —
  legal characterization is pending counsel.
- No provider/performance claims that require external verification
  before they are true in production.

## 20. CMS usage guidelines

See `MARKETING_CMS_GUIDE.md`. Pages live at `/admin/content`; public URL
pattern is `/p/<slug>`.

## 21. What Marketing can change without Engineering

- Create/edit/delete draft pages and blocks (all block types).
- Publish / unpublish pages.
- SEO metadata (title, description, canonical, robots, OG fields).
- Media library entries and alt text.
- Restore any published revision.

## 22. What requires Product/Founder approval

- Anything touching pricing, fees, payments, refunds, payouts, KYC,
  booking rules — CMS cannot edit these by design.
- New public claims about legal/compliance status.
- Changes to canonical product copy that implies unshipped behavior.
