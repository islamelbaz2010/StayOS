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
  const governorate = searchParams?.get("governorate") ?? null;
  const area = searchParams?.get("area") ?? null;
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
      area,
      governorate,
      search: q || null,
      page,
      limit: PAGE_SIZE,
    }),
    [status, unitId, area, governorate, q, page]
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

  const { data: listings } = useHostListings();

  // Stale-selection guard: when filters change so the selected booking
  // can no longer match, clear the selection — never show details that
  // contradict the visible filter set.
  useEffect(() => {
    if (!selectedId || !listings) return;
    const booking =
      selectedBooking ??
      paginated?.items.find((b) => b.id === selectedId) ??
      null;
    if (!booking) return;

    let invalid = false;
    if (status !== "all" && booking.status !== status) invalid = true;
    if (unitId && booking.unit_id !== unitId) invalid = true;
    const listing = listings.find((l) => l.id === booking.unit_id);
    if (listing) {
      if (area && listing.city !== area) invalid = true;
      if (governorate && listing.governorate !== governorate) invalid = true;
    }
    if (invalid) {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.delete("bookingId");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [
    selectedId,
    selectedBooking,
    paginated,
    listings,
    status,
    unitId,
    area,
    governorate,
    searchParams,
    pathname,
    router,
  ]);

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

  function handleGovernorateChange(next: string) {
    const value = next === "all" ? null : next;
    const updates: Record<string, string | null> = { governorate: value };
    // Keep the cascade coherent: an area or listing outside the chosen
    // governorate can never match — reset it instead of yielding empty
    // results.
    if (
      value &&
      area &&
      !listings?.some((l) => l.governorate === value && l.city === area)
    ) {
      updates.area = null;
    }
    if (
      value &&
      unitId &&
      !listings?.some((l) => l.id === unitId && l.governorate === value)
    ) {
      updates.unitId = null;
    }
    updateParams(updates, true);
  }

  function handleAreaChange(next: string) {
    const updates: Record<string, string | null> = {
      area: next === "all" ? null : next,
    };
    // Keep listing + area coherent: a selected listing outside the new
    // area can never match — reset it instead of yielding empty results.
    if (
      next !== "all" &&
      unitId &&
      !listings?.some((l) => l.id === unitId && l.city === next)
    ) {
      updates.unitId = null;
    }
    updateParams(updates, true);
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

  // Location options derive from the host's own listings — governorate
  // → city (area) → listing, all canonical stored values.
  const governorates = useMemo(() => {
    const values = new Set(
      (listings ?? [])
        .map((l) => l.governorate)
        .filter((g): g is string => !!g)
    );
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const areas = useMemo(() => {
    const cities = new Set(
      (listings ?? [])
        .filter((l) => !governorate || l.governorate === governorate)
        .map((l) => l.city)
        .filter((c): c is string => !!c)
    );
    return [...cities].sort((a, b) => a.localeCompare(b));
  }, [listings, governorate]);

  const listingOptions = useMemo(
    () =>
      (listings ?? []).filter(
        (l) =>
          (!governorate || l.governorate === governorate) &&
          (!area || l.city === area)
      ),
    [listings, governorate, area]
  );

  const hasFilters = !!(
    q ||
    unitId ||
    area ||
    governorate ||
    status !== "all"
  );
  const emptyMessage = hasFilters ? t("noSearchResults") : t("noBookings");

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("title")}
            </h1>
          </div>

          {/* Filters live in their own responsive grid — row 1 holds the
              search + location/listing selects (wrap to 1/2/4 columns),
              row 2 holds the status pills whose scroll stays inside the
              pill strip so the page never scrolls horizontally. */}
          <div className="mb-6 grid gap-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="input w-full"
              />
              {governorates.length > 0 && (
                <select
                  value={governorate ?? "all"}
                  onChange={(e) => handleGovernorateChange(e.target.value)}
                  aria-label={t("allGovernorates")}
                  className="input w-full"
                >
                  <option value="all">{t("allGovernorates")}</option>
                  {governorates.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}
              {areas.length > 0 && (
                <select
                  value={area ?? "all"}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  aria-label={t("allAreas")}
                  className="input w-full"
                >
                  <option value="all">{t("allAreas")}</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={unitId ?? "all"}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="input w-full"
              >
                <option value="all">{t("allUnits")}</option>
                {listingOptions.map((unit) => (
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
                    {hasFilters && (
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
