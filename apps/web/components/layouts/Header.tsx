"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/useAuth";
import { useUnreadCount } from "@/lib/queries/messages";

function MessagesLink({
  className,
  onClick,
  enabled,
}: {
  className: string;
  onClick?: () => void;
  enabled: boolean;
}) {
  const t = useTranslations("nav");
  const { data } = useUnreadCount({ enabled });
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const count = data?.total_unread ?? 0;
  return (
    <Link
      href={`/${locale}/messages`}
      className={className}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1.5">
        {t("messages")}
        {count > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </Link>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        href={`/${locale}/search`}
        className="text-sm font-medium text-neutral-700 hover:text-accent-600"
        onClick={() => setMobileOpen(false)}
      >
        {t("search")}
      </Link>
      {isAuthenticated && user?.role === "guest" && (
        <>
          <Link
            href={`/${locale}/favorites`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("favorites")}
          </Link>
          <Link
            href={`/${locale}/bookings`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("trips")}
          </Link>
          <Link
            href={`/${locale}/kyc`}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
            onClick={() => setMobileOpen(false)}
          >
            {t("becomeHost")}
          </Link>
        </>
      )}
      {!isAuthenticated && (
        <Link
          href={`/${locale}/kyc`}
          className="text-sm font-medium text-accent-600 hover:text-accent-700"
          onClick={() => setMobileOpen(false)}
        >
          {t("becomeHost")}
        </Link>
      )}
      {isAuthenticated && (
        <Link
          href={`/${locale}/payments`}
          className="text-sm font-medium text-neutral-700 hover:text-accent-600"
          onClick={() => setMobileOpen(false)}
        >
          {t("payments")}
        </Link>
      )}
      {isAuthenticated && (
        <MessagesLink
          className="text-sm font-medium text-neutral-700 hover:text-accent-600"
          onClick={() => setMobileOpen(false)}
          enabled={isAuthenticated}
        />
      )}
      {isAuthenticated && (user?.role === "host" || user?.role === "admin") && (
        <Link
          href={`/${locale}/host`}
          className="text-sm font-medium text-neutral-700 hover:text-accent-600"
          onClick={() => setMobileOpen(false)}
        >
          {t("host")}
        </Link>
      )}
      {isAuthenticated && user?.role === "admin" && (
        <>
          <Link
            href={`/${locale}/admin/pending`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("admin")}
          </Link>
          <Link
            href={`/${locale}/admin/kyc`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("kycReview")}
          </Link>
          <Link
            href={`/${locale}/admin/import`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("bulkImport")}
          </Link>
          <Link
            href={`/${locale}/admin/payments`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("paymentQueue")}
          </Link>
          <Link
            href={`/${locale}/admin/bookings`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("operations")}
          </Link>
          <Link
            href={`/${locale}/admin/discovery`}
            className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("discovery")}
          </Link>
        </>
      )}
      {isAuthenticated && (
        <Link
          href={`/${locale}/profile`}
          className="text-sm font-medium text-neutral-700 hover:text-accent-600"
          onClick={() => setMobileOpen(false)}
        >
          {t("account")}
        </Link>
      )}
      <Link
        href={`/${locale}/support`}
        className="text-sm font-medium text-neutral-700 hover:text-accent-600"
        onClick={() => setMobileOpen(false)}
      >
        {t("support")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Stay<span className="text-accent-500">OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks}
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? null : isAuthenticated && user ? (
            <>
              <span className="hidden text-sm text-neutral-700 sm:inline">
                {user.display_name || user.phone_number || user.email || user.id}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push(`/${locale}`);
                }}
                className="hidden rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:inline-block"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {t("signIn")}
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
            aria-label={t("toggleMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href={`/${locale}/search`}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}
            >
              {t("search")}
            </Link>
            {isAuthenticated && user?.role === "guest" && (
              <>
                <Link
                  href={`/${locale}/favorites`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("favorites")}
                </Link>
                <Link
                  href={`/${locale}/bookings`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("trips")}
                </Link>
                <Link
                  href={`/${locale}/kyc`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("becomeHost")}
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link
                href={`/${locale}/kyc`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("becomeHost")}
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href={`/${locale}/payments`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("payments")}
              </Link>
            )}
            {isAuthenticated && (
              <MessagesLink
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
                enabled={isAuthenticated}
              />
            )}
            {isAuthenticated && (user?.role === "host" || user?.role === "admin") && (
              <Link
                href={`/${locale}/host`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("host")}
              </Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Link
                  href={`/${locale}/admin/pending`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("admin")}
                </Link>
                <Link
                  href={`/${locale}/admin/kyc`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("kycReview")}
                </Link>
                <Link
                  href={`/${locale}/admin/import`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("bulkImport")}
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                href={`/${locale}/profile`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("account")}
              </Link>
            )}
            <Link
              href={`/${locale}/support`}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}
            >
              {t("support")}
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={async () => {
                  setMobileOpen(false);
                  await logout();
                  router.push(`/${locale}`);
                }}
                className="mt-2 rounded-md px-3 py-2.5 text-start text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t("signOut")}
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
