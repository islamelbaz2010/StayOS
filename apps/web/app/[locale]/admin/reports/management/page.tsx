"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/useAuth";
import { useManagementReport } from "@/lib/queries/reports";
import { formatMoney } from "@/lib/utils";

/** Horizontal bar scaled to the series max — pure CSS so it prints. */
function BarRow({
  label,
  value,
  max,
  formatted,
}: {
  label: string;
  value: number;
  max: number;
  formatted: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, 1.5) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 text-xs text-neutral-500">{label}</span>
      <div className="h-4 flex-1 rounded bg-neutral-100 print:border print:border-neutral-200">
        <div
          className="h-4 rounded bg-accent-500 print:bg-neutral-800"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-end text-xs font-semibold text-brand-900">
        {formatted}
      </span>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 print:break-inside-avoid">
      <p className="text-xl font-bold text-brand-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  basis,
  children,
}: {
  title: string;
  basis?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 print:break-inside-avoid">
      <div className="mb-3 border-b border-neutral-200 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
          {title}
        </h2>
        {basis && (
          <p className="mt-0.5 text-[11px] text-neutral-400">{basis}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function ManagementReportPage() {
  const t = useTranslations("managementReport");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const egp = (v: number | null | undefined) =>
    v != null ? formatMoney(v, "EGP", intlLocale) : "—";
  const fmtDate = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleDateString(intlLocale) : "—";

  const { user } = useAuth();
  const allowed =
    user?.role === "admin" ||
    (user?.role === "staff" &&
      (user.staff_permissions ?? []).includes("reports"));

  const searchParams = useSearchParams();
  const router = useRouter();
  const params: Record<string, string> = {};
  for (const key of ["date_from", "date_to", "status", "governorate", "city"]) {
    const v = searchParams.get(key);
    if (v) params[key] = v;
  }
  const report = useManagementReport(params, allowed);

  const [draft, setDraft] = useState({
    date_from: params.date_from ?? "",
    date_to: params.date_to ?? "",
    governorate: params.governorate ?? "",
    city: params.city ?? "",
  });

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(draft)) if (v.trim()) qs.set(k, v.trim());
    router.replace(qs.size ? `?${qs}` : "?", { scroll: false });
  };

  const data = report.data;
  const maxMonth = Math.max(
    0,
    ...(data?.revenue.by_month.map((m) => m.amount_egp) ?? [0])
  );
  const statusMax = Math.max(
    1,
    ...Object.values(data?.bookings.by_status ?? { x: 1 })
  );
  const vatMax = Math.max(
    1,
    data?.vat.calculated_egp ?? 0,
    data?.vat.recognised_egp ?? 0,
    data?.vat.within_held_funds_egp ?? 0,
    data?.vat.reversed_egp ?? 0,
    data?.vat.payable_egp ?? 0
  );

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <style>{`
          @media print {
            aside, header, nav, .no-print { display: none !important; }
            main { padding: 0 !important; }
            body { background: #fff !important; }
            .print-footer { display: block !important; }
            @page { margin: 14mm; }
          }
          .print-footer { display: none; }
        `}</style>

        <div className="mx-auto w-full max-w-5xl py-2">
          {/* Controls — screen only */}
          <form
            onSubmit={applyFilters}
            className="no-print mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <Link
              href={`/${locale}/admin/reports`}
              className="text-sm text-accent-700 underline"
            >
              {t("backToReports")}
            </Link>
            <div className="flex-1" />
            {(["date_from", "date_to"] as const).map((k) => (
              <label key={k} className="text-xs text-neutral-500">
                {t(`filters.${k}`)}
                <input
                  type="date"
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft({ ...draft, [k]: e.target.value })
                  }
                  className="input mt-1 block w-36 text-sm"
                />
              </label>
            ))}
            {(["governorate", "city"] as const).map((k) => (
              <label key={k} className="text-xs text-neutral-500">
                {t(`filters.${k}`)}
                <input
                  type="text"
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft({ ...draft, [k]: e.target.value })
                  }
                  className="input mt-1 block w-32 text-sm"
                />
              </label>
            ))}
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">
              {t("filters.apply")}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary px-4 py-2 text-sm"
            >
              {t("downloadPdf")}
            </button>
          </form>

          {!allowed ? (
            <div className="card p-12 text-center text-neutral-600">
              {t("noPermission")}
            </div>
          ) : report.isError ? (
            <ErrorState onRetry={() => report.refetch()} />
          ) : report.isPending || !data ? (
            <div className="py-16 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
              {/* ---- Masthead ---- */}
              <header className="border-b-2 border-brand-900 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent-600">
                  StayOS
                </p>
                <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
                  {t("title")}
                </h1>
                <p className="mt-2 text-xs text-neutral-500">
                  {t("period")}:{" "}
                  {data.period.date_from || data.period.date_to
                    ? `${data.period.date_from ?? "…"} → ${data.period.date_to ?? "…"}`
                    : t("allTime")}{" "}
                  · {t("generatedAt")}{" "}
                  {new Date(data.generated_at).toLocaleString(intlLocale)}
                </p>
                {Object.keys(data.filters_applied).length > 0 && (
                  <p className="mt-1 text-xs text-neutral-400">
                    {t("filtersApplied")}:{" "}
                    {Object.entries(data.filters_applied)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
                  </p>
                )}
              </header>

              {/* ---- Executive KPIs ---- */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <KpiCard
                  label={t("kpi.collected")}
                  value={egp(data.kpis.collected_egp)}
                />
                <KpiCard
                  label={t("kpi.stayosRevenue")}
                  value={egp(data.kpis.stayos_revenue_egp)}
                />
                <KpiCard
                  label={t("kpi.vatPayable")}
                  value={egp(data.kpis.vat_payable_egp)}
                />
                <KpiCard
                  label={t("kpi.hostFundsHeld")}
                  value={egp(data.kpis.host_funds_held_egp)}
                />
                <KpiCard
                  label={t("kpi.hostPayable")}
                  value={egp(data.kpis.host_payable_egp)}
                />
                <KpiCard
                  label={t("kpi.fundsHeld")}
                  value={egp(data.kpis.funds_held_egp)}
                />
                <KpiCard
                  label={t("kpi.refunded")}
                  value={egp(data.kpis.refunded_egp)}
                />
              </div>

              {/* ---- Financial composition ---- */}
              <Section title={t("sections.composition")}>
                <div className="grid gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["flow.guestPayments", data.kpis.collected_egp],
                      ["flow.fundsHeld", data.kpis.funds_held_egp],
                      ["flow.hostFundsHeld", data.kpis.host_funds_held_egp],
                      ["flow.hostPayable", data.kpis.host_payable_egp],
                      ["flow.stayosVat", data.kpis.vat_payable_egp],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg bg-neutral-50 p-3 text-center print:border print:border-neutral-200"
                    >
                      <p className="text-base font-bold text-brand-900">
                        {egp(value)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                        {t(label)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {t("compositionNote")}
                </p>
              </Section>

              {/* ---- Revenue ---- */}
              <Section
                title={t("sections.revenue")}
                basis={t(`basis.${data.date_bases.revenue}`)}
              >
                <div className="grid gap-3 sm:grid-cols-4">
                  <KpiCard
                    label={t("revenue.grossCredits")}
                    value={egp(data.revenue.gross_credits_egp)}
                  />
                  <KpiCard
                    label={t("revenue.debits")}
                    value={egp(-data.revenue.debits_egp)}
                  />
                  <KpiCard
                    label={t("revenue.net")}
                    value={egp(data.revenue.net_egp)}
                  />
                  <KpiCard
                    label={t("revenue.withinHeldFunds")}
                    value={egp(data.revenue.within_held_funds_egp)}
                  />
                </div>
                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold text-neutral-500">
                    {t("revenue.byMonth")}
                  </p>
                  {data.revenue.by_month.length === 0 ? (
                    <p className="text-sm text-neutral-400">{t("empty")}</p>
                  ) : (
                    data.revenue.by_month.map((m) => (
                      <BarRow
                        key={m.month}
                        label={m.month}
                        value={m.amount_egp}
                        max={maxMonth}
                        formatted={egp(m.amount_egp)}
                      />
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {t("revenue.recognitionNote")}
                </p>
              </Section>

              {/* ---- VAT ---- */}
              <Section
                title={t("sections.vat")}
                basis={t(`basis.${data.date_bases.vat}`)}
              >
                {(
                  [
                    ["vat.calculated", data.vat.calculated_egp],
                    ["vat.recognised", data.vat.recognised_egp],
                    ["vat.withinHeldFunds", data.vat.within_held_funds_egp],
                    ["vat.reversed", -data.vat.reversed_egp],
                    ["vat.payable", data.vat.payable_egp],
                  ] as const
                ).map(([label, value]) => (
                  <BarRow
                    key={label}
                    label={t(label)}
                    value={Math.abs(value)}
                    max={vatMax}
                    formatted={egp(value)}
                  />
                ))}
                <p className="mt-2 text-xs text-neutral-500">
                  {t("vat.note")}
                </p>
              </Section>

              {/* ---- Bookings ---- */}
              <Section
                title={t("sections.bookings")}
                basis={t(`basis.${data.date_bases.bookings}`)}
              >
                <p className="mb-3 text-lg font-bold text-brand-900">
                  {t("bookings.total", { count: data.bookings.total })}
                </p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  {Object.entries(data.bookings.by_status).map(
                    ([status, count]) => (
                      <BarRow
                        key={status}
                        label={t(`status.${status}`)}
                        value={count}
                        max={statusMax}
                        formatted={String(count)}
                      />
                    )
                  )}
                </div>
                {data.bookings.by_governorate.length > 0 && (
                  <table className="mt-5 w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-start text-xs uppercase tracking-wider text-neutral-400">
                        <th className="py-1.5 text-start font-medium">
                          {t("bookings.governorate")}
                        </th>
                        <th className="py-1.5 text-end font-medium">
                          {t("bookings.count")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bookings.by_governorate.map((g) => (
                        <tr
                          key={g.governorate}
                          className="border-b border-neutral-100"
                        >
                          <td className="py-1.5 text-neutral-700">
                            {g.governorate}
                          </td>
                          <td className="py-1.5 text-end font-medium">
                            {g.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              {/* ---- Settlement ---- */}
              <Section title={t("sections.settlement")}>
                <div className="grid gap-3 sm:grid-cols-4">
                  <KpiCard
                    label={t("settlement.hostFundsHeld")}
                    value={egp(data.settlement.host_funds_held_egp)}
                  />
                  <KpiCard
                    label={t("settlement.hostPayable")}
                    value={egp(data.settlement.host_payable_egp)}
                  />
                  <KpiCard
                    label={t("settlement.payoutsPending")}
                    value={egp(data.settlement.payouts_pending_egp)}
                  />
                  <KpiCard
                    label={t("settlement.paidOut")}
                    value={egp(data.settlement.payouts_paid_egp)}
                  />
                </div>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-400">
                      <th className="py-1.5 text-start font-medium">
                        {t("settlement.fundsStatus")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("bookings.count")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("settlement.amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.settlement.escrows_by_status.map((e) => (
                      <tr
                        key={e.status}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-1.5 text-neutral-700">
                          {t(`escrowStatus.${e.status}`)}
                        </td>
                        <td className="py-1.5 text-end">{e.count}</td>
                        <td className="py-1.5 text-end font-medium">
                          {egp(e.amount_egp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {/* ---- Refunds & exceptions ---- */}
              <Section title={t("sections.refunds")}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <KpiCard
                    label={t("refunds.refunded")}
                    value={egp(data.refunds.refunded_egp)}
                  />
                  <KpiCard
                    label={t("refunds.pending")}
                    value={egp(data.refunds.refund_pending_egp)}
                  />
                  <KpiCard
                    label={t("refunds.vatReversed")}
                    value={egp(data.refunds.vat_reversed_egp)}
                  />
                </div>
                {data.refunds.adjustments.length > 0 && (
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-400">
                        <th className="py-1.5 text-start font-medium">
                          {t("refunds.date")}
                        </th>
                        <th className="py-1.5 text-start font-medium">
                          {t("refunds.type")}
                        </th>
                        <th className="py-1.5 text-start font-medium">
                          {t("refunds.actor")}
                        </th>
                        <th className="py-1.5 text-end font-medium">
                          {t("settlement.amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.refunds.adjustments.map((a) => (
                        <tr
                          key={a.adjustment_id}
                          className="border-b border-neutral-100"
                        >
                          <td className="py-1.5 text-neutral-600">
                            {fmtDate(a.created_at)}
                          </td>
                          <td className="py-1.5 text-neutral-700">
                            {a.adjustment_type}
                            {a.status !== "applied" ? ` · ${a.status}` : ""}
                          </td>
                          <td className="py-1.5 text-neutral-600">
                            {a.actor ?? "—"}
                          </td>
                          <td className="py-1.5 text-end font-medium">
                            {egp(a.amount_egp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              {/* ---- Top bookings ---- */}
              <Section
                title={t("sections.topBookings")}
                basis={t(`basis.${data.date_bases.top_bookings}`)}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-400">
                      <th className="py-1.5 text-start font-medium">
                        {t("top.property")}
                      </th>
                      <th className="py-1.5 text-start font-medium">
                        {t("top.status")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.guestTotal")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.hostNet")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.stayos")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.vat")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_bookings.map((b) => (
                      <tr
                        key={b.booking_id}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-1.5 text-neutral-700">
                          {b.property ?? b.booking_id.slice(0, 8)}
                        </td>
                        <td className="py-1.5 text-neutral-500">
                          {t(`status.${b.status}`)}
                        </td>
                        <td className="py-1.5 text-end font-medium">
                          {egp(b.guest_total_egp)}
                        </td>
                        <td className="py-1.5 text-end">
                          {egp(b.host_net_egp)}
                        </td>
                        <td className="py-1.5 text-end">
                          {egp(b.stayos_revenue_egp)}
                        </td>
                        <td className="py-1.5 text-end">{egp(b.vat_egp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {/* ---- Appendix: open escrows ---- */}
              <Section title={t("sections.appendix")}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 uppercase tracking-wider text-neutral-400">
                      <th className="py-1.5 text-start font-medium">
                        {t("appendix.booking")}
                      </th>
                      <th className="py-1.5 text-start font-medium">
                        {t("appendix.fundsStatus")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("appendix.held")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.hostNet")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.stayos")}
                      </th>
                      <th className="py-1.5 text-end font-medium">
                        {t("top.vat")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.settlement.open_escrows.map((e) => (
                      <tr
                        key={e.escrow_id}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-1.5 font-mono text-neutral-600">
                          {e.booking_id.slice(0, 8)}
                        </td>
                        <td className="py-1.5 text-neutral-600">
                          {t(`escrowStatus.${e.status}`)}
                        </td>
                        <td className="py-1.5 text-end font-medium">
                          {egp(e.amount_egp)}
                        </td>
                        <td className="py-1.5 text-end">
                          {egp(e.host_amount_egp)}
                        </td>
                        <td className="py-1.5 text-end">
                          {egp(e.platform_share_egp)}
                        </td>
                        <td className="py-1.5 text-end">{egp(e.vat_egp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <footer className="print-footer mt-10 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
                StayOS · {t("title")} · {t("generatedAt")}{" "}
                {new Date(data.generated_at).toLocaleString(intlLocale)}
              </footer>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
