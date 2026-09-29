"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/useAuth";
import {
  downloadReportExport,
  useReport,
  useReportCatalog,
  type ReportQueryParams,
} from "@/lib/queries/reports";
import { cn, formatMoney } from "@/lib/utils";

const SELECT_FILTERS: Record<string, string[]> = {
  payment_status: [
    "pending",
    "proof_uploaded",
    "verified",
    "rejected",
    "cancelled",
    "refund_pending",
    "refunded",
  ],
  payout_status: ["pending", "processing", "completed", "failed"],
  kyc_status: [
    "unverified",
    "pending",
    "retry_required",
    "manual_review",
    "verified",
    "rejected",
  ],
  role: ["guest", "host", "staff", "admin"],
  entry_type: ["credit", "debit"],
  stay_phase: [
    "upcoming",
    "check_in_ready",
    "checked_in",
    "checkout_ready",
    "checked_out",
    "completed",
    "cancelled",
    "rejected",
    "no_show",
  ],
  property_type: [
    "APARTMENT",
    "VILLA",
    "CHALET",
    "HOTEL_ROOM",
    "RESORT_UNIT",
    "STUDIO",
  ],
  payment_method: ["manual"],
};

const BOOKING_STATUSES = [
  "requested",
  "accepted",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
  "no_show",
];

const DISPUTE_STATUSES = ["open", "in_review", "resolved", "closed"];
const ADJUSTMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "applied",
  "cancelled",
];
const REVIEW_REPORT_STATUSES = ["open", "in_review", "resolved", "dismissed"];
const KYC_DOC_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "retry_required",
  "manual_review",
];
const LISTING_STATUSES = [
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNLISTED",
  "LISTED",
  "SUSPENDED",
  "ARCHIVED",
  "REJECTED",
];
const TRANSACTION_STATUSES = ["pending", "completed", "failed"];

function optionsFor(reportCategory: string, name: string): string[] | null {
  if (name === "status") {
    switch (reportCategory) {
      case "bookings":
      case "operations":
        return BOOKING_STATUSES;
      case "listings":
        return LISTING_STATUSES;
      case "disputes":
        return DISPUTE_STATUSES;
      case "trust":
        return KYC_DOC_STATUSES;
      case "reviews":
        return REVIEW_REPORT_STATUSES;
      case "financial":
        return ADJUSTMENT_STATUSES;
      case "payments":
        return TRANSACTION_STATUSES;
      default:
        return null;
    }
  }
  return SELECT_FILTERS[name] ?? null;
}

const DATE_FILTERS = new Set(["date_from", "date_to"]);
const MONEY_RE = /_egp$|amount|price|revenue|vat|commission|net|total|payable|collected|refund/;

