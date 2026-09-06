"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostEarnings } from "@/lib/queries/hostEarnings";
import { useHostProfile, useUpdateHostProfile } from "@/lib/queries/hostProfile";

const KYC_COLORS: Record<string, string> = {
  verified: "bg-success-100 text-success-700",
  pending: "bg-warning-100 text-warning-700",
  unverified: "bg-neutral-100 text-neutral-700",
  rejected: "bg-danger-100 text-danger-700",
};

export default function HostProfilePage() {
  const t = useTranslations("hostProfile");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const { data: profile, isLoading, isError, refetch } = useHostProfile();
  const { data: earnings } = useHostEarnings();
  const updateProfile = useUpdateHostProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["host", "admin"]}>
        <HostLayout>
          <div className="py-12 text-center text-neutral-500">{tc("loading")}</div>
        </HostLayout>
      </ProtectedRoute>
    );
  }

  if (isError || !profile) {
    return (
      <ProtectedRoute allowedRoles={["host", "admin"]}>
        <HostLayout>
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
        </HostLayout>
      </ProtectedRoute>
    );
  }

  const startEdit = () => {
    setDisplayName(profile.display_name ?? "");
    setEmail(profile.email ?? "");
    setIsEditing(true);
  };

  const saveEdit = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName.trim() || undefined,
      email: email.trim() || undefined,
    });
    setIsEditing(false);
  };

  const kycStatus = profile.kyc_status ?? "unverified";

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>

            {/* Identity */}
            <div className="rounded-xl bg-white p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                  {(profile.display_name?.charAt(0) ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEdit();
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="display-name" className="block text-sm font-medium text-neutral-700">
                          {t("displayName")}
                        </label>
                        <input
                          id="display-name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                          {t("email")}
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={updateProfile.isPending}
                          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-neutral-400"
                        >
                          {updateProfile.isPending ? tc("loading") : tc("save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                      {updateProfile.isError && (
                        <p className="text-sm text-danger-600">{t("saveError")}</p>
                      )}
                    </form>
                  ) : (
                    <>
                      <h2 className="truncate text-lg font-semibold text-neutral-900">
                        {profile.display_name || "—"}
                      </h2>
                      <p className="text-sm text-neutral-500">{profile.phone_number || "—"}</p>
                      <p className="mt-2 text-sm text-neutral-500">{profile.email || t("noEmail")}</p>
                      <button
                        type="button"
                        onClick={startEdit}
                        className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {t("edit")}
                      </button>
                    </>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    KYC_COLORS[kycStatus] ?? KYC_COLORS.unverified
                  }`}
                >
                  {tc(`kycStatus.${kycStatus}`) ?? kycStatus}
                </span>
              </div>

              {kycStatus !== "verified" && (
                <div className="mt-6 rounded-lg bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-700">{t("verifyIdentityPrompt")}</p>
                  <Link
                    href={`/${locale}/host/kyc`}
                    className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    {t("verifyIdentity")}
                  </Link>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h3 className="mb-4 text-base font-semibold text-neutral-900">{t("listingStats")}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label={t("totalListings")} value={profile.total_listings} />
                <Stat label={t("listedListings")} value={profile.listed_listings} />
                <Stat label={t("coHostUnits")} value={profile.co_host_units} />
              </div>
            </div>

            {/* Earnings */}
            {earnings && (
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h3 className="mb-4 text-base font-semibold text-neutral-900">{t("earnings")}</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label={t("totalRevenue")} value={`${earnings.total_revenue_egp}`} />
                  <Stat label={t("netEarnings")} value={`${earnings.net_earnings_egp}`} />
                  <Stat label={t("completedStays")} value={earnings.completed_stays} />
                </div>
                <Link
                  href={`/${locale}/host/earnings`}
                  className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
                >
                  {t("viewEarnings")} →
                </Link>
              </div>
            )}
          </div>
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-4">
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
