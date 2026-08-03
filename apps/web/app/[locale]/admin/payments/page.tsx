"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  usePaymentQueue,
  useVerifyPayment,
  useRejectPayment,
  type PaymentListItem,
} from "@/lib/queries/payments";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("payment");
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    proof_uploaded: "bg-blue-100 text-blue-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-neutral-200 text-neutral-700",
  };
  const labels: Record<string, string> = {
    pending: t("statusPending"),
    proof_uploaded: t("statusProofUploaded"),
    verified: t("statusVerified"),
    rejected: t("statusRejected"),
    cancelled: t("statusCancelled"),
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
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
    <div className="overflow-hidden rounded-xl bg-white shadow-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-medium text-neutral-900">
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

        {payment.proof_url && (
          <div className="shrink-0">
            {payment.proof_url.endsWith(".pdf") ? (
              <a
                href={payment.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {t("viewPdf")}
              </a>
            ) : (
              <img
                src={payment.proof_url}
                alt={t("proofImage")}
                className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
              />
            )}
          </div>
        )}
      </div>

      {payment.status === "proof_uploaded" && (
        <div className="border-t border-neutral-200 p-4">
          {!showReject ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onVerify(payment.id)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                {t("approve")}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(true)}
                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                className="w-full rounded-lg border border-neutral-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder={t("rejectReasonPlaceholder")}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!reason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  {t("confirmReject")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                  }}
                  className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
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
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("queueTitle")}
          </h1>

          {isLoading && (
            <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
            </div>
          )}

          {payments && payments.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
