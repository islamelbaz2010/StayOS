"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
        English
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
        العربية
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

type NavGroup = {
  id: string;
  label: string;
  badge: number;
  items: MenuItemDef[];
};

type RootRow =
  | { kind: "group"; group: NavGroup }
  | { kind: "link"; item: MenuItemDef };

/** Chevron that points "forward" in both LTR and RTL layouts. */
function ForwardChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-neutral-400 rtl:-scale-x-100"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Arrow that points "back" in both LTR and RTL layouts. */
function BackChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-neutral-500 rtl:-scale-x-100"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function MenuLink({
  item,
  onNavigate,
}: {
  item: MenuItemDef;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-neutral-100 ${
        item.accent ? "text-accent-600" : "text-neutral-700"
      }`}
    >
      <span className="truncate">{item.label}</span>
      {item.count ? <CountBadge count={item.count} /> : null}
    </Link>
  );
}

/**
 * Two-level account menu: a compact root of navigation categories that
 * each open a smaller submenu of destinations, with a Back row. Keeps
 * the dropdown inside the viewport instead of one long scrolling list.
 */
function AccountMenuLevels({
  open,
  rows,
  backLabel,
  onNavigate,
  footer,
}: {
  open: boolean;
  rows: RootRow[];
  backLabel: string;
  onNavigate: () => void;
  footer?: ReactNode;
}) {
  const [level, setLevel] = useState<string | null>(null);

  // Return to the root level whenever the menu is closed and reopened.
  useEffect(() => {
    if (!open) setLevel(null);
  }, [open]);

  const active = level ? rows.find(
    (r) => r.kind === "group" && r.group.id === level
  ) : null;
  const activeGroup = active?.kind === "group" ? active.group : null;

  if (activeGroup) {
    return (
      <div className="py-1">
        <button
          type="button"
          onClick={() => setLevel(null)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          <BackChevron />
          {backLabel}
        </button>
        <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {activeGroup.label}
        </p>
        <div className="border-t border-neutral-100 pt-1">
          {activeGroup.items.map((item) => (
            <MenuLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="py-1">
      {rows.map((row) =>
        row.kind === "group" ? (
          <button
            key={row.group.id}
            type="button"
            onClick={() => setLevel(row.group.id)}
            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-start text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <span className="truncate">{row.group.label}</span>
            <span className="flex items-center gap-1.5">
              {row.group.badge > 0 && <CountBadge count={row.group.badge} />}
              <ForwardChevron />
            </span>
          </button>
        ) : (
          <MenuLink
            key={row.item.href}
            item={row.item}
            onNavigate={onNavigate}
          />
        )
      )}
      {footer}
    </div>
  );
}

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

  // FD-17 + hierarchical redesign: the root level shows only navigation
  // categories (Account / Hosting / Preferences / Help & Support); each
  // opens a compact submenu of its destinations — the menu stays inside
  // the viewport for every role instead of one long scrolling list.
  const accountMenuRows: RootRow[] = [];
  if (isAuthenticated) {
    const group = (
      id: string,
      label: string,
      items: MenuItemDef[]
    ): RootRow => ({
      kind: "group",
      group: {
        id,
        label,
        items,
        badge: items.reduce((sum, i) => sum + (i.count ?? 0), 0),
      },
    });
    const link = (item: MenuItemDef): RootRow => ({ kind: "link", item });

    const accountGroup = (marketplace: boolean): RootRow =>
      group(
        "account",
        t("account"),
        marketplace
          ? [
              { href: `/${locale}/profile`, label: t("profile") },
              { href: `/${locale}/bookings`, label: t("trips") },
              { href: `/${locale}/favorites`, label: t("favorites") },
              {
                href: `/${locale}/messages`,
                label: t("messages"),
                count: unreadCount,
              },
              {
                href: `/${locale}/notifications`,
                label: t("notifications"),
                count: notificationsUnread,
              },
            ]
          : // Ops accounts get the lean pair — admin surfaces live behind
            // the Admin Console entry instead.
            [
              { href: `/${locale}/profile`, label: t("profile") },
              { href: `/${locale}/bookings`, label: t("trips") },
            ]
      );

    const preferencesGroup = group("preferences", t("preferences"), [
      {
        href: `/${locale}/account-settings`,
        label: t("accountSettings"),
      },
      {
        href: `/${locale}/account-settings/language`,
        label: t("language"),
      },
    ]);

    const helpSupportGroup = group("help", t("helpSupport"), [
      { href: `/${locale}/help`, label: t("helpCenter") },
      { href: `/${locale}/support`, label: t("support") },
    ]);

    if (user?.role === "admin" || (user?.role === "staff" && hasAdminAccess)) {
      // Operational accounts: lean menu — admin surfaces behind one entry.
      // Trips stays reachable: any account can book under the capability
      // model, so booking/payment access must not dead-end here.
      accountMenuRows.push(
        accountGroup(false),
        link({
          href: `/${locale}/admin`,
          label: t("adminConsole"),
          count: adminPendingCount,
          accent: true,
        }),
        preferencesGroup,
        helpSupportGroup
      );
    } else {
      // Marketplace users (guest, host, staff w/o console, field staff):
      // trips/favorites are account-scoped — hosts book as users too.
      accountMenuRows.push(accountGroup(true));
      if (user?.role === "host") {
        accountMenuRows.push(
          group("hosting", t("hosting"), [
            { href: `/${locale}/host`, label: t("hostDashboard") },
            { href: `/${locale}/host/listings`, label: t("myListings") },
            {
              href: `/${locale}/host/bookings`,
              label: t("reservations"),
              count: hostPendingCount,
            },
            { href: `/${locale}/host/earnings`, label: t("earnings") },
            { href: `/${locale}/host/guide`, label: t("hostGuide") },
          ])
        );
      }
      if (user?.role === "guest") {
        accountMenuRows.push(
          link({
            href: `/${locale}/become-a-host`,
            label: t("becomeHost"),
            accent: true,
          })
        );
      }
      accountMenuRows.push(preferencesGroup, helpSupportGroup);
    }
  }

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
            <span dir="ltr" className="text-xl font-extrabold tracking-tight text-neutral-900">
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
                <span className="relative inline-flex shrink-0">
                  <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (
                        user.display_name ||
                        user.phone_number ||
                        user.email ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </span>
                  {badgeTotal > 0 && (
                    <span className="absolute -end-1 -top-1">
                      <CountBadge count={badgeTotal} />
                    </span>
                  )}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-neutral-700 lg:inline">
                  {user.display_name || user.phone_number || user.email}
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
                <AccountMenuLevels
                  open={accountOpen}
                  rows={accountMenuRows}
                  backLabel={t("back")}
                  onNavigate={() => setAccountOpen(false)}
                  footer={
                    <>
                      <div className="border-t border-neutral-100 py-1 sm:hidden">
                        <div className="px-3 py-1.5">
                          <LanguageSwitcher />
                        </div>
                      </div>
                      <div className="border-t border-neutral-100 py-1">
                        {signOutButton("w-full rounded-md px-3 py-2.5", () =>
                          setAccountOpen(false)
                        )}
                      </div>
                    </>
                  }
                />
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
            <AccountMenuLevels
              open={mobileOpen}
              rows={accountMenuRows}
              backLabel={t("back")}
              onNavigate={() => setMobileOpen(false)}
              footer={
                <>
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
                </>
              }
            />
          </div>
        </nav>
      )}
    </header>
  );
}
