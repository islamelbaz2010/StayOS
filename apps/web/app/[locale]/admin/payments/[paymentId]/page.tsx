"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { usePayment, usePaymentProofDownloadUrl } from "@/lib/queries/payments";
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-neutral-600">{label}</dt>
      <dd className="text-sm text-brand-900 sm:col-span-2">{children}</dd>
    </div>
  );
}

function DateField({
  label,
  date,
  locale,
}: {
  label: string;
  date: string | null | undefined;
  locale: string;
}) {
  if (!date) return null;
  return (
    <Field label={label}>
      {new Date(date).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")}
    </Field>
  );
}

export default function AdminPaymentDetailPage() {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string; paymentId: string }>();
  const locale = params?.locale ?? "ar";
  const paymentId = params?.paymentId ?? "";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const {
    data: payment,
    isLoading,
    error,
    refetch,
  } = usePayment(paymentId);
  const proofDownload = usePaymentProofDownloadUrl();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/admin/payments`}
            className="mb-4 inline-block text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
          >
            {tc("back")}
          </Link>

          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("paymentDetails")}
          </h1>

          {isLoading && (
            <div className="card p-8 text-center text-neutral-500">
              {tc("loading")}
            </div>
          )}

          {!isLoading && (error || !payment) && (
            <div className="card p-8 text-center">
              <p className="text-danger-600">
                {getApiErrorMessage(error, t("loadError"))}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {payment && (
            <div className="card space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <Image
                    src={payment.unit_cover_image || PLACEHOLDER_IMAGE}
                    alt={payment.unit_title || payment.reference_number}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-lg font-semibold text-brand-900">
                    {payment.unit_title || t("untitledListing")}
                  </p>
                  <p className="font-mono text-sm font-medium text-brand-900">
                    {payment.reference_number}
                  </p>
                  <StatusBadge status={payment.status} />
                </div>
              </div>

              <hr className="border-neutral-200" />

              <dl className="space-y-4">
                <Field label={t("amount")}>
                  {formatMoney(payment.amount_egp, "EGP", dateLocale)}
                </Field>

                {payment.accommodation_amount_egp != null && (
                  <Field label={t("accommodationAmount")}>
                    {formatMoney(payment.accommodation_amount_egp, "EGP", dateLocale)}
                  </Field>
                )}

                {payment.guest_service_fee_egp != null && (
                  <Field label={t("serviceFee")}>
                    {formatMoney(payment.guest_service_fee_egp, "EGP", dateLocale)}
                  </Field>
                )}

                {(payment.status === "refund_pending" ||
                  payment.status === "refunded") &&
                  payment.refund_amount_egp != null && (
                    <Field label={t("refundAmount")}>
                      {formatMoney(payment.refund_amount_egp, "EGP", dateLocale)}
                    </Field>
                  )}

                <Field label={t("bookingId")}>{payment.booking_id}</Field>
                <Field label={t("guestId")}>{payment.guest_id}</Field>
                <Field label={t("hostId")}>{payment.host_id}</Field>
                <Field label={t("unitId")}>{payment.unit_id}</Field>

                <DateField
                  label={t("paymentDeadline")}
                  date={payment.payment_deadline_at}
                  locale={locale}
                />
                <DateField
                  label={t("proofUploaded")}
                  date={payment.proof_uploaded_at}
                  locale={locale}
                />
                <DateField
                  label={t("verifiedAt")}
                  date={payment.verified_at}
                  locale={locale}
                />
                <DateField
                  label={t("rejectedAt")}
                  date={payment.rejected_at}
                  locale={locale}
                />
                {payment.reject_reason && (
                  <Field label={t("rejectReason")}>{payment.reject_reason}</Field>
                )}
                <DateField
                  label={t("cancelledAt")}
                  date={payment.cancelled_at}
                  locale={locale}
                />
                <DateField
                  label={t("refundedAt")}
                  date={payment.refunded_at}
                  locale={locale}
                />
                <DateField
                  label={t("createdAt")}
                  date={payment.created_at}
                  locale={locale}
                />
                <DateField
                  label={t("updatedAt")}
                  date={payment.updated_at}
                  locale={locale}
                />
              </dl>

              {payment.proof_s3_key && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={proofDownload.isPending}
                    onClick={() =>
                      proofDownload.mutate(payment.id, {
                        onSuccess: (url) =>
                          window.open(url, "_blank", "noopener,noreferrer"),
                      })
                    }
                    className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline disabled:opacity-50"
                  >
                    {proofDownload.isPending ? tc("loading") : t("viewPdf")}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
