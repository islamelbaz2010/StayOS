"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Header } from "./Header";
import { useAuth } from "@/lib/auth/useAuth";
import { useHostToday } from "@/lib/queries/hostToday";
import { usePendingListings } from "@/lib/queries/hostListings";
import { usePendingKyc } from "@/lib/queries/kyc";
import { usePaymentQueue } from "@/lib/queries/payments";
import { useAdminDisputes } from "@/lib/queries/disputes";

export function AdminLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("adminNav");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const granted = new Set(user?.staff_permissions ?? []);

  const canListings = isAdmin || granted.has("listings");
  const canKyc = isAdmin || granted.has("kyc");
  const canPayments = isAdmin || granted.has("payments");
  const canDisputes = isAdmin || granted.has("disputes");

  const { data: pendingListings } = usePendingListings({ enabled: canListings });
  const { data: pendingKyc } = usePendingKyc({ enabled: canKyc });
  const { data: paymentQueue } = usePaymentQueue(undefined, { enabled: canPayments });
  const { data: openDisputes } = useAdminDisputes("open", { enabled: canDisputes });
  const badgeCounts: Record<string, number> = {
    pending: pendingListings?.length ?? 0,
    kyc: pendingKyc?.total ?? pendingKyc?.data?.length ?? 0,
    payments: paymentQueue?.length ?? 0,
    disputes: openDisputes?.total ?? openDisputes?.data?.length ?? 0,
  };

  // Staff only see the areas their account was granted — enforcement
  // stays server-side via staff permissions; nav hiding is UX only.
  const allItems = [
    { label: t("overview"), href: `/${locale}/admin`, perm: null, badgeKey: null },
    { label: t("pending"), href: `/${locale}/admin/pending`, perm: "listings", badgeKey: "pending" },
    { label: t("kyc"), href: `/${locale}/admin/kyc`, perm: "kyc", badgeKey: "kyc" },
    { label: t("payments"), href: `/${locale}/admin/payments`, perm: "payments", badgeKey: "payments" },
    { label: t("earnings"), href: `/${locale}/admin/earnings`, perm: "payments", badgeKey: null },
    { label: t("bookings"), href: `/${locale}/admin/bookings`, perm: "operations", badgeKey: null },
    { label: t("disputes"), href: `/${locale}/admin/disputes`, perm: "disputes", badgeKey: "disputes" },
    { label: t("discovery"), href: `/${locale}/admin/discovery`, perm: "discovery", badgeKey: null },
    { label: t("import"), href: `/${locale}/admin/import`, perm: "listings", badgeKey: null },
  ];
  const navItems = [
    ...(isStaff
      ? allItems.filter((i) => i.perm === null || granted.has(i.perm))
      : allItems),
    ...(isAdmin
      ? [{ label: t("staff"), href: `/${locale}/admin/staff`, perm: null, badgeKey: null }]
      : []),
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
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-accent-100 text-accent-700"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      {item.label}
                      {item.badgeKey != null && badgeCounts[item.badgeKey] > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold leading-none text-white">
                          {badgeCounts[item.badgeKey]}
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
            <span className="whitespace-nowrap rounded-full bg-accent-100 px-3 py-1.5 text-xs font-bold uppercase text-accent-700">
              {t("adminConsole")}
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-900 text-white"
                      : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                  {item.badgeKey != null && badgeCounts[item.badgeKey] > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white">
                      {badgeCounts[item.badgeKey]}
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
