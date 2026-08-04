"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useApproveKyc, usePendingKyc, useRejectKyc } from "@/lib/queries/kyc";

export default function AdminKycPage() {
  const t = useTranslations("adminKyc");
  const { data, isPending, isError, refetch } = usePendingKyc();
  const approveMutation = useApproveKyc();
  const rejectMutation = useRejectKyc();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (documentId: string) => {
    approveMutation.mutate({ documentId });
  };

  const handleConfirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { documentId: rejectTarget, reason: rejectReason },
      { onSettled: () => {
        setRejectTarget(null);
        setRejectReason("");
      }}
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
          </div>

          {isError ? (
            <div className="rounded-xl bg-danger-50 p-6 text-center">
              <p className="text-sm text-danger-600">{t("loadError")}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-danger-600 hover:bg-danger-100"
              >
                {t("retry")}
              </button>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-lg font-medium text-neutral-700">{t("noPending")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.data.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl bg-white p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-900">
                        {t("documentId")}: <span className="font-normal text-neutral-600">{doc.id.slice(0, 8)}...</span>
                      </p>
                      <p className="text-sm text-neutral-600">
                        {t("documentType")}: {doc.document_type}
                      </p>
                      {doc.legal_name && (
                        <p className="text-sm text-neutral-600">
                          {t("legalName")}: {doc.legal_name}
                        </p>
                      )}
                      {doc.document_number && (
                        <p className="text-sm text-neutral-600">
                          {t("documentNumber")}: {doc.document_number}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400">
                        {t("submittedAt")}: {new Date(doc.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(doc.id)}
                        disabled={approveMutation.isPending}
                        className="rounded-md bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
                      >
                        {t("approve")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectTarget(doc.id)}
                        disabled={rejectMutation.isPending}
                        className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50"
                      >
                        {t("reject")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rejectTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setRejectTarget(null)}
            >
              <div
                className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-neutral-900">{t("confirmReject")}</h3>
                <label className="mt-4 block text-sm font-medium text-neutral-700">
                  {t("rejectReasonLabel")}
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder={t("rejectReasonPlaceholder")}
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(null);
                      setRejectReason("");
                    }}
                    className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                    className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50"
                  >
                    {t("confirmReject")}
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
