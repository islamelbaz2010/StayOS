"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useMyPayments, type PaymentListItem } from "@/lib/queries/payments";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  proof_uploaded: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-700",
  refund_pending: "bg-amber-100 text-amber-800",
  refunded: "bg-green-100 text-green-800",
};

export default function PaymentsPage() {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data: payments, isLoading, error, refetch } = useMyPayments();

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("title")}
          </h1>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
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

          {!isLoading && !error && payments?.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">{t("empty")}</p>
            </div>
          )}

          <div className="space-y-3">
            {payments?.map((payment) => {
              const statusStyle =
                STATUS_STYLES[payment.status] ??
                "bg-neutral-100 text-neutral-700";
              return (
                <div
                  key={payment.id}
                  className="rounded-xl bg-white p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">
                        {formatMoney(payment.amount_egp, "EGP", dateLocale)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {t("reference")}: {payment.reference_number}
                      </p>
                      {payment.payment_deadline_at && (
                        <p className="text-sm text-neutral-500">
                          {t("deadline")}:{" "}
                          {formatDate(
                            new Date(payment.payment_deadline_at),
                            dateLocale
                          )}
                        </p>
                      )}
                      {payment.proof_rejection_count ? (
                        <p className="text-sm text-danger-600">
                          {t("rejectedProofs", {
                            count: payment.proof_rejection_count,
                          })}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
                    >
                      {t(`status.${payment.status}`)}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/${locale}/bookings/${payment.booking_id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {t("viewBooking")}
                    </Link>
                    {payment.status === "pending" && (
                      <Link
                        href={`/${locale}/checkout/${payment.booking_id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        {t("payNow")}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
