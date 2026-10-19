"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useLocationAutocomplete, type LocationSuggestion } from "@/lib/queries/locations";

/**
 * Floating search capsule — the signature hero pattern from the Airbnb
 * design reference: a quiet canvas, one pill-shaped bar with segmented
 * fields separated by hairline dividers, and a circular lime submit
 * button. No hero image, no banner headline — the search bar IS the hero.
 */
export function LandingSearchForm({ locale }: { locale: string }) {
  const t = useTranslations("search");
  const activeLocale = useLocale();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("1");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = useLocationAutocomplete(
    destination,
    showSuggestions
  );

  const selectSuggestion = (s: LocationSuggestion) => {
    const name =
      activeLocale === "ar" ? s.canonical_name_ar : s.canonical_name_en;
    setDestination(name);
    setShowSuggestions(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedDestination = destination.trim();

    if (trimmedDestination) {
      params.set("q", trimmedDestination);
    }
    if (checkin) {
      params.set("checkin", checkin);
    }
    if (checkout) {
      params.set("checkout", checkout);
    }
    if (guests) {
      params.set("guests", guests);
    }

    const queryString = params.toString();
    const url = `/${locale}/search${queryString ? `?${queryString}` : ""}`;
    router.push(url);
  };

  const fieldLabel =
    "block px-6 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-900";
  const fieldInput =
    "w-full bg-transparent px-6 pb-3 pt-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none";
  const segment =
    "relative flex-1 transition-colors hover:bg-neutral-100 focus-within:bg-neutral-100";

  return (
    <section className="bg-surface-page pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-[880px] px-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          aria-label={t("title")}
          className="relative"
        >
          {/* Capsule — pill shape, white surface, layered overlay shadow. */}
          <div className="grid grid-cols-1 divide-y divide-neutral-150 rounded-3xl bg-white shadow-capsule md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:divide-x md:divide-y-0 md:rounded-full rtl:md:divide-x-reverse">
            <div className={segment} ref={destRef}>
              <label htmlFor="destination" className={fieldLabel}>
                {t("destination")}
              </label>
              <input
                id="destination"
                type="text"
                name="q"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t("placeholder")}
                className={fieldInput}
                autoComplete="off"
              />
              {showSuggestions && suggestions && suggestions.length > 0 && (
                <ul className="absolute start-0 end-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-2xl border border-neutral-150 bg-white py-1 shadow-menu">
                  {suggestions.map((s, i) => (
                    <li key={`${s.canonical_name_en}:${s.city}:${i}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s)}
                        className="flex w-full flex-col items-start px-5 py-2.5 text-start transition-colors hover:bg-neutral-100"
                      >
                        <span className="text-sm font-medium text-neutral-900">
                          {activeLocale === "ar"
                            ? s.canonical_name_ar
                            : s.canonical_name_en}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {s.governorate}
                          {s.city && s.city !== s.canonical_name_en
                            ? ` · ${s.city}`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={segment}>
              <label htmlFor="checkin" className={fieldLabel}>
                {t("checkin")}
              </label>
              <input
                id="checkin"
                type="date"
                name="checkin"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className={segment}>
              <label htmlFor="checkout" className={fieldLabel}>
                {t("checkout")}
              </label>
              <input
                id="checkout"
                type="date"
                name="checkout"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className={fieldInput}
              />
            </div>

            <div className={segment}>
              <label htmlFor="guests" className={fieldLabel}>
                {t("guests")}
              </label>
              <select
                id="guests"
                name="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className={`${fieldInput} appearance-none`}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Circular lime submit — the capsule's single accent. */}
            <div className="flex items-center p-2 md:p-1.5">
              <button
                type="submit"
                aria-label={t("button")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-brand-900 transition hover:bg-accent-600 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 md:h-12 md:w-12 md:px-0"
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
                <span className="md:hidden">{t("button")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
