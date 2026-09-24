"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useHostEarnings } from "@/lib/queries/hostEarnings";
import {
  useHostPayments,
  usePayouts,
  type PaymentListItem,
  type PayoutRecord,
} from "@/lib/queries/payments";
import { formatMoney } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";
const ACTIVITY_SECTION_ID = "payment-activity";

// Activity filters — `status` is the backend query value. Payment-status
// filters map to Payment.status; the lifecycle filters join the escrow
// lifecycle so the list always matches the card aggregate above it.
// `paid_out` renders completed payout records (the card's source rows).
const FILTERS: { key: string; status: string | undefined }[] = [
  { key: "all", status: undefined },
  { key: "pending", status: "pending" },
  { key: "collected", status: "collected" },
  { key: "verified", status: "verified" },
  { key: "funds_held", status: "funds_held" },
  { key: "payout_ready", status: "payout_ready" },
  { key: "paid_out", status: "paid_out" },
  { key: "refund_pending", status: "refund_pending" },
  { key: "refunded", status: "refunded" },
  { key: "cancelled", status: "cancelled" },
];

interface PerUnitItem {
  unit_id: string;
  unit_title: string | null;
  unit_cover_image: string | null;
  booking_count: number;
  revenue_egp: number;
}

export default function HostEarningsPage() {
  const t = useTranslations("hostEarnings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const moneyLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data, isLoading, isError, refetch } = useHostEarnings();
  const router = useRouter();
  const pathname = usePathname();
  const activityRef = useRef<HTMLDivElement>(null);

  const hasEarnings =
    data && (data.total_revenue_egp > 0 || data.total_bookings > 0);

  const openActivity = (filterKey: string) => {
    const params = new URLSearchParams();
    if (filterKey !== "all") params.set("status", filterKey);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    requestAnimationFrame(() =>
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("title")}
          </h1>

          {isLoading ? (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !hasEarnings ? (
            <div className="card p-12 text-center">
              <p className="text-neutral-500">{t("noEarnings")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                  {t("moneySection")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label={t("yourEarnings")}
                    value={formatMoney(data.host_earnings_egp ?? 0, "EGP", moneyLocale)}
                    hint={t("yourEarningsHint")}
                    highlight
                    onClick={() => openActivity("verified")}
                  />
                  <StatCard
                    label={t("fundsHeld")}
                    value={formatMoney(data.funds_held_egp ?? 0, "EGP", moneyLocale)}
                    hint={t("fundsHeldHint")}
                    onClick={() => openActivity("funds_held")}
                  />
                  <StatCard
                    label={t("payoutReady")}
                    value={formatMoney(data.payout_ready_egp ?? 0, "EGP", moneyLocale)}
                    hint={t("payoutReadyHint")}
                    onClick={() => openActivity("payout_ready")}
                  />
                  <StatCard
                    label={t("paidOut")}
                    value={formatMoney(data.paid_out_egp ?? 0, "EGP", moneyLocale)}
                    hint={t("paidOutHint")}
                    onClick={() => openActivity("paid_out")}
                  />
                  <StatCard
                    label={t("collected")}
                    value={formatMoney(data.total_revenue_egp, "EGP", moneyLocale)}
                    hint={t("collectedHint")}
                    onClick={() => openActivity("collected")}
                  />
                  <StatCard
                    label={t("refundPending")}
                    value={formatMoney(data.refund_pending_egp, "EGP", moneyLocale)}
                    hint={t("refundPendingHint")}
                    onClick={() => openActivity("refund_pending")}
                  />
                  <StatCard
                    label={t("refunded")}
                    value={formatMoney(data.refunded_egp ?? 0, "EGP", moneyLocale)}
                    hint={t("refundedHint")}
                    onClick={() => openActivity("refunded")}
                  />
                  <StatCard
                    label={t("pendingVerification")}
                    value={formatMoney(data.pending_verification_egp, "EGP", moneyLocale)}
                    hint={t("pendingPaymentHint")}
                    onClick={() => openActivity("pending")}
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                  {t("bookingsSection")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label={t("totalBookings")}
                    value={String(data.total_bookings)}
                    href={`/${locale}/host/bookings`}
                  />
                  <StatCard
                    label={t("confirmedBookings")}
                    value={String(data.confirmed_bookings)}
                    href={`/${locale}/host/bookings?status=confirmed`}
                  />
                  <StatCard
                    label={t("completedStays")}
                    value={String(data.completed_stays)}
                    href={`/${locale}/host/bookings?status=completed`}
                  />
                  <StatCard
                    label={t("cancelledBookings")}
                    value={String(data.cancelled_bookings ?? 0)}
                    href={`/${locale}/host/bookings?status=cancelled`}
                  />
                </div>
              </div>

              {data.per_unit && data.per_unit.length > 0 && (
                <div className="card p-5 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold text-brand-900">
                    {t("perListing")}
                  </h2>
                  <div className="divide-y divide-neutral-100">
                    {((data.per_unit as unknown) as PerUnitItem[]).map((unit) => (
                      <div
                        key={unit.unit_id}
                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            <Image
                              src={unit.unit_cover_image || PLACEHOLDER_IMAGE}
                              alt={unit.unit_title || t("untitledListing")}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <p className="font-medium text-brand-900">
                            {unit.unit_title || unit.unit_id.slice(0, 8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span>
                            {unit.booking_count} {t("bookings")}
                          </span>
                          <span className="font-semibold text-brand-900">
                            {formatMoney(unit.revenue_egp, "EGP", moneyLocale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={activityRef} id={ACTIVITY_SECTION_ID} className="scroll-mt-24">
                <PaymentActivity locale={moneyLocale} />
              </div>

              <p className="text-sm text-neutral-500">{t("disclaimer")}</p>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
  onClick,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          highlight ? "text-accent-600" : "text-brand-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </>
  );
  const cls = `card p-5 text-start transition ${
    onClick || href ? "cursor-pointer hover:border-accent-400 hover:shadow-md" : ""
  }`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

const HOST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  proof_uploaded: "bg-accent-100 text-accent-700",
  verified: "bg-success-100 text-success-700",
  rejected: "bg-danger-100 text-danger-700",
  cancelled: "bg-neutral-100 text-neutral-700",
  refund_pending: "bg-amber-100 text-amber-700",
  refunded: "bg-success-100 text-success-700",
};

function HostPaymentStatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  // The `payment` namespace uses statusPending, statusVerified, etc.
  // rather than a nested paymentStatuses.* object.
  const STATUS_KEY_MAP: Record<string, string> = {
    pending: "statusPending",
    proof_uploaded: "statusProofUploaded",
    verified: "statusVerified",
    rejected: "statusRejected",
    cancelled: "statusCancelled",
    refund_pending: "statusRefundPending",
    refunded: "statusRefunded",
  };
  const key = STATUS_KEY_MAP[status.toLowerCase()] ?? "";
  const label = key ? t(key) : status.toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        HOST_STATUS_COLORS[status.toLowerCase()] || "bg-neutral-100 text-neutral-700"
      }`}
    >
      {label}
    </span>
  );
}

function PaymentActivity({ locale }: { locale: string }) {
  const t = useTranslations("hostEarnings");
  const tp = useTranslations("payment");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const filter = searchParams.get("status") ?? "all";
  const active = FILTERS.some((f) => f.key === filter) ? filter : "all";
  const status = FILTERS.find((f) => f.key === active)?.status;
  const showPayouts = active === "paid_out";
  const paymentsQuery = useHostPayments(status, { enabled: !showPayouts });
  const payoutsQuery = usePayouts("completed", { enabled: showPayouts });

  const setFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") params.delete("status");
    else params.set("status", key);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const isPending = showPayouts ? payoutsQuery.isPending : paymentsQuery.isPending;
  const isError = showPayouts ? payoutsQuery.isError : paymentsQuery.isError;
  const refetch = showPayouts ? payoutsQuery.refetch : paymentsQuery.refetch;

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-brand-900">
        {t("paymentActivity")}
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              active === f.key
                ? "bg-brand-900 text-white"
                : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {t(`filter.${f.key}`)}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="py-8 text-center text-neutral-600">{t("loading")}</div>
      ) : showPayouts ? (
        <PayoutList payouts={payoutsQuery.data ?? []} locale={locale} />
      ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {paymentsQuery.data.map((payment: PaymentListItem) => (
            <div
              key={payment.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  <Image
                    src={payment.unit_cover_image || PLACEHOLDER_IMAGE}
                    alt={payment.unit_title || t("untitledListing")}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-brand-900">
                    {payment.unit_title || t("untitledListing")}
                  </p>
                  <p className="font-mono text-xs text-neutral-500">
                    {payment.reference_number}
                  </p>
                  <HostPaymentStatusBadge status={payment.status} t={tp} />
                  {payment.reject_reason && (
                    <p className="text-xs text-danger-600">
                      {payment.reject_reason}
                    </p>
                  )}
                  {payment.host_net_egp != null && (
                    <div className="mt-2 space-y-1 rounded-md bg-neutral-50 p-3 text-xs text-neutral-700">
                      <p>
                        <span className="font-medium">{t("yourEarnings")}: </span>
                        <span className="font-semibold text-brand-900">
                          {formatMoney(payment.host_net_egp, "EGP", locale)}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">{t("stayosFee")}: </span>
                        {payment.platform_share_waived
                          ? t("stayosFeeWaived")
                          : formatMoney(
                              payment.platform_fee_egp ?? 0,
                              "EGP",
                              locale
                            )}
                      </p>
                      {payment.funds_status && (
                        <p>
                          <span className="font-medium">
                            {t("fundsStatus")}:{" "}
                          </span>
                          {t(`fundsStatuses.${payment.funds_status}`)}
                        </p>
                      )}
                      {payment.payout_status && (
                        <>
                          <p>
                            <span className="font-medium">
                              {t("payoutEligibility")}:{" "}
                            </span>
                            {t("payoutEligibilityRule")}
                          </p>
                          <p>
                            <span className="font-medium">
                              {t("payoutStatus")}:{" "}
                            </span>
                            {t(`payoutStatuses.${payment.payout_status}`)}
                            {payment.payout_status === "paid" &&
                              payment.paid_at &&
                              ` · ${t("paidOn")} ${new Date(payment.paid_at).toLocaleString(locale)}`}
                          </p>
                          {payment.expected_payout_at &&
                            payment.payout_status !== "paid" &&
                            payment.payout_status !== "refunded" && (
                              <p>
                                <span className="font-medium">
                                  {t("expectedPayout")}:{" "}
                                </span>
                                {new Date(
                                  payment.expected_payout_at
                                ).toLocaleString(locale)}
                              </p>
                            )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-sm font-semibold text-brand-900">
                  {formatMoney(payment.amount_egp, "EGP", locale)}
                </p>
                {(payment.status === "refund_pending" ||
                  payment.status === "refunded") &&
                  payment.refund_amount_egp != null && (
                    <p className="text-xs text-neutral-600">
                      {t("refund")}: {formatMoney(payment.refund_amount_egp, "EGP", locale)}
                    </p>
                  )}
                {payment.refunded_at && (
                  <p className="text-xs text-neutral-500">
                    {t("refundedAt")}:{" "}
                    {new Date(payment.refunded_at).toLocaleString(locale)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-neutral-500">{t("noPayments")}</div>
      )}
    </div>
  );
}

function PayoutList({
  payouts,
  locale,
}: {
  payouts: PayoutRecord[];
  locale: string;
}) {
  const t = useTranslations("hostEarnings");
  if (payouts.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">{t("noPayouts")}</div>
    );
  }
  return (
    <div className="divide-y divide-neutral-100">
      {payouts.map((payout) => (
        <div
          key={payout.id}
          className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <p className="font-mono text-xs text-neutral-500">
              {payout.provider_ref ?? payout.id.slice(0, 8)}
            </p>
            <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700">
              {t(`payoutStatuses.${payout.status}`)}
            </span>
            {payout.processed_at && (
              <p className="text-xs text-neutral-500">
                {t("paidOn")}{" "}
                {new Date(payout.processed_at).toLocaleString(locale)}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-brand-900">
            {formatMoney(payout.amount_egp, "EGP", locale)}
          </p>
        </div>
      ))}
    </div>
  );
}
