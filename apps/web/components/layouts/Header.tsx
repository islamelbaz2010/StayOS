"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/useAuth";
import { useUnreadCount } from "@/lib/queries/messages";
import { useNotifications } from "@/lib/queries/notifications";
import { useHostBookings } from "@/lib/queries/bookings";
import { usePendingListings } from "@/lib/queries/hostListings";

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function LanguageSwitcher({ className }: { className?: string }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale) return;
    const segments = pathname.split("/");
    if (segments[1] === "ar" || segments[1] === "en") {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }
    router.push(segments.join("/"));
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={`rounded px-1.5 py-0.5 text-xs font-semibold transition ${
          locale === "en"
            ? "bg-accent-400 text-brand-900"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        EN
      </button>
      <span className="text-neutral-300">|</span>
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={`rounded px-1.5 py-0.5 text-xs font-semibold transition ${
          locale === "ar"
            ? "bg-accent-400 text-brand-900"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        ع
      </button>
    </div>
  );
}

type MenuItemDef = {
  href: string;
  label: string;
  count?: number;
  accent?: boolean;
};

type MenuEntry =
  | ({ kind: "link" } & MenuItemDef)
  | { kind: "section"; label: string };

export function Header() {
  const t = useTranslations("nav");
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Staff need at least one active permission grant before /admin renders
  // anything for them — without it the link leads to a dead-end 403.
  const staffPermissions = user?.staff_permissions ?? [];
  const hasAdminAccess =
    user?.role === "admin" ||
    (user?.role === "staff" && staffPermissions.length > 0);
  const canModerateListings =
    user?.role === "admin" ||
    (user?.role === "staff" && staffPermissions.includes("listings"));

  const { data: unreadData } = useUnreadCount({ enabled: isAuthenticated });
  const unreadCount = isAuthenticated ? (unreadData?.total_unread ?? 0) : 0;
  const { data: hostPending } = useHostBookings("pending", {
    enabled: isAuthenticated && user?.role === "host",
  });
  const hostPendingCount =
    isAuthenticated && user?.role === "host" ? (hostPending?.length ?? 0) : 0;
  const { data: pendingListings } = usePendingListings({
    enabled: isAuthenticated && canModerateListings,
  });
  const adminPendingCount = canModerateListings
    ? (pendingListings?.length ?? 0)
    : 0;
  const { data: notificationsData } = useNotifications({
    enabled: isAuthenticated,
  });
  const notificationsUnread = isAuthenticated
    ? (notificationsData?.unread_count ?? 0)
    : 0;
  const badgeTotal =
    unreadCount + hostPendingCount + adminPendingCount + notificationsUnread;

  // Close menus on navigation.
  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open so the menu — not the
  // page behind it — scrolls on small viewports.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Close the account menu on outside click / Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Anonymous visitors get the standalone Become-a-host CTA; authenticated
  // guests get it inside the account menu items instead.
  const showBecomeHost = !isAuthenticated;

  // FD-17: profile and all account-scoped destinations live in the account
  // menu — the top-level header stays compact for every role.
  const accountItems: MenuEntry[] = [];
  if (isAuthenticated) {
    const link = (item: MenuItemDef): MenuEntry => ({ kind: "link", ...item });
    const helpSupport: MenuEntry[] = [
      { kind: "section", label: t("helpSupport") },
      link({ href: `/${locale}/help`, label: t("helpCenter") }),
      link({ href: `/${locale}/support`, label: t("support") }),
    ];

    if (user?.role === "admin" || (user?.role === "staff" && hasAdminAccess)) {
      // Operational accounts get a lean menu — admin surfaces live behind
      // one entry; consumer booking links stay off the ops menu.
      accountItems.push(
        link({ href: `/${locale}/profile`, label: t("profile") }),
        link({
          href: `/${locale}/admin`,
          label: t("adminConsole"),
          count: adminPendingCount,
          accent: true,
        }),
        link({
          href: `/${locale}/account-settings`,
          label: t("accountSettings"),
        }),
        link({
          href: `/${locale}/account-settings/language`,
          label: t("language"),
        }),
        ...helpSupport
      );
    } else {
      // Marketplace users (guest, host, staff w/o console, field staff):
      // trips/favorites are account-scoped — hosts book as users too.
      accountItems.push(
        link({ href: `/${locale}/profile`, label: t("profile") }),
        link({ href: `/${locale}/bookings`, label: t("trips") }),
        link({ href: `/${locale}/favorites`, label: t("favorites") }),
        link({
          href: `/${locale}/messages`,
          label: t("messages"),
          count: unreadCount,
        }),
        link({
          href: `/${locale}/notifications`,
          label: t("notifications"),
          count: notificationsUnread,
        }),
        link({
          href: `/${locale}/account-settings`,
          label: t("accountSettings"),
        })
      );
      if (user?.role === "guest") {
        accountItems.push(
          link({
            href: `/${locale}/become-a-host`,
            label: t("becomeHost"),
            accent: true,
          })
        );
      }
      accountItems.push(
        link({
          href: `/${locale}/account-settings/language`,
          label: t("language"),
        })
      );
      if (user?.role === "host") {
        accountItems.push(
          { kind: "section", label: t("hosting") },
          link({
            href: `/${locale}/host`,
            label: t("hostDashboard"),
            count: hostPendingCount,
          }),
          link({ href: `/${locale}/host/listings`, label: t("myListings") }),
          link({ href: `/${locale}/host/earnings`, label: t("earnings") }),
          link({ href: `/${locale}/host/guide`, label: t("hostGuide") })
        );
      }
      accountItems.push(...helpSupport);
    }
  }

  const accountMenuItems = (onNavigate: () => void) =>
    accountItems.map((item) =>
      item.kind === "section" ? (
        <p
          key={`section-${item.label}`}
          className="px-3 pb-0.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400"
        >
          {item.label}
        </p>
      ) : (
        <Link
          key={item.href + item.label}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-neutral-100 ${
            item.accent ? "text-accent-600" : "text-neutral-700"
          }`}
        >
          {item.label}
          {item.count ? <CountBadge count={item.count} /> : null}
        </Link>
      )
    );

  const signOutButton = (extraClass: string, onNavigate: () => void) => (
    <button
      type="button"
      onClick={async () => {
        onNavigate();
        await logout();
        router.push(`/${locale}`);
      }}
      className={`${extraClass} text-start text-sm font-medium text-neutral-700 hover:bg-neutral-100`}
    >
      {t("signOut")}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Stay<span className="text-accent-500">OS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href={`/${locale}/search`}
              className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            >
              {t("search")}
            </Link>
            <Link
              href={`/${locale}/support`}
              className="text-sm font-medium text-neutral-700 hover:text-accent-600"
            >
              {t("support")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showBecomeHost && (
            <Link
              href={`/${locale}/become-a-host`}
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-accent-600 hover:bg-neutral-100 sm:inline-block"
            >
              {t("becomeHost")}
            </Link>
          )}
          <LanguageSwitcher className="hidden sm:flex" />
          {isLoading ? null : isAuthenticated && user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                aria-label={t("account")}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-2 pr-1.5 text-sm text-neutral-700 shadow-sm transition hover:shadow-md"
              >
                <svg
                  className="h-4 w-4 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {(user.display_name || user.phone_number || user.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                  {badgeTotal > 0 && (
                    <span className="absolute -end-1 -top-1">
                      <CountBadge count={badgeTotal} />
                    </span>
                  )}
                </span>
              </button>

              <div
                role="menu"
                className={`absolute end-0 top-full z-50 mt-2 w-60 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg ${
                  accountOpen ? "" : "hidden"
                }`}
              >
                <div className="border-b border-neutral-100 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-brand-900">
                    {user.display_name ||
                      user.phone_number ||
                      user.email ||
                      t("account")}
                  </p>
                </div>
                <div className="py-1">
                  {accountMenuItems(() => setAccountOpen(false))}
                </div>
                {showBecomeHost && (
                  <div className="border-t border-neutral-100 py-1">
                    <Link
                      href={`/${locale}/become-a-host`}
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-neutral-100"
                    >
                      {t("becomeHost")}
                    </Link>
                  </div>
                )}
                <div className="border-t border-neutral-100 py-1 sm:hidden">
                  <div className="px-3 py-1.5">
                    <LanguageSwitcher />
                  </div>
                </div>
                <div className="border-t border-neutral-100 py-1">
                  {signOutButton("w-full px-3 py-2.5", () =>
                    setAccountOpen(false)
                  )}
                </div>
              </div>
            </div>
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
        <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href={`/${locale}/search`}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}
            >
              {t("search")}
            </Link>
            {accountMenuItems(() => setMobileOpen(false))}
            {showBecomeHost && (
              <Link
                href={`/${locale}/become-a-host`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("becomeHost")}
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                href={`/${locale}/support`}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileOpen(false)}
              >
                {t("support")}
              </Link>
            )}
            <div className="px-3 py-2.5">
              <LanguageSwitcher />
            </div>
            {isAuthenticated &&
              signOutButton("mt-2 rounded-md px-3 py-2.5", () =>
                setMobileOpen(false)
              )}
          </div>
        </nav>
      )}
    </header>
  );
}
