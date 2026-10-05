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

/**
 * Localize a currency code for display. EGP renders via the localized
 * "egp" i18n label ("EGP" / "جنيه"); other codes pass through unchanged.
 */
export function currencyLabel(
  currency: string | null | undefined,
  egpLabel: string
): string {
  if (!currency || currency.toUpperCase() === "EGP") return egpLabel;
  return currency;
}
