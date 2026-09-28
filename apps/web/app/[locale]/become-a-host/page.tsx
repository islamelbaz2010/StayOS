"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useHostListings } from "@/lib/queries/hostListings";

type StepState = "done" | "pending" | "todo";

const STEP_IDS = ["account", "verify", "activate", "listing", "live"] as const;

function StepBadge({ state, t }: { state: StepState; t: (k: string) => string }) {
  const styles: Record<StepState, string> = {
    done: "bg-success-100 text-success-700",
    pending: "bg-warning-100 text-warning-700",
    todo: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[state]}`}
    >
      {t(`stepStatus.${state}`)}
    </span>
  );
}

export default function BecomeAHostPage() {
  const t = useTranslations("becomeHost");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { user, isAuthenticated, isLoading } = useAuth();

  const isHost = user?.role === "host";
  const { data: listings } = useHostListings({
    enabled: isAuthenticated && isHost,
  });

  const kycStatus = user?.kyc_status ?? "unverified";
  const hasListing = (listings?.length ?? 0) > 0;
  const hasLiveListing =
    listings?.some((l) => l.status === "LISTED") ?? false;
  const hasPendingListing =
    listings?.some((l) => l.status === "PENDING_VERIFICATION") ?? false;

  const stepStates: Record<(typeof STEP_IDS)[number], StepState> = {
    account: !isAuthenticated ? "todo" : "done",
    verify:
      kycStatus === "verified"
        ? "done"
        : kycStatus === "pending"
          ? "pending"
          : "todo",
    activate: isHost ? "done" : "todo",
    listing: hasListing ? "done" : "todo",
    live: hasLiveListing ? "done" : hasPendingListing ? "pending" : "todo",
  };

  let ctaHref = `/${locale}/auth/login`;
  let ctaLabel = t("cta.signIn");
  if (isAuthenticated && !isHost) {
    ctaHref = `/${locale}/kyc`;
    ctaLabel =
      kycStatus === "verified" ? t("cta.continueVerification") : t("cta.verifyIdentity");
  } else if (isHost) {
    ctaHref = hasListing ? `/${locale}/host` : `/${locale}/host/listings/new`;
    ctaLabel = hasListing ? t("cta.openDashboard") : t("cta.createListing");
  }

  return (
    <GuestLayout>
      <main className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-neutral-600">{t("subtitle")}</p>
          {!isLoading && (
            <Link
              href={ctaHref}
              className="btn-primary mt-6 inline-block text-sm"
            >
              {ctaLabel}
            </Link>
          )}
        </header>

        <section className="mt-12" aria-labelledby="become-host-steps">
          <h2
            id="become-host-steps"
            className="text-xl font-bold text-brand-900"
          >
            {t("stepsTitle")}
          </h2>
          <ol className="mt-5 space-y-4">
            {STEP_IDS.map((id, idx) => (
              <li
                key={id}
                className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700"
                >
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-brand-900">
                      {t(`steps.${id}.title`)}
                    </h3>
                    <StepBadge state={stepStates[id]} t={t} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {t(`steps.${id}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mt-12 rounded-xl bg-white p-6 shadow-card"
          aria-labelledby="become-host-earnings"
        >
          <h2
            id="become-host-earnings"
            className="text-xl font-bold text-brand-900"
          >
            {t("earningsTitle")}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{t("earningsBody")}</p>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-neutral-700">
            <li>{t("earningsPoints.setPrice")}</li>
            <li>{t("earningsPoints.commission")}</li>
            <li>{t("earningsPoints.allInclusive")}</li>
            <li>{t("earningsPoints.net")}</li>
            <li>{t("earningsPoints.payouts")}</li>
          </ul>
        </section>

        <section
          className="mt-6 rounded-xl bg-white p-6 shadow-card"
          aria-labelledby="become-host-standards"
        >
          <h2
            id="become-host-standards"
            className="text-xl font-bold text-brand-900"
          >
            {t("expectationsTitle")}
          </h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-neutral-700">
            <li>{t("expectations.accurate")}</li>
            <li>{t("expectations.photos")}</li>
            <li>{t("expectations.review")}</li>
            <li>{t("expectations.communication")}</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href={`/${locale}/host-standards`}
              className="text-accent-600 hover:text-accent-700"
            >
              {t("links.standards")}
            </Link>
            <Link
              href={`/${locale}/help`}
              className="text-accent-600 hover:text-accent-700"
            >
              {t("links.help")}
            </Link>
            <Link
              href={`/${locale}/support`}
              className="text-accent-600 hover:text-accent-700"
            >
              {t("links.support")}
            </Link>
          </div>
        </section>
      </main>
    </GuestLayout>
  );
}
