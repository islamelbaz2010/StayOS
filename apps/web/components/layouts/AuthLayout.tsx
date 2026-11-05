"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useParams } from "next/navigation";

export function AuthLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="mb-8">
        <Link href={`/${locale}`} className="text-[22px] font-extrabold tracking-title-tight text-brand-900" dir="ltr">
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
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-neutral-150 bg-surface-card p-8">
        {children}
      </div>
    </div>
  );
}
