"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { ProofUpload } from "@/components/payments/ProofUpload";
import { useBooking } from "@/lib/queries/bookings";
import { usePaymentByBooking } from "@/lib/queries/payments";
import { formatDate } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("payment");
  const variants: Record<string, string> = {
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
    <span className={variants[status] || variants.pending}>
      {labels[status] || status}
    </span>
  );
}

function CheckoutContent({
  bookingId,
  locale,
}: {
  bookingId: string;
  locale: string;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId);
  const { data: payment, isLoading: paymentLoading } = usePaymentByBooking(bookingId);

  if (bookingLoading || paymentLoading) {
    return (
      <div className="card p-8 text-center text-neutral-500">
        {tc("loading")}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card p-8 text-center text-danger-600">
        {t("bookingNotFound")}
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="card p-8 text-center">
        <p className="text-neutral-600">{t("noPaymentYet")}</p>
        <p className="mt-2 text-sm text-neutral-500">{t("noPaymentHint")}</p>
      </div>
    );
  }

  const canUpload =
    payment.status === "pending" || payment.status === "rejected";

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-neutral-500">{t("paymentStatus")}</p>
            <div className="mt-2">
              <StatusBadge status={payment.status} />
            </div>
          </div>
          {payment.reject_reason && (
            <div className="max-w-sm rounded-md bg-danger-50 p-3">
              <p className="text-sm font-medium text-danger-700">
                {t("rejectReason")}
              </p>
              <p className="text-sm text-neutral-700">{payment.reject_reason}</p>
            </div>
          )}
        </div>
      </div>

      {canUpload && payment.payment_deadline_at && (
        <div className="card border-l-4 border-l-warning-500 bg-warning-50 p-5">
          <p className="text-sm font-medium text-warning-700">
            {t("deadlineWarning", {
              deadline: new Date(payment.payment_deadline_at).toLocaleString(
                dateLocale
              ),
            })}
          </p>
        </div>
      )}

      {canUpload && payment.proof_rejection_count > 0 && (
        <p className="text-sm text-danger-600">
          {t("attemptsRemaining", {
            count: Math.max(0, 3 - payment.proof_rejection_count),
          })}
        </p>
      )}

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          {t("bookingSummary")}
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("referenceNumber")}</dt>
            <dd className="font-mono font-medium text-brand-900">
              {payment.reference_number}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkIn")}</dt>
            <dd className="font-medium text-brand-900">
              {formatDate(new Date(booking.check_in), dateLocale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkOut")}</dt>
            <dd className="font-medium text-brand-900">
              {formatDate(new Date(booking.check_out), dateLocale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("nights")}</dt>
            <dd className="font-medium text-brand-900">{payment.nights}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3">
            <dt className="text-base font-bold text-brand-900">
              {t("totalAmount")}
            </dt>
            <dd className="text-base font-bold text-accent-600">
              {payment.amount_egp.toLocaleString()} {t("egp")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          {t("paymentInstructions")}
        </h2>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-700">
          {payment.instructions}
        </pre>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          {t("uploadProofTitle")}
        </h2>
        <p className="mb-4 text-sm text-neutral-600">{t("uploadProofHint")}</p>

        {payment.proof_s3_key && (
          <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">
              {t("currentProof")}
            </p>
            <a
              href={`/api/v1/payments/${payment.id}/proof/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-accent-600 hover:text-accent-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
            >
              {t("viewPdf")}
            </a>
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
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <Link
              href={`/${locale}`}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              {t("backHome")}
            </Link>
            <Link
              href={`/${locale}/bookings`}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              {t("backToTrips")}
            </Link>
          </div>
          <h1 className="mb-6 text-2xl font-bold text-brand-900">
            {t("checkoutTitle")}
          </h1>
          <CheckoutContent bookingId={bookingId} locale={locale} />
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
