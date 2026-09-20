"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCardSkeleton } from "@/components/listings/ListingCardSkeleton";
import { FeesIncludedLine } from "@/components/search/FeesIncludedNotice";
import { PriceRangeFilter } from "@/components/search/PriceRangeFilter";
import { SearchBar } from "@/components/search/SearchBar";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  usePriceDistribution,
  useSearchListings,
} from "@/lib/queries/listings";

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

const LISTING_CATEGORIES = [
  "ENTIRE_PLACE",
  "PRIVATE_ROOM",
  "SHARED_ROOM",
];

const CULTURAL_TAGS = [
  { value: "FAMILY_ONLY", key: "familyOnly" },
  { value: "HALAL_CERTIFIED", key: "halalCertified" },
  { value: "MIXED", key: "mixed" },
  { value: "COUPLES_WELCOME", key: "couplesWelcome" },
];

const AMENITIES = [
  "wifi",
  "air_conditioning",
  "heating",
  "kitchen",
  "parking",
  "pool",
  "gym",
  "washer",
  "tv",
  "elevator",
];

// Must match app.listings.constants.AccessibilityFeature (DEC-019).
const ACCESSIBILITY_FEATURES = [
  { value: "STEP_FREE_ENTRANCE", key: "stepFreeEntrance" },
  { value: "WIDE_ENTRANCE", key: "wideEntrance" },
  { value: "ACCESSIBLE_PARKING", key: "accessibleParking" },
  { value: "STEP_FREE_PATH", key: "stepFreePath" },
  { value: "STEP_FREE_BEDROOM", key: "stepFreeBedroom" },
  { value: "WIDE_BEDROOM", key: "wideBedroom" },
  { value: "ACCESSIBLE_BATHROOM", key: "accessibleBathroom" },
  { value: "WIDE_BATHROOM", key: "wideBathroom" },
  { value: "SHOWER_GRAB_BAR", key: "showerGrabBar" },
  { value: "TOILET_GRAB_BAR", key: "toiletGrabBar" },
  { value: "STEP_FREE_SHOWER", key: "stepFreeShower" },
  { value: "SHOWER_CHAIR", key: "showerChair" },
  { value: "CEILING_HOIST", key: "ceilingHoist" },
];

