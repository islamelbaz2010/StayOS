"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useGuestBookings } from "@/lib/queries/bookings";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-700",
};

export default function MyTripsPage() {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { data: bookings, isLoading, error } = useGuestBookings();

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("title")}
          </h1>

          {isLoading && (
            <div className="py-12 text-center text-neutral-600">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
            </div>
          )}

          {bookings && bookings.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-card">
              <p className="text-neutral-500">{t("noBookings")}</p>
              <Link
                href={`/${locale}/search`}
                className="mt-4 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                {t("searchCta")}
              </Link>
            </div>
          )}

          {bookings && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-xl bg-white shadow-card"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            STATUS_STYLES[booking.status] ||
                            "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {t(`status.${booking.status}`)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDate(new Date(booking.requested_at), "en-EG")}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="text-neutral-400">
                            {t("checkIn")}:{" "}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {formatDate(new Date(booking.check_in), "en-EG")}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400">
                            {t("checkOut")}:{" "}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {formatDate(new Date(booking.check_out), "en-EG")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {booking.status === "accepted" && (
                        <Link
                          href={`/${locale}/checkout/${booking.id}`}
                          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                          {t("checkout")}
                        </Link>
                      )}
                      {booking.status === "confirmed" && (
                        <span className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                          {t("confirmed")}
                        </span>
                      )}
                      {booking.status === "requested" && (
                        <span className="text-sm text-neutral-500">
                          {t("waitingHost")}
                        </span>
                      )}
                      {booking.reject_reason && (
                        <span className="text-sm text-danger-600">
                          {booking.reject_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
