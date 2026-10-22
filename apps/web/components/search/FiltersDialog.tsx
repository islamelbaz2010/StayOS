"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PriceRangeFilter } from "@/components/search/PriceRangeFilter";
import {
  usePriceDistribution,
  useSearchListings,
  type SearchFilters,
} from "@/lib/queries/listings";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "STUDIO",
  "HOTEL_ROOM",
  "RESORT_UNIT",
];

const PLACE_CATEGORIES = [
  { value: "", key: "anyType" },
  { value: "ENTIRE_PLACE", key: "entire_place" },
  { value: "PRIVATE_ROOM", key: "private_room" },
  { value: "SHARED_ROOM", key: "shared_room" },
];

const RECOMMENDED = [
  { amenity: "washer", icon: "washer" },
  { amenity: "kitchen", icon: "kitchen" },
  { amenity: "parking", icon: "parking" },
  { amenity: "self_check_in", icon: "key" },
] as const;

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

const HOST_LANGUAGES = ["ar", "en"];

export interface FilterDraft {
  property_type?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
  beds?: string;
  bathrooms?: string;
  amenities: string[];
  accessibility: string[];
  free_cancellation?: string;
  pets?: string;
  self_check_in?: string;
  instant_book?: string;
  host_language?: string;
}

function RecommendedIcon({ icon }: { icon: string }) {
  const cls =
    "h-10 w-10 text-neutral-700";
  const props = {
    className: cls,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.4,
    "aria-hidden": true as const,
  };
  switch (icon) {
    case "washer":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="13" r="4.5" />
          <path strokeLinecap="round" d="M7 6h4M17 6h.01" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v7a2 2 0 002 2v9M8 3v4m2-4v4m2-4v7a2 2 0 01-2 2m6-9v12m0-12c-1.5 0-2 2-2 4s.5 4 2 4" />
        </svg>
      );
    case "parking":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path strokeLinecap="round" d="M9.5 17V8h3.25a2.75 2.75 0 010 5.5H9.5" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <circle cx="8.5" cy="14.5" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 11.5L20 3m-4 1.5l3 3m-6.5-.5l2.5 2.5" />
        </svg>
      );
    default:
      return null;
  }
}

