"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useHostEarnings } from "@/lib/queries/hostEarnings";
import { formatMoney } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

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

  const hasEarnings =
    data && (data.total_revenue_egp > 0 || data.total_bookings > 0);

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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label={t("netEarnings")}
                  value={formatMoney(data.net_earnings_egp, "EGP", moneyLocale)}
                  highlight
                />
                <StatCard
                  label={t("totalRevenue")}
                  value={formatMoney(data.total_revenue_egp, "EGP", moneyLocale)}
                />
                <StatCard
                  label={t("pendingVerification")}
                  value={formatMoney(data.pending_verification_egp, "EGP", moneyLocale)}
                />
                <StatCard
                  label={t("refundPending")}
                  value={formatMoney(data.refund_pending_egp, "EGP", moneyLocale)}
                />
                <StatCard
                  label={t("totalBookings")}
                  value={String(data.total_bookings)}
                />
                <StatCard
                  label={t("confirmedBookings")}
                  value={String(data.confirmed_bookings)}
                />
                <StatCard
                  label={t("completedStays")}
                  value={String(data.completed_stays)}
                />
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
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          highlight ? "text-accent-600" : "text-brand-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
