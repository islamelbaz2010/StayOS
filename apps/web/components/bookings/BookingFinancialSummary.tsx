"use client";

import { useTranslations } from "next-intl";

import {
  useBookingFinancialContext,
  type BookingFinancialContext,
} from "@/lib/queries/admin";
import { formatMoney } from "@/lib/utils";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-neutral-500">{label}</span>
      <span
        className={
          strong
            ? "text-sm font-semibold text-brand-900"
            : "text-sm text-neutral-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

const money = (v: number | null | undefined, locale: string) =>
  v === null || v === undefined ? "—" : formatMoney(v, "EGP", locale);

const dateOr = (v: string | null | undefined, locale: string) =>
  v ? new Date(v).toLocaleDateString(locale) : "—";

function FinancialBody({
  data,
  locale,
}: {
  data: BookingFinancialContext;
  locale: string;
}) {
  const t = useTranslations("adminBookings.financial");
  const f = data.financials;
  const p = data.payout;
  const escrow = data.escrow;

  return (
    <div className="space-y-5">
      {f && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("title")}
          </p>
          <div className="divide-y divide-neutral-100">
            <Row label={t("accommodation")} value={money(f.accommodation_egp, locale)} />
            <Row label={t("cleaning")} value={money(f.cleaning_fee_egp, locale)} />
            <Row label={t("hostCommission")} value={money(f.host_side_share_egp, locale)} />
            <Row label={t("guestCommission")} value={money(f.guest_side_share_egp, locale)} />
            <Row label={t("taxable")} value={money(f.taxable_amount_egp, locale)} />
            <Row label={t("vat")} value={money(f.vat_egp, locale)} />
            <Row label={t("guestTotal")} value={money(f.guest_paid_egp, locale)} strong />
            <Row label={t("hostNet")} value={money(f.host_net_egp, locale)} strong />
            <Row label={t("platformRevenue")} value={money(f.platform_share_egp, locale)} strong />
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("paymentTitle")}
        </p>
        <div className="divide-y divide-neutral-100">
          <Row label={t("paymentStatus")} value={data.payment_status ?? "—"} />
          <Row label={t("paymentMethod")} value={data.payment_method ?? "—"} />
          <Row label={t("amount")} value={money(data.payment_amount_egp, locale)} />
          <Row label={t("verifiedAt")} value={dateOr(data.verified_at, locale)} />
          <Row label={t("refundAmount")} value={money(data.refund_amount_egp, locale)} />
          <Row label={t("refundedAt")} value={dateOr(data.refunded_at, locale)} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("fundsTitle")}
        </p>
        <div className="divide-y divide-neutral-100">
          <Row
            label={t("fundsStatus")}
            value={p?.funds_status ?? escrow?.status ?? "—"}
          />
          <Row
            label={t("heldAmount")}
            value={money(p?.funds_held_egp ?? escrow?.amount_egp, locale)}
          />
          <Row label={t("expectedPayout")} value={dateOr(p?.expected_payout_at, locale)} />
          <Row label={t("payoutStatus")} value={p?.payout_status ?? "—"} />
          <Row label={t("paidAt")} value={dateOr(p?.paid_at, locale)} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("adjustmentsTitle")}
        </p>
        {data.adjustments.length === 0 ? (
          <p className="text-xs text-neutral-500">{t("noAdjustments")}</p>
        ) : (
          <div className="space-y-2">
            {data.adjustments.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-neutral-800">
                    {a.adjustment_type ?? "—"} · {a.status ?? "—"}
                  </p>
                  {a.reason && (
                    <p className="text-xs text-neutral-500">{a.reason}</p>
                  )}
                  {(a.actor || a.created_at) && (
                    <p className="text-xs text-neutral-400">
                      {[a.actor, dateOr(a.created_at, locale)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-neutral-800">
                  {money(a.amount_egp, locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Admin Operations financial drill-down: canonical booking economics +
 * payment/funds/payout/adjustments from the finance engine. Hidden when the
 * caller lacks the payments permission (endpoint returns 403). */
export function BookingFinancialSummary({
  bookingId,
  locale,
}: {
  bookingId: string;
  locale: string;
}) {
  const t = useTranslations("adminBookings.financial");
  const { data, isPending, error } = useBookingFinancialContext(bookingId);

  if (isPending) {
    return (
      <div className="card p-4 text-sm text-neutral-500">{t("loading")}</div>
    );
  }
  if (error) {
    // 403 (staff without payments permission) — hide the section entirely.
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 403 || status === 404) return null;
    return (
      <div className="card p-4 text-sm text-neutral-500">
        {t("unavailable")}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="card p-4">
      <FinancialBody data={data} locale={locale} />
    </div>
  );
}
