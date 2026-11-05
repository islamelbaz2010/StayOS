"use client";

import { KeyboardEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  LocationSuggestion,
  useLocationAutocomplete,
  usePopularLocations,
} from "@/lib/queries/locations";

interface DestinationSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  inputClassName?: string;
  autoFocus?: boolean;
}

/**
 * Destination input + suggestion list shared by the landing capsule and
 * the search-bar where-panel. Empty/short queries show the same popular
 * destinations the homepage cards use (the supported default source);
 * ≥2 chars switches to the autocomplete endpoint. Arrow keys + Enter
 * navigate; failure shows a retryable error rather than an empty panel.
 */
export function DestinationSuggestions({
  value,
  onChange,
  onSelect,
  inputClassName,
  autoFocus = true,
}: DestinationSuggestionsProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = value.trim();
  const searching = trimmed.length >= 2;
  const autocomplete = useLocationAutocomplete(trimmed, searching);
  const popular = usePopularLocations(!searching);

  const active = searching ? autocomplete : popular;
  const suggestions = (active.data ?? []).slice(0, 8);

  const pick = (index: number) => {
    const s = suggestions[index];
    if (s) onSelect(s);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(activeIndex);
    }
  };

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setActiveIndex(-1);
          onChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
        placeholder={t("placeholder")}
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded="true"
        aria-controls="destination-suggestions"
        aria-activedescendant={
          activeIndex >= 0 ? `destination-option-${activeIndex}` : undefined
        }
        className={inputClassName}
      />
      <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {t("suggestedDestinations")}
      </p>
      <ul
        id="destination-suggestions"
        role="listbox"
        className="max-h-72 overflow-auto"
      >
        {suggestions.map((s, i) => (
          <li
            key={`${s.canonical_name_en}:${s.city}:${i}`}
            role="option"
            id={`destination-option-${i}`}
            aria-selected={i === activeIndex}
          >
            <button
              type="button"
              onClick={() => pick(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-start transition-colors hover:bg-surface-soft",
                i === activeIndex && "bg-surface-soft"
              )}
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
                  {locale === "ar" ? s.canonical_name_ar : s.canonical_name_en}
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
        {active.isLoading && (
          <li className="px-2 py-3 text-sm text-neutral-500">
            {t("suggestionsLoading")}
          </li>
        )}
        {active.isError && (
          <li className="flex items-center justify-between gap-2 px-2 py-3 text-sm text-neutral-500">
            <span>{t("suggestionsError")}</span>
            <button
              type="button"
              onClick={() => active.refetch()}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-brand-900 hover:bg-surface-soft"
            >
              {t("retry")}
            </button>
          </li>
        )}
        {active.isSuccess && suggestions.length === 0 && (
          <li className="px-2 py-3 text-sm text-neutral-500">
            {t("noSuggestions")}
          </li>
        )}
      </ul>
    </>
  );
}
