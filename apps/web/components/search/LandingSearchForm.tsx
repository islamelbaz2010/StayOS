"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { useLocationAutocomplete, type LocationSuggestion } from "@/lib/queries/locations";

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

  return (
    <section className="bg-surface-page py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-bold text-brand-900 md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-neutral-600 md:text-xl">
            {t("heroSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-surface-card p-6 shadow-card md:p-8">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 md:flex-row md:items-end"
            aria-label={t("title")}
          >
            <div className="flex-1">
              <label
                htmlFor="destination"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("destination")}
              </label>
              <div ref={destRef} className="relative">
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
                  placeholder={t("placeholder")}
                  className="input"
                  aria-required="false"
                  autoComplete="off"
                />
                {showSuggestions && suggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                    {suggestions.map((s, i) => (
                      <li key={`${s.canonical_name_en}:${s.city}:${i}`}>
                        <button
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="flex w-full flex-col items-start px-4 py-2 text-start hover:bg-neutral-50"
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
            </div>

            <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="checkin"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("checkin")}
                </label>
                <input
                  id="checkin"
                  type="date"
                  name="checkin"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("checkout")}
                </label>
                <input
                  id="checkout"
                  type="date"
                  name="checkout"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label
                  htmlFor="guests"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("guests")}
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="input"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-accent-400 px-8 py-3 text-center text-base font-semibold text-brand-900 transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 md:w-auto"
            >
              {t("button")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
