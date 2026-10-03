"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import {
  ALL_ARTICLES,
  HELP_CATEGORIES,
  getArticle,
  rolesForUser,
} from "@/lib/help";

export function HelpArticleClient({ slug }: { slug: string }) {
  const t = useTranslations("helpCenter");
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale === "ar" ? "ar" : "en") as "en" | "ar";
  const { user } = useAuth();
  const roles = rolesForUser(user?.role);

  const article = getArticle(slug);
  const visible = article && article.roles.some((r) => roles.includes(r));

  if (!article || !visible) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-neutral-600">{t("articleNotFound")}</p>
        <Link
          href={`/${locale}/help`}
          className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:underline"
        >
          {t("backToHelp")}
        </Link>
      </div>
    );
  }

  const category = HELP_CATEGORIES.find((c) => c.key === article.category);
  const related = article.related
    .map((s) => ALL_ARTICLES.find((a) => a.slug === s))
    .filter(
      (a): a is NonNullable<typeof a> =>
        !!a && a.roles.some((r) => roles.includes(r))
    );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/help`}
        className="text-sm font-medium text-neutral-500 transition hover:text-accent-600"
      >
        ← {t("backToHelp")}
      </Link>

      <article className="mt-6">
        {category && (
          <p className="text-sm font-medium uppercase tracking-wide text-accent-600">
            {category.title[locale]}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
          {article.title[locale]}
        </h1>
        <p className="mt-2 text-neutral-600">{article.summary[locale]}</p>

        <div className="mt-8 space-y-5">
          {article.body[locale].map((paragraph, i) => (
            <p
              key={i}
              className="leading-relaxed text-neutral-700"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold text-brand-900">
            {t("relatedArticles")}
          </h2>
          <div className="space-y-2">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/${locale}/help/article/${rel.slug}`}
                className="block rounded-xl bg-white p-4 shadow-card transition hover:shadow-md"
              >
                <p className="font-medium text-brand-900">
                  {rel.title[locale]}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
                  {rel.summary[locale]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 rounded-xl bg-brand-900 p-6 text-white">
        <h2 className="font-semibold">{t("stillNeedHelp")}</h2>
        <p className="mt-1 text-sm text-brand-100">
          {t("stillNeedHelpHint")}
        </p>
        <Link
          href={`/${locale}/support`}
          className="mt-3 inline-block rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-300"
        >
          {t("startConversation")}
        </Link>
      </section>
    </div>
  );
}
