import { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Header } from "./Header";

export function HostLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("hostNav");
  const navItems = [
    { label: t("dashboard"), href: "/host" },
    { label: t("properties"), href: "/host/listings" },
    { label: t("reservations"), href: "/host/bookings" },
    { label: t("kyc"), href: "/host/kyc" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-e border-neutral-200 bg-white md:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  );
}
