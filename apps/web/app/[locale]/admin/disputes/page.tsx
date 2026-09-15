"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useAdminDisputes,
  useUpdateDispute,
  type Dispute,
  type DisputeStatus,
} from "@/lib/queries/disputes";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["open", "in_review", "resolved", "closed"] as const;
const NEXT_STATUSES: Record<string, DisputeStatus[]> = {
  open: ["in_review", "resolved", "closed"],
  in_review: ["resolved", "closed"],
  resolved: [],
  closed: [],
};

export default function AdminDisputesPage() {
  const t = useTranslations("adminDisputes");
  const tc = useTranslations("common");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isPending, isError, refetch } = useAdminDisputes(statusFilter);
  const updateMutation = useUpdateDispute();

  const disputes = data?.data ?? [];

  const setStatus = (dispute: Dispute, status: DisputeStatus) => {
    updateMutation.mutate(
      {
        dispute_id: dispute.id,
        status,
        admin_notes: notes || undefined,
      },
      { onSuccess: () => setSelected(null) }
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter(undefined)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                !statusFilter
                  ? "bg-brand-900 text-white"
                  : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {t("all")}
            </button>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  statusFilter === s
                    ? "bg-brand-900 text-white"
                    : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                )}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="card p-8 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : disputes.length === 0 ? (
            <div className="card p-12 text-center text-neutral-500">
              {t("empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelected(d);
                    setNotes(d.admin_notes ?? "");
                  }}
                  className="card w-full p-4 text-start transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-900">
                        {t(`category.${d.category}`)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {d.description}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {d.reporter_name ?? d.reporter_id} ·{" "}
                        {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        d.status === "open" && "bg-danger-100 text-danger-700",
                        d.status === "in_review" &&
                          "bg-warning-100 text-warning-700",
                        d.status === "resolved" &&
                          "bg-success-100 text-success-700",
                        d.status === "closed" &&
                          "bg-neutral-100 text-neutral-600"
                      )}
                    >
                      {t(`status.${d.status}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelected(null)}
            >
              <div
                className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-brand-900">
                    {t(`category.${selected.category}`)}
                  </h2>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                    {t(`status.${selected.status}`)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-neutral-700">
                  {selected.description}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {t("booking")}: {selected.booking_id}
                </p>

                <label className="mt-4 block text-sm font-medium text-neutral-700">
                  {t("adminNotes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input mt-1 w-full text-sm"
                />

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  {NEXT_STATUSES[selected.status]?.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => setStatus(selected, s)}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50",
                        s === "resolved"
                          ? "btn-primary"
                          : s === "closed"
                            ? "btn-danger"
                            : "btn-secondary"
                      )}
                    >
                      {t(`status.${s}`)}
                    </button>
                  ))}
                  {selected.status !== "resolved" &&
                    selected.status !== "closed" &&
                    NEXT_STATUSES[selected.status]?.length === 0 && null}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {tc("cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
