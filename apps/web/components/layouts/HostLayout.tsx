import { ReactNode } from "react";

import { Header } from "./Header";

export function HostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-e border-neutral-200 bg-white md:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {["Dashboard", "Properties", "Reservations", "Earnings", "Reviews"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href={`/host/${item.toLowerCase()}`}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  );
}
