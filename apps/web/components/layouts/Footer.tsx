"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("nav");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">StayOS</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={`/${locale}/search`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("search")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("host")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={`/${locale}/host/kyc`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("becomeHost")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("account")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={`/${locale}/profile`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("account")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} StayOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
