"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostBookingDetail } from "@/components/bookings/HostBookingDetail";
import { HostBookingList } from "@/components/bookings/HostBookingList";
import { ErrorState } from "@/components/ui/ErrorState";
import { HostLayout } from "@/components/layouts";
import { useBooking, useHostBookingsPaginated } from "@/lib/queries/bookings";
import { useHostListings } from "@/lib/queries/hostListings";

const FILTERS = [
  "all",
  "requested",
  "accepted",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
  "no_show",
];

const PAGE_SIZE = 10;

export default function HostBookingsPage() {
  const t = useTranslations("hostBookings");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const status = searchParams?.get("status") ?? "all";
  const unitId = searchParams?.get("unitId") ?? null;
  const q = searchParams?.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams?.get("page") ?? "1", 10) || 1);
  const selectedId = searchParams?.get("bookingId") ?? null;

  const [searchInput, setSearchInput] = useState(q);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const params = useMemo(
    () => ({
      status: status === "all" ? null : status,
      unitId,
      search: q || null,
      page,
      limit: PAGE_SIZE,
    }),
    [status, unitId, q, page]
  );

  const {
    data: paginated,
    isPending,
    isError,
    refetch,
  } = useHostBookingsPaginated(params);

  const { data: selectedBooking, isPending: isDetailPending } = useBooking(
    selectedId ?? ""
  );

  const selected = useMemo(
    () =>
      selectedBooking ||
      (paginated?.items && selectedId
        ? paginated.items.find((b) => b.id === selectedId) || null
        : null),
    [selectedBooking, paginated, selectedId]
  );

  function updateParams(updates: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "" || (key === "status" && value === "all")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    if (resetPage) {
      next.delete("page");
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function handleStatusChange(next: string) {
    updateParams({ status: next === "all" ? null : next }, true);
  }

  function handleUnitChange(next: string) {
    updateParams({ unitId: next === "all" ? null : next }, true);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      updateParams({ q: value || null }, true);
    }, 300);
  }

  function handleSelect(id: string) {
    updateParams({ bookingId: id }, false);
  }

  function handleClearFilters() {
    const next = new URLSearchParams();
    if (selectedId) next.set("bookingId", selectedId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const { data: listings } = useHostListings();

  const emptyMessage =
    q || unitId || status !== "all"
      ? t("noSearchResults")
      : t("noBookings");

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="input w-full sm:w-64"
                />
                <select
                  value={unitId ?? "all"}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="input w-full sm:w-48"
                >
                  <option value="all">{t("allUnits")}</option>
                  {listings?.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleStatusChange(f)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                      status === f
                        ? "bg-brand-900 text-white"
                        : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {t(`filter.${f}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="py-12 text-center text-neutral-600">{t("loading")}</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                {paginated && paginated.items.length > 0 ? (
                  <>
                    <HostBookingList
                      bookings={paginated.items}
                      selectedId={selectedId}
                      onSelect={handleSelect}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          updateParams({ page: String(page - 1) }, false)
                        }
                        disabled={page <= 1}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        {tc("previous")}
                      </button>
                      <span className="text-sm text-neutral-600">
                        {t("pageInfo", {
                          page,
                          total: paginated.total_pages,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateParams({ page: String(page + 1) }, false)
                        }
                        disabled={page >= paginated.total_pages}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        {tc("next")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="card p-6 text-center text-neutral-600">
                    <p className="mb-4">{emptyMessage}</p>
                    {(q || unitId || status !== "all") && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn-secondary text-sm"
                      >
                        {t("clearFilters")}
                      </button>
                    )}
                  </div>
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
                        const next = new URLSearchParams(
                          searchParams?.toString() ?? ""
                        );
                        next.delete("bookingId");
                        router.replace(`${pathname}?${next.toString()}`, {
                          scroll: false,
                        });
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
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
