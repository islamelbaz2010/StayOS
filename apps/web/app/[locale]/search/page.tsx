"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSearchListings } from "@/lib/queries/listings";

const SearchMap = dynamic(
  () => import("@/components/search/SearchMap").then((mod) => mod.SearchMap),
  { ssr: false }
);

const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "STUDIO",
  "HOTEL_ROOM",
  "RESORT_UNIT",
];

const CULTURAL_TAGS = [
  { value: "FAMILY_ONLY", key: "familyOnly" },
  { value: "HALAL_CERTIFIED", key: "halalCertified" },
  { value: "MIXED", key: "mixed" },
  { value: "COUPLES_WELCOME", key: "couplesWelcome" },
];

export default function SearchPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      checkin: searchParams.get("checkin") || undefined,
      checkout: searchParams.get("checkout") || undefined,
      guests: searchParams.get("guests") || undefined,
      property_type: searchParams.get("property_type") || undefined,
      cultural_tags: searchParams.get("cultural_tags") || undefined,
      min_price: searchParams.get("min_price") || undefined,
      max_price: searchParams.get("max_price") || undefined,
      sort: searchParams.get("sort") || undefined,
      limit: searchParams.get("limit") || undefined,
    }),
    [searchParams]
  );

  const selectedTags = useMemo(() => {
    return filters.cultural_tags ? filters.cultural_tags.split(",") : [];
  }, [filters.cultural_tags]);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (next.size > 0) {
      nextParams.set("cultural_tags", Array.from(next).join(","));
    } else {
      nextParams.delete("cultural_tags");
    }

    router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
  };

  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    router.push(`/${locale}/search?${nextParams.toString()}`, {
      scroll: false,
    });
  };

  const hasActiveFilters = Boolean(
    filters.property_type || filters.min_price || filters.max_price
  );

  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchListings(filters);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const allListings = useMemo(
    () => data?.pages.flatMap((page) => page.listings) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;

  const goToListing = (unitId: string) => {
    router.push(`/${locale}/listings/${unitId}`);
  };

  return (
    <GuestLayout>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
            {t("search.title")}
          </h1>
          {allListings.length > 0 && (
            <span className="text-sm text-neutral-500">
              {t("search.resultsCount", { count: total })}
            </span>
          )}
        </div>

        <div className="mt-4">
          <SearchBar
            baseParams={searchParams.toString()}
            q={filters.q}
            checkin={filters.checkin}
            checkout={filters.checkout}
            guests={filters.guests}
            onSearch={(queryString) =>
              router.push(`/${locale}/search?${queryString}`, { scroll: false })
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CULTURAL_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`
                  rounded-full border px-4 py-2 text-sm font-medium transition
                  ${
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
                  }
                `}
                aria-pressed={selected}
              >
                {t(`search.tags.${tag.key}`)}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-card">
          <div className="min-w-36 flex-1 sm:flex-none">
            <label
              htmlFor="filter-property-type"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.propertyType")}
            </label>
            <select
              id="filter-property-type"
              value={filters.property_type ?? ""}
              onChange={(e) => updateParam("property_type", e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">{t("search.anyType")}</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`search.types.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label
              htmlFor="filter-min-price"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.minPrice")}
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.min_price ?? ""}
              onChange={(e) => updateParam("min_price", e.target.value)}
              className="input mt-1 w-full text-sm"
            />
          </div>
          <div className="w-28">
            <label
              htmlFor="filter-max-price"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.maxPrice")}
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.max_price ?? ""}
              onChange={(e) => updateParam("max_price", e.target.value)}
              className="input mt-1 w-full text-sm"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.delete("property_type");
                nextParams.delete("min_price");
                nextParams.delete("max_price");
                router.push(`/${locale}/search?${nextParams.toString()}`, {
                  scroll: false,
                });
              }}
              className="text-sm font-semibold text-accent-600 hover:text-accent-700"
            >
              {t("search.clearFilters")}
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-sm font-medium text-neutral-500"
            >
              {t("search.sortBy")}
            </label>
            <select
              id="sort-select"
              value={filters.sort ?? ""}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="input w-44 text-sm"
            >
              <option value="">{t("search.sortRecommended")}</option>
              <option value="price_asc">{t("search.sortPriceAsc")}</option>
              <option value="price_desc">{t("search.sortPriceDesc")}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`
              rounded-lg px-3 py-1.5 text-sm font-medium transition
              ${
                viewMode === "list"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }
            `}
            aria-pressed={viewMode === "list"}
          >
            {t("search.list")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`
              rounded-lg px-3 py-1.5 text-sm font-medium transition
              ${
                viewMode === "map"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }
            `}
            aria-pressed={viewMode === "map"}
          >
            {t("search.map")}
          </button>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : allListings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-neutral-700">
              {t("search.noResults")}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {t("search.noResultsHint")}
            </p>
          </div>
        ) : viewMode === "map" ? (
          <div className="mt-6">
            <SearchMap listings={allListings} onSelect={goToListing} />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  checkin={filters.checkin}
                  checkout={filters.checkout}
                />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFetchingNextPage
                    ? t("search.loadingMore")
                    : t("search.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </GuestLayout>
  );
}
