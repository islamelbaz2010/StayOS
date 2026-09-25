"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useMyPayments, type PaymentListItem } from "@/lib/queries/payments";
import { formatDate, formatMoney } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  proof_uploaded: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-700",
  refund_pending: "bg-amber-100 text-amber-800",
  refunded: "bg-green-100 text-green-800",
};

type TabKey =
  | "all"
  | "pending"
  | "paid"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "refunded";

const TABS: TabKey[] = [
  "all",
  "pending",
  "paid",
  "upcoming",
  "completed",
  "cancelled",
  "refunded",
];

function matchesTab(payment: PaymentListItem, tab: TabKey): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (tab) {
    case "all":
      return true;
    case "pending":
      return ["pending", "proof_uploaded", "rejected"].includes(payment.status);
    case "paid":
      return payment.status === "verified";
    case "upcoming":
      return (
        payment.status === "verified" &&
        !!payment.check_in &&
        new Date(payment.check_in) > today
      );
    case "completed":
      return (
        payment.status === "verified" &&
        (payment.booking_status === "completed" ||
          (!!payment.check_out && new Date(payment.check_out) <= today))
      );
    case "cancelled":
      return payment.status === "cancelled";
    case "refunded":
      return ["refund_pending", "refunded"].includes(payment.status);
  }
}

function matchesSearch(payment: PaymentListItem, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [payment.reference_number, payment.unit_title, payment.amount_egp]
    .filter((v): v is string | number => v !== null && v !== undefined)
    .some((v) => String(v).toLowerCase().includes(q));
}

export default function PaymentsPage() {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data: payments, isLoading, error, refetch } = useMyPayments();
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      (payments ?? []).filter(
        (p) => matchesTab(p, tab) && matchesSearch(p, query)
      ),
    [payments, tab, query]
  );

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="mb-6 mt-1 text-sm text-neutral-500">
            {t("methodsNote")}
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-700 shadow-card hover:bg-neutral-50"
                }`}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mb-6 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />

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

          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">
                {payments?.length === 0 ? t("empty") : t("emptyFiltered")}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((payment) => {
              const statusStyle =
                STATUS_STYLES[payment.status] ??
                "bg-neutral-100 text-neutral-700";
              return (
                <div
                  key={payment.id}
                  className="rounded-xl bg-white p-4 shadow-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image
                        src={payment.unit_cover_image || PLACEHOLDER_IMAGE}
                        alt={payment.unit_title || payment.reference_number}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">
                        {payment.unit_title ?? t("untitledListing")}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatMoney(payment.amount_egp, "EGP", dateLocale)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {t("reference")}: {payment.reference_number}
                      </p>
                      {payment.check_in && payment.check_out && (
                        <p className="text-sm text-neutral-500">
                          {formatDate(new Date(payment.check_in), dateLocale)} –{" "}
                          {formatDate(new Date(payment.check_out), dateLocale)}
                        </p>
                      )}
                      {payment.payment_deadline_at &&
                        payment.status !== "verified" && (
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
                      {payment.refund_amount_egp && (
                        <p className="text-sm text-neutral-500">
                          {t("refundAmount")}:{" "}
                          {formatMoney(
                            payment.refund_amount_egp,
                            "EGP",
                            dateLocale
                          )}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle}`}
                    >
                      {t(`status.${payment.status}`)}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4">
                    <Link
                      href={`/${locale}/bookings/${payment.booking_id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {t("viewBooking")}
                    </Link>
                    <Link
                      href={`/${locale}/bookings/${payment.booking_id}#payment`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {t("viewPaymentDetails")}
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