export default function AdminReportPage() {
  const t = useTranslations("adminReports");
  const tc = useTranslations("common");
  const { locale = "ar", reportKey } = useParams<{
    locale: string;
    reportKey: string;
  }>();
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { user } = useAuth();
  const allowed =
    user?.role === "admin" ||
    (user?.role === "staff" &&
      (user.staff_permissions ?? []).includes("reports"));

  const catalog = useReportCatalog(allowed);
  const meta = useMemo(
    () => catalog.data?.find((r) => r.key === reportKey),
    [catalog.data, reportKey]
  );

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>(null);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const params: ReportQueryParams = useMemo(() => {
    const p: ReportQueryParams = { page, page_size: 50 };
    for (const [k, v] of Object.entries(applied)) {
      if (v) p[k] = v;
    }
    if (sort) {
      p.sort = sort;
      p.order = order;
    }
    return p;
  }, [applied, page, sort, order]);

  const report = useReport(reportKey, params, allowed && Boolean(meta?.implemented));

  const apply = () => {
    setApplied({ ...draft });
    setPage(1);
  };
  const reset = () => {
    setDraft({});
    setApplied({});
    setPage(1);
    setSort(null);
  };
  const toggleSort = (col: string) => {
    if (!meta?.sortable.includes(col)) return;
    if (sort === col) {
      setOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSort(col);
      setOrder("desc");
    }
    setPage(1);
  };
  const doExport = async (format: "csv" | "xlsx") => {
    setExporting(format);
    try {
      const { page: _p, page_size: _s, ...rest } = params;
      await downloadReportExport(reportKey, rest, format);
    } finally {
      setExporting(null);
    }
  };

  const fmtCell = (col: string, v: unknown) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number" && MONEY_RE.test(col) && col !== "count")
      return formatMoney(v, "EGP", intlLocale);
    if (col.endsWith("_at") && typeof v === "string")
      return new Date(v).toLocaleString(intlLocale);
    if ((col === "check_in" || col === "check_out" || col === "month") && typeof v === "string")
      return v;
    if (typeof v === "boolean") return v ? "✓" : "—";
    return String(v);
  };

  const totalPages = report.data
    ? Math.max(1, Math.ceil(report.data.total / report.data.page_size))
    : 1;

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2 print:max-w-none">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 print:hidden">
            <div>
              <Link
                href={`/${locale}/admin/reports`}
                className="text-xs font-medium text-accent-600 hover:underline"
              >
                {locale === "ar" ? "→" : "←"} {t("backToCatalog")}
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
                {meta ? t(`reports.${meta.key}`) : reportKey}
              </h1>
              {meta && (
                <p className="mt-1 text-xs text-neutral-500">
                  {t("dateBasisLabel")}: {t(`dateBasis.${meta.date_basis}`)}
                </p>
              )}
              {meta?.note && (
                <p className="mt-1 max-w-2xl text-xs text-neutral-500">
                  {t.has(`notes.${meta.note}`)
                    ? t(`notes.${meta.note}`)
                    : meta.note}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => doExport("csv")}
                disabled={exporting !== null}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {t("exportCsv")}
              </button>
              <button
                type="button"
                onClick={() => doExport("xlsx")}
                disabled={exporting !== null}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {t("exportXlsx")}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                {t("print")}
              </button>
            </div>
          </div>

          {meta && meta.filters.length > 0 && (
            <div className="card mb-4 p-4 print:hidden">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t("filters")}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                {meta.filters.map((f) => {
                  const opts = optionsFor(meta.category, f);
                  if (DATE_FILTERS.has(f)) {
                    return (
                      <label key={f} className="text-xs text-neutral-600">
                        {t(`filter.${f}`)}
                        <input
                          type="date"
                          value={draft[f] ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [f]: e.target.value }))
                          }
                          className="input mt-1 block w-40 text-sm"
                        />
                      </label>
                    );
                  }
                  if (f === "stay_in_range") {
                    return (
                      <label
                        key={f}
                        className="flex items-center gap-2 pb-2 text-xs text-neutral-600"
                      >
                        <input
                          type="checkbox"
                          checked={draft[f] === "true"}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [f]: e.target.checked ? "true" : "",
                            }))
                          }
                        />
                        {t(`filter.${f}`)}
                      </label>
                    );
                  }
                  if (opts) {
                    return (
                      <label key={f} className="text-xs text-neutral-600">
                        {t(`filter.${f}`)}
                        <select
                          value={draft[f] ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [f]: e.target.value }))
                          }
                          className="input mt-1 block w-44 text-sm"
                        >
                          <option value="">{t("any")}</option>
                          {opts.map((o) => (
                            <option key={o} value={o}>
                              {t.has(`option.${o}`) ? t(`option.${o}`) : o}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={f} className="text-xs text-neutral-600">
                      {t(`filter.${f}`)}
                      <input
                        type="text"
                        value={draft[f] ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [f]: e.target.value }))
                        }
                        className="input mt-1 block w-44 text-sm"
                        dir="ltr"
                      />
                    </label>
                  );
                })}
                <button
                  type="button"
                  onClick={apply}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  {t("applyFilters")}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  {t("resetFilters")}
                </button>
              </div>
            </div>
          )}

          {!allowed ? (
            <div className="card p-12 text-center text-neutral-600">
              {t("noPermission")}
            </div>
          ) : catalog.data && !meta ? (
            <ErrorState onRetry={() => catalog.refetch()} />
          ) : meta && !meta.implemented ? (
            <div className="card border-dashed p-12 text-center">
              <p className="text-sm font-semibold text-neutral-600">
                {t("notImplemented")}
              </p>
              {meta.unavailable_reason && (
                <p className="mt-2 text-xs text-neutral-400">
                  {t.has(`reasons.${meta.unavailable_reason}`)
                    ? t(`reasons.${meta.unavailable_reason}`)
                    : meta.unavailable_reason}
                </p>
              )}
            </div>
          ) : report.isError ? (
            <ErrorState onRetry={() => report.refetch()} />
          ) : report.isPending || !report.data ? (
            <div className="py-12 text-center text-neutral-600">
              {t("loading")}
            </div>
          ) : report.data.rows.length === 0 ? (
            <div className="card p-12 text-center text-neutral-600">
              {t("noRows")}
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    {report.data.columns.map((c) => (
                      <th
                        key={c}
                        onClick={() => toggleSort(c)}
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-neutral-500",
                          meta?.sortable.includes(c) &&
                            "cursor-pointer select-none hover:text-brand-900"
                        )}
                      >
                        {t(`columns.${c}`)}
                        {sort === c ? (order === "desc" ? " ↓" : " ↑") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {report.data.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      {report.data!.columns.map((c) => (
                        <td
                          key={c}
                          className="whitespace-nowrap px-3 py-2 text-neutral-800"
                        >
                          {fmtCell(c, row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {Object.keys(report.data.totals).length > 0 && (
                  <tfoot className="bg-neutral-50 font-semibold">
                    <tr>
                      {report.data.columns.map((c, i) => (
                        <td key={c} className="px-3 py-2 text-xs">
                          {i === 0
                            ? t("totals")
                            : report.data!.totals[c] !== undefined
                              ? fmtCell(c, report.data!.totals[c])
                              : ""}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Semantically labeled totals — covers money totals that are
              not display columns (gross credits / debits / net). */}
          {report.data && Object.keys(report.data.totals).length > 0 && (
            <div className="card mt-3 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t("totals")}
              </p>
              <dl className="flex flex-wrap gap-x-8 gap-y-2">
                {Object.entries(report.data.totals).map(([c, v]) => {
                  const labelKey = (report.data!.total_labels ?? {})[c];
                  const label =
                    labelKey && t.has(`totalLabels.${labelKey}`)
                      ? t(`totalLabels.${labelKey}`)
                      : t.has(`columns.${c}`)
                        ? t(`columns.${c}`)
                        : c;
                  const money =
                    typeof v === "number" && MONEY_RE.test(c) && c !== "count";
                  return (
                    <div key={c} className="min-w-36">
                      <dt className="text-xs text-neutral-500">{label}</dt>
                      <dd className="text-sm font-semibold text-brand-900">
                        {money
                          ? formatMoney(v, "EGP", intlLocale)
                          : v.toLocaleString(intlLocale)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}

          {report.data && report.data.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 print:hidden">
              <p>
                {t("resultsCount", { count: report.data.total })} ·{" "}
                {t("generatedAt", {
                  date: new Date(report.data.generated_at).toLocaleString(
                    intlLocale
                  ),
                })}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary px-3 py-1 disabled:opacity-40"
                  >
                    {tc("previous")}
                  </button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="btn-secondary px-3 py-1 disabled:opacity-40"
                  >
                    {tc("next")}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
