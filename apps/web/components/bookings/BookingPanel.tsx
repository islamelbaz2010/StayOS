"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import type { ListingDetail } from "@/lib/queries/listings";
import { useAuth } from "@/lib/auth/useAuth";
import { useBookingQuote, useCreateBooking } from "@/lib/queries/bookings";
import { useListingAvailability } from "@/lib/queries/listings";
import { cn, formatMoney } from "@/lib/utils";

import { BookingSuccess } from "./BookingSuccess";

interface BookingPanelProps {
  listing: ListingDetail;
}

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

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

export function BookingPanel({ listing }: BookingPanelProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const { isAuthenticated, isGuest, isLoading: isAuthLoading, user } = useAuth();
  const isKycVerified = user?.kyc_status === "verified";
  const moneyLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const createBooking = useCreateBooking();
  const pathname = usePathname();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toInputDate(today), [today]);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const dayAfterTomorrow = useMemo(() => addDays(today, 2), [today]);

  const [checkIn, setCheckIn] = useState<string>(toInputDate(tomorrow));
  const [checkOut, setCheckOut] = useState<string>(toInputDate(dayAfterTomorrow));
  const [guests, setGuests] = useState<GuestCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      setCheckOut(toInputDate(addDays(checkInDate, 1)));
    }
  }, [checkIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: availability } = useListingAvailability(listing.id, checkIn, checkOut);
  const { data: quote, isLoading: isQuoteLoading } = useBookingQuote(
    listing.id,
    checkIn,
    checkOut
  );

  const blockedDatesInRange = useMemo(() => {
    return (availability?.days ?? []).filter((day) => day.status !== "AVAILABLE");
  }, [availability]);

  const totalGuests = guests.adults + guests.children + guests.infants;
  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  }, [checkIn, checkOut]);

  const totalPrice = quote?.accommodation_egp ?? listing.price * nights;
  const cleaningFee = quote?.cleaning_fee_egp ?? listing.cleaningFee ?? 0;
  const serviceFee = quote?.service_fee_egp ?? 0;
  const serviceFeeWaived = quote?.service_fee_waived ?? false;
  const grandTotal = quote?.total_egp ?? totalPrice + cleaningFee + serviceFee;

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!checkIn) {
      nextErrors.checkIn = t("checkInRequired");
    } else {
      const checkInDate = new Date(checkIn);
      const todayMidnight = new Date(todayStr);
      if (checkInDate < todayMidnight) {
        nextErrors.checkIn = t("checkInPast");
      }
    }

    if (!checkOut) {
      nextErrors.checkOut = t("checkOutRequired");
    } else if (checkIn) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        nextErrors.checkOut = t("checkOutAfterCheckIn");
      } else if (blockedDatesInRange.length > 0) {
        nextErrors.checkOut = t("datesUnavailable");
      } else if (nights > 0 && listing.minNights > 0 && nights < listing.minNights) {
        nextErrors.nights = t("minNightsRequired", { min: listing.minNights });
      } else if (nights > 0 && listing.maxNights > 0 && nights > listing.maxNights) {
        nextErrors.nights = t("maxNightsExceeded", { max: listing.maxNights });
      }
    }

    if (guests.adults < 1) {
      nextErrors.adults = t("atLeastOneAdult");
    }

    if (totalGuests < 1) {
      nextErrors.guests = t("atLeastOneGuest");
    } else if (totalGuests > listing.maxGuests) {
      nextErrors.guests = t("maxGuestsExceeded", { max: listing.maxGuests });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    setErrors({});

    if (!isAuthenticated || !isGuest) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      await createBooking.mutateAsync({
        unit_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
      });
      setSuccess(true);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        axiosError.response?.data?.error?.message || t("submitError");
      setErrors({ submit: message });
    }
  }

  if (success) {
    return (
      <BookingSuccess
        onClose={() => {
          setSuccess(false);
          setCheckIn(toInputDate(tomorrow));
          setCheckOut(toInputDate(dayAfterTomorrow));
          setGuests({ adults: 1, children: 0, infants: 0 });
        }}
      />
    );
  }

  const minNights = listing.minNights || 1;
  const maxNights = listing.maxNights || Number.MAX_SAFE_INTEGER;
  const nightsValid =
    nights > 0 && nights >= minNights && nights <= maxNights;

  const canSubmit =
    isAuthenticated &&
    isGuest &&
    isKycVerified &&
    !createBooking.isPending &&
    blockedDatesInRange.length === 0 &&
    nightsValid;

  return (
    <section className="card p-5 sm:p-6" aria-label={t("title")}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-brand-900">{t("title")}</h2>
        <p className="text-sm text-neutral-500">
          {formatMoney(listing.price, listing.currency, moneyLocale)}{" "}
          <span className="text-neutral-400">/ {t("perNight")}</span>
        </p>
      </div>

      {!isAuthLoading && !isAuthenticated && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-4">
          <p className="text-sm text-neutral-700">{t("signInTitle")}</p>
          <Link
            href={`/${locale}/auth/login?redirect=${encodeURIComponent(pathname || `/${locale}`)}`}
            className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            {t("signInButton")}
          </Link>
        </div>
      )}

      {!isAuthLoading && isAuthenticated && !isGuest && (
        <p className="mt-4 text-sm text-danger-600" role="alert">
          {t("guestsOnly")}
        </p>
      )}

      {!isAuthLoading && isAuthenticated && isGuest && !isKycVerified && (
        <div className="mt-4 rounded-lg bg-warning-50 p-4">
          <p className="text-sm text-warning-800">{t("kycRequired")}</p>
          <Link
            href={`/${locale}/host/kyc`}
            className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            {t("kycRequiredCta")}
          </Link>
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="check-in"
              className="block text-sm font-medium text-neutral-700"
            >
              {t("checkIn")}
            </label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={(e) => setCheckIn(e.target.value)}
              className={cn(
                "input mt-1 text-sm",
                errors.checkIn &&
                  "border-danger-500 focus:border-danger-600 focus:ring-danger-500"
              )}
              aria-invalid={!!errors.checkIn}
              aria-errormessage={errors.checkIn ? "checkIn-error" : undefined}
              disabled={createBooking.isPending}
            />
            {errors.checkIn && (
              <p id="checkIn-error" className="mt-1 text-sm text-danger-600" role="alert">
                {errors.checkIn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="check-out"
              className="block text-sm font-medium text-neutral-700"
            >
              {t("checkOut")}
            </label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              min={toInputDate(addDays(new Date(checkIn), 1))}
              onChange={(e) => setCheckOut(e.target.value)}
              className={cn(
                "input mt-1 text-sm",
                errors.checkOut &&
                  "border-danger-500 focus:border-danger-600 focus:ring-danger-500"
              )}
              aria-invalid={!!errors.checkOut}
              aria-errormessage={errors.checkOut ? "checkOut-error" : undefined}
              disabled={createBooking.isPending}
            />
            {errors.checkOut && (
              <p id="checkOut-error" className="mt-1 text-sm text-danger-600" role="alert">
                {errors.checkOut}
              </p>
            )}
            {!errors.checkOut && nights > 0 && blockedDatesInRange.length > 0 && (
              <p className="mt-1 text-sm text-danger-600" role="alert">
                {t("datesUnavailable")}
              </p>
            )}
            {errors.nights && (
              <p className="mt-1 text-sm text-danger-600" role="alert">
                {errors.nights}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-neutral-700">
            {t("guests")}
          </h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="adults"
                className="block text-sm text-neutral-600"
              >
                {t("adults")}
              </label>
              <select
                id="adults"
                value={guests.adults}
                onChange={(e) =>
                  setGuests((prev) => ({
                    ...prev,
                    adults: Number(e.target.value),
                  }))
                }
                className={cn(
                  "input mt-1 text-sm",
                  (errors.adults || errors.guests) &&
                    "border-danger-500 focus:border-danger-600 focus:ring-danger-500"
                )}
                aria-invalid={!!(errors.adults || errors.guests)}
                aria-errormessage={
                  errors.adults ? "adults-error" : "guests-error"
                }
                disabled={createBooking.isPending}
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="children"
                className="block text-sm text-neutral-600"
              >
                {t("children")}
              </label>
              <select
                id="children"
                value={guests.children}
                onChange={(e) =>
                  setGuests((prev) => ({
                    ...prev,
                    children: Number(e.target.value),
                  }))
                }
                className="input mt-1 text-sm"
                disabled={createBooking.isPending}
              >
                {Array.from({ length: 11 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="infants"
                className="block text-sm text-neutral-600"
              >
                {t("infants")}
              </label>
              <select
                id="infants"
                value={guests.infants}
                onChange={(e) =>
                  setGuests((prev) => ({
                    ...prev,
                    infants: Number(e.target.value),
                  }))
                }
                className="input mt-1 text-sm"
                disabled={createBooking.isPending}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(errors.adults || errors.guests) && (
            <div className="mt-2 space-y-1">
              {errors.adults && (
                <p id="adults-error" className="text-sm text-danger-600" role="alert">
                  {errors.adults}
                </p>
              )}
              {errors.guests && (
                <p id="guests-error" className="text-sm text-danger-600" role="alert">
                  {errors.guests}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-brand-900">
            {t("summary")}
          </h3>

          {nights > 0 ? (
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {formatMoney(listing.price, listing.currency, moneyLocale)} × {nights} {t("nights")}
                </span>
                <span className="font-medium text-brand-900">
                  {formatMoney(totalPrice, listing.currency, moneyLocale)}
                </span>
              </div>

              {cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">{t("cleaningFee")}</span>
                  <span className="font-medium text-brand-900">
                    {formatMoney(cleaningFee, listing.currency, moneyLocale)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t("serviceFee")}
                  {serviceFeeWaived && (
                    <span className="ms-1 text-xs text-success-600">
                      ({t("serviceFeeWaived")})
                    </span>
                  )}
                </span>
                <span className="font-medium text-brand-900">
                  {formatMoney(serviceFee, listing.currency, moneyLocale)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">{t("guests")}</span>
                <span className="font-medium text-brand-900">{totalGuests}</span>
              </div>

              <div className="border-t border-neutral-200 pt-2">
                <div className="flex justify-between font-semibold text-brand-900">
                  <span>{t("total")}</span>
                  <span>{formatMoney(grandTotal, listing.currency, moneyLocale)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">{t("selectDates")}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || createBooking.isPending}
          className={cn(
            "w-full rounded-md px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2",
            !canSubmit
              ? "cursor-not-allowed bg-neutral-300 text-neutral-600"
              : "btn-primary"
          )}
          aria-busy={createBooking.isPending}
        >
          {createBooking.isPending ? t("submitting") : t("requestBooking")}
        </button>

        {errors.submit && (
          <p className="text-sm text-danger-600" role="alert">
            {errors.submit}
          </p>
        )}
      </form>
    </section>
  );
}
