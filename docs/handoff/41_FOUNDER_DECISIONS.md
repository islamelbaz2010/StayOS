# 41 — Founder Decisions (locked — do not reopen)

| # | Decision | Enforced where |
|---|---|---|
| FD-1 | **Commercial Model B** — host 6% + guest 6% = 12% of accommodation; cleaning per-stay; all-inclusive guest UX | `finance` posting, quote endpoints, E2E economics test |
| FD-2 | Guests never see internal fees/commission | guest payload shaping (test-locked) |
| FD-3 | Host cannot cancel/check-in — guest+admin only | booking services + removed host actions |
| FD-4 | Web canonical acceptance URL is `web-amber-pi-98.vercel.app` | release checklist |
| FD-5 | Language selector shows literal `English`/`العربية` | account-settings language page |
| FD-6 | Account menu = hierarchical grouped IA | Header `AccountMenuLevels` |
| FD-7 | Mobile follows Web closure — Phase 4 begins after this handoff | — |
| FD-8 | `host` role coexists with guest capabilities (host can book) | capability model |
| FD-9 | Support via in-app threads + staff queue (not email-only) | `053_support_conversations` |
| FD-10 | VAT 14% engineering assumption pending accountant confirm | `TAX_VAT_RATE`, legal pack flag |

Each maps to code/tests; changing any requires a new explicit founder
decision, not an engineering judgment call.
