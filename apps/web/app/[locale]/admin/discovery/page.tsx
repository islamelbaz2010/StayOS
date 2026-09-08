"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import {
  useDiscoveryCandidates,
  useDiscoveryStats,
  useDiscoverySources,
  useUpdateCandidateStatus,
  useImportCandidate,
  useTriggerDiscoveryRun,
  type DiscoveryCandidate,
  type CandidateFilters,
} from "@/lib/queries/discovery";

const STATUS_COLORS: Record<string, string> = {
  DISCOVERED: "badge-neutral",
  QUALIFIED: "badge-success",
  DUPLICATE: "badge-warning",
  REJECTED: "badge-danger",
  PROSPECT: "badge-accent",
  CONTACTED: "badge-accent",
  OWNER_INTERESTED: "badge-success",
  READY_FOR_IMPORT: "badge-success",
  IMPORTED: "badge-success",
};

const STATUS_VALUES = [
  "DISCOVERED",
  "QUALIFIED",
  "PROSPECT",
  "CONTACTED",
  "OWNER_INTERESTED",
  "READY_FOR_IMPORT",
  "IMPORTED",
  "REJECTED",
  "DUPLICATE",
];

const SORT_VALUES = [
  "newest",
  "highest_score",
  "best_completeness",
  "source",
  "city",
];

const DUPLICATE_VALUES = ["UNIQUE", "POSSIBLE_DUPLICATE", "CONFIRMED_DUPLICATE"];

