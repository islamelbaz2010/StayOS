"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostEarnings } from "@/lib/queries/hostEarnings";
import { formatMoney } from "@/lib/utils";

interface PerUnitItem {
  unit_id: string;
  unit_title: string | null;
  booking_count: number;
  revenue_egp: number;
}

export default function HostEarningsPage() {
  const t = useTranslations("hostEarnings");
  const tc = useTranslations("common");
  const { data, isLoading, isError, refetch } = useHostEarnings();

  const hasEarnings = data && (data.total_revenue_egp > 0 || data.total_bookings > 0);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("title")}
          </h1>

          {isLoading ? (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : isError ? (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 font-medium text-brand-600 hover:underline"
              >
                {tc("retry")}
              </button>
            </div>
          ) : !hasEarnings ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">{t("noEarnings")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label={t("netEarnings")} value={formatMoney(data.net_earnings_egp, "EGP")} />
                <StatCard label={t("totalRevenue")} value={formatMoney(data.total_revenue_egp, "EGP")} />
                <StatCard label={t("pendingVerification")} value={formatMoney(data.pending_verification_egp, "EGP")} />
                <StatCard label={t("refundPending")} value={formatMoney(data.refund_pending_egp, "EGP")} />
                <StatCard label={t("totalBookings")} value={String(data.total_bookings)} />
                <StatCard label={t("confirmedBookings")} value={String(data.confirmed_bookings)} />
                <StatCard label={t("completedStays")} value={String(data.completed_stays)} />
              </div>

              {data.per_unit && data.per_unit.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-card">
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                    {t("perListing")}
                  </h2>
                  <div className="space-y-3">
                    {((data.per_unit as unknown) as PerUnitItem[]).map((unit) => (
                      <div
                        key={unit.unit_id}
                        className="flex flex-col gap-2 border-b border-neutral-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="font-medium text-neutral-900">
                          {unit.unit_title || unit.unit_id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span>
                            {unit.booking_count} {t("bookings")}
                          </span>
                          <span className="font-semibold text-neutral-900">
                            {formatMoney(unit.revenue_egp, "EGP")}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
