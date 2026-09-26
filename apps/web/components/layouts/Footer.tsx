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

  // field_staff operate on /operations (mobile); they cannot open /admin —
  // ProtectedRoute there only allows admin/staff, so never link them to it.
  // Staff additionally need at least one active permission grant — without
  // it /admin returns 403 (backend _require_console_access).
  const staffPermissions = user?.staff_permissions ?? [];
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const hasAdminAccess =
    isAdmin || (isStaff && staffPermissions.length > 0);
  const isFieldOps = user?.role === "field_staff";
  const isInternal = hasAdminAccess || isStaff || isFieldOps;
  const isHost = user?.role === "host";
  const canModerateListings =
    isAdmin || (isStaff && staffPermissions.includes("listings"));

  // Ops staff get an operations column instead of marketplace/guest
  // actions — internal accounts are never nudged toward "become a host".
  const workspaceLinks: { href: string; label: string }[] = hasAdminAccess
    ? [
        { href: `/${locale}/admin`, label: t("admin") },
        ...(canModerateListings
          ? [{ href: `/${locale}/admin/pending`, label: t("pendingListings") }]
          : []),
      ]
    : isHost
      ? [
          { href: `/${locale}/host`, label: t("hostDashboard") },
          { href: `/${locale}/host/listings`, label: t("myListings") },
          { href: `/${locale}/host-standards`, label: t("hostStandards") },
        ]
      : isInternal
        ? []
        : [{ href: `/${locale}/kyc`, label: t("becomeHost") }];

  // Anonymous/guest users get the host-entry column; its heading must use the
  // same canonical label as the header link for /kyc ("Become a host"), not
  // the host-side "List your property" terminology.
  const workspaceHeading = hasAdminAccess
    ? t("admin")
    : isInternal
      ? t("account")
      : isHost
        ? t("hostDashboard")
        : t("becomeHost");

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
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
              {!isInternal && user?.role === "guest" && (
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
          {workspaceLinks.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {workspaceHeading}
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
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("account")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={user ? `/${locale}/profile` : `/${locale}/auth/login`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {user ? t("account") : t("signIn")}
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
              <li>
                <Link
                  href={`/${locale}/help`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/p/privacy`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/p/terms`}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {t("terms")}
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
