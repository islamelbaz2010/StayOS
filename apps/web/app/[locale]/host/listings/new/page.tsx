"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ListingForm } from "@/components/listings/ListingForm";

export default function NewListingPage() {
  const t = useTranslations("listingForm");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  // Focused creation chrome per the listing-creation reference: brand
  // mark top-left, no global header or host sidebar competing with the
  // wizard — its own Questions?/Save & exit controls handle egress.
  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <div className="min-h-screen bg-surface-page">
        <header className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link
            href={`/${locale}/host/listings`}
            aria-label="MAKAZOH"
            className="flex items-center gap-2"
          >
            <span
              dir="ltr"
              className="text-[22px] font-extrabold tracking-title-tight text-brand-900"
            >
              MAKAZ
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="inline-block h-[1.15em] w-[0.85em] -translate-y-[0.05em] text-accent-500"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              H
            </span>
          </Link>
        </header>
        <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("createTitle")}
            </h1>
            <ListingForm />
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
