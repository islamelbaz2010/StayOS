"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostAvailabilityCalendar } from "@/components/availability/HostAvailabilityCalendar";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListingDetailSkeleton } from "@/components/listings/ListingDetailSkeleton";
import { useListing } from "@/lib/queries/listings";

export default function HostAvailabilityPage() {
  const t = useTranslations("availability");
  const params = useParams<{ locale: string; unitId: string }>();
  const unitId = params?.unitId ?? "";

  const { data, isPending, isError, refetch } = useListing(unitId);

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <ListingDetailSkeleton />
          ) : (
            <article className="mx-auto max-w-4xl">
              <h1 className="text-2xl font-bold text-neutral-900">
                {t("title")} — {data.title}
              </h1>
              <p className="mt-2 text-neutral-600">
                {t("subtitle")}
              </p>

              <div className="mt-8">
                <HostAvailabilityCalendar unitId={unitId} />
              </div>
            </article>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
