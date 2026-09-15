"use client";

import { ReactNode } from "react";

import { useAuth } from "@/lib/auth/useAuth";
import { AdminLayout } from "./AdminLayout";
import { GuestLayout } from "./GuestLayout";
import { HostLayout } from "./HostLayout";

/**
 * Wraps shared pages (e.g. messages) in the layout matching the signed-in
 * user's role so sidebar/context navigation is preserved for every role.
 * Defaults to GuestLayout while auth state resolves or for guests.
 */
export function RoleAwareLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role === "host") {
    return <HostLayout>{children}</HostLayout>;
  }
  if (user?.role === "admin" || user?.role === "staff") {
    return <AdminLayout>{children}</AdminLayout>;
  }
  return <GuestLayout>{children}</GuestLayout>;
}
