"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminIndexPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  useEffect(() => {
    router.replace(`/${locale}/admin/pending`);
  }, [router, locale]);

  return (
    <ProtectedRoute allowedRoles={["admin", "staff", "field_staff"]}>
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
        …
      </div>
    </ProtectedRoute>
  );
}
