"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/useAuth";

export function Header() {
  const t = useTranslations("nav");
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Stay<span className="text-brand-600">OS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/search"
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
          >
            {t("search")}
          </Link>
          <Link
            href="/host"
            className="text-sm font-medium text-neutral-700 hover:text-brand-600"
          >
            {t("host")}
          </Link>
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
                  router.push("/");
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
