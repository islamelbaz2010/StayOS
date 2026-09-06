"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import {
  usePaymentQueue,
  useVerifyPayment,
  useRejectPayment,
  usePaymentProofDownloadUrl,
  type PaymentListItem,
} from "@/lib/queries/payments";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("payment");
  const styles: Record<string, string> = {
    pending: "badge-warning",
    proof_uploaded: "badge-info",
    verified: "badge-success",
    rejected: "badge-danger",
    cancelled: "badge-neutral",
  };
  const labels: Record<string, string> = {
    pending: t("statusPending"),
    proof_uploaded: t("statusProofUploaded"),
    verified: t("statusVerified"),
    rejected: t("statusRejected"),
    cancelled: t("statusCancelled"),
  };
  return (
    <span className={`${styles[status] ?? styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentCard({
  payment,
  onVerify,
  onReject,
}: {
  payment: PaymentListItem;
  onVerify: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const proofDownload = usePaymentProofDownloadUrl();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (reason.trim()) {
      onReject(payment.id, reason.trim());
      setShowReject(false);
      setReason("");
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-medium text-brand-900">
              {payment.reference_number}
            </span>
            <StatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-neutral-600">
            {t("amount")}: {payment.amount_egp.toLocaleString()} {t("egp")}
          </p>
          <p className="text-xs text-neutral-500">
            {t("bookingId")}: {payment.booking_id}
          </p>
          {payment.proof_uploaded_at && (
            <p className="text-xs text-neutral-500">
              {t("proofUploaded")}:{" "}
              {new Date(payment.proof_uploaded_at).toLocaleString()}
            </p>
          )}
        </div>

        {payment.proof_s3_key && (
          <div className="shrink-0">
            <button
              type="button"
              disabled={proofDownload.isPending}
              onClick={() =>
                proofDownload.mutate(payment.id, {
                  onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
                })
              }
              className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline disabled:opacity-50"
            >
              {proofDownload.isPending ? tc("loading") : t("viewPdf")}
            </button>
          </div>
        )}
      </div>

      {payment.status === "proof_uploaded" && (
        <div className="border-t border-neutral-200 p-4">
          {!showReject ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onVerify(payment.id)}
                className="btn-primary text-sm"
              >
                {t("approve")}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(true)}
                className="btn-danger text-sm"
              >
                {t("reject")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label
                htmlFor={`reason-${payment.id}`}
                className="block text-sm font-medium text-neutral-700"
              >
                {t("rejectReasonLabel")}
              </label>
              <textarea
                id={`reason-${payment.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="input min-h-[5rem] text-sm"
                placeholder={t("rejectReasonPlaceholder")}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!reason.trim()}
                  className="btn-danger text-sm disabled:opacity-50"
                >
                  {t("confirmReject")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                  }}
                  className="btn-secondary text-sm"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPaymentQueuePage() {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const { data: payments, isLoading, error } = usePaymentQueue();
  const verifyMutation = useVerifyPayment();
  const rejectMutation = useRejectPayment();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("queueTitle")}
          </h1>

          {isLoading && (
            <div className="card p-8 text-center text-neutral-500">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="card p-8 text-center text-danger-600">
              {t("loadError")}
            </div>
          )}

          {payments && payments.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-neutral-500">{t("noPendingPayments")}</p>
            </div>
          )}

          {payments && payments.length > 0 && (
            <div className="space-y-4">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={(id) => verifyMutation.mutate(id)}
                  onReject={(id, reason) =>
                    rejectMutation.mutate({
                      paymentId: id,
                      rejectReason: reason,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
