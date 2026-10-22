"use client";

import { useMemo, useState } from "react";

import { useLocale } from "next-intl";

import { cn, toInputDate } from "@/lib/utils";

const MAX_NAV_MONTHS = 24;

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Generic two-month range calendar for search panels — same visual recipe
 * as AvailabilityCalendar (ink endpoints, #F7F7F7 range band, Sunday-first
 * grid) but with no availability feed: past days are disabled, everything
 * else selectable. Shared by the landing capsule and the results SearchBar.
 */
export function RangeCalendar({
  checkIn,
  checkOut,
  onSelect,
  compact = false,
}: {
  checkIn: string;
  checkOut: string;
  onSelect: (checkIn: string, checkOut: string) => void;
  compact?: boolean;
}) {
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = toInputDate(today);

  // Reopen scrolled to the month containing the current check-in so a
  // previously selected range stays visible.
  const [offset, setOffset] = useState(() => {
    if (!checkIn) return 0;
    const ci = new Date(`${checkIn}T00:00:00`);
    return Math.max(
      0,
      Math.min(
        MAX_NAV_MONTHS,
        (ci.getFullYear() - today.getFullYear()) * 12 +
          (ci.getMonth() - today.getMonth())
      )
    );
  });
  const months = useMemo(() => {
    const base = addMonths(monthStart(today), offset);
    return [base, addMonths(base, 1)];
  }, [today, offset]);

  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString(dateLocale, { weekday: "narrow" });
    });
  }, [dateLocale]);

  const awaitingCheckout = Boolean(checkIn) && !checkOut;

  const handleDayClick = (dateStr: string) => {
    if (dateStr < todayStr) return;
    if (!awaitingCheckout || dateStr <= checkIn) {
      onSelect(dateStr, "");
      return;
    }
    onSelect(checkIn, dateStr);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((v) => Math.max(0, v - 1))}
          disabled={offset === 0}
          aria-label="Previous month"
          className="icon-btn h-8 w-8 disabled:opacity-30"
        >
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setOffset((v) => Math.min(MAX_NAV_MONTHS, v + 1))}
          disabled={offset >= MAX_NAV_MONTHS}
          aria-label="Next month"
          className="icon-btn h-8 w-8 disabled:opacity-30"
        >
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        {(compact ? [months[0]] : months).map((month) => {
          const daysInMonth = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0
          ).getDate();
          const leading = month.getDay();
          return (
            <div key={`${month.getFullYear()}-${month.getMonth()}`}>
              <p className="mb-2 text-center text-xs font-semibold text-neutral-700">
                {month.toLocaleDateString(dateLocale, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {weekdayNames.map((name, i) => (
                  <span
                    key={i}
                    className="text-center text-[10px] font-medium text-neutral-400"
                  >
                    {name}
                  </span>
                ))}
                {Array.from({ length: leading }).map((_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dateStr = toInputDate(
                    new Date(month.getFullYear(), month.getMonth(), i + 1)
                  );
                  const selectable = dateStr >= todayStr;
                  const isEndpoint =
                    dateStr === checkIn || dateStr === checkOut;
                  const inRange =
                    Boolean(checkIn && checkOut) &&
                    dateStr > checkIn &&
                    dateStr < checkOut;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!selectable}
                      onClick={() => handleDayClick(dateStr)}
                      aria-label={dateStr}
                      aria-pressed={isEndpoint || inRange}
                      className={cn(
                        "flex h-9 w-full items-center justify-center rounded-md text-[13px]",
                        isEndpoint && "rounded-full bg-neutral-900 text-white",
                        inRange && "bg-neutral-100 text-neutral-900",
                        !selectable && !isEndpoint && "text-neutral-300",
                        selectable &&
                          !isEndpoint &&
                          "text-neutral-800 hover:ring-1 hover:ring-neutral-900"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
