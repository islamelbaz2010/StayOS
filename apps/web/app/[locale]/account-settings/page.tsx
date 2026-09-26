"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useAccount } from "@/lib/queries/account";

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
  const tp = useTranslations("profile");
  const { user } = useAuth();
  const { data: account } = useAccount();

  const isHost = user?.role === "host";

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold text-brand-900">{t("title")}</h1>
          <p className="mt-2 text-neutral-600">{t("subtitle")}</p>
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
                  <dd>{user?.kyc_status || t("notConfigured")}</dd>
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
            <Card
              title={t("cards.taxes.title")}
              body={t("cards.taxes.body")}
              href={`/${locale}/account-settings/personal`}
              action={t("open")}
            >
              <p className="mt-3 text-xs text-neutral-500">
                {tp("taxId")}: {account?.tax_id || t("notConfigured")}
              </p>
            </Card>
            {isHost ? (
              <Card
                title={t("cards.hosting.title")}
                body={t("cards.hosting.body")}
                href={`/${locale}/host`}
                action={t("open")}
              />
            ) : (
              <Card
                title={t("cards.becomeHost.title")}
                body={t("cards.becomeHost.body")}
                href={`/${locale}/kyc`}
                action={t("open")}
              />
            )}
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
