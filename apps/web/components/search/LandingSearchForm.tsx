"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LandingSearchForm({ locale }: { locale: string }) {
  const t = useTranslations("search");
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("1");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedDestination = destination.trim();

    if (trimmedDestination) {
      params.set("q", trimmedDestination);
    }
    if (checkin) {
      params.set("checkin", checkin);
    }
    if (checkout) {
      params.set("checkout", checkout);
    }
    if (guests) {
      params.set("guests", guests);
    }

    const queryString = params.toString();
    const url = `/${locale}/search${queryString ? `?${queryString}` : ""}`;
    router.push(url);
  };

  return (
    <section className="bg-brand-600 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-white/90 md:text-xl">
            {t("heroSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 md:flex-row md:items-end"
            aria-label={t("title")}
          >
            <div className="flex-1">
              <label
                htmlFor="destination"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                {t("destination")}
              </label>
              <input
                id="destination"
                type="text"
                name="q"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("placeholder")}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                aria-required="false"
              />
            </div>

            <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="checkin"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("checkin")}
                </label>
                <input
                  id="checkin"
                  type="date"
                  name="checkin"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("checkout")}
                </label>
                <input
                  id="checkout"
                  type="date"
                  name="checkout"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="guests"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  {t("guests")}
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 px-8 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 md:w-auto"
            >
              {t("button")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
