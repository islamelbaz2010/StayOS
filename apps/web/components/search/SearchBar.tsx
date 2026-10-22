"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { GuestSelector } from "@/components/search/GuestSelector";
import { RangeCalendar } from "@/components/search/RangeCalendar";
import { useLocationAutocomplete, type LocationSuggestion } from "@/lib/queries/locations";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  baseParams: string;
  q?: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  pets?: string;
  onSearch: (queryString: string) => void;
}

function formatShort(value: string, locale: string): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

type Segment = "where" | "checkin" | "checkout" | "who" | null;

export function SearchBar({
  baseParams,
  q,
  checkin,
  checkout,
  guests,
  pets,
  onSearch,
}: SearchBarProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [destination, setDestination] = useState(q ?? "");
  const [checkIn, setCheckIn] = useState(checkin ?? "");
  const [checkOut, setCheckOut] = useState(checkout ?? "");
  const [guestsCount, setGuestsCount] = useState(Number(guests ?? "1") || 1);
  const [petsOn, setPetsOn] = useState(Boolean(pets));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Segment>(null);
  const rootRef = useRef<HTMLFormElement>(null);

  const { data: suggestions } = useLocationAutocomplete(
    destination,
    active === "where"
  );

  useEffect(() => {
    setDestination(q ?? "");
    setCheckIn(checkin ?? "");
    setCheckOut(checkout ?? "");
    setGuestsCount(Number(guests ?? "1") || 1);
    setPetsOn(Boolean(pets));
    setErrors({});
  }, [q, checkin, checkout, guests, pets]);

  // Reference dismissal: outside click or Escape closes the open panel.
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
    setDestination(locale === "ar" ? s.canonical_name_ar : s.canonical_name_en);
    setActive("checkin");
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (checkIn && checkOut && checkOut <= checkIn) {
      next.checkOut = t("checkOutAfterCheckIn");
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
    if (guestsCount > 1) {
      nextParams.set("guests", String(guestsCount));
    } else {
      nextParams.delete("guests");
    }
    if (petsOn) {
      nextParams.set("pets", "true");
    } else {
      nextParams.delete("pets");
    }
    nextParams.delete("offset");

    setActive(null);
    onSearch(nextParams.toString());
  };

  const hasPrimarySearch = Boolean(
    q || checkin || checkout || (guests && guests !== "1") || pets
  );

  const handleClear = () => {
    const nextParams = new URLSearchParams(baseParams);
    for (const k of ["q", "checkin", "checkout", "guests", "pets", "offset"]) {
      nextParams.delete(k);
    }
    onSearch(nextParams.toString());
  };

  // Reference segment recipe: open capsule goes quiet-gray, the active
  // segment lifts as a white pill, inactive ones get a soft hover tint.
  const segmentClass = (seg: Segment) =>
    cn(
      "relative cursor-pointer rounded-full transition-colors",
      active === seg
        ? "bg-white shadow-capsule"
        : active
          ? "hover:bg-neutral-300/40"
          : "hover:bg-neutral-150"
    );
  const labelClass =
    "block px-5 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-900";
  const valueClass = "block px-5 pb-3 pt-1 text-sm text-neutral-900";

  return (
    <form ref={rootRef} onSubmit={handleSubmit} noValidate aria-label={t("title")}>
      <div
        className={cn(
          "grid grid-cols-1 rounded-2xl border transition-colors md:grid-cols-[2fr_1fr_1fr_1.1fr_auto] md:rounded-full",
          active
            ? "border-neutral-150 bg-neutral-150"
            : "divide-y divide-neutral-hairline border-neutral-hairline bg-white shadow-capsule md:divide-x md:divide-y-0 rtl:md:divide-x-reverse"
        )}
      >
        <div className={`${segmentClass("where")} flex-1`}>
          <button
            type="button"
            className="block w-full text-start"
            onClick={() => setActive(active === "where" ? null : "where")}
            aria-expanded={active === "where"}
          >
            <span className={labelClass}>{t("destination")}</span>
            <span className={valueClass}>
              {destination || (
                <span className="text-neutral-400">{t("placeholder")}</span>
              )}
            </span>
          </button>
        </div>

        <div className={segmentClass("checkin")}>
          <button
            type="button"
            className="block w-full text-start"
            onClick={() => setActive(active === "checkin" ? null : "checkin")}
            aria-expanded={active === "checkin"}
          >
            <span className={labelClass}>{t("checkin")}</span>
            <span className={valueClass}>
              {checkIn ? (
                formatShort(checkIn, locale)
              ) : (
                <span className="text-neutral-400">{t("addDates")}</span>
              )}
            </span>
          </button>
        </div>

        <div className={segmentClass("checkout")}>
          <button
            type="button"
            className="block w-full text-start"
            onClick={() => setActive(active === "checkout" ? null : "checkout")}
            aria-expanded={active === "checkout"}
          >
            <span className={labelClass}>{t("checkout")}</span>
            <span className={valueClass}>
              {checkOut ? (
                formatShort(checkOut, locale)
              ) : (
                <span className="text-neutral-400">{t("addDates")}</span>
              )}
            </span>
          </button>
        </div>

        <div className={segmentClass("who")}>
          <button
            type="button"
            className="block w-full text-start"
            onClick={() => setActive(active === "who" ? null : "who")}
            aria-expanded={active === "who"}
          >
            <span className={labelClass}>{t("guests")}</span>
            <span className={valueClass}>
              {guestsCount > 1 || petsOn ? (
                <span className="truncate">
                  {t("guestsCount", { count: guestsCount })}
                  {petsOn ? ` · ${t("pets")}` : ""}
                </span>
              ) : (
                <span className="text-neutral-400">{t("addGuests")}</span>
              )}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 p-2 md:p-1.5">
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
          {hasPrimarySearch && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("clearSearch")}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-hover text-neutral-600 transition hover:bg-neutral-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 md:h-10 md:w-10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Reference panels anchored under the capsule. */}
      {active === "where" && (
        <div className="relative">
          <div className="absolute start-0 top-3 z-50 w-full max-w-md rounded-3xl border border-neutral-150 bg-white p-4 shadow-menu">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t("placeholder")}
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
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
                      <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-neutral-900">
                        {locale === "ar" ? s.canonical_name_ar : s.canonical_name_en}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {s.governorate}
                        {s.city && s.city !== s.canonical_name_en ? ` · ${s.city}` : ""}
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
        </div>
      )}

      {(active === "checkin" || active === "checkout") && (
        <div className="relative">
          <div className="absolute start-1/2 top-3 z-50 w-full max-w-2xl -translate-x-1/2 rounded-3xl border border-neutral-150 bg-white p-5 shadow-menu rtl:translate-x-1/2">
            <RangeCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              onSelect={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
                if (ci && co) setActive("who");
              }}
            />
          </div>
        </div>
      )}

      {active === "who" && (
        <div className="relative">
          <div className="absolute end-0 top-3 z-50 w-full max-w-xs rounded-3xl border border-neutral-150 bg-white p-3 shadow-menu">
            <GuestSelector
              value={guestsCount}
              onChange={setGuestsCount}
              pets={petsOn}
              onPetsChange={setPetsOn}
            />
          </div>
        </div>
      )}

      {errors.checkOut && (
        <p className="mt-2 px-4 text-sm text-danger-600" role="alert">
          {errors.checkOut}
        </p>
      )}
    </form>
  );
}
