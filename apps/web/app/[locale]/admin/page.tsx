"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/useAuth";
import { useAdminOverview } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/utils";

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const inner = (
    <div className="card p-4">
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
  const t = useTranslations("adminOverview");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data, isPending, isError, refetch } = useAdminOverview();
  const { user } = useAuth();
  // Per-user records are admin-only; staff see the aggregate counts but
  // not drill-down links into a dataset they cannot open.
  const usersHref = (suffix: string) =>
    user?.role === "admin" ? `/${locale}/admin/users${suffix}` : undefined;

  const egp = (v: number) =>
    formatMoney(v, "EGP", intlLocale);

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

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending || !data ? (
            <div className="card p-8 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("users")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label={t("usersTotal")} value={data.users_total} href={usersHref("")} />
                  <Stat label={t("guests")} value={data.users_guests} href={usersHref("?role=guest")} />
                  <Stat label={t("hosts")} value={data.users_hosts} href={usersHref("?role=host")} />
                  <Stat
                    label={t("hostsVerified")}
                    value={data.hosts_kyc_verified}
                    href={usersHref("?role=host&kyc_status=verified")}
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("supply")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat
                    label={t("listingsTotal")}
                    value={data.listings_total}
                    href={`/${locale}/admin/listings`}
                  />
                  <Stat label={t("listed")} value={data.listings_listed} href={`/${locale}/admin/listings?status=LISTED`} />
                  <Stat
                    label={t("pendingVerification")}
                    value={data.listings_pending_verification}
                    href={`/${locale}/admin/pending`}
                  />
                  <Stat
                    label={t("pendingChanges")}
                    value={data.listings_pending_changes}
                    href={`/${locale}/admin/pending`}
                  />
                  <Stat label={t("rejected")} value={data.listings_rejected} href={`/${locale}/admin/listings?status=REJECTED`} />
                </div>
                {Object.keys(data.listings_by_governorate).length > 0 && (
                  <div className="card mt-3 p-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-600">
                      {t("byGovernorate")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.listings_by_governorate).map(
                        ([gov, count]) => (
                          <Link
                            key={gov}
                            href={`/${locale}/admin/listings?governorate=${encodeURIComponent(gov)}`}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 hover:bg-accent-100 hover:text-accent-700"
                          >
                            {gov}: {count}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("bookings")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                  <Stat label={t("bookingsTotal")} value={data.bookings_total} href={`/${locale}/admin/bookings?view=all`} />
                  <Stat label={t("requested")} value={data.bookings_requested} href={`/${locale}/admin/bookings?status=requested`} />
                  <Stat label={t("accepted")} value={data.bookings_accepted} href={`/${locale}/admin/bookings?status=accepted`} />
                  <Stat label={t("confirmed")} value={data.bookings_confirmed} href={`/${locale}/admin/bookings?status=confirmed`} />
                  <Stat label={t("completed")} value={data.bookings_completed} href={`/${locale}/admin/bookings?status=completed`} />
                  <Stat label={t("cancelled")} value={data.bookings_cancelled} href={`/${locale}/admin/bookings?status=cancelled`} />
                  <Stat label={t("rejectedB")} value={data.bookings_rejected} href={`/${locale}/admin/bookings?status=rejected`} />
                  <Stat label={t("upcomingCheckins")} value={data.upcoming_checkins_7d} href={`/${locale}/admin/bookings?view=upcoming-checkins`} />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("money")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    label={t("paymentsPending")}
                    value={data.payments_pending}
                    href={`/${locale}/admin/payments?status=pending`}
                  />
                  <Stat
                    label={t("proofUploaded")}
                    value={data.payments_proof_uploaded}
                    href={`/${locale}/admin/payments?status=proof_uploaded`}
                  />
                  <Stat label={t("collectedAmount")} value={egp(data.payments_verified_amount_egp)} href={`/${locale}/admin/earnings?view=collected`} />
                  <Stat label={t("refundedAmount")} value={egp(data.payments_refunded_amount_egp)} href={`/${locale}/admin/earnings?view=refunded`} />
                  <Stat label={t("payoutsPending")} value={data.payouts_pending} href={`/${locale}/admin/earnings?view=payouts_pending`} />
                  <Stat label={t("payoutsAmount")} value={egp(data.payouts_pending_amount_egp)} href={`/${locale}/admin/earnings?view=payouts_pending`} />
                  <Stat label={t("escrowsHeld")} value={data.escrows_held} href={`/${locale}/admin/earnings?view=funds_held`} />
                  <Stat label={t("verifiedPayments")} value={data.payments_verified} href={`/${locale}/admin/earnings?view=collected`} />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent-600">
                  {t("workQueues")}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat
                    label={t("kycPending")}
                    value={data.kyc_pending_documents}
                    href={`/${locale}/admin/kyc`}
                  />
                  <Stat
                    label={t("disputesOpen")}
                    value={data.disputes_open}
                    href={`/${locale}/admin/disputes`}
                  />
                  <Stat
                    label={t("disputesInReview")}
                    value={data.disputes_in_review}
                    href={`/${locale}/admin/disputes`}
                  />
                  <Stat
                    label={t("maintenanceOpen")}
                    value={data.maintenance_open}
                    href={`/${locale}/admin/bookings`}
                  />
                  <Stat
                    label={t("tasksPending")}
                    value={data.tasks_pending}
                    href={`/${locale}/admin/bookings`}
                  />
                  <Stat
                    label={t("tasksOverdue")}
                    value={data.tasks_overdue}
                    href={`/${locale}/admin/bookings`}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
