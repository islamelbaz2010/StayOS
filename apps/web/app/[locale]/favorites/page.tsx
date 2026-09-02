"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { useAuth } from "@/lib/auth/useAuth";
import { useFavorites } from "@/lib/queries/favorites";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { isAuthenticated, isGuest, isLoading: isAuthLoading } = useAuth();
  const { data, isPending } = useFavorites();

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

        {!isAuthLoading && (!isAuthenticated || !isGuest) ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-card">
            <p className="text-lg font-medium text-neutral-700">{t("signInTitle")}</p>
            <Link
              href={`/${locale}/auth/login`}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {t("signInTitle")}
            </Link>
          </div>
        ) : isPending ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : !data || data.listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-neutral-700">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-neutral-500">{t("emptySubtitle")}</p>
            <Link
              href={`/${locale}/search`}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {t("browseListings")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </GuestLayout>
  );
}
