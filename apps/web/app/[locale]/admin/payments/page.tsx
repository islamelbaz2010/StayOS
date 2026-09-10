"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import {
  usePaymentQueue,
  useVerifyPayment,
  useRejectPayment,
  useRefundPayment,
  usePaymentProofDownloadUrl,
  type PaymentListItem,
} from "@/lib/queries/payments";
import { formatMoney, getApiErrorMessage } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("payment");
  const styles: Record<string, string> = {
    pending: "badge-warning",
    proof_uploaded: "badge-info",
    verified: "badge-success",
    rejected: "badge-danger",
    cancelled: "badge-neutral",
    refund_pending: "badge-warning",
    refunded: "badge-success",
  };
  const labels: Record<string, string> = {
    pending: t("statusPending"),
    proof_uploaded: t("statusProofUploaded"),
    verified: t("statusVerified"),
    rejected: t("statusRejected"),
    cancelled: t("statusCancelled"),
    refund_pending: t("statusRefundPending"),
    refunded: t("statusRefunded"),
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
  onRefund,
  isVerifying,
  isRejecting,
  isRefunding,
}: {
  payment: PaymentListItem;
  onVerify: (id: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
  onRefund: (id: string) => Promise<unknown>;
  isVerifying: boolean;
  isRejecting: boolean;
  isRefunding: boolean;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const proofDownload = usePaymentProofDownloadUrl();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!window.confirm(t("confirmVerify"))) return;
    setVerifyError(null);
    try {
      await onVerify(payment.id);
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, t("verifyError")));
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setRejectError(null);
    try {
      await onReject(payment.id, reason.trim());
      setShowReject(false);
      setReason("");
    } catch (err) {
      setRejectError(getApiErrorMessage(err, t("rejectError")));
    }
  };

  const handleRefund = async () => {
    if (!window.confirm(t("confirmRefund"))) return;
    setRefundError(null);
    try {
      await onRefund(payment.id);
    } catch (err) {
      setRefundError(getApiErrorMessage(err, t("refundError")));
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={payment.unit_cover_image || PLACEHOLDER_IMAGE}
            alt={payment.unit_title || payment.reference_number}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-brand-900">
            {payment.unit_title ?? t("untitledListing")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-medium text-brand-900">
              {payment.reference_number}
            </span>
            <StatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-neutral-600">
            {t("amount")}: {payment.amount_egp.toLocaleString(dateLocale)} {t("egp")}
          </p>
          {(payment.status === "refund_pending" || payment.status === "refunded") &&
            payment.refund_amount_egp != null && (
              <p className="text-sm text-neutral-600">
                {t("refundAmount")}: {formatMoney(payment.refund_amount_egp, "EGP", dateLocale)}
              </p>
            )}
          <p className="text-xs text-neutral-500">
            {t("bookingId")}: {payment.booking_id}
          </p>
          {payment.proof_uploaded_at && (
            <p className="text-xs text-neutral-500">
              {t("proofUploaded")}:{" "}
              {new Date(payment.proof_uploaded_at).toLocaleString(dateLocale)}
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
          {verifyError && (
            <p className="mb-3 rounded-md bg-danger-50 p-3 text-sm text-danger-700" role="alert">
              {verifyError}
            </p>
          )}
          {rejectError && (
            <p className="mb-3 rounded-md bg-danger-50 p-3 text-sm text-danger-700" role="alert">
              {rejectError}
            </p>
          )}
          {!showReject ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || isRejecting}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {isVerifying ? tc("loading") : t("approve")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectError(null);
                  setShowReject(true);
                }}
                disabled={isVerifying || isRejecting}
                className="btn-danger text-sm disabled:opacity-50"
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
                  disabled={!reason.trim() || isRejecting}
                  className="btn-danger text-sm disabled:opacity-50"
                >
                  {t("confirmReject")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setRejectError(null);
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

      {payment.status === "refund_pending" && (
        <div className="border-t border-neutral-200 p-4">
          {refundError && (
            <p
              className="mb-3 rounded-md bg-danger-50 p-3 text-sm text-danger-700"
              role="alert"
            >
              {refundError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefund}
              disabled={isRefunding}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isRefunding ? tc("loading") : t("markRefunded")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type QueueStatus = "pending" | "refund_pending" | "refunded";

export default function AdminPaymentQueuePage() {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<QueueStatus | undefined>(undefined);
  const {
    data: payments,
    isLoading,
    error,
    refetch,
  } = usePaymentQueue(status === "pending" ? undefined : status);
  const verifyMutation = useVerifyPayment();
  const rejectMutation = useRejectPayment();
  const refundMutation = useRefundPayment();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("queueTitle")}
          </h1>

          <div className="mb-6 flex flex-wrap gap-2">
            {(["pending", "refund_pending", "refunded"] as QueueStatus[]).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatus(tab === "pending" ? undefined : tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    (tab === "pending" && status === undefined) || status === tab
                      ? "bg-brand-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {t(`tab.${tab}`)}
                </button>
              )
            )}
          </div>

          {isLoading && (
            <div className="card p-8 text-center text-neutral-500">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="card p-8 text-center">
              <p className="text-danger-600">{t("loadError")}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {tc("retry")}
              </button>
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
                  onVerify={(id) => verifyMutation.mutateAsync(id)}
                  onReject={(id, reason) =>
                    rejectMutation.mutateAsync({
                      paymentId: id,
                      rejectReason: reason,
                    })
                  }
                  onRefund={(id) => refundMutation.mutateAsync(id)}
                  isVerifying={verifyMutation.isPending}
                  isRejecting={rejectMutation.isPending}
                  isRefunding={refundMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