function Section({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-neutral-150 px-6 py-6 first:border-t-0">
      <button
        type="button"
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        aria-expanded={collapsible ? open : undefined}
        className={cn(
          "flex w-full items-center justify-between text-start",
          !collapsible && "cursor-default"
        )}
      >
        <h3 className="text-[22px] font-semibold text-brand-900">{title}</h3>
        {collapsible && (
          <svg
            className={cn(
              "h-4 w-4 text-neutral-500 transition-transform",
              open && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        )}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

/**
 * Reference filter dialog: centered title + circular close, scrollable
 * sectioned body separated by hairlines, staged draft selection applied
 * only on "Show N places" (N = live count from the real search API for
 * the drafted filters), and "Clear all" resetting the draft.
 */
export function FiltersDialog({
  open,
  onClose,
  baseFilters,
  initial,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  /** Search params that stay fixed (q/dates/guests/map bounds/sort). */
  baseFilters: SearchFilters;
  initial: FilterDraft;
  onApply: (draft: FilterDraft) => void;
}) {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const tl = useTranslations("listingForm");
  const dialogRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<FilterDraft>(initial);

  // Re-seed the draft every time the dialog opens.
  useEffect(() => {
    if (open) setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape + focus containment.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Live preview count for the drafted selection — real API call,
  // limit=1 so only the total is material.
  const previewFilters = useMemo<SearchFilters>(
    () => ({
      ...baseFilters,
      property_type: draft.property_type,
      category: draft.category,
      min_price: draft.min_price,
      max_price: draft.max_price,
      bedrooms: draft.bedrooms,
      beds: draft.beds,
      bathrooms: draft.bathrooms,
      amenities: draft.amenities.length
        ? draft.amenities.join(",")
        : undefined,
      accessibility: draft.accessibility.length
        ? draft.accessibility.join(",")
        : undefined,
      free_cancellation: draft.free_cancellation,
      pets: draft.pets,
      self_check_in: draft.self_check_in,
      instant_book: draft.instant_book,
      host_language: draft.host_language,
      limit: "1",
    }),
    [baseFilters, draft]
  );
  const preview = useSearchListings(previewFilters);
  const previewCount = preview.data?.pages[0]?.total;

  const priceDistribution = usePriceDistribution(previewFilters);

  if (!open) return null;

  const set = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleListValue = (key: "amenities" | "accessibility", value: string) =>
    setDraft((d) => {
      const list = d[key];
      return {
        ...d,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });

  const toggleFlag = (key: keyof FilterDraft) =>
    setDraft((d) => ({ ...d, [key]: d[key] ? undefined : "true" }));

  const clearAll = () =>
    setDraft({ amenities: [], accessibility: [] });

  const chipClass = (selected: boolean) =>
    cn(
      "chip",
      selected && "chip-active"
    );

  const counterRow = (
    label: string,
    key: "bedrooms" | "beds" | "bathrooms",
    max: number
  ) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => set(key, undefined)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            !draft[key]
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
          )}
          aria-pressed={!draft[key]}
        >
          {t("any")}
        </button>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const val = String(n);
          const selected = draft[key] === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => set(key, selected ? undefined : val)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
              )}
              aria-pressed={selected}
            >
              {n}
              {n === max ? "+" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-dialog-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — centered title, circular close top-right (reference). */}
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-neutral-150 px-6">
          <h2
            id="filters-dialog-title"
            className="text-base font-bold text-brand-900"
          >
            {t("filters")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="absolute end-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-700 transition hover:bg-surface-hover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Recommended — icon tiles per the reference. */}
          <Section title={t("recommended")}>
            <div className="grid grid-cols-4 gap-3">
              {RECOMMENDED.map(({ amenity, icon }) => {
                const selected =
                  amenity === "self_check_in"
                    ? Boolean(draft.self_check_in)
                    : draft.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      amenity === "self_check_in"
                        ? toggleFlag("self_check_in")
                        : toggleListValue("amenities", amenity)
                    }
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-start gap-3 rounded-2xl border p-3 text-start transition",
                      selected
                        ? "border-2 border-neutral-900"
                        : "border-neutral-hairline hover:border-neutral-mutedSoft"
                    )}
                  >
                    <RecommendedIcon icon={icon} />
                    <span className="text-sm font-medium text-neutral-900">
                      {amenity === "self_check_in"
                        ? t("selfCheckIn")
                        : tl(`amenities.${amenity}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Type of place — single segmented control (reference). */}
          <Section title={t("typeOfPlace")}>
            <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-neutral-150">
              {PLACE_CATEGORIES.map((c, i) => {
                const selected = (draft.category ?? "") === c.value;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => set("category", c.value || undefined)}
                    aria-pressed={selected}
                    className={cn(
                      "px-2 py-4 text-center text-sm font-medium transition",
                      i > 0 && "border-s border-neutral-150",
                      selected
                        ? "m-1 rounded-xl border-2 border-neutral-900 py-3 text-neutral-900"
                        : "text-neutral-700 hover:bg-surface-soft"
                    )}
                  >
                    {t(`categories.${c.key}`)}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Property type */}
          <Section title={t("propertyType")} collapsible defaultOpen>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set("property_type", undefined)}
                className={chipClass(!draft.property_type)}
                aria-pressed={!draft.property_type}
              >
                {t("anyType")}
              </button>
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() =>
                    set(
                      "property_type",
                      draft.property_type === pt ? undefined : pt
                    )
                  }
                  className={chipClass(draft.property_type === pt)}
                  aria-pressed={draft.property_type === pt}
                >
                  {t(`types.${pt}`)}
                </button>
              ))}
            </div>
          </Section>

          {/* Price range — existing histogram/slider, staged via draft. */}
          <Section title={t("priceRangeTitle")}>
            <PriceRangeFilter
              distribution={priceDistribution.data}
              isLoading={priceDistribution.isPending}
              minPrice={draft.min_price}
              maxPrice={draft.max_price}
              onApply={(min, max) =>
                setDraft((d) => ({
                  ...d,
                  min_price: min != null ? String(min) : undefined,
                  max_price: max != null ? String(max) : undefined,
                }))
              }
            />
          </Section>

          {/* Rooms and beds */}
          <Section title={t("roomsAndBeds")}>
            {counterRow(t("bedrooms"), "bedrooms", 8)}
            {counterRow(t("beds"), "beds", 8)}
            {counterRow(t("bathrooms"), "bathrooms", 8)}
          </Section>

          {/* Amenities */}
          <Section title={t("amenities")} collapsible defaultOpen>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleListValue("amenities", a)}
                  className={chipClass(draft.amenities.includes(a))}
                  aria-pressed={draft.amenities.includes(a)}
                >
                  {tl(`amenities.${a}`)}
                </button>
              ))}
            </div>
          </Section>

          {/* Booking options */}
          <Section title={t("bookingOptions")}>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["instant_book", t("instantBook")],
                  ["free_cancellation", t("freeCancellation")],
                  ["self_check_in", t("selfCheckIn")],
                  ["pets", t("petsAllowed")],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFlag(key)}
                  className={chipClass(Boolean(draft[key]))}
                  aria-pressed={Boolean(draft[key])}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* Accessibility — collapsible checkbox list (reference). */}
          <Section title={t("accessibility")} collapsible defaultOpen={false}>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCESSIBILITY_FEATURES.map((f) => {
                const selected = draft.accessibility.includes(f.value);
                return (
                  <label
                    key={f.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-sm text-neutral-700"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleListValue("accessibility", f.value)
                      }
                      className="h-5 w-5 rounded border-neutral-300 text-brand-600 accent-brand-600"
                    />
                    {t(`accessibilityFeatures.${f.key}`)}
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Host language */}
          <Section title={t("hostLanguage")}>
            <div className="flex flex-wrap gap-2">
              {HOST_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() =>
                    set(
                      "host_language",
                      draft.host_language === lang ? undefined : lang
                    )
                  }
                  className={chipClass(draft.host_language === lang)}
                  aria-pressed={draft.host_language === lang}
                >
                  {t(`languages.${lang}`)}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer — Clear all (left) + dark "Show N places" (right). */}
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-150 px-6 py-4">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-neutral-700 underline underline-offset-2 transition hover:text-brand-900"
          >
            {t("clearFilters")}
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            {previewCount != null
              ? t("showPlaces", { count: previewCount })
              : t("showResults", { count: 0 })}
          </button>
        </div>
      </div>
    </div>
  );
}
