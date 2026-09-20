"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useListingAvailability } from "@/lib/queries/listings";
import { cn, toInputDate } from "@/lib/utils";

const MAX_WINDOW_DAYS = 90;
const MAX_NAV_MONTHS = 24;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

interface AvailabilityCalendarProps {
  unitId: string;
  checkIn: string;
  checkOut: string;
  onSelect: (checkIn: string, checkOut: string) => void;
  disabled?: boolean;
}

export function AvailabilityCalendar({
  unitId,
  checkIn,
  checkOut,
  onSelect,
  disabled,
}: AvailabilityCalendarProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = toInputDate(today);

  const [offset, setOffset] = useState(0);

  const months = useMemo(() => {
    const first = monthStart(today);
    const base = addMonths(first, offset);
    return [base, addMonths(base, 1)];
  }, [today, offset]);

  const maxOffset = MAX_NAV_MONTHS;

  // Fetch only the two visible months (always <= 62 days, within the API's
  // 90-day per-request limit) — the window slides as the user navigates.
  const windowStart = useMemo(() => {
    const first = months[0];
    return first > today ? first : today;
  }, [months, today]);
  const windowEnd = useMemo(() => addDays(monthEnd(months[1]), 1), [months]);

  const { data } = useListingAvailability(
    unitId,
    toInputDate(windowStart),
    toInputDate(windowEnd)
  );

  // Accumulate statuses across fetched windows so a range whose endpoints
  // live in different months still validates after navigation.
  const [statusByDate, setStatusByDate] = useState(
    () => new Map<string, { status: string; price: number }>()
  );
  useEffect(() => {
    setStatusByDate((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const day of data?.days ?? []) {
        const existing = next.get(day.date);
        if (
          !existing ||
          existing.status !== day.status ||
          existing.price !== day.price_egp
        ) {
          next.set(day.date, { status: day.status, price: day.price_egp });
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data]);
  useEffect(() => {
    setStatusByDate(new Map());
  }, [unitId]);

  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      addDays(base, i).toLocaleDateString(dateLocale, { weekday: "narrow" })
    );
  }, [dateLocale]);

  const awaitingCheckout = Boolean(checkIn) && !checkOut;

  const handleDayClick = (dateStr: string) => {
    if (disabled) return;
    const day = statusByDate.get(dateStr);
    if (!day || day.status !== "AVAILABLE" || dateStr < todayStr) return;
    if (!awaitingCheckout || dateStr <= checkIn) {
      onSelect(dateStr, "");
      return;
    }
    // Always complete the range — if it spans unavailable days, BookingPanel's
    // availability query shows "dates unavailable" and disables submit. A
    // silent reset here made valid-looking clicks erase the user's check-in.
    onSelect(checkIn, dateStr);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((value) => Math.max(0, value - 1))}
          disabled={disabled || offset === 0}
          aria-label={t("prevMonth")}
          className="rounded-md p-1.5 text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setOffset((value) => Math.min(maxOffset, value + 1))}
          disabled={disabled || offset >= maxOffset}
          aria-label={t("nextMonth")}
          className="rounded-md p-1.5 text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {months.map((month) => {
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
                  const date = new Date(
                    month.getFullYear(),
                    month.getMonth(),
                    i + 1
                  );
                  const dateStr = toInputDate(date);
                  const day = statusByDate.get(dateStr);
                  const selectable =
                    !disabled &&
                    dateStr >= todayStr &&
                    day?.status === "AVAILABLE";
                  const knownUnavailable =
                    day !== undefined && day.status !== "AVAILABLE";
                  const isEndpoint = dateStr === checkIn || dateStr === checkOut;
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
                        "flex h-9 w-full flex-col items-center justify-center rounded-md text-[11px]",
                        isEndpoint && "bg-brand-600 text-white",
                        inRange && "bg-brand-50 text-brand-900",
                        !selectable &&
                          !isEndpoint &&
                          (knownUnavailable
                            ? "text-neutral-300 line-through"
                            : "text-neutral-300"),
                        selectable &&
                          !isEndpoint &&
                          "text-neutral-800 hover:bg-neutral-100"
                      )}
                    >
                      <span>{i + 1}</span>
                      {selectable && day ? (
                        <span
                          className={cn(
                            "text-[9px] leading-none",
                            isEndpoint ? "text-white" : "text-neutral-400"
                          )}
                        >
                          {day.price.toLocaleString(dateLocale)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-neutral-300" />
            {t("available")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-neutral-200" />
            {t("unavailable")}
          </span>
        </div>
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={() => onSelect("", "")}
            className="text-xs font-semibold text-accent-600 underline hover:text-accent-700"
          >
            {t("clearDates")}
          </button>
        )}
      </div>
    </div>
  );
}
