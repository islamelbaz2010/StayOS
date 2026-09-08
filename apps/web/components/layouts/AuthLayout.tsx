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
        <Link href={`/${locale}`} className="text-2xl font-bold tracking-tight">
          Stay<span className="text-accent-600">OS</span>
        </Link>
      </div>
      <div className="w-full max-w-md rounded-card bg-surface-card p-8 shadow-card">
        {children}
      </div>
    </div>
  );
}
