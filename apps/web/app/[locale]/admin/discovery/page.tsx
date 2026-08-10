"use client";

import { useCallback, useMemo, useState } from "react";
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
  DISCOVERED: "bg-neutral-100 text-neutral-700",
  QUALIFIED: "bg-success-100 text-success-700",
  DUPLICATE: "bg-warning-100 text-warning-700",
  REJECTED: "bg-danger-100 text-danger-700",
  PROSPECT: "bg-brand-100 text-brand-700",
  CONTACTED: "bg-brand-100 text-brand-700",
  OWNER_INTERESTED: "bg-success-100 text-success-700",
  READY_FOR_IMPORT: "bg-success-100 text-success-700",
  IMPORTED: "bg-success-200 text-success-800",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "DISCOVERED", label: "Discovered" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "OWNER_INTERESTED", label: "Owner Interested" },
  { value: "READY_FOR_IMPORT", label: "Ready for Import" },
  { value: "IMPORTED", label: "Imported" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DUPLICATE", label: "Duplicate" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest_score", label: "Highest Score" },
  { value: "best_completeness", label: "Best Completeness" },
  { value: "source", label: "Source" },
  { value: "city", label: "City" },
];

export default function AdminDiscoveryPage() {
  const t = useTranslations("common");
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

  const { data: stats } = useDiscoveryStats();
  const { data: sources } = useDiscoverySources();
  const { data: candidateData, isLoading } = useDiscoveryCandidates(filters);
  const statusMutation = useUpdateCandidateStatus();
  const importMutation = useImportCandidate();
  const runMutation = useTriggerDiscoveryRun();

  const candidates = candidateData?.data ?? [];
  const pagination = candidateData?.pagination;

  const handleFilterChange = useCallback((key: keyof CandidateFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, offset: 0 }));
  }, []);

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
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
      });
      setShowImportModal(false);
      setSelected(null);
    } catch {
      // error handled by mutation
    }
  }, [selected, importHost, importMutation]);

  const scoreColor = useMemo(
    () => (score: number) => {
      if (score >= 80) return "text-success-600";
      if (score >= 60) return "text-brand-600";
      if (score >= 40) return "text-warning-600";
      return "text-danger-600";
    },
    []
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Supply Discovery</h1>
            <button
              type="button"
              onClick={() => runMutation.mutate({ source: "airbnb" })}
              disabled={runMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {runMutation.isPending ? "Running..." : "Trigger Run"}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <StatCard label="Total" value={stats.total_candidates} />
              <StatCard label="Unique" value={stats.unique_candidates} />
              <StatCard label="Qualified" value={stats.qualified_candidates} />
              <StatCard label="Supply Leads" value={stats.by_candidate_type?.SUPPLY_LEAD ?? 0} />
              <StatCard label="Contactable" value={stats.contactable_candidates ?? 0} />
              <StatCard label="Imported" value={stats.imported} />
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
                  {s.source} ({s.status === "MANUAL_SOURCE" ? "manual" : s.status.toLowerCase()})
                </span>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status ?? ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={filters.source ?? ""}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              {(sources ?? []).map((s) => (
                <option key={s.source} value={s.source}>
                  {s.source}
                </option>
              ))}
            </select>

            <select
              value={filters.sort_by ?? "newest"}
              onChange={(e) => handleFilterChange("sort_by", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filter by city..."
              value={filters.city ?? ""}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />

            <select
              value={filters.candidate_type ?? ""}
              onChange={(e) => handleFilterChange("candidate_type", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="PLACE">Place</option>
              <option value="SUPPLY_LEAD">Supply Lead</option>
            </select>

            <select
              value={filters.duplicate_status ?? ""}
              onChange={(e) => handleFilterChange("duplicate_status", e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All Duplicates</option>
              <option value="UNIQUE">Unique</option>
              <option value="POSSIBLE_DUPLICATE">Possible Duplicate</option>
              <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate</option>
            </select>
          </div>

          {/* Candidates table */}
          {isLoading && (
            <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
              {t("loading")}
            </div>
          )}

          {!isLoading && candidates.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">No discovery candidates found.</p>
            </div>
          )}

          {!isLoading && candidates.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Lead Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">City</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="max-w-xs truncate px-4 py-3 text-sm font-medium text-neutral-900">
                        {c.title || c.raw_title || "Untitled"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{c.source}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.candidate_type === "SUPPLY_LEAD"
                            ? "bg-brand-100 text-brand-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {c.candidate_type === "SUPPLY_LEAD" ? "Supply" : "Place"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{c.city || "—"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{c.property_type || "—"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {c.nightly_price ? `${c.nightly_price.toLocaleString()} ${c.currency || "EGP"}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${scoreColor(c.qualification_score)}`}>
                          {c.qualification_score.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {c.contact_status === "AVAILABLE" ? (
                          <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                            {c.contact_type}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-neutral-100 text-neutral-600"}`}>
                          {c.status.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Review
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
                Showing {(filters.offset ?? 0) + 1}–{Math.min((filters.offset ?? 0) + (filters.limit ?? 20), pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={filters.offset === 0}
                  onClick={() => setFilters((prev) => ({ ...prev, offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 20)) }))}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!pagination.has_more}
                  onClick={() => setFilters((prev) => ({ ...prev, offset: (prev.offset ?? 0) + (prev.limit ?? 20) }))}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Next
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
                className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      {selected.title || selected.raw_title || "Untitled"}
                    </h2>
                    <a
                      href={selected.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-600 hover:underline"
                    >
                      View source →
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                        alt={`Image ${i + 1}`}
                        className="h-24 w-32 shrink-0 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Scores */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <ScoreCard label="Qualification" value={selected.qualification_score} />
                  <ScoreCard label="Completeness" value={selected.data_completeness_score} />
                  <ScoreCard label="Source Confidence" value={selected.source_confidence * 100} />
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <DetailRow label="Candidate Type" value={selected.candidate_type === "SUPPLY_LEAD" ? "Supply Lead" : "Place"} />
                  <DetailRow label="City" value={selected.city} />
                  <DetailRow label="Zone" value={selected.zone} />
                  <DetailRow label="Property Type" value={selected.property_type} />
                  <DetailRow label="Bedrooms" value={selected.bedrooms?.toString()} />
                  <DetailRow label="Bathrooms" value={selected.bathrooms?.toString()} />
                  <DetailRow label="Guest Capacity" value={selected.guest_capacity?.toString()} />
                  <DetailRow label="Nightly Price" value={selected.nightly_price ? `${selected.nightly_price.toLocaleString()} ${selected.currency || "EGP"}` : null} />
                  <DetailRow label="Coordinates" value={selected.latitude && selected.longitude ? `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}` : null} />
                  <DetailRow label="Contact" value={selected.contact_status === "AVAILABLE" ? `${selected.contact_type}: ${selected.contact_value}` : "Not available"} />
                  <DetailRow label="Duplicate" value={selected.duplicate_status === "UNIQUE" ? "Unique" : `${selected.duplicate_status} (${(selected.duplicate_confidence * 100).toFixed(0)}%)`} />
                </div>

                {selected.description && (
                  <div className="mt-4">
                    <span className="font-medium text-neutral-700">Description:</span>
                    <p className="mt-1 text-sm text-neutral-600">{selected.description}</p>
                  </div>
                )}

                {selected.amenities.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-neutral-700">Amenities:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selected.amenities.map((a) => (
                        <span key={a} className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div className="mt-4 rounded-lg bg-neutral-50 p-3">
                    <span className="font-medium text-neutral-700">Notes:</span>
                    <p className="mt-1 text-sm text-neutral-600">{selected.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {selected.status === "DISCOVERED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selected.id, "QUALIFIED")}
                      disabled={statusMutation.isPending}
                      className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                    >
                      Qualify
                    </button>
                  )}
                  {selected.status === "QUALIFIED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selected.id, "PROSPECT")}
                      disabled={statusMutation.isPending}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Mark as Prospect
                    </button>
                  )}
                  {selected.status === "PROSPECT" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selected.id, "CONTACTED")}
                      disabled={statusMutation.isPending}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Mark Contacted
                    </button>
                  )}
                  {selected.status === "CONTACTED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selected.id, "OWNER_INTERESTED")}
                      disabled={statusMutation.isPending}
                      className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                    >
                      Owner Interested
                    </button>
                  )}
                  {selected.status === "OWNER_INTERESTED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selected.id, "READY_FOR_IMPORT")}
                      disabled={statusMutation.isPending}
                      className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                    >
                      Ready for Import
                    </button>
                  )}
                  {(selected.status === "READY_FOR_IMPORT" || selected.status === "OWNER_INTERESTED" || selected.status === "QUALIFIED" || selected.status === "PROSPECT") && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportHost({
                          host_name: "",
                          host_phone: selected.contact_type === "phone" ? selected.contact_value || "" : "",
                          host_email: selected.contact_type === "email" ? selected.contact_value || "" : "",
                          price: selected.nightly_price ? String(selected.nightly_price) : "",
                        });
                        setShowImportModal(true);
                      }}
                      disabled={importMutation.isPending}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Import to StayOS
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selected.id, "REJECTED")}
                    disabled={statusMutation.isPending}
                    className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50"
                  >
                    Reject
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
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-neutral-900">Import Candidate</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  This will create a new listing in PENDING_VERIFICATION status via the existing import pipeline.
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Host Name</label>
                    <input
                      type="text"
                      value={importHost.host_name}
                      onChange={(e) => setImportHost((prev) => ({ ...prev, host_name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="Owner name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Host Phone</label>
                    <input
                      type="text"
                      value={importHost.host_phone}
                      onChange={(e) => setImportHost((prev) => ({ ...prev, host_phone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="+20..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Host Email</label>
                    <input
                      type="text"
                      value={importHost.host_email}
                      onChange={(e) => setImportHost((prev) => ({ ...prev, host_email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="owner@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Nightly Price (EGP)</label>
                    <input
                      type="number"
                      value={importHost.price}
                      onChange={(e) => setImportHost((prev) => ({ ...prev, price: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="Required — min 100"
                      min={100}
                    />
                    {(!selected.nightly_price || selected.nightly_price < 100) && (
                      <p className="mt-1 text-xs text-warning-600">Candidate has no price — enter one to import.</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {importMutation.isPending ? "Importing..." : "Confirm Import"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-card">
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-3 text-center">
      <p className="text-xl font-bold text-neutral-900">{value.toFixed(0)}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="font-medium text-neutral-700">{label}:</span>{" "}
      <span className="text-neutral-600">{value || "—"}</span>
    </div>
  );
}
