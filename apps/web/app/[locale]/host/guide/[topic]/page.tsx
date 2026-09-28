"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HostLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getGuideTopic } from "@/lib/hosting/guideTopics";

export default function HostGuideTopicPage() {
  const t = useTranslations("hostGuide");
  const params = useParams<{ locale: string; topic: string }>();
  const locale = params?.locale ?? "ar";
  const topic = getGuideTopic(params?.topic ?? "");

  if (!topic) {
    return (
      <ProtectedRoute allowedRoles={["host", "admin"]}>
        <HostLayout>
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h1 className="text-2xl font-bold text-brand-900">
              {t("notFoundTitle")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {t("notFoundBody")}
            </p>
            <Link
              href={`/${locale}/host/guide`}
              className="btn-primary mt-6 inline-block text-sm"
            >
              {t("back")}
            </Link>
          </main>
        </HostLayout>
      </ProtectedRoute>
    );
  }

  const points = Array.from({ length: topic.points }, (_, i) => `p${i + 1}`);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Link
            href={`/${locale}/host/guide`}
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            {t("back")}
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t(`sections.${topic.section}.title`)}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t(`topics.${topic.id}.title`)}
          </h1>
          <p className="mt-3 text-base text-neutral-600">
            {t(`topics.${topic.id}.intro`)}
          </p>

          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </span>
                <p className="text-sm text-neutral-700">
                  {t(`topics.${topic.id}.points.${p}`)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {topic.actions.map((action) => (
              <Link
                key={action.href + action.labelKey}
                href={`/${locale}${action.href}`}
                className="btn-primary text-sm"
              >
                {t(`actions.${action.labelKey}`)}
              </Link>
            ))}
          </div>
        </main>
      </HostLayout>
    </ProtectedRoute>
  );
}
