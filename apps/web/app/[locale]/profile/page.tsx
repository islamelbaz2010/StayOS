"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Avatar } from "@/components/profile/Avatar";
import { useAuth } from "@/lib/auth/useAuth";
import { useKycStatus } from "@/lib/queries/kyc";
import {
  useAccount,
  useUpdateAccount,
  type AccountUpdate,
} from "@/lib/queries/account";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, refreshUser } = useAuth();
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
                <Avatar
                  url={user?.avatar_url}
                  name={user?.display_name || user?.phone_number || user?.email}
                  editable
                />
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
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG") : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-500">{t("accountStatus")}</dt>
                  <dd className="text-sm font-medium text-neutral-900">
                    {user?.is_active ? t("active") : t("inactive")}
                  </dd>
                </div>
                {(user?.role === "admin" || user?.role === "staff") && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-sm text-neutral-500">{t("permissions")}</dt>
                    <dd className="text-end text-sm font-medium text-neutral-900">
                      {user.role === "admin" ? (
                        t("allPermissions")
                      ) : user.staff_permissions && user.staff_permissions.length > 0 ? (
                        <span className="inline-flex flex-wrap justify-end gap-1">
                          {user.staff_permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded bg-neutral-100 px-2 py-0.5 text-xs"
                            >
                              {p}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <PersonalInfoSection kycVerified={kycStatusValue === "verified"} />

            <PasswordSection
              hasPassword={Boolean(user?.has_password)}
              onSaved={refreshUser}
            />

            {user?.role === "guest" && (
              <div className="rounded-xl bg-brand-50 p-6">
                <h2 className="text-lg font-bold text-neutral-900">{t("becomeHostTitle")}</h2>
                <p className="mt-2 text-sm text-neutral-600">{t("becomeHostDesc")}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/kyc`)}
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

// Canonical personal-information editor — Profile and Account Settings
// both read the same user + account records, so edits here are the
// single source of truth (never a duplicate copy).
function PersonalInfoSection({ kycVerified }: { kycVerified: boolean }) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, refreshUser } = useAuth();
  const { data: account } = useAccount();
  const updateAccount = useUpdateAccount();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dob, setDob] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");

  const addressStr =
    account?.address &&
    Object.values(account.address).filter(Boolean).join(", ");

  function startEdit() {
    setDisplayName(user?.display_name ?? "");
    setLegalName(account?.legal_name ?? "");
    setDob(account?.date_of_birth ?? "");
    setStreet(String(account?.address?.street ?? ""));
    setCity(String(account?.address?.city ?? ""));
    setGovernorate(String(account?.address?.governorate ?? ""));
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if ((displayName.trim() || null) !== (user?.display_name ?? null)) {
        await api.patch("/auth/me", {
          display_name: displayName.trim() || null,
        });
        await refreshUser();
      }
      const address: Record<string, string> = {};
      if (street.trim()) address.street = street.trim();
      if (city.trim()) address.city = city.trim();
      if (governorate.trim()) address.governorate = governorate.trim();
      const payload: AccountUpdate = {
        date_of_birth: dob || null,
        address: Object.keys(address).length ? address : null,
      };
      if (!kycVerified) payload.legal_name = legalName.trim() || null;
      await updateAccount.mutateAsync(payload);
      setEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err, tc("error")));
    } finally {
      setSaving(false);
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: t("displayName"), value: user?.display_name || "—" },
    {
      label: t("legalName"),
      value: account?.legal_name || t("notSet"),
    },
    {
      label: t("dateOfBirth"),
      value: account?.date_of_birth || t("notSet"),
    },
    { label: t("address"), value: addressStr || t("notSet") },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-neutral-900">
          {t("personalInfo")}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="btn-secondary text-sm"
          >
            {t("edit")}
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t("displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={255}
              className="input mt-1 w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t("legalName")}
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              maxLength={255}
              disabled={kycVerified}
              className="input mt-1 w-full text-sm disabled:bg-neutral-100"
            />
            {kycVerified && (
              <p className="mt-1 text-xs text-neutral-500">
                {t("legalNameLocked")}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t("dateOfBirth")}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="input mt-1 w-full text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                {t("addressStreet")}
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                {t("addressCity")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input mt-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                {t("addressGovernorate")}
              </label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="input mt-1 w-full text-sm"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? tc("loading") : tc("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary text-sm"
            >
              {tc("cancel")}
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-sm text-neutral-500">{row.label}</dt>
              <dd className="text-end text-sm font-medium text-neutral-900">
                {row.value}
              </dd>
            </div>
          ))}
          {kycVerified && (
            <p className="text-xs text-neutral-500">{t("legalNameLocked")}</p>
          )}
        </dl>
      )}
    </div>
  );
}

function PasswordSection({
  hasPassword,
  onSaved,
}: {
  hasPassword: boolean;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (next !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/password", {
        new_password: next,
        ...(hasPassword ? { current_password: current } : {}),
      });
      await onSaved();
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 401 ? t("invalidCredentials") : t("registerFailed")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-neutral-900">
        {hasPassword ? t("changePassword") : t("setPassword")}
      </h2>
      {!hasPassword && (
        <p className="mt-1 text-sm text-neutral-600">{t("passwordSetHint")}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {hasPassword && (
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder={t("currentPassword")}
            required
            className="input w-full text-sm"
            aria-label={t("currentPassword")}
          />
        )}
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder={t("newPassword")}
          required
          className="input w-full text-sm"
          aria-label={t("newPassword")}
        />
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("confirmPassword")}
          required
          className="input w-full text-sm"
          aria-label={t("confirmPassword")}
        />
        {error && (
          <p className="text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-success-700">{t("passwordUpdated")}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {submitting ? tc("loading") : tc("save")}
        </button>
      </form>
    </div>
  );
}
