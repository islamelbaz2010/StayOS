"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { PasswordSection } from "@/components/profile/PasswordSection";
import { useAuth } from "@/lib/auth/useAuth";
import {
  logoutAllSessions,
  useSessions,
} from "@/lib/queries/settings";
import { formatDate } from "@/lib/utils";

export default function SecurityPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.securityPage");
  const tc = useTranslations("common");
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const { data: sessionData, isLoading } = useSessions();
  const [endingAll, setEndingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  async function signOutEverywhere() {
    setEndingAll(true);
    setError(null);
    try {
      await logoutAllSessions();
      await logout();
      router.push(`/${locale}/auth/login`);
    } catch {
      setError(tc("error"));
      setEndingAll(false);
    }
  }

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

          <div className="mt-6 space-y-6">
            <PasswordSection
              hasPassword={Boolean(user?.has_password)}
              onSaved={refreshUser}
            />

            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("sessions")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t("sessionsBody")}
              </p>
              {isLoading ? (
                <p className="mt-4 text-sm text-neutral-500">{tc("loading")}</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {(sessionData?.sessions ?? []).map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {t("session")}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {t("created")}{" "}
                          {session.created_at
                            ? formatDate(session.created_at, dateLocale)
                            : "—"}{" "}
                          · {t("expires")}{" "}
                          {formatDate(session.expires_at, dateLocale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="mt-3 text-sm text-danger-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={signOutEverywhere}
                disabled={endingAll}
                className="btn-secondary mt-4 text-sm disabled:opacity-50"
              >
                {endingAll ? tc("loading") : t("logoutAll")}
              </button>
              <p className="mt-2 text-xs text-neutral-500">
                {t("logoutAllHint")}
              </p>
            </div>
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
