# 17 — Financial Ledger

## Model
Double-entry style ledger in `finance.ledger_entries` + account views
(`finance/financial_accounts.py`):

```
guest_payable · escrow_holdings · platform_revenue · platform_receivable
tax_payable · cash · host_funds_payable
```

Every posting records booking/unit refs, source module, description, and
a dedupe/idempotency key. Balances = SUM(entries); no mutable balance
columns on money-moving aggregates.

## Posting events
| Event | Entries |
|---|---|
| Payment confirmed | escrow holdings DR / guest payable CR; platform revenue + VAT receivable posted |
| Funds release (check-in + 24h) | escrow → host_funds_payable (host gross − host share) |
| Cancellation/refund | reversal of recognition + refund credit (cash / guest_refund_payable) |
| Payout executed | host_funds_payable → cash |

## Idempotency
`finance/financial_idempotency.py` — natural keys (booking + event type +
provider ref) make every posting replay-safe; verified by the
12%-economics E2E test (`test_full_booking_lifecycle_12pct_economics`).

## Reporting
`reports` module + `/admin/reports` — financial report, settlement report,
management report (earnings vs revenue split, VAT line, outstanding
holds/payables). Financial reconciliation was closed in the prior batch;
do not rework the recognition rules.
