"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useDefaultHostCalendarRange,
  useCreateCalendarRule,
} from "@/lib/queries/calendar";
import { useHostListingDetail } from "@/lib/queries/hostListings";
import type { components } from "@/lib/api-types";

const BLOCK_TYPES = [
  { value: "manual", labelKey: "blockManual" },
  { value: "cleaning", labelKey: "blockCleaning" },
  { value: "maintenance", labelKey: "blockMaintenance" },
];

const DAY_STATUS_STYLES: Record<string, string> = {
  booked: "bg-accent-100 text-accent-700",
  blocked: "bg-warning-100 text-warning-700",
  available: "bg-success-100 text-success-700",
};

export default function ListingAvailabilityPage() {
  const t = useTranslations("hostListings");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string; unitId: string }>();
  const locale = params.locale ?? "ar";
  const unitId = params.unitId;

  const {
    data: listing,
    isLoading: listingLoading,
    error: listingError,
  } = useHostListingDetail(unitId);
  const listingTitle =
    locale === "ar"
      ? listing?.title_ar
      : listing?.title_en || listing?.title_ar;
  const {
    data: calendar,
    isLoading: calLoading,
    isError: calError,
    refetch,
  } = useDefaultHostCalendarRange(unitId);
  const createRule = useCreateCalendarRule();

  const [showForm, setShowForm] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [blockType, setBlockType] = useState("manual");
  const [priceOverride, setPriceOverride] = useState("");

  const canManage =
    listing?.permission_scope === "owner" ||
    listing?.permission_scope === "admin" ||
    listing?.permission_scope === "full_access" ||
    listing?.permission_scope === "calendar_messaging" ||
    listing?.permission_scope === "calendar_only";

  const days = calendar?.days ?? [];
  const bookedDays = days.filter((d) => d.status === "booked");
  const blockedDays = days.filter((d) => d.status === "blocked");
  const availableDays = days.filter((d) => d.status === "available");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateFrom || !dateTo) return;
    await createRule.mutateAsync({
      unitId,
      payload: {
        date_from: dateFrom,
        date_to: dateTo,
        status: "blocked",
        block_type: blockType,
        price_override: priceOverride ? Number(priceOverride) : null,
      },
    });
    setShowForm(false);
    setDateFrom("");
    setDateTo("");
    setPriceOverride("");
    setBlockType("manual");
  }

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/${locale}/host/listings`}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                <svg
                  className="h-4 w-4 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                {t("backToListings")}
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
                {listingTitle ?? t("availabilityTitle")}
              </h1>
            </div>
            <Link
              href={`/${locale}/host/listings/${unitId}/edit`}
              className="btn-secondary text-sm"
            >
              {t("editListing")}
            </Link>
          </div>

          {listingLoading || calLoading ? (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : listingError || calError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label={t("calendarAvailable")}
                  value={availableDays.length}
                  color="text-success-600"
                />
                <StatCard
                  label={t("calendarBooked")}
                  value={bookedDays.length}
                  color="text-accent-600"
                />
                <StatCard
                  label={t("calendarBlocked")}
                  value={blockedDays.length}
                  color="text-warning-600"
                />
              </div>

              {canManage && (
                <div className="card p-5 sm:p-6">
                  <button
                    type="button"
                    onClick={() => setShowForm((s) => !s)}
                    className="btn-primary text-sm"
                  >
                    {showForm ? t("hideBlockForm") : t("blockDates")}
                  </button>

                  {showForm && (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="date-from"
                            className="block text-sm font-medium text-neutral-700"
                          >
                            {t("dateFrom")}
                          </label>
                          <input
                            id="date-from"
                            type="date"
                            value={dateFrom}
                            min={toISODate(new Date())}
                            onChange={(e) => setDateFrom(e.target.value)}
                            required
                            className="input mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="date-to"
                            className="block text-sm font-medium text-neutral-700"
                          >
                            {t("dateTo")}
                          </label>
                          <input
                            id="date-to"
                            type="date"
                            value={dateTo}
                            min={dateFrom || toISODate(new Date())}
                            onChange={(e) => setDateTo(e.target.value)}
                            required
                            className="input mt-1 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-neutral-700">
                          {t("blockType")}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {BLOCK_TYPES.map((bt) => (
                            <button
                              key={bt.value}
                              type="button"
                              onClick={() => setBlockType(bt.value)}
                              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                blockType === bt.value
                                  ? "bg-accent-100 text-accent-700 ring-1 ring-accent-500"
                                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              }`}
                            >
                              {t(bt.labelKey)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="price-override"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          {t("priceOverride")}
                        </label>
                        <input
                          id="price-override"
                          type="number"
                          min={0}
                          value={priceOverride}
                          onChange={(e) => setPriceOverride(e.target.value)}
                          placeholder={t("priceOverridePlaceholder")}
                          className="input mt-1 text-sm sm:w-48"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={createRule.isPending}
                          className="btn-primary text-sm"
                        >
                          {createRule.isPending ? tc("loading") : t("addRule")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="btn-secondary text-sm"
                        >
                          {tc("cancel")}
                        </button>
                      </div>

                      {createRule.isError && (
                        <p className="text-sm text-danger-600">{t("ruleError")}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-brand-900">
                  {t("calendarDays")}
                </h2>
                {days.filter((d) => d.status !== "available").length === 0 ? (
                  <p className="text-center text-neutral-500">
                    {t("noBlockedDays")}
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {days
                      .filter((d) => d.status !== "available")
                      .map((day) => (
                        <DayRow key={day.date} day={day} t={t} />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function DayRow({
  day,
  t,
}: {
  day: components["schemas"]["HostCalendarDay"];
  t: (key: string) => string;
}) {
  const statusStyle =
    DAY_STATUS_STYLES[day.status] ?? DAY_STATUS_STYLES.available;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {day.status === "booked" ? t("calendarBooked") : t("calendarBlocked")}
        </span>
        <span className="text-sm font-medium text-brand-900">{day.date}</span>
      </div>
      <div className="text-end text-sm text-neutral-600">
        {day.guest_name && <span>{day.guest_name}</span>}
        {day.price_egp > 0 && (
          <span className="ms-2">
            {day.price_egp} {t("egp")}
          </span>
        )}
      </div>
    </div>
  );
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}
