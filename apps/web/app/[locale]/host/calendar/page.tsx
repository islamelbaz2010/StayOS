"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostListings } from "@/lib/queries/hostListings";
import { useHostCalendar } from "@/lib/queries/calendar";
import type { components } from "@/lib/api-types";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-success-50 text-success-700",
  booked: "bg-primary-500 text-white",
  blocked: "bg-warning-100 text-warning-700",
  hold: "bg-neutral-100 text-neutral-600",
};

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type HostCalendarDay = components["schemas"]["HostCalendarDay"];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export default function HostCalendarPage() {
  const t = useTranslations("hostCalendar");
  const tc = useTranslations("common");
  const { locale = "ar" } = useParams<{ locale: string }>();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const checkIn = toISODate(startOfMonth(cursor));
  const checkOut = toISODate(addDays(endOfMonth(cursor), 1));

  const { data: listings } = useHostListings();
  const { data: calendar, isLoading, isError, refetch } = useHostCalendar(
    selectedUnitId ?? undefined,
    checkIn,
    checkOut
  );

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor);
  }, [cursor, locale]);

  const dayMap = useMemo(() => {
    const map = new Map<string, HostCalendarDay>();
    calendar?.days.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendar]);

  const gridDays = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const days: (Date | null)[] = [];
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      days.push(new Date(d));
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [cursor]);

  const stats = useMemo(() => {
    const days = calendar?.days ?? [];
    return {
      available: days.filter((d) => d.status === "available").length,
      booked: days.filter((d) => d.status === "booked").length,
      blocked: days.filter((d) => d.status === "blocked").length,
    };
  }, [calendar]);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCursor((c) => addDays(startOfMonth(c), -1))}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                aria-label={t("previousMonth")}
              >
                ‹
              </button>
              <span className="min-w-[140px] text-center text-lg font-semibold text-neutral-900">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => setCursor((c) => addDays(addDays(endOfMonth(c), 1), 1))}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                aria-label={t("nextMonth")}
              >
                ›
              </button>
            </div>
          </div>

          {listings && listings.length > 0 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedUnitId(null)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                  selectedUnitId === null
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {t("allListings")}
              </button>
              {listings.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedUnitId(l.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                    selectedUnitId === l.id
                      ? "bg-brand-600 text-white"
                      : "bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label={t("available")} value={stats.available} color="text-success-600" />
            <StatCard label={t("booked")} value={stats.booked} color="text-primary-600" />
            <StatCard label={t("blocked")} value={stats.blocked} color="text-warning-600" />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-neutral-600">{tc("loading")}</div>
          ) : isError ? (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 font-medium text-brand-600 hover:underline"
              >
                {tc("retry")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
                {WEEKDAYS.map((d) => (
                  <div key={d}>{t(`weekday.${d}`)}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gridDays.flat().map((date, idx) => (
                  <CalendarCell
                    key={idx}
                    date={date}
                    day={date ? dayMap.get(toISODate(date)) : undefined}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function CalendarCell({
  date,
  day,
  t,
}: {
  date: Date | null;
  day?: HostCalendarDay;
  t: (key: string) => string;
}) {
  if (!date) {
    return <div className="min-h-[80px] rounded-lg bg-neutral-50" />;
  }

  const isToday = toISODate(date) === toISODate(new Date());
  const statusStyle = STATUS_STYLES[day?.status ?? "hold"] ?? STATUS_STYLES.hold;

  return (
    <div
      className={`flex min-h-[80px] flex-col justify-between rounded-lg border p-1.5 text-xs transition ${
        isToday ? "border-brand-400 ring-1 ring-brand-400" : "border-neutral-100"
      } ${day ? statusStyle : "bg-white text-neutral-900"}`}
    >
      <span className={`self-end font-semibold ${day ? "" : "text-neutral-500"}`}>{date.getDate()}</span>
      {day && (
        <div className="mt-1 min-w-0">
          {day.guest_name && <p className="truncate font-medium">{day.guest_name}</p>}
          {day.price_egp > 0 && <p className="truncate">{day.price_egp.toLocaleString()} {t("egp")}</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