export default function AdminDiscoveryPage() {
  const t = useTranslations("common");
  const td = useTranslations("adminDiscovery");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const [filters, setFilters] = useState<CandidateFilters>({
    limit: 20,
    offset: 0,
    sort_by: "newest",
    status: "",
  });
  const [selected, setSelected] = useState<DiscoveryCandidate | null>(null);
  const [importHost, setImportHost] = useState({
    host_name: "",
    host_phone: "",
    host_email: "",
    price: "",
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [runSource, setRunSource] = useState("");

  const { data: stats } = useDiscoveryStats();
  const { data: sources } = useDiscoverySources();
  const {
    data: candidateData,
    isLoading,
    isError,
    refetch,
  } = useDiscoveryCandidates(filters);
  const statusMutation = useUpdateCandidateStatus();
  const importMutation = useImportCandidate();
  const runMutation = useTriggerDiscoveryRun();

  const candidates = candidateData?.data ?? [];
  const pagination = candidateData?.pagination;

  const enabledSources = useMemo(
    () => (sources ?? []).filter((s) => s.status === "ENABLED"),
    [sources]
  );
  const effectiveRunSource = runSource || enabledSources[0]?.source || "";

  const handleFilterChange = useCallback(
    (key: keyof CandidateFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value || undefined, offset: 0 }));
    },
    []
  );

  const handleStatusUpdate = useCallback(
    async (id: string, status: string) => {
      await statusMutation.mutateAsync({ id, status });
      if (selected?.id === id) {
        setSelected(null);
      }
    },
    [statusMutation, selected]
  );

  const handleImport = useCallback(async () => {
    if (!selected) return;
    setImportError(null);
    try {
      const overrides: Record<string, unknown> = {};
      if (importHost.price) {
        overrides.price = Number(importHost.price);
      }
      await importMutation.mutateAsync({
        id: selected.id,
        host_name: importHost.host_name || undefined,
        host_phone: importHost.host_phone || undefined,
        host_email: importHost.host_email || undefined,
        overrides:
          Object.keys(overrides).length > 0 ? overrides : undefined,
      });
      setShowImportModal(false);
      setSelected(null);
    } catch (err) {
      const detail = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setImportError(detail || td("importFailed"));
    }
  }, [selected, importHost, importMutation, td]);

  const scoreColor = useMemo(
    () => (score: number) => {
      if (score >= 80) return "text-success-600";
      if (score >= 60) return "text-accent-600";
      if (score >= 40) return "text-warning-600";
      return "text-danger-600";
    },
    []
  );

  const statusLabel = (status: string) =>
    td.has(`statuses.${status}`)
      ? td(`statuses.${status}`)
      : status.replace(/_/g, " ").toLowerCase();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {td("title")}
              </h1>
              <div className="flex items-center gap-2">
                <label htmlFor="run-source" className="sr-only">
                  {td("runSource")}
                </label>
                <select
                  id="run-source"
                  value={effectiveRunSource}
                  onChange={(e) => setRunSource(e.target.value)}
                  className="input text-sm"
                  disabled={enabledSources.length === 0}
                >
                  {enabledSources.length === 0 && (
                    <option value="">{td("allSources")}</option>
                  )}
                  {enabledSources.map((s) => (
                    <option key={s.source} value={s.source}>
                      {s.source}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    runMutation.mutate({
                      source: effectiveRunSource || undefined,
                    })
                  }
                  disabled={runMutation.isPending || !effectiveRunSource}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {runMutation.isPending ? td("running") : td("triggerRun")}
                </button>
              </div>
            </div>

            {runMutation.isError && (
              <p className="text-sm text-danger-600" role="alert">
                {td("runFailed")}
              </p>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <StatCard label={td("statsTotal")} value={stats.total_candidates} />
                <StatCard label={td("statsUnique")} value={stats.unique_candidates} />
                <StatCard label={td("statsQualified")} value={stats.qualified_candidates} />
                <StatCard
                  label={td("statsSupplyLeads")}
                  value={stats.by_candidate_type?.SUPPLY_LEAD ?? 0}
                />
                <StatCard label={td("statsContactable")} value={stats.contactable_candidates ?? 0} />
                <StatCard label={td("statsImported")} value={stats.imported} />
              </div>
            )}

            {/* Sources */}
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sources.map((s) => (
                  <span
                    key={s.source}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      s.status === "ENABLED"
                        ? "bg-success-100 text-success-700"
                        : s.status === "MANUAL_SOURCE"
                          ? "bg-neutral-100 text-neutral-600"
                          : "bg-danger-100 text-danger-700"
                    }`}
                  >
                    {s.source} (
                    {s.status === "MANUAL_SOURCE"
                      ? td("statusManual")
                      : s.status.toLowerCase()}
                    )
                  </span>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.status ?? ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="input text-sm"
                aria-label={td("status")}
              >
                <option value="">{td("allStatus")}</option>
                {STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </select>

              <select
                value={filters.source ?? ""}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="input text-sm"
                aria-label={td("source")}
              >
                <option value="">{td("allSources")}</option>
                {(sources ?? []).map((s) => (
                  <option key={s.source} value={s.source}>
                    {s.source}
                  </option>
                ))}
              </select>

              <select
                value={filters.sort_by ?? "newest"}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                className="input text-sm"
                aria-label={td("title")}
              >
                {SORT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {td(`sorts.${value}`)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder={td("filterCity")}
                value={filters.city ?? ""}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="input text-sm"
              />

              <select
                value={filters.candidate_type ?? ""}
                onChange={(e) =>
                  handleFilterChange("candidate_type", e.target.value)
                }
                className="input text-sm"
                aria-label={td("candidateType")}
              >
                <option value="">{td("allTypes")}</option>
                <option value="PLACE">{td("candidateTypes.PLACE")}</option>
                <option value="SUPPLY_LEAD">
                  {td("candidateTypes.SUPPLY_LEAD")}
                </option>
              </select>

              <select
                value={filters.duplicate_status ?? ""}
                onChange={(e) =>
                  handleFilterChange("duplicate_status", e.target.value)
                }
                className="input text-sm"
                aria-label={td("duplicate")}
              >
                <option value="">{td("allDuplicates")}</option>
                {DUPLICATE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {td(`duplicates.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Candidates table */}
            {isLoading && (
              <div className="card p-8 text-center text-neutral-500">
                {t("loading")}
              </div>
            )}

            {isError && (
              <div className="card p-8 text-center">
                <p className="text-danger-600">{td("loadError")}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  {t("retry")}
                </button>
              </div>
            )}

            {!isLoading && !isError && candidates.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-neutral-500">{td("noCandidates")}</p>
              </div>
            )}

            {!isLoading && !isError && candidates.length > 0 && (
              <div className="overflow-x-auto overflow-y-hidden rounded-card border border-neutral-200 bg-surface-card">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("colTitle")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("source")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("leadType")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("city")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("type")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("price")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("score")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("contact")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("status")}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-neutral-500">
                        {td("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-surface-card">
                    {candidates.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50">
                        <td className="max-w-xs truncate px-4 py-3 text-sm font-medium text-brand-900">
                          {c.title || c.raw_title || td("untitled")}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {c.source}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              c.candidate_type === "SUPPLY_LEAD"
                                ? "bg-accent-100 text-accent-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {c.candidate_type === "SUPPLY_LEAD"
                              ? td("supply")
                              : td("place")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {c.city || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {c.property_type || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {c.nightly_price
                            ? `${c.nightly_price.toLocaleString(dateLocale)} ${c.currency || "EGP"}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`font-semibold ${scoreColor(
                              c.qualification_score
                            )}`}
                          >
                            {c.qualification_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {c.contact_status === "AVAILABLE" ? (
                            <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                              {c.contact_type}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">
                              {td("notAvailable")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[c.status] ||
                              "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {statusLabel(c.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelected(c)}
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            {td("review")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total > (filters.limit ?? 20) && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {td("showingOf", {
                    from: (filters.offset ?? 0) + 1,
                    to: Math.min(
                      (filters.offset ?? 0) + (filters.limit ?? 20),
                      pagination.total
                    ),
                    total: pagination.total,
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={filters.offset === 0}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        offset: Math.max(
                          0,
                          (prev.offset ?? 0) - (prev.limit ?? 20)
                        ),
                      }))
                    }
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {td("previous")}
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.has_more}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        offset: (prev.offset ?? 0) + (prev.limit ?? 20),
                      }))
                    }
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {td("next")}
                  </button>
                </div>
              </div>
            )}

            {/* Detail modal */}
            {selected && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setSelected(null)}
              >
                <div
                  className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-card bg-surface-card p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-brand-900">
                        {selected.title || selected.raw_title || td("untitled")}
                      </h2>
                      <a
                        href={selected.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-600 hover:text-accent-700 hover:underline"
                      >
                        {td("viewSource")}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                      aria-label={t("close")}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Images */}
                  {selected.image_urls.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                      {selected.image_urls.slice(0, 5).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={td("imageAlt", { n: i + 1 })}
                          className="h-24 w-32 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Scores */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <ScoreCard
                      label={td("qualification")}
                      value={selected.qualification_score}
                    />
                    <ScoreCard
                      label={td("completeness")}
                      value={selected.data_completeness_score}
                    />
                    <ScoreCard
                      label={td("sourceConfidence")}
                      value={selected.source_confidence * 100}
                    />
                  </div>

                  {/* Details */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <DetailRow
                      label={td("candidateType")}
                      value={
                        selected.candidate_type === "SUPPLY_LEAD"
                          ? td("supplyLead")
                          : td("place")
                      }
                    />
                    <DetailRow label={td("city")} value={selected.city} />
                    <DetailRow label={td("zone")} value={selected.zone} />
                    <DetailRow
                      label={td("propertyType")}
                      value={selected.property_type}
                    />
                    <DetailRow
                      label={td("bedrooms")}
                      value={selected.bedrooms?.toString()}
                    />
                    <DetailRow
                      label={td("bathrooms")}
                      value={selected.bathrooms?.toString()}
                    />
                    <DetailRow
                      label={td("guestCapacity")}
                      value={selected.guest_capacity?.toString()}
                    />
                    <DetailRow
                      label={td("nightlyPrice")}
                      value={
                        selected.nightly_price
                          ? `${selected.nightly_price.toLocaleString(dateLocale)} ${selected.currency || "EGP"}`
                          : null
                      }
                    />
                    <DetailRow
                      label={td("coordinates")}
                      value={
                        selected.latitude && selected.longitude
                          ? `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}`
                          : null
                      }
                    />
                    <DetailRow
                      label={td("contact")}
                      value={
                        selected.contact_status === "AVAILABLE"
                          ? `${selected.contact_type}: ${selected.contact_value}`
                          : td("notAvailable")
                      }
                    />
                    <DetailRow
                      label={td("duplicate")}
                      value={
                        selected.duplicate_status === "UNIQUE"
                          ? td("unique")
                          : `${statusLabel(selected.duplicate_status)} (${(
                              selected.duplicate_confidence * 100
                            ).toFixed(0)}%)`
                      }
                    />
                  </div>

                  {selected.description && (
                    <div className="mt-4">
                      <span className="font-medium text-neutral-700">
                        {td("description")}:
                      </span>
                      <p className="mt-1 text-sm text-neutral-600">
                        {selected.description}
                      </p>
                    </div>
                  )}

                  {selected.amenities.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-neutral-700">
                        {td("amenities")}:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.amenities.map((a) => (
                          <span
                            key={a}
                            className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.notes && (
                    <div className="mt-4 rounded-lg bg-neutral-50 p-3">
                      <span className="font-medium text-neutral-700">
                        {td("notes")}:
                      </span>
                      <p className="mt-1 text-sm text-neutral-600">
                        {selected.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selected.status === "DISCOVERED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selected.id, "QUALIFIED")
                        }
                        disabled={statusMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("qualify")}
                      </button>
                    )}
                    {selected.status === "QUALIFIED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selected.id, "PROSPECT")
                        }
                        disabled={statusMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("markProspect")}
                      </button>
                    )}
                    {selected.status === "PROSPECT" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selected.id, "CONTACTED")
                        }
                        disabled={statusMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("markContacted")}
                      </button>
                    )}
                    {selected.status === "CONTACTED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selected.id, "OWNER_INTERESTED")
                        }
                        disabled={statusMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("ownerInterested")}
                      </button>
                    )}
                    {selected.status === "OWNER_INTERESTED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selected.id, "READY_FOR_IMPORT")
                        }
                        disabled={statusMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("readyForImport")}
                      </button>
                    )}
                    {(selected.status === "READY_FOR_IMPORT" ||
                      selected.status === "OWNER_INTERESTED" ||
                      selected.status === "QUALIFIED" ||
                      selected.status === "PROSPECT") && (
                      <button
                        type="button"
                        onClick={() => {
                          setImportError(null);
                          setImportHost({
                            host_name: "",
                            host_phone:
                              selected.contact_type === "phone"
                                ? selected.contact_value || ""
                                : "",
                            host_email:
                              selected.contact_type === "email"
                                ? selected.contact_value || ""
                                : "",
                            price: selected.nightly_price
                              ? String(selected.nightly_price)
                              : "",
                          });
                          setShowImportModal(true);
                        }}
                        disabled={importMutation.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {td("importToStayOS")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate(selected.id, "REJECTED")
                      }
                      disabled={statusMutation.isPending}
                      className="btn-danger text-sm disabled:opacity-50"
                    >
                      {td("reject")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import modal */}
            {showImportModal && selected && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowImportModal(false)}
              >
                <div
                  className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-brand-900">
                    {td("importTitle")}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {td("importDescription")}
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">
                        {td("hostName")}
                      </label>
                      <input
                        type="text"
                        value={importHost.host_name}
                        onChange={(e) =>
                          setImportHost((prev) => ({
                            ...prev,
                            host_name: e.target.value,
                          }))
                        }
                        className="input mt-1 text-sm"
                        placeholder={td("hostNamePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">
                        {td("hostPhone")}
                      </label>
                      <input
                        type="text"
                        value={importHost.host_phone}
                        onChange={(e) =>
                          setImportHost((prev) => ({
                            ...prev,
                            host_phone: e.target.value,
                          }))
                        }
                        className="input mt-1 text-sm"
                        placeholder="+20..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">
                        {td("hostEmail")}
                      </label>
                      <input
                        type="text"
                        value={importHost.host_email}
                        onChange={(e) =>
                          setImportHost((prev) => ({
                            ...prev,
                            host_email: e.target.value,
                          }))
                        }
                        className="input mt-1 text-sm"
                        placeholder="owner@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">
                        {td("nightlyPriceEgp")}
                      </label>
                      <input
                        type="number"
                        value={importHost.price}
                        onChange={(e) =>
                          setImportHost((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        className="input mt-1 text-sm"
                        placeholder={td("pricePlaceholder")}
                        min={100}
                      />
                      {(!selected.nightly_price || selected.nightly_price < 100) && (
                        <p className="mt-1 text-xs text-warning-600">
                          {td("noPriceWarning")}
                        </p>
                      )}
                    </div>
                  </div>
                  {importError && (
                    <p className="mt-3 text-sm text-danger-600" role="alert">
                      {importError}
                    </p>
                  )}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {importMutation.isPending
                        ? td("importing")
                        : td("confirmImport")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-3 text-center">
      <p className="text-xl font-bold text-brand-900">{value.toFixed(0)}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="font-medium text-neutral-700">{label}:</span>{" "}
      <span className="text-neutral-600">{value || "—"}</span>
    </div>
  );
}
