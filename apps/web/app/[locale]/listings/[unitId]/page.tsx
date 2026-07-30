"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { GuestLayout } from "@/components/layouts";
import { ListingDetailSkeleton } from "@/components/listings/ListingDetailSkeleton";
import { useListing } from "@/lib/queries/listings";
import { formatMoney } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export default function ListingDetailPage() {
  const t = useTranslations();
  const params = useParams<{ locale: string; unitId: string }>();
  const unitId = params?.unitId ?? "";

  const { data, isPending, isError, refetch } = useListing(unitId);

  return (
    <GuestLayout>
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isError ? (
          <div className="mt-8 rounded-xl bg-danger-50 p-6 text-center">
            <p className="text-danger-700">{t("common.error")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : isPending ? (
          <ListingDetailSkeleton />
        ) : (
          <article className="mx-auto max-w-4xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.coverImage ?? PLACEHOLDER_IMAGE}
                alt={data.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-neutral-900">
                  {data.title}
                </h1>

                <p className="mt-2 text-lg text-neutral-700">
                  {data.city}, {data.governorate}, {data.country}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-neutral-100 p-4">
                    <p className="text-sm font-medium text-neutral-900">
                      {t("listing.propertyType")}
                    </p>
                    <p className="mt-1 text-neutral-700">{data.propertyType}</p>
                  </div>

                  <div className="rounded-xl bg-neutral-100 p-4">
                    <p className="text-sm font-medium text-neutral-900">
                      {t("listing.maxGuests")}
                    </p>
                    <p className="mt-1 text-neutral-700">{data.maxGuests}</p>
                  </div>

                  <div className="rounded-xl bg-neutral-100 p-4">
                    <p className="text-sm font-medium text-neutral-900">
                      {t("listing.price")}
                    </p>
                    <p className="mt-1 text-brand-600">
                      {formatMoney(data.price, data.currency)}{" "}
                      <span className="text-sm text-neutral-700">
                        {t("listing.perNight")}
                      </span>
                    </p>
                  </div>
                </div>

                <section className="mt-8">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t("listing.details")}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-neutral-700">
                    {data.description}
                  </p>
                </section>

                {data.houseRules && (
                  <section className="mt-8">
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {t("listing.houseRules")}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap leading-relaxed text-neutral-700">
                      {data.houseRules}
                    </p>
                  </section>
                )}
              </div>

              <aside className="lg:col-span-1">
                <section className="rounded-xl bg-white p-6 shadow-card">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {t("listing.amenities")}
                  </h2>

                  {data.amenities.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {data.amenities.map((amenity) => (
                        <li
                          key={amenity}
                          className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
                        >
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-600">
                      {t("search.noResults")}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </article>
        )}
      </main>
    </GuestLayout>
  );
}
