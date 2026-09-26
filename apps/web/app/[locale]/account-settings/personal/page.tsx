"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { PersonalInfoEditor } from "@/components/profile/PersonalInfoEditor";
import { useAuth } from "@/lib/auth/useAuth";
import { useKycStatus } from "@/lib/queries/kyc";

export default function PersonalInfoPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.personalPage");
  const { user } = useAuth();
  const { data: kycStatus } = useKycStatus();
  const kycVerified =
    (kycStatus?.kyc_status ?? user?.kyc_status) === "verified";

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link
            href={`/${locale}/account-settings`}
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            ← {t("back")}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-brand-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{t("body")}</p>
          <div className="mt-6">
            <PersonalInfoEditor kycVerified={kycVerified} />
          </div>
          <p className="mt-4 text-xs text-neutral-500">{t("taxNote")}</p>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
