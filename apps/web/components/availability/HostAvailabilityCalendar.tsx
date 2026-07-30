"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import {
  useAvailability,
  useUpdateAvailability,
} from "@/lib/queries/availability";

interface HostAvailabilityCalendarProps {
  unitId: string;
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatMonthYear(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(date);
}

function getMonthDays(current: Date): Date[] {
  const start = startOfMonth(current);
  const end = endOfMonth(current);
  const days: Date[] = [];
  const iter = new Date(start);
  while (iter <= end) {
    days.push(new Date(iter));
    iter.setDate(iter.getDate() + 1);
  }
  return days;
}

function groupContiguousDates(dates: string[]): { date_from: string; date_to: string }[] {
  if (dates.length === 0) return [];
  const sorted = [...dates].sort();
  const groups: { date_from: string; date_to: string }[] = [];
  let current = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(end);
    const next = new Date(sorted[i]);
    const expected = new Date(prev);
    expected.setDate(expected.getDate() + 1);
    if (next.getTime() === expected.getTime()) {
      end = sorted[i];
    } else {
      groups.push({ date_from: current, date_to: end });
      current = sorted[i];
      end = sorted[i];
    }
  }
  groups.push({ date_from: current, date_to: end });
  return groups;
}

const STATUS_COLORS: Record<string, string> = {
  available:
    "bg-white text-neutral-900 hover:bg-neutral-50",
  blocked:
    "bg-red-100 text-red-800 hover:bg-red-200",
  booked:
    "bg-blue-100 text-blue-800 cursor-not-allowed",
  hold:
    "bg-yellow-100 text-yellow-800 cursor-not-allowed",
};

export function HostAvailabilityCalendar({ unitId }: HostAvailabilityCalendarProps) {
  const t = useTranslations("availability");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const checkIn = useMemo(() => toInputDate(monthStart), [monthStart]);
  const checkOut = useMemo(
    () => toInputDate(new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000)),
    [monthEnd]
  );

  const {
    data: availability,
    isPending,
    isError,
    refetch,
  } = useAvailability(unitId, checkIn, checkOut);

  const updateAvailability = useUpdateAvailability();

  const dayMap = useMemo(() => {
    const map: Record<string, { status: string; block_type: string | null }> = {};
    if (availability) {
      for (const day of availability.days) {
        map[day.date] = { status: day.status, block_type: day.block_type ?? null };
      }
    }
    return map;
  }, [availability]);

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  function toggleDate(dateStr: string, isOccupied: boolean) {
    if (isOccupied || updateAvailability.isPending) return;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
    setSuccess(null);
    setError(null);
  }

  function clearSelection() {
    setSelectedDates(new Set());
    setSuccess(null);
    setError(null);
  }

  async function applyStatus(status: "available" | "blocked") {
    if (selectedDates.size === 0) return;
    setSuccess(null);
    setError(null);

    const rules = groupContiguousDates(Array.from(selectedDates)).map((group) => ({
      ...group,
      status,
    }));

    try {
      await updateAvailability.mutateAsync({ unitId, payload: { rules } });
      setSuccess(
        status === "blocked" ? t("blockSuccess") : t("unblockSuccess")
      );
      setSelectedDates(new Set());
      await refetch();
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        axiosError.response?.data?.error?.message || t("updateError")
      );
    }
  }

  const isPast = (date: Date) => date < new Date(today.toDateString());

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {formatMonthYear(currentMonth, t("locale"))}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            disabled={isPending}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            aria-label={t("previousMonth")}
          >
            {t("previous")}
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            disabled={isPending}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            aria-label={t("nextMonth")}
          >
            {t("next")}
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="py-12 text-center text-neutral-600">{t("loading")}</div>
      ) : isError ? (
        <div className="py-12 text-center text-red-600" role="alert">
          {t("loadError")}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-2 text-brand-600 hover:text-brand-700"
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-neutral-500">
            {t("weekDays")
              .split(",")
              .map((day) => (
                <div key={day}>{day}</div>
              ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dateStr = toInputDate(day);
              const info = dayMap[dateStr] || { status: "available", block_type: null };
              const occupied = ["booked", "hold"].includes(info.status) || isPast(day);
              const selected = selectedDates.has(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={occupied || updateAvailability.isPending}
                  onClick={() => toggleDate(dateStr, occupied)}
                  className={`
                    relative aspect-square w-full rounded-lg border p-2 text-sm
                    transition focus:outline-none focus:ring-2 focus:ring-brand-500
                    ${STATUS_COLORS[info.status] || STATUS_COLORS.available}
                    ${
                      occupied
                        ? "cursor-not-allowed border-neutral-200 opacity-70"
                        : "border-neutral-300"
                    }
                    ${selected ? "ring-2 ring-brand-600" : ""}
                  `}
                  aria-pressed={selected}
                  aria-label={t("dayLabel", { date: dateStr, status: info.status })}
                >
                  <span className="block text-center">{day.getDate()}</span>
                  {selected && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-600" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full border border-neutral-300 bg-white" />
              <span>{t("available")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-100" />
              <span>{t("blocked")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-100" />
              <span>{t("booked")}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => applyStatus("blocked")}
              disabled={selectedDates.size === 0 || updateAvailability.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {updateAvailability.isPending ? t("applying") : t("blockSelected")}
            </button>
            <button
              type="button"
              onClick={() => applyStatus("available")}
              disabled={selectedDates.size === 0 || updateAvailability.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {updateAvailability.isPending ? t("applying") : t("unblockSelected")}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedDates.size === 0 || updateAvailability.isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
            >
              {t("clearSelection")}
            </button>
          </div>

          {success && (
            <p
              className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800"
              role="status"
            >
              {success}
            </p>
          )}

          {error && (
            <p
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
