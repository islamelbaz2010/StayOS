"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { GuestSelector } from "@/components/search/GuestSelector";
import { RangeCalendar } from "@/components/search/RangeCalendar";
import { useLocationAutocomplete, type LocationSuggestion } from "@/lib/queries/locations";
import { cn } from "@/lib/utils";

type Segment = "where" | "checkin" | "checkout" | "who" | null;

function formatShort(value: string, locale: string): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Floating search capsule — the signature hero pattern from the Airbnb
 * reference: a quiet canvas, one pill bar with segmented fields, and a
 * circular lime submit. Open state per the tab-animation reference: the
 * capsule surface goes quiet-gray and the active segment raises as a
 * white pill; each segment drops a purpose-built panel (destination
 * suggestions, range calendar, guest stepper) anchored beneath it.
 */
export function LandingSearchForm({ locale }: { locale: string }) {
  const t = useTranslations("search");
  const activeLocale = useLocale();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(1);
  const [active, setActive] = useState<Segment>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = useLocationAutocomplete(
    destination,
    active === "where"
  );

  // Outside click / Escape closes the open panel — reference dismissal.
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const selectSuggestion = (s: LocationSuggestion) => {
    setDestination(
      activeLocale === "ar" ? s.canonical_name_ar : s.canonical_name_en
    );
    setActive("checkin");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (guests > 1) params.set("guests", String(guests));
    const queryString = params.toString();
    router.push(`/${locale}/search${queryString ? `?${queryString}` : ""}`);
  };

  // Segment recipes per the reference: when a panel is open the capsule
  // surface goes quiet and the active segment lifts as a white pill;
  // inactive segments get a soft hover tint.
  const segmentClass = (seg: Segment) =>
    cn(
      "relative flex-1 cursor-pointer rounded-full transition-colors",
      active === seg
        ? "bg-white shadow-capsule"
        : active
          ? "hover:bg-neutral-300/40"
          : "hover:bg-neutral-150"
    );

  const labelClass =
    "block px-6 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-900";
  const inputClass =
    "w-full cursor-pointer bg-transparent px-6 pb-3 pt-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none";

  return (
    <section className="bg-surface-page pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-[880px] px-4 sm:px-6" ref={rootRef}>
        <form onSubmit={handleSubmit} aria-label={t("title")} className="relative">
          {/* Capsule — quiet gray surface while a segment is open. */}
          <div
            className={cn(
              "grid grid-cols-1 rounded-3xl border transition-colors md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:rounded-full",
              active
                ? "border-neutral-150 bg-neutral-150"
                : "divide-y divide-neutral-hairline border-neutral-hairline bg-white shadow-capsule md:divide-x md:divide-y-0 rtl:md:divide-x-reverse"
            )}
          >
            {/* Where */}
            <div className={segmentClass("where")}>
              <button
                type="button"
                className="block w-full text-start"
                onClick={() => setActive(active === "where" ? null : "where")}
                aria-expanded={active === "where"}
              >
                <span className={labelClass}>{t("destination")}</span>
                <span className="block px-6 pb-3 pt-1 text-sm text-neutral-900">
                  {destination || (
                    <span className="text-neutral-400">{t("placeholder")}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Check-in */}
            <div className={segmentClass("checkin")}>
              <button
                type="button"
                className="block w-full text-start"
                onClick={() => setActive(active === "checkin" ? null : "checkin")}
                aria-expanded={active === "checkin"}
              >
                <span className={labelClass}>{t("checkin")}</span>
                <span className="block px-6 pb-3 pt-1 text-sm text-neutral-900">
                  {checkin ? (
                    formatShort(checkin, activeLocale)
                  ) : (
                    <span className="text-neutral-400">{t("addDates")}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Check-out */}
            <div className={segmentClass("checkout")}>
              <button
                type="button"
                className="block w-full text-start"
                onClick={() =>
                  setActive(active === "checkout" ? null : "checkout")
                }
                aria-expanded={active === "checkout"}
              >
                <span className={labelClass}>{t("checkout")}</span>
                <span className="block px-6 pb-3 pt-1 text-sm text-neutral-900">
                  {checkout ? (
                    formatShort(checkout, activeLocale)
                  ) : (
                    <span className="text-neutral-400">{t("addDates")}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Who */}
            <div className={segmentClass("who")}>
              <button
                type="button"
                className="block w-full text-start"
                onClick={() => setActive(active === "who" ? null : "who")}
                aria-expanded={active === "who"}
              >
                <span className={labelClass}>{t("guests")}</span>
                <span className="block px-6 pb-3 pt-1 text-sm text-neutral-900">
                  {guests > 1 ? (
                    t("guestsCount", { count: guests })
                  ) : (
                    <span className="text-neutral-400">{t("addGuests")}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Circular lime submit — the capsule's single accent. */}
            <div className="flex items-center p-2 md:p-1.5">
              <button
                type="submit"
                aria-label={t("button")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-brand-900 transition hover:bg-accent-600 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 md:h-12 md:w-auto md:px-5"
              >
                <svg
                  className="h-4 w-4 md:h-5 md:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <span>{t("button")}</span>
              </button>
            </div>
          </div>

          {/* Panels — anchored under the capsule per the reference. */}
          {active === "where" && (
            <div className="absolute start-0 top-full z-50 mt-3 w-full max-w-md rounded-3xl border border-neutral-150 bg-white p-4 shadow-menu">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("placeholder")}
                autoComplete="off"
                autoFocus
                className={cn(inputClass, "px-4 py-2")}
              />
              <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("suggestedDestinations")}
              </p>
              <ul className="max-h-72 overflow-auto">
                {(suggestions ?? []).map((s, i) => (
                  <li key={`${s.canonical_name_en}:${s.city}:${i}`}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-start transition-colors hover:bg-surface-soft"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <svg
                          className="h-5 w-5 text-neutral-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900">
                          {activeLocale === "ar"
                            ? s.canonical_name_ar
                            : s.canonical_name_en}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {s.governorate}
                          {s.city && s.city !== s.canonical_name_en
                            ? ` · ${s.city}`
                            : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {suggestions && suggestions.length === 0 && (
                  <li className="px-2 py-3 text-sm text-neutral-500">
                    {t("noSuggestions")}
                  </li>
                )}
              </ul>
            </div>
          )}

          {(active === "checkin" || active === "checkout") && (
            <div className="absolute start-1/2 top-full z-50 mt-3 w-full max-w-2xl -translate-x-1/2 rounded-3xl border border-neutral-150 bg-white p-5 shadow-menu rtl:translate-x-1/2">
              <RangeCalendar
                checkIn={checkin}
                checkOut={checkout}
                onSelect={(ci, co) => {
                  setCheckin(ci);
                  setCheckout(co);
                  if (ci && co) setActive("who");
                }}
              />
            </div>
          )}

          {active === "who" && (
            <div className="absolute end-0 top-full z-50 mt-3 w-full max-w-xs rounded-3xl border border-neutral-150 bg-white p-3 shadow-menu">
              <GuestSelector
                value={guests}
                onChange={(total) => setGuests(Math.max(1, total))}
              />
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
