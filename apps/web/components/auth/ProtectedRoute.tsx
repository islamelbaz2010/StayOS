"use client";

import { ReactNode, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const t = useTranslations("common");
  const locale = params?.locale ?? "ar";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/${locale}/auth/login?redirect=${redirect}`);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, locale, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-600">{t("loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
