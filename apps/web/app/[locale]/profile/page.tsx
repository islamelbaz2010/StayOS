"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/useAuth";
import { useKycStatus } from "@/lib/queries/kyc";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { data: kycStatus } = useKycStatus();

  const kycStatusValue = kycStatus?.kyc_status ?? user?.kyc_status ?? "unverified";

  const kycBadgeColor: Record<string, string> = {
    unverified: "bg-neutral-100 text-neutral-600",
    pending: "bg-warning-100 text-warning-700",
    verified: "bg-success-100 text-success-700",
    rejected: "bg-danger-100 text-danger-700",
  };

  const roleBadgeColor: Record<string, string> = {
    guest: "bg-neutral-100 text-neutral-600",
    host: "bg-brand-100 text-brand-700",
    admin: "bg-danger-100 text-danger-700",
  };

  return (
    <ProtectedRoute>
      <GuestLayout>
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>

            <div className="rounded-xl bg-white p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                  <span className="text-xl font-bold text-brand-700">
                    {(user?.display_name || user?.phone_number || user?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {user?.display_name || user?.phone_number || user?.email}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {user?.role && (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] ?? roleBadgeColor.guest}`}>
                        {t(`role.${user.role}`)}
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${kycBadgeColor[kycStatusValue] ?? kycBadgeColor.unverified}`}>
                      {t(`kyc.${kycStatusValue}`)}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-6">
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-500">{t("phone")}</dt>
                  <dd className="text-sm font-medium text-neutral-900">{user?.phone_number || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-500">{t("email")}</dt>
                  <dd className="text-sm font-medium text-neutral-900">{user?.email || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-500">{t("memberSince")}</dt>
                  <dd className="text-sm font-medium text-neutral-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {user?.role === "guest" && (
              <div className="rounded-xl bg-brand-50 p-6">
                <h2 className="text-lg font-bold text-neutral-900">{t("becomeHostTitle")}</h2>
                <p className="mt-2 text-sm text-neutral-600">{t("becomeHostDesc")}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/host/kyc`)}
                  className="mt-4 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {t("startKyc")}
                </button>
              </div>
            )}

            {user?.role === "guest" && kycStatusValue === "verified" && (
              <div className="rounded-xl bg-success-50 p-6">
                <h2 className="text-lg font-bold text-neutral-900">{t("kycVerifiedTitle")}</h2>
                <p className="mt-2 text-sm text-neutral-600">{t("kycVerifiedDesc")}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/host`)}
                  className="mt-4 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {t("goToHostDashboard")}
                </button>
              </div>
            )}
          </div>
        </div>
      </GuestLayout>
    </ProtectedRoute>
  );
}
