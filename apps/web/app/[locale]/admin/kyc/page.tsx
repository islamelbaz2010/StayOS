"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  useApproveKyc,
  useKycDocumentImages,
  usePendingKyc,
  useRejectKyc,
  type KycImageDownload,
} from "@/lib/queries/kyc";

export default function AdminKycPage() {
  const t = useTranslations("adminKyc");
  const { locale = "ar" } = useParams<{ locale: string }>();
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
      {
        onSettled: () => {
          setRejectTarget(null);
          setRejectReason("");
        },
      }
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>

            {isError ? (
              <div className="rounded-card bg-danger-50 p-6 text-center">
                <p className="text-sm text-danger-600">{t("loadError")}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn-secondary mt-3 text-sm"
                >
                  {t("retry")}
                </button>
              </div>
            ) : isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-card bg-neutral-100"
                  />
                ))}
              </div>
            ) : data?.data.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-lg font-medium text-neutral-700">
                  {t("noPending")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.data.map((doc) => (
                  <div key={doc.id} className="card p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-brand-900">
                          {t("documentId")}:{" "}
                          <span className="font-normal text-neutral-600">
                            {doc.id.slice(0, 8)}...
                          </span>
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
                          {t("submittedAt")}:{" "}
                          {new Date(doc.updated_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(doc.id)}
                          disabled={approveMutation.isPending}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {t("approve")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(doc.id)}
                          disabled={rejectMutation.isPending}
                          className="btn-danger text-sm disabled:opacity-50"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    </div>
                    <KycDocumentImages documentId={doc.id} />
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
                  className="mx-4 w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-brand-900">
                    {t("confirmReject")}
                  </h3>
                  <label className="mt-4 block text-sm font-medium text-neutral-700">
                    {t("rejectReasonLabel")}
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="input mt-1 min-h-[5rem] text-sm"
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
                      className="btn-danger text-sm disabled:opacity-50"
                    >
                      {t("confirmReject")}
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

function KycDocumentImages({ documentId }: { documentId: string }) {
  const t = useTranslations("adminKyc");
  const tc = useTranslations("common");
  const { data, isPending, isError } = useKycDocumentImages(documentId);

  if (isPending) {
    return <p className="text-xs text-neutral-500">{tc("loading")}</p>;
  }
  if (isError || !data) {
    return null;
  }

  const images: { label: string; url: string | null }[] = [
    { label: t("viewFront"), url: data.front_url },
    { label: t("viewBack"), url: data.back_url },
    { label: t("viewSelfie"), url: data.selfie_url },
  ];

  const visible = images.filter((i) => i.url);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {visible.map((image) => (
        <a
          key={image.label}
          href={image.url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
        >
          {image.label}
        </a>
      ))}
    </div>
  );
}
