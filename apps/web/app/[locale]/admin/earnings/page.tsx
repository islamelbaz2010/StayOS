"use client";

import { useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import {
  useAdminOverview,
  useBookingFinancialContext,
} from "@/lib/queries/admin";
import { formatMoney } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-end text-sm font-medium text-neutral-900">
        {value ?? "—"}
      </dd>
    </div>
  );
}

export default function AdminEarningsPage() {
  const t = useTranslations("adminEarnings");
  const to = useTranslations("adminOverview");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const egp = (v: number | null | undefined) =>
    v != null ? formatMoney(v, "EGP", intlLocale) : "—";
  const fmtDate = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleString(intlLocale) : "—";

  const overview = useAdminOverview();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("booking") ?? "");
  const [bookingId, setBookingId] = useState<string | undefined>(
    searchParams.get("booking") ?? undefined
  );
  const ctx = useBookingFinancialContext(bookingId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = input.trim();
    if (id) setBookingId(id);
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
          </div>

          {overview.data && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {egp(overview.data.payments_verified_amount_egp)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {to("collectedAmount")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {egp(overview.data.payouts_pending_amount_egp)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {to("payoutsAmount")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {egp(overview.data.payments_refunded_amount_egp)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {to("refundedAmount")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {overview.data.escrows_held}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {to("escrowsHeld")}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="card mb-6 flex gap-3 p-4">
            <div className="flex-1">
              <label
                htmlFor="booking-lookup"
                className="block text-xs font-medium text-neutral-500"
              >
                {t("lookupLabel")}
              </label>
              <input
                id="booking-lookup"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("lookupPlaceholder")}
                className="input mt-1 w-full text-sm"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="btn-primary self-end px-6 py-2.5 text-sm"
            >
              {t("lookup")}
            </button>
          </form>

          {bookingId && ctx.isPending && (
            <div className="card p-8 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}
          {bookingId && ctx.isError && (
            <div className="card p-8 text-center text-danger-600">
              {t("notFound")}
            </div>
          )}

          {ctx.data && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("booking")}
                </h2>
                <dl className="divide-y divide-neutral-100">
                  <Row label={t("status")} value={ctx.data.booking_status} />
                  <Row
                    label={t("dates")}
                    value={`${ctx.data.check_in} → ${ctx.data.check_out}`}
                  />
                  <Row
                    label={t("guest")}
                    value={
                      ctx.data.guest_name ??
                      ctx.data.guest_phone ??
                      ctx.data.guest_id
                    }
                  />
                  <Row
                    label={t("host")}
                    value={
                      ctx.data.host_name ??
                      ctx.data.host_phone ??
                      ctx.data.host_id
                    }
                  />
                  <Row
                    label={t("listing")}
                    value={
                      ctx.data.unit_title
                        ? `${ctx.data.unit_title} — ${ctx.data.unit_city ?? ""}, ${ctx.data.unit_governorate ?? ""}`
                        : ctx.data.unit_id
                    }
                  />
                </dl>
              </div>

              <div className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("payment")}
                </h2>
                {ctx.data.payment_id ? (
                  <dl className="divide-y divide-neutral-100">
                    <Row label={t("status")} value={ctx.data.payment_status} />
                    <Row label={t("method")} value={ctx.data.payment_method} />
                    <Row
                      label={t("amount")}
                      value={egp(ctx.data.payment_amount_egp)}
                    />
                    <Row
                      label={t("accommodation")}
                      value={egp(ctx.data.accommodation_amount_egp)}
                    />
                    <Row
                      label={t("serviceFee")}
                      value={egp(ctx.data.guest_service_fee_egp)}
                    />
                    <Row
                      label={t("cleaningFee")}
                      value={egp(ctx.data.cleaning_fee_egp)}
                    />
                    <Row
                      label={t("reference")}
                      value={ctx.data.reference_number}
                    />
                    <Row
                      label={t("deadline")}
                      value={fmtDate(ctx.data.payment_deadline_at)}
                    />
                    <Row
                      label={t("proofUploaded")}
                      value={fmtDate(ctx.data.proof_uploaded_at)}
                    />
                    <Row
                      label={t("verified")}
                      value={fmtDate(ctx.data.verified_at)}
                    />
                    <Row
                      label={t("refunded")}
                      value={
                        ctx.data.refund_amount_egp != null
                          ? `${egp(ctx.data.refund_amount_egp)} · ${fmtDate(ctx.data.refunded_at)}`
                          : "—"
                      }
                    />
                    {ctx.data.reject_reason && (
                      <Row
                        label={t("rejectReason")}
                        value={ctx.data.reject_reason}
                      />
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-neutral-500">—</p>
                )}
              </div>

              {ctx.data.financials && (
                <div className="card p-5">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                    {t("financialBreakdown")}
                  </h2>
                  <dl className="divide-y divide-neutral-100">
                    <Row
                      label={t("guestPaid")}
                      value={egp(ctx.data.financials.guest_paid_egp)}
                    />
                    <Row
                      label={t("accommodation")}
                      value={egp(ctx.data.financials.accommodation_egp)}
                    />
                    <Row
                      label={t("cleaningFee")}
                      value={egp(ctx.data.financials.cleaning_fee_egp)}
                    />
                    <Row
                      label={t("stayosFeeAllocation")}
                      value={`${t("hostSide")}: ${egp(ctx.data.financials.host_side_share_egp)} · ${t("guestSide")}: ${egp(ctx.data.financials.guest_side_share_egp)}`}
                    />
                    <Row
                      label={t("stayosRevenue")}
                      value={
                        ctx.data.financials.platform_share_waived
                          ? `${egp(0)} (${t("shareWaived")})`
                          : egp(ctx.data.financials.platform_share_egp)
                      }
                    />
                    <Row
                      label={t("hostPayable")}
                      value={egp(ctx.data.financials.host_net_egp)}
                    />
                  </dl>
                </div>
              )}

              {ctx.data.payout && (
                <div className="card p-5">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                    {t("payout")}
                  </h2>
                  <dl className="divide-y divide-neutral-100">
                    <Row
                      label={t("fundsStatus")}
                      value={ctx.data.payout.funds_status}
                    />
                    <Row
                      label={t("fundsHeld")}
                      value={egp(ctx.data.payout.funds_held_egp)}
                    />
                    <Row
                      label={t("payoutEligibility")}
                      value={t("payoutEligibilityRule")}
                    />
                    <Row
                      label={t("expectedPayout")}
                      value={fmtDate(ctx.data.payout.expected_payout_at)}
                    />
                    <Row
                      label={t("payoutStatus")}
                      value={ctx.data.payout.payout_status}
                    />
                    {ctx.data.payout.paid_at && (
                      <Row
                        label={t("paidAt")}
                        value={fmtDate(ctx.data.payout.paid_at)}
                      />
                    )}
                    {ctx.data.financials?.provider && (
                      <Row
                        label={t("providerPayout")}
                        value={ctx.data.financials.provider}
                      />
                    )}
                  </dl>
                </div>
              )}

              <div className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("escrow")}
                </h2>
                {ctx.data.escrow ? (
                  <dl className="divide-y divide-neutral-100">
                    <Row
                      label={t("escrowStatus")}
                      value={ctx.data.escrow.status}
                    />
                    <Row
                      label={t("escrowAmount")}
                      value={egp(ctx.data.escrow.amount_egp)}
                    />
                    <Row
                      label={t("holdUntil")}
                      value={fmtDate(ctx.data.escrow.hold_until)}
                    />
                    <Row
                      label={t("released")}
                      value={fmtDate(ctx.data.escrow.released_at)}
                    />
                  </dl>
                ) : (
                  <p className="text-sm text-neutral-500">—</p>
                )}
              </div>

              <div className="card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("disputes")}
                </h2>
                {ctx.data.disputes.length === 0 ? (
                  <p className="text-sm text-neutral-500">{t("noDisputes")}</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {ctx.data.disputes.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2"
                      >
                        <span className="font-medium text-neutral-700">
                          {d.category}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {d.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5 lg:col-span-2">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("transactions")}
                </h2>
                {ctx.data.transactions.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    {t("noTransactions")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ctx.data.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="rounded-lg border border-neutral-200 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-semibold text-neutral-800">
                            {txn.type} · {egp(txn.amount_egp)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {txn.status}
                            {txn.provider ? ` · ${txn.provider}` : ""}
                            {txn.provider_ref ? ` · ${txn.provider_ref}` : ""}
                          </span>
                        </div>
                        {txn.ledger_entries.length > 0 && (
                          <table className="mt-2 w-full text-xs">
                            <thead>
                              <tr className="text-start text-neutral-400">
                                <th className="py-1 text-start font-medium">
                                  {t("ledger")}
                                </th>
                                <th className="py-1 text-start font-medium" />
                                <th className="py-1 text-end font-medium" />
                              </tr>
                            </thead>
                            <tbody>
                              {txn.ledger_entries.map((le, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-neutral-100"
                                >
                                  <td className="py-1 text-neutral-600">
                                    {le.ledger_account}
                                  </td>
                                  <td className="py-1 text-neutral-600">
                                    {le.entry_type}
                                  </td>
                                  <td className="py-1 text-end font-medium text-neutral-800">
                                    {egp(le.amount_egp)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
