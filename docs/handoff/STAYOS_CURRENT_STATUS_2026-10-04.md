# StayOS Current Status Matrix — 2026-10-04

| AREA | STATUS | EVIDENCE | OWNER | BLOCKER | NEXT ACTION |
|---|---|---|---|---|---|
| Web | CLOSED | 222 tests; build clean; prod routes 200; founder acceptance URL live | — | — | none — do not reopen |
| Backend | GREEN | 1644 tests, 80.5% cov; `/health` db+redis ok | — | — | none |
| Database | GREEN | migrations through `053_support_conversations` applied to prod | — | — | per-change migrations |
| Payments (Accept) | LIVE | `PAYMOB_SECRET_KEY` set; hosted checkout verified | ops | — | monitor webhooks |
| Manual transfer rail | PARTIAL | flow implemented; `PAYMENT_BANK_*` placeholders unset | founder | real bank details | set env before enabling |
| Refunds | GREEN | reversal ledger + provider refunds implemented+tested | — | — | — |
| Payouts | MANUAL | Paymob Payout creds unprovisioned; ops manual flow | founder/Paymob | external provisioning | provision when issued |
| KYC | MANUAL MODE | `KYC_VERIFICATION_MODE` unset→manual; Sumsub creds unset | founder/legal | provider + privacy approval | keep manual until provisioned |
| Storage | GREEN | private buckets + presign; KYC isolated | — | — | — |
| Messaging | GREEN | conversations/participants/unread verified | — | — | — |
| Support | GREEN | `053` migration live; queue + RBAC E2E-verified | — | — | mobile parity (Phase 1) |
| Help Center | GREEN | role-aware bundled catalog; `/help` 200 | — | — | mobile port (Phase 1, P2) |
| Notifications | GREEN | outbox + push/email; prefs honored | — | — | — |
| Admin | GREEN | console + staff permissions; support queue | — | — | — |
| Financial reporting | GREEN | management report reconciled (Model B) | — | — | — |
| Security | GREEN w/ flag | RBAC server-side; HMAC; audit; prod `ENVIRONMENT=staging` dev-token surface noted | — | tighten pre-launch | set `production` pre-launch |
| Infrastructure | GREEN w/ flag | Railway+Vercel live; **stale AWS deploy workflows fail on push** | owner | workflow cleanup decision | remove/repoint `deploy-*.yml` |
| Mobile | READY (Phase 4) | 28 screens, 25/25 endpoints resolve; audit done | — | none | execute Phase 1 plan |
| Legal | OPEN ITEMS | readiness pack v4 updated; entity/e-invoice/PDPL review pending counsel | founder+counsel | legal review | counsel engagement |
| Accounting | OPEN ITEMS | VAT base, e-invoice — flagged accountant-confirm | founder+accountant | accountant review | confirm VAT basis |
| Marketing | UPDATED | V3 brief reflects shipped product only | — | — | — |
