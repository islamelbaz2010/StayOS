"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/useAuth";
import { useAccount } from "@/lib/queries/account";
import { useHostListings } from "@/lib/queries/hostListings";
import {
  GUIDE_SECTIONS,
  topicsBySection,
} from "@/lib/hosting/guideTopics";

type ReadinessState = "ready" | "pending" | "attention";

interface ReadinessItem {
  id: string;
  state: ReadinessState;
  href: string;
  actionKey: string;
}

const READINESS_CHIP: Record<ReadinessState, string> = {
  ready: "bg-success-100 text-success-700",
  pending: "bg-warning-100 text-warning-700",
  attention: "bg-neutral-200 text-neutral-600",
};

export default function HostGuidePage() {
  const t = useTranslations("hostGuide");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { user } = useAuth();
  const { data: listings, isLoading: listingsLoading } = useHostListings();
  const { data: account } = useAccount();

  const hasListing = (listings?.length ?? 0) > 0;
  const hasLive = listings?.some((l) => l.status === "LISTED") ?? false;
  const hasPendingReview =
    listings?.some((l) => l.status === "PENDING_VERIFICATION") ?? false;
  const hasPhotos = listings?.some((l) => l.cover_image) ?? false;
  const hasPricing =
    listings?.some((l) => l.base_price_egp > 0) ?? false;
  const hasPayout = Boolean(account?.payout_method);
  const kyc = user?.kyc_status ?? "unverified";

  const readiness: ReadinessItem[] = [
    {
      id: "identity",
      state:
        kyc === "verified" ? "ready" : kyc === "pending" ? "pending" : "attention",
      href: `/${locale}/host/kyc`,
      actionKey: "openKyc",
    },
    {
      id: "listing",
      state: hasListing ? "ready" : "attention",
      href: hasListing
        ? `/${locale}/host/listings`
        : `/${locale}/host/listings/new`,
      actionKey: hasListing ? "manageListings" : "newListing",
    },
    {
      id: "live",
      state: hasLive ? "ready" : hasPendingReview ? "pending" : "attention",
      href: `/${locale}/host/listings`,
      actionKey: "manageListings",
    },
    {
      id: "photos",
      state: hasPhotos ? "ready" : "attention",
      href: `/${locale}/host/listings`,
      actionKey: "editListing",
    },
    {
      id: "pricing",
      state: hasPricing ? "ready" : "attention",
      href: `/${locale}/host/listings`,
      actionKey: "editListing",
    },
    {
      id: "payout",
      state: hasPayout ? "ready" : "attention",
      href: `/${locale}/account-settings/payments`,
      actionKey: "openPayouts",
    },
  ];

  const readyCount = readiness.filter((r) => r.state === "ready").length;

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <header className="max-w-2xl">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
          </header>

          <section
            className="mt-8 rounded-xl bg-white p-5 shadow-card sm:p-6"
            aria-labelledby="host-readiness"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="host-readiness"
                  className="text-lg font-bold text-brand-900"
                >
                  {t("readinessTitle")}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("readinessBody", { count: readyCount, total: readiness.length })}
                </p>
              </div>
              {!listingsLoading && (
                <span className="rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-accent-700">
                  {readyCount}/{readiness.length}
                </span>
              )}
            </div>
            <ul className="mt-5 divide-y divide-neutral-100">
              {readiness.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-800">
                      {t(`readiness.${item.id}.title`)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {t(`readiness.${item.id}.body`)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${READINESS_CHIP[item.state]}`}
                    >
                      {t(`status.${item.state}`)}
                    </span>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-accent-600 hover:text-accent-700"
                    >
                      {t(`actions.${item.actionKey}`)}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {GUIDE_SECTIONS.map((section) => (
            <section
              key={section}
              className="mt-10"
              aria-labelledby={`guide-section-${section}`}
            >
              <h2
                id={`guide-section-${section}`}
                className="text-lg font-bold text-brand-900"
              >
                {t(`sections.${section}.title`)}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t(`sections.${section}.body`)}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topicsBySection(section).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/${locale}/host/guide/${topic.id}`}
                    className="group rounded-xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <h3 className="font-semibold text-brand-900 group-hover:text-accent-700">
                      {t(`topics.${topic.id}.title`)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                      {t(`topics.${topic.id}.intro`)}
                    </p>
                    <span className="mt-3 inline-block text-sm font-semibold text-accent-600">
                      {t("readGuide")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section
            className="mt-10 rounded-xl bg-neutral-50 p-5 sm:p-6"
            aria-labelledby="guide-support"
          >
            <h2
              id="guide-support"
              className="text-lg font-bold text-brand-900"
            >
              {t("supportTitle")}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{t("supportBody")}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href={`/${locale}/help`}
                className="rounded-lg bg-white px-4 py-2 text-accent-700 shadow-card hover:text-accent-800"
              >
                {t("actions.help")}
              </Link>
              <Link
                href={`/${locale}/support`}
                className="rounded-lg bg-white px-4 py-2 text-accent-700 shadow-card hover:text-accent-800"
              >
                {t("actions.support")}
              </Link>
              <Link
                href={`/${locale}/host-standards`}
                className="rounded-lg bg-white px-4 py-2 text-accent-700 shadow-card hover:text-accent-800"
              >
                {t("actions.standards")}
              </Link>
            </div>
          </section>
        </main>
      </HostLayout>
    </ProtectedRoute>
  );
}
