"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { ProofUpload } from "@/components/payments/ProofUpload";
import { useAuth } from "@/lib/auth/useAuth";
import { useBooking, useStayInfo } from "@/lib/queries/bookings";
import {
  useCheckoutSession,
  usePaymentByBooking,
  usePaymentProofDownloadUrl,
  usePaymentReturnStatus,
} from "@/lib/queries/payments";
import { formatDate, getApiErrorMessage } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("payment");
  const variants: Record<string, string> = {
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
  const searchParams = useSearchParams();
  // Returned from Paymob hosted checkout? The redirect is navigation only —
  // the webhook is authoritative, so poll the server until it confirms.
  const returnedFromPaymob =
    searchParams.get("from") === "paymob" ||
    (searchParams.has("success") && searchParams.has("id"));
  const providerFailed = searchParams.get("success") === "false";
  // Give the webhook up to 90s to reconcile before falling back to the
  // ordinary status display — never trust the redirect params alone.
  const [confirmWindowOpen, setConfirmWindowOpen] = useState(true);
  useEffect(() => {
    if (!returnedFromPaymob) return;
    const timer = setTimeout(() => setConfirmWindowOpen(false), 90_000);
    return () => clearTimeout(timer);
  }, [returnedFromPaymob]);
  const pollWhilePending = (p: { status: string } | null | undefined) =>
    returnedFromPaymob &&
    confirmWindowOpen &&
    (!p || ["pending", "proof_uploaded", "rejected"].includes(p.status))
      ? 3000
      : false;
  const {
    data: booking,
    isLoading: bookingLoading,
    error: bookingQueryError,
    refetch: refetchBooking,
  } = useBooking(bookingId, {
    refetchInterval:
      returnedFromPaymob && confirmWindowOpen && !providerFailed
        ? 3000
        : false,
  });
  const {
    data: payment,
    isLoading: paymentLoading,
    isError: paymentError,
    refetch: refetchPayment,
  } = usePaymentByBooking(bookingId, { refetchInterval: pollWhilePending });
  const proofDownload = usePaymentProofDownloadUrl();
  const checkoutSession = useCheckoutSession();
  const { data: stayInfo } = useStayInfo(bookingId);

  function handlePayByCard() {
    if (!payment) return;
    if (payment.checkout_url) {
      window.location.href = payment.checkout_url;
      return;
    }
    checkoutSession.mutate(payment.id, {
      onSuccess: (data) => {
        const url = data.checkout_url;
        if (url) {
          window.location.href = url;
        }
      },
    });
  }

  if (bookingLoading || paymentLoading) {
    return (
      <div className="card p-8 text-center text-neutral-500">
        {tc("loading")}
      </div>
    );
  }

  const bookingNotFound =
    (bookingQueryError as { response?: { status?: number } } | null)?.response
      ?.status === 404;

  if (bookingNotFound) {
    return (
      <div className="card p-8 text-center">
        <p className="text-danger-600">{t("bookingNotFound")}</p>
        <Link
          href={`/${locale}/bookings`}
          className="mt-3 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {t("backToTrips")}
        </Link>
      </div>
    );
  }

  if (bookingQueryError || paymentError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-danger-600">{t("loadError")}</p>
        <button
          type="button"
          onClick={() => {
            refetchBooking();
            refetchPayment();
          }}
          className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {tc("retry")}
        </button>
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
      {returnedFromPaymob && payment.status === "verified" && (
        <div
          className="card border-s-4 border-s-success-500 bg-success-50 p-5"
          role="status"
        >
          <p className="font-semibold text-success-700">
            {t("paymobReturnConfirmed")}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("paymobReturnConfirmedHint")}
          </p>
        </div>
      )}
      {returnedFromPaymob &&
        providerFailed &&
        payment.status !== "verified" && (
          <div
            className="card border-s-4 border-s-warning-500 bg-warning-50 p-5"
            role="alert"
          >
            <p className="font-semibold text-warning-700">
              {t("paymobReturnFailed")}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {t("paymobReturnFailedHint")}
            </p>
          </div>
        )}
      {returnedFromPaymob &&
        !providerFailed &&
        payment.status !== "verified" &&
        confirmWindowOpen && (
          <div
            className="card border-s-4 border-s-accent-500 bg-accent-50 p-5"
            role="status"
          >
            <p className="font-semibold text-accent-700">
              {t("paymobReturnConfirming")}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {t("paymobReturnConfirmingHint")}
            </p>
          </div>
        )}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src={booking.unit_cover_image || PLACEHOLDER_IMAGE}
              alt={booking.unit_title || t("bookingSummary")}
              fill
              sizes="144px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-base font-semibold text-brand-900">
              {booking.unit_title ?? t("untitledListing")}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {formatDate(booking.check_in, dateLocale)} - {formatDate(booking.check_out, dateLocale)}
            </p>
          </div>
        </div>
      </div>

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
        <div className="card border-s-4 border-s-warning-500 bg-warning-50 p-5">
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
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">{t("referenceNumber")}</dt>
            <dd className="break-all font-mono font-medium text-brand-900">
              {payment.reference_number}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkIn")}</dt>
            <dd className="font-medium text-brand-900">
              {formatDate(booking.check_in, dateLocale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("checkOut")}</dt>
            <dd className="font-medium text-brand-900">
              {formatDate(booking.check_out, dateLocale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t("nights")}</dt>
            <dd className="font-medium text-brand-900">{payment.nights}</dd>
          </div>
          {payment.accommodation_amount_egp != null && (
            <div className="flex justify-between">
              <dt className="text-neutral-600">{t("accommodation")}</dt>
              <dd className="font-medium text-brand-900">
                {payment.accommodation_amount_egp.toLocaleString(dateLocale)}{" "}
                {t("egp")}
              </dd>
            </div>
          )}
          {payment.vat_egp ? (
            <div className="flex justify-between">
              <dt className="text-neutral-600">{t("vatLine")}</dt>
              <dd className="font-medium text-brand-900">
                {payment.vat_egp.toLocaleString(dateLocale)} {t("egp")}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-neutral-200 pt-3">
            <dt className="text-base font-bold text-brand-900">
              {t("totalAmount")}
            </dt>
            <dd className="text-base font-bold text-accent-600">
              {payment.amount_egp.toLocaleString(dateLocale)} {t("egp")}
            </dd>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{t("includesAllFees")}</p>
        </dl>
      </div>

      {canUpload && (
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-brand-900">
            {t("payByCardTitle")}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{t("payByCardHint")}</p>
          <button
            type="button"
            onClick={handlePayByCard}
            disabled={checkoutSession.isPending}
            className="btn-primary mt-4 w-full py-3 text-sm font-semibold disabled:opacity-60"
          >
            {checkoutSession.isPending
              ? tc("loading")
              : t("payByCardCta", {
                  amount: payment.amount_egp.toLocaleString(dateLocale),
                })}
          </button>
          {checkoutSession.isError && (
            <p className="mt-2 text-sm text-danger-600" role="alert">
              {getApiErrorMessage(
                checkoutSession.error,
                t("payByCardError")
              )}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-neutral-500">
            {t("payByCardSecure")}
          </p>
        </div>
      )}

      {stayInfo?.property?.cancellation_policy && (
        <div className="card p-5 sm:p-6">
          <h2 className="mb-2 text-lg font-bold text-brand-900">
            {t("cancellationPolicy")}
          </h2>
          <p className="text-sm text-neutral-600">
            {t(`cancellationPolicies.${stayInfo.property.cancellation_policy.toLowerCase()}`)}
          </p>
        </div>
      )}

      <details className="card p-5 sm:p-6" open={!canUpload}>
        <summary className="cursor-pointer text-sm font-semibold text-brand-900">
          {t("manualTransferTitle")}
        </summary>
        <p className="mt-2 text-sm text-neutral-600">
          {t("manualTransferHint")}
        </p>

        <div className="mt-4 rounded-lg bg-neutral-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-brand-900">
            {t("paymentInstructions")}
          </h3>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-700">
            {payment.instructions}
          </pre>
        </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-brand-900">
          {t("uploadProofTitle")}
        </h3>
        <p className="mb-4 text-sm text-neutral-600">{t("uploadProofHint")}</p>

        {payment.proof_s3_key && (
          <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">
              {t("currentProof")}
            </p>
            <button
              type="button"
              disabled={proofDownload.isPending}
              onClick={() =>
                proofDownload.mutate(payment.id, {
                  onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
                })
              }
              className="text-sm font-semibold text-accent-600 hover:text-accent-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {proofDownload.isPending ? tc("loading") : t("viewPdf")}
            </button>
          </div>
        )}

        {canUpload ? (
          <ProofUpload paymentId={payment.id} />
        ) : (
          <p className="text-sm text-neutral-500">{t("uploadDisabled")}</p>
        )}
      </div>
      </details>
    </div>
  );
}

// Unauthenticated return view — shown when a guest comes back from hosted
// checkout without a session. The unguessable `pr` token authorizes a
// read-only server status lookup; Paymob redirect params are never trusted
// as proof and nothing on this view mutates financial state.
function PaymentReturnView({
  bookingId,
  token,
  locale,
}: {
  bookingId: string;
  token: string;
  locale: string;
}) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const [confirmWindowOpen, setConfirmWindowOpen] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setConfirmWindowOpen(false), 90_000);
    return () => clearTimeout(timer);
  }, []);
  const { data, error, isLoading } = usePaymentReturnStatus(bookingId, token, {
    refetchInterval: (status) =>
      confirmWindowOpen &&
      (!status ||
        ["pending", "proof_uploaded", "rejected"].includes(
          status.payment_status
        ))
        ? 3000
        : false,
  });

  if (isLoading) {
    return (
      <div className="card p-8 text-center text-neutral-500">
        {tc("loading")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-brand-900">
          {t("returnLinkInvalidTitle")}
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          {t("returnLinkInvalidHint")}
        </p>
        <Link
          href={`/${locale}/auth/login`}
          className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {t("signInToViewBooking")}
        </Link>
      </div>
    );
  }

  const status = data.payment_status;
  const isVerified = status === "verified";
  const isFailed = ["cancelled", "refunded", "refund_pending"].includes(status);
  const stillPending = !isVerified && !isFailed;

  return (
    <div className="space-y-6">
      {isVerified && (
        <div
          className="card border-s-4 border-s-success-500 bg-success-50 p-5"
          role="status"
        >
          <p className="font-semibold text-success-700">
            {t("paymobReturnConfirmed")}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("paymobReturnConfirmedHint")}
          </p>
        </div>
      )}
      {isFailed && (
        <div
          className="card border-s-4 border-s-warning-500 bg-warning-50 p-5"
          role="alert"
        >
          <p className="font-semibold text-warning-700">
            {t("paymobReturnFailed")}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("paymobReturnFailedHint")}
          </p>
        </div>
      )}
      {stillPending && confirmWindowOpen && (
        <div
          className="card border-s-4 border-s-accent-500 bg-accent-50 p-5"
          role="status"
        >
          <p className="font-semibold text-accent-700">
            {t("paymobReturnConfirming")}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("paymobReturnConfirmingHint")}
          </p>
        </div>
      )}
      {stillPending && !confirmWindowOpen && (
        <div
          className="card border-s-4 border-s-warning-500 bg-warning-50 p-5"
          role="status"
        >
          <p className="font-semibold text-warning-700">
            {t("returnStillProcessing")}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("returnStillProcessingHint")}
          </p>
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          {t("bookingSummary")}
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">{t("paymentStatus")}</dt>
            <dd>
              <StatusBadge status={status} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">{t("bookingStatus")}</dt>
            <dd className="font-medium text-brand-900">
              {t(`bookingStatuses.${data.booking_status}`)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">{t("referenceNumber")}</dt>
            <dd className="break-all font-mono font-medium text-brand-900">
              {data.reference_number}
            </dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3">
            <dt className="text-base font-bold text-brand-900">
              {t("totalAmount")}
            </dt>
            <dd className="text-base font-bold text-accent-600">
              {data.amount_egp.toLocaleString(dateLocale)} {t("egp")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-5 text-center sm:p-6">
        <p className="text-sm text-neutral-600">{t("returnSignInHint")}</p>
        <Link
          href={`/${locale}/auth/login?redirect=${encodeURIComponent(
            `/${locale}/bookings/${bookingId}`
          )}`}
          className="btn-primary mt-3 inline-block px-6 py-2 text-sm font-semibold"
        >
          {t("signInToViewBooking")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string; bookingId: string }>();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const locale = params?.locale ?? "ar";
  const bookingId = params?.bookingId ?? "";

  const returnToken = searchParams.get("pr");
  const isProviderReturn =
    searchParams.get("from") === "paymob" ||
    (searchParams.has("success") && searchParams.has("id"));

  // A guest returning from hosted checkout without a session still gets a
  // safe payment-status resolution — never a login dead-end. When a session
  // exists the full authenticated checkout page is preserved as before.
  if (!isLoading && !isAuthenticated && isProviderReturn && returnToken) {
    return (
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}`}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              {t("backHome")}
            </Link>
          </div>
          <h1 className="mb-6 text-2xl font-bold text-brand-900">
            {t("paymentResultTitle")}
          </h1>
          <PaymentReturnView
            bookingId={bookingId}
            token={returnToken}
            locale={locale}
          />
        </section>
      </GuestLayout>
    );
  }

  return (
    <ProtectedRoute>
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-4">
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
