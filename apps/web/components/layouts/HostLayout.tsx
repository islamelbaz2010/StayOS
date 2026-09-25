"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Header } from "./Header";
import { useHostToday } from "@/lib/queries/hostToday";

export function HostLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("hostNav");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { data: today } = useHostToday();
  const pendingCount = today?.summary?.pending_requests ?? 0;

  const navItems = [
    { label: t("dashboard"), href: `/${locale}/host`, badge: 0 },
    { label: t("properties"), href: `/${locale}/host/listings`, badge: 0 },
    { label: t("calendar"), href: `/${locale}/host/calendar`, badge: 0 },
    { label: t("reservations"), href: `/${locale}/host/bookings`, badge: pendingCount },
    { label: t("earnings"), href: `/${locale}/host/earnings`, badge: 0 },
    { label: t("messages"), href: `/${locale}/messages`, badge: 0 },
    { label: t("kyc"), href: `/${locale}/host/kyc`, badge: 0 },
    { label: t("profile"), href: `/${locale}/host/profile`, badge: 0 },
    { label: t("standards"), href: `/${locale}/host-standards`, badge: 0 },
    { label: t("help"), href: `/${locale}/help`, badge: 0 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-e border-neutral-200 bg-surface-card md:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href.endsWith("/messages") &&
                    pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-accent-100 text-accent-700"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6">
          <nav className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-900 text-white"
                      : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
