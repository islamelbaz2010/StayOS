"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostBookingDetail } from "@/components/bookings/HostBookingDetail";
import { HostBookingList } from "@/components/bookings/HostBookingList";
import { ErrorState } from "@/components/ui/ErrorState";
import { HostLayout } from "@/components/layouts";
import { useBooking, useHostBookings } from "@/lib/queries/bookings";

const FILTERS = ["all", "requested", "accepted", "rejected", "cancelled"];

export default function HostBookingsPage() {
  const t = useTranslations("hostBookings");
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const status = filter === "all" ? null : filter;
  const { data: bookings, isPending, isError, refetch } = useHostBookings(status);
  const { data: selectedBooking, isPending: isDetailPending } = useBooking(
    selectedId ?? ""
  );

  const selected = useMemo(
    () =>
      selectedBooking ||
      (bookings && selectedId
        ? bookings.find((b) => b.id === selectedId) || null
        : null),
    [selectedBooking, bookings, selectedId]
  );

  function handleSelect(id: string) {
    setSelectedId(id);
  }

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>

            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                    onClick={() => {
                    setFilter(f);
                    setSelectedId(null);
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    filter === f
                      ? "bg-brand-600 text-white"
                      : "bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {t(`filter.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="py-12 text-center text-neutral-600">{t("loading")}</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <HostBookingList
                  bookings={bookings || []}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </div>

              <div className="lg:col-span-2">
                {selectedId ? (
                  isDetailPending ? (
                    <div className="rounded-xl bg-white p-12 text-center text-neutral-600 shadow-card">
                      {t("loading")}
                    </div>
                  ) : selected ? (
                    <HostBookingDetail
                      booking={selected}
                      onActionSuccess={() => {
                        refetch();
                        setSelectedId(null);
                      }}
                    />
                  ) : (
                    <div className="rounded-xl bg-white p-12 text-center text-neutral-600 shadow-card">
                      {t("notFound")}
                    </div>
                  )
                ) : (
                  <div className="rounded-xl bg-white p-12 text-center text-neutral-600 shadow-card">
                    {t("selectBooking")}
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
