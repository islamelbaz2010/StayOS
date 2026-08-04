"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProofUpload } from "@/components/payments/ProofUpload";
import { useBooking } from "@/lib/queries/bookings";
import { usePaymentByBooking } from "@/lib/queries/payments";

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function CheckoutContent({ bookingId }: { bookingId: string }) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId);
  const { data: payment, isLoading: paymentLoading } =
    usePaymentByBooking(bookingId);

  if (bookingLoading || paymentLoading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
        {tc("loading")}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
        {t("bookingNotFound")}
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-card">
        <p className="text-neutral-600">{t("noPaymentYet")}</p>
        <p className="mt-2 text-sm text-neutral-500">{t("noPaymentHint")}</p>
      </div>
    );
  }

  const canUpload =
    payment.status === "pending" || payment.status === "rejected";

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
        <div>
          <p className="text-sm text-neutral-500">{t("paymentStatus")}</p>
          <StatusBadge status={payment.status} />
        </div>
        {payment.reject_reason && (
          <div className="max-w-xs text-end">
            <p className="text-sm font-medium text-danger-600">
              {t("rejectReason")}
            </p>
            <p className="text-sm text-neutral-600">{payment.reject_reason}</p>
          </div>
        )}
      </div>

      {/* Booking summary */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("bookingSummary")}
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("referenceNumber")}</dt>
            <dd className="font-mono font-medium text-neutral-900">
              {payment.reference_number}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkIn")}</dt>
            <dd className="font-medium text-neutral-900">{booking.check_in}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkOut")}</dt>
            <dd className="font-medium text-neutral-900">
              {booking.check_out}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("nights")}</dt>
            <dd className="font-medium text-neutral-900">{payment.nights}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3">
            <dt className="text-lg font-bold text-neutral-900">
              {t("totalAmount")}
            </dt>
            <dd className="text-lg font-bold text-primary-600">
              {payment.amount_egp.toLocaleString()} {t("egp")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Payment instructions */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("paymentInstructions")}
        </h2>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-700">
          {payment.instructions}
        </pre>
      </div>

      {/* Proof upload */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("uploadProofTitle")}
        </h2>
        <p className="mb-4 text-sm text-neutral-600">{t("uploadProofHint")}</p>

        {payment.proof_url && (
          <div className="mb-4 rounded-lg border border-neutral-200 p-3">
            <p className="mb-2 text-sm font-medium text-neutral-700">
              {t("currentProof")}
            </p>
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
                className="max-h-48 rounded-lg border border-neutral-200"
              />
            )}
          </div>
        )}

        {canUpload ? (
          <ProofUpload paymentId={payment.id} />
        ) : (
          <p className="text-sm text-neutral-500">{t("uploadDisabled")}</p>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("payment");
  const params = useParams<{ locale: string; bookingId: string }>();
  const locale = params?.locale ?? "ar";
  const bookingId = params?.bookingId ?? "";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-2xl p-4 sm:p-6">
          <div className="mb-6 flex items-center gap-4">
            <Link
              href={`/${locale}`}
              className="text-sm text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {t("backHome")}
            </Link>
            <Link
              href={`/${locale}/bookings`}
              className="text-sm text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {t("backToTrips")}
            </Link>
          </div>
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("checkoutTitle")}
          </h1>
          <CheckoutContent bookingId={bookingId} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
