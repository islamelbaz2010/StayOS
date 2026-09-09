"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
  const [destination, setDestination] = useState(q ?? "");
  const [checkIn, setCheckIn] = useState(checkin ?? "");
  const [checkOut, setCheckOut] = useState(checkout ?? "");
  const [guestsCount, setGuestsCount] = useState(guests ?? "1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDestination(q ?? "");
    setCheckIn(checkin ?? "");
    setCheckOut(checkout ?? "");
    setGuestsCount(guests ?? "1");
    setErrors({});
  }, [q, checkin, checkout, guests]);

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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-surface-card p-4 shadow-card md:p-6"
      noValidate
      aria-label={t("title")}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label
            htmlFor="search-destination"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            {t("destination")}
          </label>
          <input
            id="search-destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t("placeholder")}
            className="input w-full"
          />
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="search-checkin"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("checkin")}
            </label>
            <input
              id="search-checkin"
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={(e) => setCheckIn(e.target.value)}
              className={`input w-full ${errors.checkIn ? "border-danger-500" : ""}`}
              aria-invalid={!!errors.checkIn}
            />
            {errors.checkIn && (
              <p className="mt-1 text-sm text-danger-600" role="alert">
                {errors.checkIn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="search-checkout"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {t("checkout")}
            </label>
            <input
              id="search-checkout"
              type="date"
              value={checkOut}
              min={checkIn ? checkIn : todayStr}
              onChange={(e) => setCheckOut(e.target.value)}
              className={`input w-full ${errors.checkOut ? "border-danger-500" : ""}`}
              aria-invalid={!!errors.checkOut}
            />
            {errors.checkOut && (
              <p className="mt-1 text-sm text-danger-600" role="alert">
                {errors.checkOut}
              </p>
            )}
          </div>
        </div>

        <div className="w-full md:w-28">
          <label
            htmlFor="search-guests"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            {t("guests")}
          </label>
          <select
            id="search-guests"
            value={guestsCount}
            onChange={(e) => setGuestsCount(e.target.value)}
            className="input w-full"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="w-full rounded-md bg-accent-400 px-6 py-3 text-center text-base font-semibold text-brand-900 transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 md:w-auto"
          >
            {t("button")}
          </button>
          {hasPrimarySearch && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-md bg-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 md:w-auto"
            >
              {t("clearSearch")}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
