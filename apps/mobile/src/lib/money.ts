/**
 * Canonical customer-facing money display.
 *
 * Presentation only — database precision, VAT, ledger, payouts and
 * payment-provider amounts are untouched. Customer-facing EGP prices
 * render without decimal fractions ("700.00 EGP" → "700 EGP").
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = "EGP"
): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "";
  return `${Math.round(n).toLocaleString("en-US")} ${currency}`;
}
