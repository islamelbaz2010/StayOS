"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import {
  downloadLeadsCsv,
  useAddLeadNote,
  useHostLeads,
  useLeadDetail,
  useLeadsSummary,
  useUpdateLeadStatus,
  LEAD_STATUSES,
  type LeadFilters,
  type LeadStatus,
} from "@/lib/queries/hostLeads";

const PAGE_SIZE = 50;

const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "chalet",
  "serviced_apartment",
  "hotel_resort",
  "other",
];
const READINESS = [
  "ready_now",
  "needs_furnishing",
  "under_renovation",
  "exploring",
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-accent-50 text-accent-700",
    CONTACTED: "bg-blue-50 text-blue-700",
    QUALIFIED: "bg-emerald-50 text-emerald-700",
    INVITED: "bg-violet-50 text-violet-700",
    ONBOARDED: "bg-emerald-100 text-emerald-800",
    NOT_A_FIT: "bg-neutral-100 text-neutral-500",
  };
  const t = useTranslations("adminHostLeads.status");
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-neutral-100 text-neutral-600"
      }`}
    >
      {t.has(status) ? t(status) : status}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-neutral-800">{value ?? "—"}</p>
    </div>
  );
}

function LeadDrawer({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const t = useTranslations("adminHostLeads");
  const { data, isPending, isError } = useLeadDetail("HOST", leadId);
  const updateStatus = useUpdateLeadStatus();
  const addNote = useAddLeadNote();
  const [note, setNote] = useState("");
  const [draftStatus, setDraftStatus] = useState<LeadStatus | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl">
        {isPending ? (
          <p className="py-12 text-center text-neutral-500">{t("loading")}</p>
        ) : isError || !data ? (
          <p className="py-12 text-center text-danger-600">{t("loadError")}</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-900">
                  {data.full_name}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-neutral-400">
                  {data.id}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2.5 py-1 text-sm font-semibold text-neutral-500 hover:bg-surface-soft"
              >
                {t("close")}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Field label={t("colPhone")} value={data.phone} />
              <Field label={t("colEmail")} value={data.email} />
              <Field label={t("colCity")} value={data.city} />
              <Field
                label={t("colProperty")}
                value={t.has(`propertyType.${data.property_type}`)
                  ? `${t(`propertyType.${data.property_type}`)} ×${data.units_count}`
                  : `${data.property_type} ×${data.units_count}`}
              />
              <Field
                label={t("readinessLabel")}
                value={
                  data.property_readiness && t.has(`readiness.${data.property_readiness}`)
                    ? t(`readiness.${data.property_readiness}`)
                    : data.property_readiness
                }
              />
              <Field
                label={t("preferredContact")}
                value={
                  data.preferred_contact && t.has(`contact.${data.preferred_contact}`)
                    ? t(`contact.${data.preferred_contact}`)
                    : data.preferred_contact
                }
              />
              <Field
                label={t("managementCompany")}
                value={data.management_company}
              />
              <Field label={t("lang")} value={data.lang?.toUpperCase()} />
            </div>

            {data.message && (
              <div className="mt-4">
                <Field label={t("message")} value={data.message} />
              </div>
            )}

            <div className="mt-6 rounded-lg border border-neutral-150 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t("submission")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field
                  label={t("submittedAt")}
                  value={
                    data.created_at
                      ? new Date(data.created_at).toLocaleString()
                      : null
                  }
                />
                <Field
                  label={t("consentAt")}
                  value={
                    data.consent_at
                      ? new Date(data.consent_at).toLocaleString()
                      : null
                  }
                />
                <Field label={t("utmSource")} value={data.utm_source} />
                <Field label={t("utmMedium")} value={data.utm_medium} />
                <Field label={t("utmCampaign")} value={data.utm_campaign} />
                <Field label={t("utmContent")} value={data.utm_content} />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t("colStatus")}
              </label>
              <div className="mt-2 flex gap-2">
                <select
                  value={draftStatus ?? data.status}
                  onChange={(e) => setDraftStatus(e.target.value as LeadStatus)}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t.has(`status.${s}`) ? t(`status.${s}`) : s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={
                    updateStatus.isPending ||
                    (draftStatus ?? data.status) === data.status
                  }
                  onClick={() =>
                    updateStatus.mutate(
                      {
                        kind: "HOST",
                        leadId: data.id,
                        status: draftStatus ?? data.status,
                      },
                      { onSuccess: () => setDraftStatus(null) }
                    )
                  }
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-brand-900 disabled:opacity-50"
                >
                  {t("saveStatus")}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t("notes")}
              </p>
              <div className="mt-2 space-y-2">
                {data.notes.length === 0 && (
                  <p className="text-sm text-neutral-400">{t("noNotes")}</p>
                )}
                {data.notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg bg-surface-soft px-3 py-2 text-sm"
                  >
                    <p className="text-neutral-800">{n.note}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={addNote.isPending || !note.trim()}
                  onClick={() =>
                    addNote.mutate(
                      { kind: "HOST", leadId: data.id, note: note.trim() },
                      { onSuccess: () => setNote("") }
                    )
                  }
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {t("addNote")}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default function AdminHostLeadsPage() {
  const t = useTranslations("adminHostLeads");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const [filters, setFilters] = useState<LeadFilters>({});
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const queryFilters: LeadFilters = {
    ...filters,
    // date inputs are day-precision; end-date must include the whole day
    date_to: filters.date_to ? `${filters.date_to}T23:59:59` : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  const { data = [], isPending, isError } = useHostLeads(queryFilters);
  const { data: summary } = useLeadsSummary();

  const hostStatus = (s: string) => summary?.leads_by_status?.[`host:${s}`] ?? 0;

  function setFilter(k: keyof LeadFilters, v: string) {
    setFilters((f) => ({ ...f, [k]: v || undefined }));
    setPage(0);
  }

  async function exportCsv() {
    setExporting(true);
    setExportError(false);
    try {
      await downloadLeadsCsv(queryFilters);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {t("title")}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting}
              className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {exporting ? t("exporting") : t("exportCsv")}
            </button>
          </div>
          {exportError && (
            <p className="mt-3 rounded-lg bg-danger-50 p-3 text-sm text-danger-700" role="alert">
              {t("exportError")}
            </p>
          )}

          {summary && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {summary.host_submissions}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{t("mTotal")}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {hostStatus("NEW")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("status.NEW")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {hostStatus("CONTACTED")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("status.CONTACTED")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {hostStatus("QUALIFIED")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("status.QUALIFIED")}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {summary.host_units_total}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{t("mUnits")}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-brand-900">
                  {summary.host_conversion_rate}%
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("mConversion")}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            <input
              value={filters.q ?? ""}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="col-span-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={filters.city ?? ""}
              onChange={(e) => setFilter("city", e.target.value)}
              placeholder={t("cityPlaceholder")}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={filters.property_type ?? ""}
              onChange={(e) => setFilter("property_type", e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("allPropertyTypes")}</option>
              {PROPERTY_TYPES.map((p) => (
                <option key={p} value={p}>
                  {t.has(`propertyType.${p}`) ? t(`propertyType.${p}`) : p}
                </option>
              ))}
            </select>
            <select
              value={filters.readiness ?? ""}
              onChange={(e) => setFilter("readiness", e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("allReadiness")}</option>
              {READINESS.map((r) => (
                <option key={r} value={r}>
                  {t.has(`readiness.${r}`) ? t(`readiness.${r}`) : r}
                </option>
              ))}
            </select>
            <select
              value={filters.status ?? ""}
              onChange={(e) => setFilter("status", e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("allStatuses")}</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.has(`status.${s}`) ? t(`status.${s}`) : s}
                </option>
              ))}
            </select>
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <input
                type="date"
                aria-label={t("dateFrom")}
                value={filters.date_from ?? ""}
                onChange={(e) => setFilter("date_from", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm"
              />
              <input
                type="date"
                aria-label={t("dateTo")}
                value={filters.date_to ?? ""}
                onChange={(e) => setFilter("date_to", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm"
              />
            </div>
          </div>

          {isPending ? (
            <p className="py-12 text-center text-neutral-500">{t("loading")}</p>
          ) : isError ? (
            <p className="py-12 text-center text-danger-600">{t("loadError")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-150 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-start">{t("colName")}</th>
                    <th className="px-4 py-3 text-start">{t("colPhone")}</th>
                    <th className="px-4 py-3 text-start">{t("colEmail")}</th>
                    <th className="px-4 py-3 text-start">{t("colCity")}</th>
                    <th className="px-4 py-3 text-start">{t("colProperty")}</th>
                    <th className="px-4 py-3 text-start">{t("colSource")}</th>
                    <th className="px-4 py-3 text-start">{t("colDate")}</th>
                    <th className="px-4 py-3 text-start">{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelected(lead.id)}
                      className="cursor-pointer hover:bg-surface-soft"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">
                          {lead.name || "—"}
                        </p>
                        <p className="font-mono text-xs text-neutral-400">
                          {lead.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-neutral-600" dir="ltr">
                        {lead.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lead.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lead.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lead.detail || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lead.utm_source || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <p className="p-8 text-center text-neutral-500">{t("empty")}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("prev")}
            </button>
            <span className="text-sm text-neutral-500">
              {t("page", { page: page + 1 })}
            </span>
            <button
              type="button"
              disabled={data.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("next")}
            </button>
          </div>
        </section>

        {selected && (
          <LeadDrawer leadId={selected} onClose={() => setSelected(null)} />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
