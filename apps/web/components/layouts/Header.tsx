"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/useAuth";

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
        className="text-sm font-medium text-neutral-700 hover:text-brand-600"
        onClick={() => setMobileOpen(false)}
      >
        {t("search")}
      </Link>
      {isAuthenticated && user?.role === "guest" && (
        <>
          <Link
            href={`/${locale}/favorites`}
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("favorites")}
          </Link>
          <Link
            href={`/${locale}/bookings`}
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("trips")}
          </Link>
          <Link
            href={`/${locale}/host/kyc`}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
            onClick={() => setMobileOpen(false)}
          >
            {t("becomeHost")}
          </Link>
        </>
      )}
      {!isAuthenticated && (
        <Link
          href={`/${locale}/host/kyc`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
          onClick={() => setMobileOpen(false)}
        >
          {t("becomeHost")}
        </Link>
      )}
      {isAuthenticated && (user?.role === "host" || user?.role === "admin") && (
        <Link
          href={`/${locale}/host`}
          className="text-sm font-medium text-neutral-700 hover:text-brand-600"
          onClick={() => setMobileOpen(false)}
        >
          {t("host")}
        </Link>
      )}
      {isAuthenticated && user?.role === "admin" && (
        <>
          <Link
            href={`/${locale}/admin/pending`}
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("admin")}
          </Link>
          <Link
            href={`/${locale}/admin/kyc`}
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("kycReview")}
          </Link>
          <Link
            href={`/${locale}/admin/import`}
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
            onClick={() => setMobileOpen(false)}
          >
            {t("bulkImport")}
          </Link>
        </>
      )}
      {isAuthenticated && (
        <Link
          href={`/${locale}/profile`}
          className="text-sm font-medium text-neutral-700 hover:text-brand-600"
          onClick={() => setMobileOpen(false)}
        >
          {t("account")}
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Stay<span className="text-brand-600">OS</span>
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
            aria-label="Toggle menu"
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
                  href={`/${locale}/host/kyc`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-neutral-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("becomeHost")}
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link
                href={`/${locale}/host/kyc`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("becomeHost")}
              </Link>
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
