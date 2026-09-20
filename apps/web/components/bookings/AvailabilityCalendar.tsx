"use client";

import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useListingAvailability } from "@/lib/queries/listings";
import { cn } from "@/lib/utils";

const WINDOW_DAYS = 62;

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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
  const windowEnd = useMemo(() => addDays(today, WINDOW_DAYS), [today]);

  const { data } = useListingAvailability(unitId, todayStr, toInputDate(windowEnd));

  const statusByDate = useMemo(() => {
    const map = new Map<string, { status: string; price: number }>();
    for (const day of data?.days ?? []) {
      map.set(day.date, { status: day.status, price: day.price_egp });
    }
    return map;
  }, [data]);

  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      addDays(base, i).toLocaleDateString(dateLocale, { weekday: "narrow" })
    );
  }, [dateLocale]);

  const months = useMemo(() => {
    const first = monthStart(today);
    return [first, new Date(first.getFullYear(), first.getMonth() + 1, 1)];
  }, [today]);

  const rangeBlocked = (start: string, end: string): boolean => {
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur < endDate) {
      const day = statusByDate.get(toInputDate(cur));
      if (!day || day.status !== "AVAILABLE") return true;
      cur = addDays(cur, 1);
    }
    return false;
  };

  const awaitingCheckout = Boolean(checkIn) && !checkOut;

  const handleDayClick = (dateStr: string) => {
    if (disabled) return;
    const day = statusByDate.get(dateStr);
    if (!day || day.status !== "AVAILABLE" || dateStr < todayStr) return;
    if (!awaitingCheckout || dateStr <= checkIn) {
      onSelect(dateStr, "");
    } else if (rangeBlocked(checkIn, dateStr)) {
      onSelect(dateStr, "");
    } else {
      onSelect(checkIn, dateStr);
    }
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {months.map((month) => {
          const daysInMonth = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0
          ).getDate();
          const leading = month.getDay();
          return (
            <div key={month.toISOString()}>
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
                          "text-neutral-300 line-through",
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
