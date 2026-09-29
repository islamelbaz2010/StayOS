"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/useAuth";
import { useReportCatalog } from "@/lib/queries/reports";

const CATEGORY_ORDER = [
  "overview",
  "users",
  "listings",
  "bookings",
  "financial",
  "payments",
  "payouts",
  "operations",
  "trust",
  "disputes",
  "reviews",
];

export default function AdminReportsPage() {
  const t = useTranslations("adminReports");
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuth();
  const allowed =
    user?.role === "admin" ||
    (user?.role === "staff" &&
      (user.staff_permissions ?? []).includes("reports"));
  const { data, isPending, isError, refetch } = useReportCatalog(allowed);

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
          </div>

          {!allowed ? (
            <div className="card p-12 text-center text-neutral-600">
              {t("noPermission")}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending || !data ? (
            <div className="py-12 text-center text-neutral-600">
              {t("loading")}
            </div>
          ) : (
            <div className="space-y-8">
              {CATEGORY_ORDER.map((cat) => {
                const reports = data.filter((r) => r.category === cat);
                if (reports.length === 0) return null;
                return (
                  <div key={cat}>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                      {t(`categories.${cat}`)}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {reports.map((r) =>
                        r.implemented ? (
                          <Link
                            key={r.key}
                            href={`/${locale}/admin/reports/${r.key}`}
                            className="card block p-4 transition hover:border-accent-400 hover:shadow-sm"
                          >
                            <p className="text-sm font-semibold text-brand-900">
                              {t(`reports.${r.key}`)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {t(`dateBasis.${r.date_basis}`)}
                            </p>
                          </Link>
                        ) : (
                          <div
                            key={r.key}
                            className="card border-dashed p-4 opacity-70"
                          >
                            <p className="text-sm font-semibold text-neutral-600">
                              {t(`reports.${r.key}`)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              {t("notImplemented")}
                              {r.unavailable_reason
                                ? ` — ${t(`reasons.${r.unavailable_reason}`)}`
                                : ""}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