// Must match app.auth.constants.SpokenLanguage (DEC-019).
const HOST_LANGUAGES = [
  "ar", "en", "fr", "de", "ru", "it", "es", "tr",
  "zh", "ja", "ko", "pt", "nl", "fi", "el", "he",
  "hi", "hu", "id", "ms", "sv", "th", "be", "bg",
  "gu", "ht", "fa", "pa", "tl", "uk", "ur", "vi",
  "sign",
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

  const toggleAccessibility = (feature: string) => {
    const next = new Set(selectedAccessibility);
    if (next.has(feature)) {
      next.delete(feature);
    } else {
      next.add(feature);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (next.size > 0) {
      nextParams.set("accessibility", Array.from(next).join(","));
    } else {
      nextParams.delete("accessibility");
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

  const applyPriceRange = (min: number | null, max: number | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (min != null) {
      nextParams.set("min_price", String(min));
    } else {
      nextParams.delete("min_price");
    }
    if (max != null) {
      nextParams.set("max_price", String(max));
    } else {
      nextParams.delete("max_price");
    }
    router.push(`/${locale}/search?${nextParams.toString()}`, {
      scroll: false,
    });
  };

  const hasActiveFilters = Boolean(
    filters.property_type ||
      filters.category ||
      filters.min_price ||
      filters.max_price ||
      filters.bedrooms ||
      filters.beds ||
      filters.bathrooms ||
      filters.amenities ||
      filters.pets ||
      filters.self_check_in ||
      filters.accessibility ||
      filters.host_language ||
      filters.instant_book
  );

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

  const priceDistribution = usePriceDistribution(filters);

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
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams.toString());
              if (filters.free_cancellation) {
                nextParams.delete("free_cancellation");
              } else {
                nextParams.set("free_cancellation", "true");
              }
              router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
            }}
            className={`
              rounded-full border px-4 py-2 text-sm font-medium transition
              ${
                filters.free_cancellation
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
              }
            `}
            aria-pressed={Boolean(filters.free_cancellation)}
          >
            {t("search.freeCancellation")}
          </button>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams.toString());
              if (filters.instant_book) {
                nextParams.delete("instant_book");
              } else {
                nextParams.set("instant_book", "true");
              }
              router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
            }}
            className={`
              rounded-full border px-4 py-2 text-sm font-medium transition
              ${
                filters.instant_book
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
              }
            `}
            aria-pressed={Boolean(filters.instant_book)}
          >
            {t("search.instantBook")}
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand-400 hover:text-brand-600"
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
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters modal — grouped by intent (Airbnb pattern) */}
        {showFilters && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowFilters(false)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-surface-card shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-bold text-brand-900">
                  {t("search.filters")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label={t("common.close")}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-wrap items-end gap-3">
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
          <div className="min-w-36 flex-1 sm:flex-none">
            <label
              htmlFor="filter-category"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.category")}
            </label>
            <select
              id="filter-category"
              value={filters.category ?? ""}
              onChange={(e) => updateParam("category", e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">{t("search.anyCategory")}</option>
              {LISTING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`listing.categoryLabel.${cat.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <PriceRangeFilter
              distribution={priceDistribution.data}
              isLoading={priceDistribution.isPending}
              minPrice={filters.min_price}
              maxPrice={filters.max_price}
              onApply={applyPriceRange}
            />
          </div>
          <div className="w-24">
            <label
              htmlFor="filter-bedrooms"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.bedrooms")}
            </label>
            <select
              id="filter-bedrooms"
              value={filters.bedrooms ?? ""}
              onChange={(e) => updateParam("bedrooms", e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">{t("search.any")}</option>
              {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                <option key={n} value={String(n)}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label
              htmlFor="filter-beds"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.beds")}
            </label>
            <select
              id="filter-beds"
              value={filters.beds ?? ""}
              onChange={(e) => updateParam("beds", e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">{t("search.any")}</option>
              {Array.from({ length: 8 }, (_, i) => i).map((n) => (
                <option key={n} value={String(n)}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label
              htmlFor="filter-bathrooms"
              className="block text-xs font-medium text-neutral-500"
            >
              {t("search.bathrooms")}
            </label>
            <select
              id="filter-bathrooms"
              value={filters.bathrooms ?? ""}
              onChange={(e) => updateParam("bathrooms", e.target.value)}
              className="input mt-1 w-full text-sm"
            >
              <option value="">{t("search.any")}</option>
              {Array.from({ length: 5 }, (_, i) => i).map((n) => (
                <option key={n} value={String(n)}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {t("search.amenities")}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
          {AMENITIES.map((amenity) => {
            const selected = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`
                  rounded-full border px-3 py-1 text-xs font-medium transition
                  ${
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
                  }
                `}
                aria-pressed={selected}
              >
                {t(`listingForm.amenities.${amenity}`)}
              </button>
            );
          })}
          </div>
        </div>

        {/* Booking options */}
        <div className="mt-6 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {t("search.bookingOptions")}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams.toString());
              if (filters.pets) {
                nextParams.delete("pets");
              } else {
                nextParams.set("pets", "true");
              }
              router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
            }}
            className={`
              rounded-full border px-3 py-1 text-xs font-medium transition
              ${
                filters.pets
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
              }
            `}
            aria-pressed={Boolean(filters.pets)}
          >
            {t("search.petsAllowed")}
          </button>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams.toString());
              if (filters.self_check_in) {
                nextParams.delete("self_check_in");
              } else {
                nextParams.set("self_check_in", "true");
              }
              router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
            }}
            className={`
              rounded-full border px-3 py-1 text-xs font-medium transition
              ${
                filters.self_check_in
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
              }
            `}
            aria-pressed={Boolean(filters.self_check_in)}
          >
            {t("search.selfCheckIn")}
          </button>
          </div>
        </div>

        {ACCESSIBILITY_FEATURES.length > 0 && (
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-brand-900">
              {t("search.accessibility")}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
            {ACCESSIBILITY_FEATURES.map((feature) => {
              const selected = selectedAccessibility.includes(feature.value);
              return (
                <button
                  key={feature.value}
                  type="button"
                  onClick={() => toggleAccessibility(feature.value)}
                  className={`
                    rounded-full border px-3 py-1 text-xs font-medium transition
                    ${
                      selected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
                    }
                  `}
                  aria-pressed={selected}
                >
                  {t(`search.accessibilityFeatures.${feature.key}`)}
                </button>
              );
            })}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {t("search.hostLanguage")}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
          {HOST_LANGUAGES.map((lang) => {
            const selected = filters.host_language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams.toString());
                  if (selected) {
                    nextParams.delete("host_language");
                  } else {
                    nextParams.set("host_language", lang);
                  }
                  router.push(`/${locale}/search?${nextParams.toString()}`, { scroll: false });
                }}
                className={`
                  rounded-full border px-3 py-1 text-xs font-medium transition
                  ${
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-600"
                  }
                `}
                aria-pressed={selected}
              >
                {t(`search.languages.${lang}`)}
              </button>
            );
          })}
          </div>
        </div>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      nextParams.delete("property_type");
                      nextParams.delete("category");
                      nextParams.delete("min_price");
                      nextParams.delete("max_price");
                      nextParams.delete("bedrooms");
                      nextParams.delete("beds");
                      nextParams.delete("bathrooms");
                      nextParams.delete("amenities");
                      nextParams.delete("pets");
                      nextParams.delete("self_check_in");
                      nextParams.delete("accessibility");
                      nextParams.delete("host_language");
                      nextParams.delete("instant_book");
                      router.push(`/${locale}/search?${nextParams.toString()}`, {
                        scroll: false,
                      });
                    }}
                    className="text-sm font-semibold text-accent-600 hover:text-accent-700"
                  >
                    {t("search.clearFilters")}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="btn-primary text-sm"
                >
                  {t("search.showResults", { count: total })}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
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
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
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
