"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useKycStatus } from "@/lib/queries/kyc";

export default function HostPage() {
  const t = useTranslations("host");
  const { user } = useAuth();
  const { data: kycStatus } = useKycStatus();

  const kycStatusValue = kycStatus?.kyc_status ?? user?.kyc_status ?? "unverified";

  const kycBadgeColor: Record<string, string> = {
    unverified: "bg-neutral-100 text-neutral-600",
    pending: "bg-warning-100 text-warning-700",
    verified: "bg-success-100 text-success-700",
    rejected: "bg-danger-100 text-danger-700",
  };

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-8 shadow-card">
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("title")}
            </h1>
            <p className="mt-2 text-neutral-600">
              {user?.display_name || user?.phone_number || user?.email}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/host/listings"
              className="group rounded-xl bg-white p-6 shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-brand-600">
                    {t("manageListings")}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {t("manageListingsDesc")}
                  </p>
                </div>
              </div>
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin/pending"
                className="group rounded-xl bg-white p-6 shadow-card transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 group-hover:text-warning-600">
                      {t("pendingReview")}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {t("pendingReviewDesc")}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <Link
              href="/host/kyc"
              className="group rounded-xl bg-white p-6 shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A9.716 9.716 0 0112 2.25c2.26 0 4.358.807 6 2.146v18.126A9.716 9.716 0 0112 20.25c-2.26 0-4.358-.807-6-2.146V4.396z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-brand-600">
                    {t("kycVerification")}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kycBadgeColor[kycStatusValue] ?? kycBadgeColor.unverified}`}>
                      {t(`kycStatus.${kycStatusValue}`)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </HostLayout>
    </ProtectedRoute>
  );
}
