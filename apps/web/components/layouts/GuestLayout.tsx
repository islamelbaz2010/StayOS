import { ReactNode } from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";

export function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
