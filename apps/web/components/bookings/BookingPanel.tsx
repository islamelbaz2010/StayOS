"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import type { ListingDetail } from "@/lib/queries/listings";
import type { BookingResponse } from "@/lib/queries/bookings";
import { useAuth } from "@/lib/auth/useAuth";
import { useBookingQuote, useCreateBooking } from "@/lib/queries/bookings";
import { useListingAvailability } from "@/lib/queries/listings";
import { cn, formatMoney, parseInputDate, toInputDate } from "@/lib/utils";

import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { BookingSuccess } from "./BookingSuccess";

interface BookingPanelProps {
  listing: ListingDetail;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: GuestCounts;
}

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isValidIsoDate(value: string | undefined): value is string {
  return parseInputDate(value) !== null;
}

export function BookingPanel({ listing, initialCheckIn, initialCheckOut, initialGuests }: BookingPanelProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const { isAuthenticated, isGuest, isLoading: isAuthLoading, user } = useAuth();
  const isKycVerified = user?.kyc_status === "verified";
  const isUnauthenticated = !isAuthLoading && !isAuthenticated;
  const moneyLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const createBooking = useCreateBooking();
  const pathname = usePathname();
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toInputDate(today), [today]);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const dayAfterTomorrow = useMemo(() => addDays(today, 2), [today]);

  const defaultCheckIn = isValidIsoDate(initialCheckIn) ? initialCheckIn : toInputDate(tomorrow);
  const defaultCheckOut = isValidIsoDate(initialCheckOut) ? initialCheckOut : toInputDate(dayAfterTomorrow);

  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut);
  const [guests, setGuests] = useState<GuestCounts>(
    initialGuests ?? { adults: 1, children: 0, infants: 0 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(null);
  const [message, setMessage] = useState("");
  // The calendar is a popover anchored to the date fields, not a permanent
  // grid — it opens on field focus and closes once a full range is picked.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"in" | "out">("in");
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [calendarOpen]);

  function openCalendar(target: "in" | "out") {
    setCalendarTarget(target);
    setCalendarOpen(true);
  }

  function handleCalendarSelect(nextCheckIn: string, nextCheckOut: string) {
    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);
    if (nextCheckIn && nextCheckOut) setCalendarOpen(false);
  }

  useEffect(() => {
    if (checkIn && checkOut && checkOut <= checkIn) {
      const checkInDate = parseInputDate(checkIn);
      if (checkInDate) {
        setCheckOut(toInputDate(addDays(checkInDate, 1)));
      }
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
    const start = parseInputDate(checkIn);
    const end = parseInputDate(checkOut);
    if (!start || !end) return 0;
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  }, [checkIn, checkOut]);

  const liveDateError = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    if (checkOut <= checkIn) return t("checkOutAfterCheckIn");
    if (checkIn < todayStr) return t("checkInPast");
    if (nights > 0 && listing.minNights > 0 && nights < listing.minNights) {
      return t("minNightsRequired", { min: listing.minNights });
    }
    if (nights > 0 && listing.maxNights > 0 && nights > listing.maxNights) {
      return t("maxNightsExceeded", { max: listing.maxNights });
    }
    return null;
  }, [checkIn, checkOut, nights, todayStr, listing.minNights, listing.maxNights, t]);

  // All-inclusive pricing (FD-19): guests see the final total only — the
  // quote contract no longer exposes accommodation/fee components.
  const grandTotal = quote?.total_egp ?? listing.price * nights;

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!checkIn) {
      nextErrors.checkIn = t("checkInRequired");
    } else if (checkIn < todayStr) {
      nextErrors.checkIn = t("checkInPast");
    }

    if (!checkOut) {
      nextErrors.checkOut = t("checkOutRequired");
    } else if (checkIn) {
      if (checkOut <= checkIn) {
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

    // Unauthenticated visitors keep the CTA — clicking it preserves the
    // booking context (dates + guests) in the redirect so sign-in returns
    // them to this exact selection. The booking itself is never created
    // before authentication.
    if (isUnauthenticated) {
      const params = new URLSearchParams();
      if (checkIn) params.set("checkin", checkIn);
      if (checkOut) params.set("checkout", checkOut);
      params.set("adults", String(guests.adults));
      params.set("children", String(guests.children));
      params.set("infants", String(guests.infants));
      const bookingUrl = `${pathname}?${params.toString()}`;
      router.push(
        `/${locale}/auth/login?redirect=${encodeURIComponent(bookingUrl)}`
      );
      return;
    }

    if (!isAuthenticated || !isGuest) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        unit_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        message: message.trim() || undefined,
      });
      // Instant Book: availability was validated and the payment request
      // already exists — take the guest straight to checkout instead of a
      // "request sent" screen. No host-approval wait on this path.
      if (listing.instantBook) {
        router.push(`/${locale}/checkout/${booking.id}`);
        return;
      }
      setCreatedBooking(booking);
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

  if (success && createdBooking) {
    return (
      <BookingSuccess
        booking={createdBooking}
        instantBook={Boolean(listing.instantBook)}
        onClose={() => {
          setSuccess(false);
          setCreatedBooking(null);
          setCheckIn(toInputDate(tomorrow));
          setCheckOut(toInputDate(dayAfterTomorrow));
          setGuests({ adults: 1, children: 0, infants: 0 });
          setMessage("");
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

      {listing.instantBook && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t("instantBookBadge")}
        </p>
      )}

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
            href={`/${locale}/kyc`}
            className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            {t("kycRequiredCta")}
          </Link>
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div ref={datePickerRef}>
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
              onFocus={() => openCalendar("in")}
              onClick={() => openCalendar("in")}
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
              min={
                parseInputDate(checkIn)
                  ? toInputDate(addDays(parseInputDate(checkIn)!, 1))
                  : todayStr
              }
              onChange={(e) => setCheckOut(e.target.value)}
              onFocus={() => openCalendar("out")}
              onClick={() => openCalendar("out")}
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
            {!errors.checkOut && liveDateError && (
              <p className="mt-1 text-sm text-danger-600" role="alert">
                {liveDateError}
              </p>
            )}
            {!errors.checkOut && !liveDateError && nights > 0 && blockedDatesInRange.length > 0 && (
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

        {calendarOpen && (
          <AvailabilityCalendar
            unitId={listing.id}
            checkIn={checkIn}
            checkOut={checkOut}
            disabled={createBooking.isPending}
            selectingCheckOut={calendarTarget === "out"}
            onSelect={handleCalendarSelect}
          />
        )}
        </div>

        {listing.minNights > 1 && (
          <p className="text-xs text-neutral-500">
            {t("minNightsInfo", { min: listing.minNights })}
          </p>
        )}
        {listing.maxNights > 0 && (
          <p className="text-xs text-neutral-500">
            {t("maxNightsInfo", { max: listing.maxNights })}
          </p>
        )}

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
                <span className="text-neutral-600">{t("accommodation")}</span>
                <span className="font-medium text-brand-900">
                  {formatMoney(
                    quote?.accommodation_egp ?? 0,
                    listing.currency,
                    moneyLocale
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">{t("nights")}</span>
                <span className="font-medium text-brand-900">{nights}</span>
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
                <p className="mt-1 text-xs text-neutral-500">
                  {t("includesAllFees")}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">{t("selectDates")}</p>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t("messageToHost")}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={4000}
            className="input w-full text-sm"
            placeholder={t("messageToHostPlaceholder")}
          />
          <p className="mt-1 text-xs text-neutral-500">{t("messageToHostHint")}</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            (!canSubmit && !isUnauthenticated) || createBooking.isPending
          }
          className={cn(
            "w-full rounded-md px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2",
            !canSubmit && !isUnauthenticated
              ? "cursor-not-allowed bg-neutral-300 text-neutral-600"
              : "btn-primary"
          )}
          aria-busy={createBooking.isPending}
        >
          {createBooking.isPending
            ? t("submitting")
            : isUnauthenticated
              ? t("signInToBook")
              : listing.instantBook
                ? t("instantBook")
                : t("requestBooking")}
        </button>

        <p className="text-center text-xs text-neutral-500">
          {listing.instantBook ? t("chargedNow") : t("notChargedYet")}
        </p>

        {errors.submit && (
          <p className="text-sm text-danger-600" role="alert">
            {errors.submit}
          </p>
        )}
      </form>
    </section>
  );
}
