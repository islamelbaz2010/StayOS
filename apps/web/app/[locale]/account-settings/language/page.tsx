"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useUpdateProfile } from "@/lib/queries/settings";

export default function LanguageCurrencyPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const t = useTranslations("settings.languagePage");
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);

  async function chooseLanguage(next: "en" | "ar") {
    setError(null);
    try {
      await updateProfile.mutateAsync({ locale: next });
      await refreshUser();
      // Navigate to the same route under the new locale so UI + persisted
      // preference stay in sync (same contract as the header switcher).
      const segments = pathname.split("/");
      if (segments[1] === "ar" || segments[1] === "en") {
        segments[1] = next;
      }
      window.location.assign(segments.join("/"));
    } catch {
      setError(t("saveError"));
    }
  }

  const active = user?.locale === "en" ? "en" : "ar";

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

          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("language")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t("languageBody")}
              </p>
              <div className="mt-4 flex gap-3">
                {(["ar", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => chooseLanguage(lang)}
                    disabled={updateProfile.isPending}
                    aria-pressed={active === lang}
                    className={`rounded-lg border px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      active === lang
                        ? "border-primary-700 bg-primary-700 text-white"
                        : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    {lang === "ar" ? "العربية" : "English"}
                  </button>
                ))}
              </div>
              {error && (
                <p className="mt-3 text-sm text-danger-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("currency")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t("currencyBody")}
              </p>
              <p className="mt-4 inline-flex items-center rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900">
                {t("egp")}
              </p>
            </div>
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
