"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import {
  ALL_ARTICLES,
  articlesInCategory,
  categoriesForRoles,
  recommendedFor,
  rolesForUser,
  searchArticles,
  type HelpRole,
} from "@/lib/help";

export function HelpCenterClient() {
  const t = useTranslations("helpCenter");
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale === "ar" ? "ar" : "en") as "en" | "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";
  const context = searchParams?.get("context") ?? null;

  const { user } = useAuth();
  const roles: HelpRole[] = rolesForUser(user?.role);

  const categories = useMemo(() => categoriesForRoles(roles), [roles]);
  const results = useMemo(
    () => searchArticles(ALL_ARTICLES, roles, query, locale),
    [roles, query, locale]
  );
  const recommended = useMemo(
    () => recommendedFor(ALL_ARTICLES, roles, context),
    [roles, context]
  );

  const [searchInput, setSearchInput] = useState(query);

  const goSearch = (value: string) => {
    const q = value.trim();
    router.replace(
      q ? `/${locale}/help?q=${encodeURIComponent(q)}` : `/${locale}/help`,
      { scroll: false }
    );
  };

  const searching = query.trim().length > 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Hero + search */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-brand-900">{t("title")}</h1>
        <p className="mt-2 text-neutral-600">{t("subtitle")}</p>
        <div className="mx-auto mt-6 flex max-w-xl gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch(searchInput)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="input w-full"
          />
          <button
            type="button"
            onClick={() => goSearch(searchInput)}
            className="shrink-0 rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            {t("searchButton")}
          </button>
        </div>
      </div>

      {searching ? (
        /* ------------------------- Search results ------------------------- */
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">
              {t("searchResultsFor", { q: query })}
            </h2>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                router.replace(`/${locale}/help`, { scroll: false });
              }}
              className="text-sm font-medium text-accent-600 hover:underline"
            >
              {t("clearSearch")}
            </button>
          </div>
          {results.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-card">
              <p className="font-medium text-neutral-700">{t("noResults")}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {t("noResultsHint")}
              </p>
              <Link
                href={`/${locale}/support`}
                className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {t("startConversation")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/help/article/${article.slug}`}
                  className="block rounded-xl bg-white p-5 shadow-card transition hover:shadow-md"
                >
                  <p className="font-semibold text-brand-900">
                    {article.title[locale]}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {article.summary[locale]}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-10">
          {/* --------------------- Recommended --------------------- */}
          {recommended.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-brand-900">
                {t("recommended")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {recommended.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/help/article/${article.slug}`}
                    className="rounded-xl bg-white p-5 shadow-card transition hover:shadow-md"
                  >
                    <p className="font-semibold text-brand-900">
                      {article.title[locale]}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                      {article.summary[locale]}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------- Topics ------------------------ */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-brand-900">
              {t("browseTopics")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const articles = articlesInCategory(
                  ALL_ARTICLES,
                  category.key,
                  roles
                );
                if (category.key === "support") return null;
                return (
                  <div
                    key={category.key}
                    className="rounded-xl bg-white p-5 shadow-card"
                  >
                    <h3 className="font-semibold text-brand-900">
                      {category.title[locale]}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {category.blurb[locale]}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {articles.slice(0, 4).map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/${locale}/help/article/${article.slug}`}
                            className="text-sm text-neutral-700 transition hover:text-accent-600"
                          >
                            {article.title[locale]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ----------------- FAQ + Contact Support ---------------- */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-brand-900">{t("faqTitle")}</h2>
              <Link
                href={`/${locale}/faq`}
                className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:underline"
              >
                {t("browseFaq")}
              </Link>
            </div>
            <div className="rounded-xl bg-brand-900 p-6 text-white">
              <h2 className="font-semibold">{t("contactTitle")}</h2>
              <p className="mt-1 text-sm text-brand-100">{t("contactHint")}</p>
              <Link
                href={`/${locale}/support`}
                className="mt-3 inline-block rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-300"
              >
                {t("startConversation")}
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
