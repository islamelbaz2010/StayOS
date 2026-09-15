"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Header } from "./Header";
import { useHostToday } from "@/lib/queries/hostToday";

export function AdminLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("adminNav");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const navItems = [
    { label: t("pending"), href: `/${locale}/admin/pending` },
    { label: t("kyc"), href: `/${locale}/admin/kyc` },
    { label: t("payments"), href: `/${locale}/admin/payments` },
    { label: t("bookings"), href: `/${locale}/admin/bookings` },
    { label: t("discovery"), href: `/${locale}/admin/discovery` },
    { label: t("import"), href: `/${locale}/admin/import` },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-e border-neutral-200 bg-surface-card md:block">
          <div className="border-b border-neutral-200 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-600">
              {t("adminConsole")}
            </span>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-accent-100 text-accent-700"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6">
          <nav className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            <span className="whitespace-nowrap rounded-full bg-accent-100 px-3 py-1.5 text-xs font-bold uppercase text-accent-700">
              {t("adminConsole")}
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-900 text-white"
                      : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
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
