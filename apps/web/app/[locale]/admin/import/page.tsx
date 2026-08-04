"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  useConfirmImport,
  usePreviewImport,
  type ImportPreviewResponse,
  type ImportRowData,
  type ImportSummaryResponse,
} from "@/lib/queries/import";

type Phase = "idle" | "preview" | "importing" | "complete";

export default function AdminImportPage() {
  const t = useTranslations("adminImport");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMutation = usePreviewImport();
  const confirmMutation = useConfirmImport();

  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setError(null);
      setPhase("idle");
      setPreview(null);
      setSummary(null);

      try {
        const result = await previewMutation.mutateAsync(file);
        setPreview(result);
        setPhase("preview");
      } catch {
        setError(t("previewFailed"));
      }
    },
    [previewMutation, t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleConfirm = async () => {
    if (!preview) return;
    setPhase("importing");
    setError(null);

    const validRows: ImportRowData[] = preview.rows
      .filter((r) => r.is_valid)
      .map((r) => ({
        row_number: r.row_number,
        title: r.title,
        description: "",
        city: r.city,
        governorate: r.governorate,
        latitude: 0,
        longitude: 0,
        property_type: r.property_type,
        price: r.price,
        host_name: r.host_name,
        host_phone: r.host_phone,
        host_email: r.host_email,
      }));

    if (validRows.length === 0) {
      setError(t("noValidRows"));
      setPhase("preview");
      return;
    }

    try {
      const result = await confirmMutation.mutateAsync(validRows);
      setSummary(result);
      setPhase("complete");
    } catch {
      setError(t("importFailed"));
      setPhase("preview");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setSelectedFile(null);
    setPreview(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>

          {error && (
            <div className="rounded-lg bg-danger-50 p-4">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {phase === "idle" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={previewMutation.isPending}
                className="mx-auto block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {previewMutation.isPending ? t("parsing") : t("selectFile")}
              </button>
              <p className="mt-3 text-sm text-neutral-500">{t("formatsHint")}</p>
            </div>
          )}

          {phase === "preview" && preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label={t("totalRows")}
                  value={preview.total_rows}
                  color="bg-neutral-100 text-neutral-700"
                />
                <StatCard
                  label={t("validRows")}
                  value={preview.valid_rows}
                  color="bg-success-100 text-success-700"
                />
                <StatCard
                  label={t("invalidRows")}
                  value={preview.invalid_rows + preview.duplicate_rows}
                  color="bg-danger-100 text-danger-700"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colTitle")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colCity")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colType")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colPrice")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colHost")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {preview.rows.map((row) => (
                      <tr
                        key={row.row_number}
                        className={row.is_valid ? "" : "bg-danger-50/50"}
                      >
                        <td className="px-4 py-3 text-sm text-neutral-500">{row.row_number}</td>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900">{row.title}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{row.city}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{row.property_type}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{row.price}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{row.host_name || row.host_phone || "—"}</td>
                        <td className="px-4 py-3">
                          {row.is_valid ? (
                            <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                              {t("valid")}
                            </span>
                          ) : row.is_duplicate ? (
                            <span className="inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                              {t("duplicate")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                              {t("invalid")}
                            </span>
                          )}
                          {row.errors.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {row.errors.map((err, i) => (
                                <li key={i} className="text-xs text-danger-600">
                                  {err.field}: {err.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={preview.valid_rows === 0}
                  className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {t("importValid")} ({preview.valid_rows})
                </button>
              </div>
            </div>
          )}

          {phase === "importing" && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
                <p className="mt-4 text-sm text-neutral-600">{t("importing")}</p>
              </div>
            </div>
          )}

          {phase === "complete" && summary && (
            <div className="space-y-4">
              <div className="rounded-xl bg-success-50 p-6 text-center">
                <h2 className="text-xl font-bold text-neutral-900">{t("importComplete")}</h2>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <StatCard label={t("totalRequested")} value={summary.total_requested} color="bg-neutral-100 text-neutral-700" />
                  <StatCard label={t("created")} value={summary.created} color="bg-success-100 text-success-700" />
                  <StatCard label={t("failed")} value={summary.failed} color="bg-danger-100 text-danger-700" />
                </div>
              </div>

              {summary.results.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colTitle")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colStatus")}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">{t("colError")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {summary.results.map((r) => (
                        <tr key={r.row_number}>
                          <td className="px-4 py-3 text-sm text-neutral-500">{r.row_number}</td>
                          <td className="px-4 py-3 text-sm font-medium text-neutral-900">{r.title}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                r.status === "created"
                                  ? "bg-success-100 text-success-700"
                                  : r.status === "skipped"
                                  ? "bg-warning-100 text-warning-700"
                                  : "bg-danger-100 text-danger-700"
                              }`}
                            >
                              {t(`resultStatus.${r.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-danger-600">{r.error || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {t("importAnother")}
                </button>
              </div>
            </div>
          )}
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
  );
}
