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

/** Reference account-menu icons — quiet 20px line glyphs keyed by route. */
function MenuRowIcon({ href }: { href: string }) {
  const props = {
    className: "h-5 w-5 shrink-0 text-neutral-500",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };
  let d: string;
  if (href.includes("/favorites")) {
    d = "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z";
  } else if (href.includes("/bookings")) {
    d = "M16.5 6V4.5A2.25 2.25 0 0014.25 2.25h-4.5A2.25 2.25 0 007.5 4.5V6M4.5 9.75h15M6.75 21h10.5a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 7.5v11.25A2.25 2.25 0 006.75 21z";
  } else if (href.includes("/messages")) {
    d = "M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 018.5-8.5 8.38 8.38 0 018.5 8.5z";
  } else if (href.includes("/notifications")) {
    d = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
  } else if (href.includes("/account-settings/language")) {
    d = "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3.6 9h16.8M3.6 15h16.8";
  } else if (href.includes("/account-settings")) {
    d = "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75";
  } else if (href.includes("/help") || href.includes("/support")) {
    d = "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z";
  } else if (href.includes("/admin")) {
    d = "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z";
  } else if (href.includes("/host")) {
    d = "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75";
  } else if (href.includes("/profile")) {
    d = "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z";
  } else {
    d = "M9 5l7 7-7 7";
  }
  return (
    <svg {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const GROUP_ICONS: Record<string, string> = {
  account: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  hosting: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  preferences: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
  help: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
};

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
      className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold hover:bg-surface-soft ${
        item.accent ? "text-accent-600" : "text-neutral-800"
      }`}
    >
      <MenuRowIcon href={item.href} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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
          className="flex w-full items-center gap-2 px-5 py-2.5 text-start text-sm font-semibold text-neutral-700 hover:bg-surface-soft"
        >
          <BackChevron />
          {backLabel}
        </button>
        <p className="px-5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {activeGroup.label}
        </p>
        <div className="border-t border-neutral-100">
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
      {rows.map((row, i) =>
        row.kind === "group" ? (
          <div key={row.group.id} className={i > 0 ? "border-t border-neutral-100" : ""}>
            <button
              type="button"
              onClick={() => setLevel(row.group.id)}
              className="flex w-full items-center gap-3 px-5 py-3 text-start text-sm font-semibold text-neutral-800 hover:bg-surface-soft"
            >
              <svg className="h-5 w-5 shrink-0 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d={GROUP_ICONS[row.group.id] ?? GROUP_ICONS.account} />
              </svg>
              <span className="min-w-0 flex-1 truncate">{row.group.label}</span>
              <span className="flex items-center gap-1.5">
                {row.group.badge > 0 && <CountBadge count={row.group.badge} />}
                <ForwardChevron />
              </span>
            </button>
          </div>
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
  const [avatarError, setAvatarError] = useState(false);
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

  // The public header keeps the standalone Become-a-host CTA for visitors
  // and guests; hosts/staff reach hosting via the account menu instead.
  const showBecomeHost = !isAuthenticated || user?.role === "guest";

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
      // Guests get Become-a-host as the header pill — no duplicate inside
      // the account menu.
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
      className={`${extraClass} text-start text-sm font-medium text-neutral-700 hover:bg-surface-soft`}
    >
      {t("signOut")}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-150 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span dir="ltr" className="text-[22px] font-extrabold tracking-title-tight text-brand-900">
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
        {/* Center tabs — the reference nav pattern: quiet labels, active
            tab carries a 2px near-black underline. */}
        <nav className="absolute start-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex rtl:translate-x-1/2">
          {(() => {
            // Stays → the homepage browsing experience; Explore → the
            // search/discovery route. Intentionally distinct targets.
            const isStays = pathname === `/${locale}` || pathname === `/${locale}/`;
            const isExplore = pathname?.startsWith(`/${locale}/search`);
            const linkClass = (active: boolean) =>
              `relative py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:start-0 after:h-0.5 after:w-full after:rounded-full after:transition-colors ${
                active
                  ? "text-brand-900 after:bg-brand-900"
                  : "text-neutral-500 after:bg-transparent hover:text-brand-900"
              }`;
            return (
              <>
                <Link
                  href={`/${locale}`}
                  aria-current={isStays ? "page" : undefined}
                  className={linkClass(Boolean(isStays))}
                >
                  {t("stays")}
                </Link>
                <Link
                  href={`/${locale}/search`}
                  aria-current={isExplore ? "page" : undefined}
                  className={linkClass(Boolean(isExplore))}
                >
                  {t("explore")}
                </Link>
              </>
            );
          })()}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showBecomeHost && (
            <Link
              href={`/${locale}/become-a-host`}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-brand-900 transition hover:bg-surface-hover sm:inline-block"
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
                className="inline-flex items-center gap-2 rounded-full border border-neutral-150 py-1 pl-2 pr-1.5 text-sm text-neutral-700 shadow-sm transition hover:bg-surface-hover"
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
                    {user.avatar_url && !avatarError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt=""
                        onError={() => setAvatarError(true)}
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
                className={`absolute end-0 top-full z-50 mt-2 w-72 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-neutral-150 bg-white py-1.5 shadow-menu ${
                  accountOpen ? "" : "hidden"
                }`}
              >
                <div className="border-b border-neutral-100 px-5 py-3">
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
                        <div className="px-5 py-1.5">
                          <LanguageSwitcher />
                        </div>
                      </div>
                      <div className="border-t border-neutral-100">
                        {signOutButton("w-full px-5 py-3", () =>
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
              className="rounded-full px-4 py-2 text-sm font-medium text-brand-900 transition hover:bg-surface-hover"
            >
              {t("signIn")}
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="icon-btn md:hidden"
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
        <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-neutral-150 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href={`/${locale}`}
              aria-current={
                pathname === `/${locale}` || pathname === `/${locale}/`
                  ? "page"
                  : undefined
              }
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-surface-soft"
              onClick={() => setMobileOpen(false)}
            >
              {t("stays")}
            </Link>
            <Link
              href={`/${locale}/search`}
              aria-current={
                pathname?.startsWith(`/${locale}/search`) ? "page" : undefined
              }
              className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-surface-soft"
              onClick={() => setMobileOpen(false)}
            >
              {t("explore")}
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
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-surface-soft"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("becomeHost")}
                    </Link>
                  )}
                  {!isAuthenticated && (
                    <Link
                      href={`/${locale}/support`}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-surface-soft"
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
