"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("error");
  const { locale = "ar" } = useParams<{ locale: string }>();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-neutral-200">404</p>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          {t("notFound")}
        </h1>
      </div>
      <Link
        href={`/${locale}`}
        className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
      >
        {t("goHome")}
      </Link>
    </div>
  );
}
