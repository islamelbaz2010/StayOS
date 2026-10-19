"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useLocationAutocomplete, type LocationSuggestion } from "@/lib/queries/locations";

interface SearchBarProps {
  baseParams: string;
  q?: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  onSearch: (queryString: string) => void;
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SearchBar({
  baseParams,
  q,
  checkin,
  checkout,
  guests,
  onSearch,
}: SearchBarProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [destination, setDestination] = useState(q ?? "");
  const [checkIn, setCheckIn] = useState(checkin ?? "");
  const [checkOut, setCheckOut] = useState(checkout ?? "");
  const [guestsCount, setGuestsCount] = useState(guests ?? "1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = useLocationAutocomplete(
    destination,
    showSuggestions
  );

  useEffect(() => {
    setDestination(q ?? "");
    setCheckIn(checkin ?? "");
    setCheckOut(checkout ?? "");
    setGuestsCount(guests ?? "1");
    setErrors({});
  }, [q, checkin, checkout, guests]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (s: LocationSuggestion) => {
    const name = locale === "ar" ? s.canonical_name_ar : s.canonical_name_en;
    setDestination(name);
    setShowSuggestions(false);
  };

  const todayStr = toInputDate(new Date());

  const validate = () => {
    const next: Record<string, string> = {};

    if (checkIn) {
      if (checkIn < todayStr) {
        next.checkIn = t("checkInPast");
      }
      if (checkOut) {
        if (checkOut <= checkIn) {
          next.checkOut = t("checkOutAfterCheckIn");
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const nextParams = new URLSearchParams(baseParams);
    const trimmed = destination.trim();

    if (trimmed) {
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }
    if (checkIn) {
      nextParams.set("checkin", checkIn);
    } else {
      nextParams.delete("checkin");
    }
    if (checkOut) {
      nextParams.set("checkout", checkOut);
    } else {
      nextParams.delete("checkout");
    }
    if (guestsCount) {
      nextParams.set("guests", guestsCount);
    } else {
      nextParams.delete("guests");
    }
    nextParams.delete("offset");

    onSearch(nextParams.toString());
  };

  const hasPrimarySearch = Boolean(q || checkin || checkout || (guests && guests !== "1"));

  const handleClear = () => {
    const nextParams = new URLSearchParams(baseParams);
    nextParams.delete("q");
    nextParams.delete("checkin");
    nextParams.delete("checkout");
    nextParams.delete("guests");
    nextParams.delete("offset");
    onSearch(nextParams.toString());
  };

  const fieldLabel =
    "block px-5 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-900";
  const fieldInput =
    "w-full bg-transparent px-5 pb-3 pt-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none";
  const segment =
    "relative transition-colors hover:bg-neutral-100 focus-within:bg-neutral-100";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("title")}
    >
      {/* Floating capsule search — segmented fields, pill outline, layered
          shadow, circular lime submit (Airbnb-reference search bar). */}
      <div className="grid grid-cols-1 divide-y divide-neutral-150 rounded-2xl bg-white shadow-capsule md:grid-cols-[2fr_1fr_1fr_0.8fr_auto] md:divide-x md:divide-y-0 md:rounded-full rtl:md:divide-x-reverse">
        <div className={`${segment} flex-1`}>
          <label
            htmlFor="search-destination"
            className={fieldLabel}
          >
            {t("destination")}
          </label>
          <div ref={destRef} className="relative">
            <input
              id="search-destination"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("placeholder")}
              className={fieldInput}
              autoComplete="off"
            />
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <ul className="absolute start-0 top-full z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-neutral-150 bg-white py-1 shadow-menu">
                {suggestions.map((s, i) => (
                  <li key={`${s.canonical_name_en}:${s.city}:${i}`}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="flex w-full flex-col items-start px-4 py-2 text-start hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">
                        {locale === "ar"
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

        <div className={segment}>
          <label
            htmlFor="search-checkin"
            className={fieldLabel}
          >
            {t("checkin")}
          </label>
          <input
            id="search-checkin"
            type="date"
            value={checkIn}
            min={todayStr}
            onChange={(e) => setCheckIn(e.target.value)}
            className={fieldInput}
            aria-invalid={!!errors.checkIn}
          />
        </div>

        <div className={segment}>
          <label
            htmlFor="search-checkout"
            className={fieldLabel}
          >
            {t("checkout")}
          </label>
          <input
            id="search-checkout"
            type="date"
            value={checkOut}
            min={checkIn ? checkIn : todayStr}
            onChange={(e) => setCheckOut(e.target.value)}
            className={fieldInput}
            aria-invalid={!!errors.checkOut}
          />
        </div>

        <div className={segment}>
          <label
            htmlFor="search-guests"
            className={fieldLabel}
          >
            {t("guests")}
          </label>
          <select
            id="search-guests"
            value={guestsCount}
            onChange={(e) => setGuestsCount(e.target.value)}
            className={`${fieldInput} appearance-none`}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 p-2 md:p-1.5">
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
          {hasPrimarySearch && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("clearSearch")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-neutral-600 transition hover:bg-neutral-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 md:h-10 md:w-10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {(errors.checkIn || errors.checkOut) && (
        <p className="mt-2 px-4 text-sm text-danger-600" role="alert">
          {errors.checkIn || errors.checkOut}
        </p>
      )}
    </form>
  );
}
