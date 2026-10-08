"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useAccount, useDeactivateHosting } from "@/lib/queries/account";

function Card({
  title,
  body,
  href,
  action,
  children,
  id,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-xl bg-white p-5 shadow-card">
      <h2 className="font-semibold text-brand-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{body}</p>
      {children}
      {href && action && (
        <Link
          href={href}
          className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
        >
          {action}
        </Link>
      )}
    </section>
  );
}

export default function AccountSettingsPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings");
  const th = useTranslations("host");
  const { user, refreshUser } = useAuth();
  const { data: account } = useAccount();
  const deactivateHosting = useDeactivateHosting();
  const [hostingError, setHostingError] = useState<string | null>(null);
  const [hostingDeactivated, setHostingDeactivated] = useState(false);

  const isHost = user?.role === "host";

  async function handleDeactivateHosting() {
    if (!window.confirm(t("cards.hosting.deactivateConfirm"))) {
      return;
    }
    setHostingError(null);
    try {
      await deactivateHosting.mutateAsync();
      await refreshUser();
      setHostingDeactivated(true);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      setHostingError(
        status === 409
          ? t("cards.hosting.deactivateBlocked")
          : t("cards.hosting.deactivateError")
      );
    }
  }

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold text-brand-900">{t("title")}</h1>
          <p className="mt-2 text-neutral-600">{t("subtitle")}</p>
          {user && (
            <div className="mt-6 flex items-center gap-4 rounded-xl bg-white p-5 shadow-card">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.display_name ?? ""}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
                  {user.display_name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-bold text-brand-900">
                    {user.display_name}
                  </p>
                  {user.kyc_status === "verified" && (
                    <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">
                      ✓ {th("kycStatus.verified")}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-neutral-500">
                  {user.email ?? user.phone_number}
                </p>
              </div>
              <Link
                href={`/${locale}/profile`}
                className="text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("open")}
              </Link>
            </div>
          )}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card
              title={t("cards.personal.title")}
              body={t("cards.personal.body")}
              href={`/${locale}/account-settings/personal`}
              action={t("open")}
            >
              <dl className="mt-3 space-y-1 text-xs text-neutral-500">
                <div className="flex justify-between">
                  <dt>{t("legalName")}</dt>
                  <dd>{account?.legal_name || t("notConfigured")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("verified")}</dt>
                  <dd>
                    {user?.kyc_status
                      ? th(
                          `kycStatus.${user.kyc_status}` as Parameters<
                            typeof th
                          >[0],
                          { default: user.kyc_status }
                        )
                      : t("notConfigured")}
                  </dd>
                </div>
              </dl>
            </Card>
            <Card
              title={t("cards.security.title")}
              body={t("cards.security.body")}
              href={`/${locale}/account-settings/security`}
              action={t("open")}
            />
            <Card
              title={t("cards.privacy.title")}
              body={t("cards.privacy.body")}
              href={`/${locale}/account-settings/privacy`}
              action={t("open")}
            />
            <Card
              title={t("cards.notifications.title")}
              body={t("cards.notifications.body")}
              href={`/${locale}/account-settings/notifications`}
              action={t("open")}
            />
            <Card
              title={t("cards.activity.title")}
              body={t("cards.activity.body")}
              href={`/${locale}/account-settings/activity`}
              action={t("open")}
            />
            <Card
              id="language"
              title={t("cards.language.title")}
              body={t("cards.language.body")}
              href={`/${locale}/account-settings/language`}
              action={t("open")}
            >
              <p className="mt-3 text-xs text-neutral-500">
                {user?.locale === "en" ? "English" : "العربية"} · EGP
              </p>
            </Card>
            <Card
              title={t("cards.payments.title")}
              body={t("cards.payments.body")}
              href={`/${locale}/account-settings/payments`}
              action={t("open")}
            />
            {/* Tax ID lives only in the dedicated payments/tax surface —
                never on the general account settings index. */}
            {isHost ? (
              <Card
                title={t("cards.hosting.title")}
                body={t("cards.hosting.body")}
                href={`/${locale}/host`}
                action={t("open")}
              >
                {hostingDeactivated ? (
                  <p className="mt-3 text-sm font-medium text-success-700" role="status">
                    {t("cards.hosting.deactivated")}
                  </p>
                ) : (
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      onClick={handleDeactivateHosting}
                      disabled={deactivateHosting.isPending}
                      className="text-sm font-semibold text-danger-600 hover:text-danger-700 disabled:opacity-50"
                    >
                      {deactivateHosting.isPending
                        ? t("cards.hosting.deactivating")
                        : t("cards.hosting.deactivate")}
                    </button>
                    {hostingError && (
                      <p className="mt-2 text-sm text-danger-600" role="alert">
                        {hostingError}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              <Card
                title={t("cards.becomeHost.title")}
                body={t("cards.becomeHost.body")}
                href={`/${locale}/become-a-host`}
                action={t("open")}
              />
            )}
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
