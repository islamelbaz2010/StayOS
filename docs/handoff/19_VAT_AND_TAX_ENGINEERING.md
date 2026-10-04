# 19 — VAT & Tax Engineering

## Assumption (flagged)
VAT rate **14%** is the current product/engineering assumption —
`TAX_VAT_RATE` in `src/app/config.py`. Marked **accountant-to-confirm**
in the legal/accounting readiness pack; do not treat as resolved.

## Where VAT is computed
- Guest total includes VAT inside the all-inclusive price (guests see one
  total — VAT is not itemized as a fee split).
- At capture, the ledger posts a `tax_payable` line alongside
  `platform_revenue` — VAT is recognized on the platform share per the
  current model, kept consistent with the closed financial reconciliation.
- Refund reversals back out the VAT component proportionally.

## Files
- `src/app/config.py` — `TAX_VAT_RATE`
- `src/app/finance/services.py` — recognition + reversal posting
- `src/app/reports/` — VAT line in financial/management reports

## Open items (non-engineering)
- Exact VAT base (on platform revenue vs accommodation) — accountant confirm.
- Egyptian e-invoice/e-receipt integration — external blocker, documented
  in the legal pack; no code path exists yet.
