"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/lib/auth/useAuth";

export function Footer() {
  const t = useTranslations("nav");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { user } = useAuth();

  const isOps =
    user?.role === "admin" ||
    user?.role === "staff" ||
    user?.role === "field_staff";
  const isHost = user?.role === "host";

  // Ops staff get an operations column instead of marketplace/guest
  // actions — internal accounts are never nudged toward "become a host".
  const workspaceLinks: { href: string; label: string }[] = isOps
    ? [
        { href: `/${locale}/admin`, label: t("admin") },
        { href: `/${locale}/admin/pending`, label: t("pendingListings") },
      ]
    : isHost
      ? [
          { href: `/${locale}/host`, label: t("host") },
          { href: `/${locale}/host/listings`, label: t("myListings") },
        ]
      : [{ href: `/${locale}/kyc`, label: t("becomeHost") }];

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">StayOS</p>
            <ul className="mt-4 space-y-2">
              {!isOps && (
                <li>
                  <Link
                    href={`/${locale}/search`}
                    className="text-sm text-neutral-500 hover:text-neutral-900"
                  >
                    {t("search")}
                  </Link>
                </li>
              )}
              {!isOps && user?.role === "guest" && (
                <li>
                  <Link
                    href={`/${locale}/bookings`}
                    className="text-sm text-neutral-500 hover:text-neutral-900"
                  >
                    {t("trips")}
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {isOps ? t("admin") : t("host")}
            </p>
            <ul className="mt-4 space-y-2">
              {workspaceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 hover:text-neutral-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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
              {user && (
                <li>
                  <Link
                    href={`/${locale}/messages`}
                    className="text-sm text-neutral-500 hover:text-neutral-900"
                  >
                    {t("messages")}
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("support")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={`/${locale}/support`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("support")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} StayOS. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
