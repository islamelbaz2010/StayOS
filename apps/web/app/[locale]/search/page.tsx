"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { FeesIncludedLine } from "@/components/search/FeesIncludedNotice";
import {
  FiltersDialog,
  type FilterDraft,
} from "@/components/search/FiltersDialog";
import { SearchBar } from "@/components/search/SearchBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSearchListings } from "@/lib/queries/listings";

const SearchMap = dynamic(
  () => import("@/components/search/SearchMap").then((mod) => mod.SearchMap),
  { ssr: false }
);

const CULTURAL_TAGS = [
  { value: "FAMILY_ONLY", key: "familyOnly" },
  { value: "MIXED", key: "mixed" },
  { value: "COUPLES_WELCOME", key: "couplesWelcome" },
];

// Horizontal quick-filter strip — the reference's amenity chips that
// toggle instantly, ahead of the staged Filters dialog.
const QUICK_AMENITIES = [
  "washer",
  "wifi",
  "kitchen",
  "parking",
  "air_conditioning",
  "self_check_in",
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
      category: searchParams.get("category") || undefined,
      cultural_tags: searchParams.get("cultural_tags") || undefined,
      min_price: searchParams.get("min_price") || undefined,
      max_price: searchParams.get("max_price") || undefined,
      bedrooms: searchParams.get("bedrooms") || undefined,
      beds: searchParams.get("beds") || undefined,
      bathrooms: searchParams.get("bathrooms") || undefined,
      amenities: searchParams.get("amenities") || undefined,
      free_cancellation: searchParams.get("free_cancellation") || undefined,
      pets: searchParams.get("pets") || undefined,
      self_check_in: searchParams.get("self_check_in") || undefined,
      accessibility: searchParams.get("accessibility") || undefined,
      host_language: searchParams.get("host_language") || undefined,
      instant_book: searchParams.get("instant_book") || undefined,
      sw_lat: searchParams.get("sw_lat") || undefined,
      sw_lng: searchParams.get("sw_lng") || undefined,
      ne_lat: searchParams.get("ne_lat") || undefined,
      ne_lng: searchParams.get("ne_lng") || undefined,
      sort: searchParams.get("sort") || undefined,
      limit: searchParams.get("limit") || undefined,
    }),
    [searchParams]
  );

  const selectedTags = useMemo(() => {
    return filters.cultural_tags ? filters.cultural_tags.split(",") : [];
  }, [filters.cultural_tags]);

  const selectedAmenities = useMemo(() => {
    return filters.amenities ? filters.amenities.split(",") : [];
  }, [filters.amenities]);

  const selectedAccessibility = useMemo(() => {
    return filters.accessibility ? filters.accessibility.split(",") : [];
  }, [filters.accessibility]);

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

  const toggleAmenity = (amenity: string) => {
    const next = new Set(selectedAmenities);
    if (next.has(amenity)) {
      next.delete(amenity);
    } else {
      next.add(amenity);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (next.size > 0) {
      nextParams.set("amenities", Array.from(next).join(","));
    } else {
      nextParams.delete("amenities");
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

  // Staged dialog apply: writes the whole draft into the URL at once,
  // matching the reference's "Show N places" confirmation step.
  const applyDraft = (draft: FilterDraft) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const scalarKeys = [
      "property_type",
      "category",
      "min_price",
      "max_price",
      "bedrooms",
      "beds",
      "bathrooms",
      "free_cancellation",
      "pets",
      "self_check_in",
      "instant_book",
      "host_language",
    ] as const;
    for (const key of scalarKeys) {
      const value = draft[key];
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    }
    if (draft.amenities.length) {
      nextParams.set("amenities", draft.amenities.join(","));
    } else {
      nextParams.delete("amenities");
    }
    if (draft.accessibility.length) {
      nextParams.set("accessibility", draft.accessibility.join(","));
    } else {
      nextParams.delete("accessibility");
    }
    nextParams.delete("offset");
    router.push(`/${locale}/search?${nextParams.toString()}`, {
      scroll: false,
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const key of [
      "property_type",
      "category",
      "min_price",
      "max_price",
      "bedrooms",
      "beds",
      "bathrooms",
      "pets",
      "self_check_in",
      "host_language",
    ]) {
      if (filters[key as keyof typeof filters]) count += 1;
    }
    count += selectedAmenities.length + selectedAccessibility.length;
    return count;
  }, [filters, selectedAmenities, selectedAccessibility]);

  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchListings(filters);

  const [viewMode, setViewMode] = useState<"list" | "map" | "split">("split");
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
        <FeesIncludedLine className="mt-1" />

        <div className="mt-4">
          <SearchBar
            baseParams={searchParams.toString()}
            q={filters.q}
            checkin={filters.checkin}
            checkout={filters.checkout}
            guests={filters.guests}
            pets={filters.pets}
            onSearch={(queryString) =>
              router.push(`/${locale}/search?${queryString}`, { scroll: false })
            }
          />
        </div>

        {/* Reference filter strip — Filters trigger first, then
            instant-toggle quick chips on a hairline rail. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="chip gap-1.5"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            {t("search.filters")}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {QUICK_AMENITIES.map((amenity) => {
            const selected =
              amenity === "self_check_in"
                ? Boolean(filters.self_check_in)
                : selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() =>
                  amenity === "self_check_in"
                    ? updateParam(
                        "self_check_in",
                        filters.self_check_in ? "" : "true"
                      )
                    : toggleAmenity(amenity)
                }
                className={`chip ${selected ? "chip-active" : ""}`}
                aria-pressed={selected}
              >
                {amenity === "self_check_in"
                  ? t("search.selfCheckIn")
                  : t(`listingForm.amenities.${amenity}`)}
              </button>
            );
          })}
          {CULTURAL_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`chip ${selected ? "chip-active" : ""}`}
                aria-pressed={selected}
              >
                {t(`search.tags.${tag.key}`)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() =>
              updateParam(
                "free_cancellation",
                filters.free_cancellation ? "" : "true"
              )
            }
            className={`chip ${filters.free_cancellation ? "chip-active" : ""}`}
            aria-pressed={Boolean(filters.free_cancellation)}
          >
            {t("search.freeCancellation")}
          </button>
          <button
            type="button"
            onClick={() =>
              updateParam("instant_book", filters.instant_book ? "" : "true")
            }
            className={`chip ${filters.instant_book ? "chip-active" : ""}`}
            aria-pressed={Boolean(filters.instant_book)}
          >
            {t("search.instantBook")}
          </button>
        </div>

        <FiltersDialog
          open={showFilters}
          onClose={() => setShowFilters(false)}
          baseFilters={{
            q: filters.q,
            checkin: filters.checkin,
            checkout: filters.checkout,
            guests: filters.guests,
            cultural_tags: filters.cultural_tags,
            sw_lat: filters.sw_lat,
            sw_lng: filters.sw_lng,
            ne_lat: filters.ne_lat,
            ne_lng: filters.ne_lng,
            sort: filters.sort,
          }}
          initial={{
            property_type: filters.property_type,
            category: filters.category,
            min_price: filters.min_price,
            max_price: filters.max_price,
            bedrooms: filters.bedrooms,
            beds: filters.beds,
            bathrooms: filters.bathrooms,
            amenities: selectedAmenities,
            accessibility: selectedAccessibility,
            free_cancellation: filters.free_cancellation,
            pets: filters.pets,
            self_check_in: filters.self_check_in,
            instant_book: filters.instant_book,
            host_language: filters.host_language,
          }}
          onApply={applyDraft}
        />

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
              <option value="rating_desc">{t("search.sortRatingDesc")}</option>
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
                  : "bg-white text-neutral-700 hover:bg-surface-soft"
              }
            `}
            aria-pressed={viewMode === "list"}
          >
            {t("search.list")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`
              hidden rounded-lg px-3 py-1.5 text-sm font-medium transition lg:inline-block
              ${
                viewMode === "split"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-neutral-700 hover:bg-surface-soft"
              }
            `}
            aria-pressed={viewMode === "split"}
          >
            {t("search.split")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`
              rounded-lg px-3 py-1.5 text-sm font-medium transition
              ${
                viewMode === "map"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-neutral-700 hover:bg-surface-soft"
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
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center border border-neutral-150">
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
        ) : (
          (() => {
            const applyMapBounds = (bounds: {
              sw_lat: string;
              sw_lng: string;
              ne_lat: string;
              ne_lng: string;
            }) => {
              const nextParams = new URLSearchParams(searchParams.toString());
              nextParams.set("sw_lat", bounds.sw_lat);
              nextParams.set("sw_lng", bounds.sw_lng);
              nextParams.set("ne_lat", bounds.ne_lat);
              nextParams.set("ne_lng", bounds.ne_lng);
              router.push(`/${locale}/search?${nextParams.toString()}`, {
                scroll: false,
              });
            };

            const mapAreaIndicator = (filters.sw_lat ||
              filters.sw_lng ||
              filters.ne_lat ||
              filters.ne_lng) && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-neutral-500">
                  {t("search.filteredByMapArea")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextParams = new URLSearchParams(
                      searchParams.toString()
                    );
                    nextParams.delete("sw_lat");
                    nextParams.delete("sw_lng");
                    nextParams.delete("ne_lat");
                    nextParams.delete("ne_lng");
                    router.push(`/${locale}/search?${nextParams.toString()}`, {
                      scroll: false,
                    });
                  }}
                  className="text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  {t("search.clearMapArea")}
                </button>
              </div>
            );

            const renderMap = (mapClass: string) => (
              <>
                <SearchMap
                  listings={allListings}
                  onSelect={goToListing}
                  onBoundsChange={applyMapBounds}
                  searchAreaLabel={t("search.searchArea")}
                  highlightId={highlightedId}
                  onMarkerHover={setHighlightedId}
                  className={mapClass}
                />
                {mapAreaIndicator}
              </>
            );

            const renderList = (gridCols: string) => (
              <>
                <div className={`mt-6 grid grid-cols-1 gap-6 ${gridCols}`}>
                  {allListings.map((listing) => (
                    <div
                      key={listing.id}
                      onMouseEnter={() => setHighlightedId(listing.id)}
                      onMouseLeave={() => setHighlightedId(null)}
                      className={
                        highlightedId === listing.id
                          ? "rounded-card ring-2 ring-brand-500"
                          : ""
                      }
                    >
                      <ListingCard
                        listing={listing}
                        checkin={filters.checkin}
                        checkout={filters.checkout}
                      />
                    </div>
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
            );

            if (viewMode === "map") {
              return (
                <div className="mt-6">
                  {renderMap("h-[70vh] w-full rounded-xl")}
                </div>
              );
            }

            if (viewMode === "split") {
              // Desktop: results + map side by side, map sticky. Mobile:
              // falls back to the list (the map view is one tap away).
              return (
                <div className="lg:grid lg:grid-cols-[1fr_45%] lg:gap-6">
                  <div>{renderList("sm:grid-cols-2")}</div>
                  <div className="hidden lg:block">
                    <div className="sticky top-24">
                      {renderMap("h-[calc(100vh-140px)] w-full rounded-xl")}
                    </div>
                  </div>
                </div>
              );
            }

            return renderList("sm:grid-cols-2 lg:grid-cols-3");
          })()
        )}
      </section>
    </GuestLayout>
  );
}
