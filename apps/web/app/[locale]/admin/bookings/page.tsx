"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostBookingDetail } from "@/components/bookings/HostBookingDetail";
import { HostBookingList } from "@/components/bookings/HostBookingList";
import { ErrorState } from "@/components/ui/ErrorState";
import { HostLayout } from "@/components/layouts";
import { useBooking, useHostBookings } from "@/lib/queries/bookings";
import type { BookingResponse } from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";

type QueueKey = "decision" | "checkIn" | "checkOut" | "complete";

function belongsToQueue(queue: QueueKey, booking: BookingResponse): boolean {
  switch (queue) {
    case "decision":
      return booking.status === "requested";
    case "checkIn":
      return booking.stay_phase === "check_in_ready";
    case "checkOut":
      return (
        booking.stay_phase === "checked_in" ||
        booking.stay_phase === "checkout_ready"
      );
    case "complete":
      return booking.stay_phase === "checked_out";
    default:
      return false;
  }
}

export default function AdminBookingsPage() {
  const t = useTranslations("adminBookings");
  const [activeQueue, setActiveQueue] = useState<QueueKey>("decision");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: allBookings,
    isPending,
    isError,
    refetch,
  } = useHostBookings(null);
  const { data: selectedBooking, isPending: isDetailPending } = useBooking(
    selectedId ?? ""
  );

  const queues: { key: QueueKey; label: string }[] = useMemo(
    () => [
      { key: "decision", label: t("queue.decision") },
      { key: "checkIn", label: t("queue.checkIn") },
      { key: "checkOut", label: t("queue.checkOut") },
      { key: "complete", label: t("queue.complete") },
    ],
    [t]
  );

  const bookings = useMemo(() => allBookings ?? [], [allBookings]);

  const queueBookings = useMemo(() => {
    return bookings.filter((b) => belongsToQueue(activeQueue, b));
  }, [bookings, activeQueue]);

  const selected = useMemo(
    () =>
      selectedBooking ||
      (queueBookings && selectedId
        ? queueBookings.find((b) => b.id === selectedId) || null
        : null),
    [selectedBooking, queueBookings, selectedId]
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="py-12 text-center text-neutral-600">
              {t("loading")}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {queues.map((q) => {
                  const count = bookings.filter((b) =>
                    belongsToQueue(q.key, b)
                  ).length;
                  const active = activeQueue === q.key;
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => {
                        setActiveQueue(q.key);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                        active
                          ? "bg-brand-900 text-white"
                          : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                      )}
                    >
                      {q.label}
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs",
                          active
                            ? "bg-white text-brand-900"
                            : "bg-neutral-200 text-neutral-700"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  {queueBookings.length === 0 ? (
                    <div className="card p-8 text-center text-neutral-600">
                      {t("emptyQueue")}
                    </div>
                  ) : (
                    <HostBookingList
                      bookings={queueBookings}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      showPhase
                    />
                  )}
                </div>

                <div className="lg:col-span-2">
                  {selectedId ? (
                    isDetailPending ? (
                      <div className="card p-12 text-center text-neutral-600">
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
                      <div className="card p-12 text-center text-neutral-600">
                        {t("notFound")}
                      </div>
                    )
                  ) : (
                    <div className="card p-12 text-center text-neutral-600">
                      {t("selectBooking")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
