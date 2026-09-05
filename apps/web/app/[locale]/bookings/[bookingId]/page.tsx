"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { CancelBookingButton } from "@/components/bookings/CancelBookingButton";
import { LeaveReviewForm } from "@/components/bookings/LeaveReviewForm";
import {
  useCheckIn,
  useCheckOut,
  useStayInfo,
} from "@/lib/queries/bookings";
import { useBookingConversation } from "@/lib/queries/messages";
import { formatDate } from "@/lib/utils";

const CANCELLABLE_PHASES = new Set(["upcoming", "check_in_ready"]);

const PHASE_STYLES: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  check_in_ready: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checkout_ready: "bg-green-100 text-green-800",
  checked_out: "bg-neutral-200 text-neutral-700",
  completed: "bg-neutral-200 text-neutral-700",
  cancelled: "bg-neutral-200 text-neutral-700",
  rejected: "bg-red-100 text-red-800",
  no_show: "bg-neutral-200 text-neutral-700",
};

function TripContent({ bookingId, locale }: { bookingId: string; locale: string }) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const { data: stay, isLoading, error, refetch } = useStayInfo(bookingId);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const conversation = useBookingConversation(
    stay?.booking.status === "confirmed" ||
      stay?.booking.status === "accepted" ||
      stay?.booking.checked_in_at
      ? bookingId
      : null
  );

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
        {tc("loading")}
      </div>
    );
  }

  if (error || !stay) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-card">
        <p className="text-danger-600">{t("loadError")}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-brand-600 hover:underline"
        >
          {tc("retry")}
        </button>
      </div>
    );
  }

  const { booking, property, host, arrival, review_eligible: reviewEligible } = stay;
  const phase = booking.stay_phase;
  const isTerminal = phase === "cancelled" || phase === "rejected" || phase === "no_show";
  const canCheckIn = phase === "check_in_ready";
  const canCheckOut = phase === "checked_in" || phase === "checkout_ready";
  const showStayInfo =
    phase === "checked_in" ||
    phase === "checkout_ready" ||
    phase === "check_in_ready" ||
    phase === "upcoming";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            {property.title && (
              <h2 className="text-lg font-bold text-neutral-900">
                {property.title}
              </h2>
            )}
            <p className="mt-1 text-sm text-neutral-600">
              {formatDate(new Date(booking.check_in), dateLocale)} →{" "}
              {formatDate(new Date(booking.check_out), dateLocale)}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {booking.adults} {t("adults")}
              {booking.children > 0 && ` · ${booking.children} ${t("children")}`}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${
              PHASE_STYLES[phase] ?? "bg-neutral-100 text-neutral-700"
            }`}
          >
            {t(`phase.${phase}`)}
          </span>
        </div>
      </div>

      {/* Arrival */}
      {!isTerminal && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h3 className="mb-3 font-bold text-neutral-900">{t("arrivalInfo")}</h3>
          {property.address && (
            <p className="mb-2 text-sm text-neutral-700">{property.address}</p>
          )}
          <p className="mb-2 text-sm text-neutral-500">
            {t("checkIn")}: {arrival.default_check_in_time} · {t("checkOut")}:{" "}
            {arrival.default_check_out_time}
          </p>
          {arrival.eligible ? (
            arrival.check_in_instructions && (
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="mb-1 text-xs font-semibold text-neutral-500">
                  {t("checkInInstructions")}
                </p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">
                  {arrival.check_in_instructions}
                </p>
              </div>
            )
          ) : (
            <p className="text-sm italic text-neutral-400">
              {t("arrivalReleasesAt")}
            </p>
          )}
        </div>
      )}

      {/* Host & stay info */}
      {showStayInfo && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h3 className="mb-3 font-bold text-neutral-900">{t("stayInfo")}</h3>
          {host.name && <p className="text-sm text-neutral-700">{host.name}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            {host.phone && (
              <a
                href={`tel:${host.phone}`}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                {t("callHost")}
              </a>
            )}
            {conversation.data && (
              <Link
                href={`/${locale}/messages/${conversation.data.id}`}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                {t("messageHost")}
              </Link>
            )}
          </div>
          {property.house_rules && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-neutral-500">
                {t("houseRules")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                {property.house_rules}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {booking.status === "accepted" && (
          <Link
            href={`/${locale}/checkout/${booking.id}`}
            className="block rounded-lg bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("checkout")}
          </Link>
        )}

        {canCheckIn && (
          <button
            type="button"
            onClick={async () => {
              await checkIn.mutateAsync(booking.id);
              refetch();
            }}
            disabled={checkIn.isPending}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {t("checkInAction")}
          </button>
        )}

        {canCheckOut && (
          <button
            type="button"
            onClick={async () => {
              await checkOut.mutateAsync(booking.id);
              refetch();
            }}
            disabled={checkOut.isPending}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {t("checkOutAction")}
          </button>
        )}

        {reviewEligible && (
          <LeaveReviewForm
            bookingId={booking.id}
            unitId={booking.unit_id}
            onSubmitted={() => refetch()}
          />
        )}

        {CANCELLABLE_PHASES.has(phase) && (
          <CancelBookingButton booking={booking} onCancelled={() => refetch()} />
        )}
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const t = useTranslations("trips");
  const params = useParams<{ locale: string; bookingId: string }>();
  const locale = params?.locale ?? "ar";
  const bookingId = params?.bookingId ?? "";

  return (
    <ProtectedRoute allowedRoles={["guest"]}>
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/bookings`}
            className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700"
          >
            ← {t("title")}
          </Link>
          <TripContent bookingId={bookingId} locale={locale} />
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
