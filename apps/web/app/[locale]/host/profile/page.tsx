"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useHostEarnings } from "@/lib/queries/hostEarnings";
import {
  useHostProfile,
  useUpdateHostProfile,
} from "@/lib/queries/hostProfile";

const KYC_COLORS: Record<string, string> = {
  verified: "bg-success-100 text-success-700",
  pending: "bg-warning-100 text-warning-700",
  unverified: "bg-neutral-100 text-neutral-700",
  rejected: "bg-danger-100 text-danger-700",
};

// Must match app.auth.constants.SpokenLanguage (DEC-019).
const SPOKEN_LANGUAGES = [
  "ar", "en", "fr", "de", "ru", "it", "es", "tr",
  "zh", "ja", "ko", "pt", "nl", "fi", "el", "he",
  "hi", "hu", "id", "ms", "sv", "th", "be", "bg",
  "gu", "ht", "fa", "pa", "tl", "uk", "ur", "vi",
  "sign",
];

export default function HostProfilePage() {
  const t = useTranslations("hostProfile");
  const tc = useTranslations("common");
  const tl = useTranslations("listing");
  const th = useTranslations("host");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const { data: profile, isLoading, isError, refetch } = useHostProfile();
  const { data: earnings } = useHostEarnings();
  const updateProfile = useUpdateHostProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["host", "admin"]}>
        <HostLayout>
          <div className="py-12 text-center text-neutral-500">
            {tc("loading")}
          </div>
        </HostLayout>
      </ProtectedRoute>
    );
  }

  if (isError || !profile) {
    return (
      <ProtectedRoute allowedRoles={["host", "admin"]}>
        <HostLayout>
          <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <ErrorState onRetry={() => refetch()} />
          </section>
        </HostLayout>
      </ProtectedRoute>
    );
  }

  const startEdit = () => {
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setEmail(profile.email ?? "");
    setLanguages(profile.languages ?? []);
    setIsEditing(true);
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const saveEdit = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      email: email.trim() || undefined,
      languages,
    });
    setIsEditing(false);
  };

  const kycStatus = profile.kyc_status ?? "unverified";

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>

            <div className="card p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-100 text-2xl font-bold text-accent-700">
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
                        <label
                          htmlFor="display-name"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          {t("displayName")}
                        </label>
                        <input
                          id="display-name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="input mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          {t("email")}
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="bio"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          {t("bio")}
                        </label>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          maxLength={2000}
                          rows={4}
                          placeholder={t("bioPlaceholder")}
                          className="input mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                          {t("languages")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SPOKEN_LANGUAGES.map((lang) => {
                            const selected = languages.includes(lang);
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                className={`
                                  rounded-full border px-3 py-1 text-xs font-medium transition
                                  ${
                                    selected
                                      ? "border-brand-600 bg-brand-600 text-white"
                                      : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
                                  }
                                `}
                                aria-pressed={selected}
                              >
                                {tl(`languages.${lang}`, { default: lang })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={updateProfile.isPending}
                          className="btn-primary text-sm"
                        >
                          {updateProfile.isPending ? tc("loading") : tc("save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="btn-secondary text-sm"
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
                      <h2 className="truncate text-lg font-semibold text-brand-900">
                        {profile.display_name || "—"}
                      </h2>
                      <p className="text-sm text-neutral-500">
                        {profile.phone_number || "—"}
                      </p>
                      <p className="mt-2 text-sm text-neutral-500">
                        {profile.email || t("noEmail")}
                      </p>
                      {profile.bio && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                          {profile.bio}
                        </p>
                      )}
                      {profile.languages && profile.languages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {profile.languages.map((lang) => (
                            <span
                              key={lang}
                              className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700"
                            >
                              {tl(`languages.${lang}`, { default: lang })}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={startEdit}
                        className="btn-secondary mt-4 text-sm"
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
                  {th(`kycStatus.${kycStatus}`)}
                </span>
              </div>

              {kycStatus !== "verified" && (
                <div className="mt-6 rounded-md bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-700">
                    {t("verifyIdentityPrompt")}
                  </p>
                  <Link
                    href={`/${locale}/host/kyc`}
                    className="btn-primary mt-3 inline-flex text-sm"
                  >
                    {t("verifyIdentity")}
                  </Link>
                </div>
              )}
            </div>

            <div className="card p-5 sm:p-6">
              <h3 className="mb-4 text-base font-semibold text-brand-900">
                {t("listingStats")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label={t("totalListings")} value={profile.total_listings} />
                <Stat label={t("listedListings")} value={profile.listed_listings} />
                <Stat label={t("coHostUnits")} value={profile.co_host_units} />
              </div>
            </div>

            {earnings && (
              <div className="card p-5 sm:p-6">
                <h3 className="mb-4 text-base font-semibold text-brand-900">
                  {t("earnings")}
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label={t("totalRevenue")} value={`${earnings.total_revenue_egp}`} />
                  <Stat label={t("netEarnings")} value={`${earnings.net_earnings_egp}`} />
                  <Stat label={t("completedStays")} value={earnings.completed_stays} />
                </div>
                <Link
                  href={`/${locale}/host/earnings`}
                  className="mt-4 inline-block text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
                >
                  {t("viewEarnings")}
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
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
