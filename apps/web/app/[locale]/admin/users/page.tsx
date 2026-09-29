"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { useAdminUserAction, useAdminUsers } from "@/lib/queries/admin";
import { useAuth } from "@/lib/auth/useAuth";

type ActionKey = "suspend" | "reactivate" | "deactivate-hosting" | "restore-hosting";

export default function AdminUsersPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("adminUsers");
  const search = useSearchParams();
  const role = search.get("role") || undefined;
  const kycStatus = search.get("kyc_status") || undefined;
  const { data = [], isPending, isError } = useAdminUsers(role, kycStatus);
  const { user: me } = useAuth();
  const action = useAdminUserAction();
  const [error, setError] = useState<string | null>(null);

  function actionsFor(user: (typeof data)[number]): ActionKey[] {
    const actions: ActionKey[] = [];
    if (user.id === me?.id || user.role === "admin") return actions;
    if (user.is_active) actions.push("suspend");
    else actions.push("reactivate");
    if (user.role === "host") actions.push("deactivate-hosting");
    if (user.role === "guest" && user.kyc_status === "verified") {
      actions.push("restore-hosting");
    }
    return actions;
  }

  async function run(userId: string, key: ActionKey) {
    if (!window.confirm(t(`confirm.${key}`))) return;
    setError(null);
    try {
      await action.mutateAsync({ userId, action: key });
    } catch (e) {
      const message =
        (e as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message ?? t("actionError");
      setError(message);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-brand-900">{t("title")}</h1><p className="mt-1 text-sm text-neutral-500">{t("count", { count: data.length })}{role ? ` · ${role}` : ""}{kycStatus ? ` · KYC ${kycStatus}` : ""}</p></div><Link href={`/${locale}/admin`} className="text-sm font-semibold text-accent-600">{t("overview")}</Link></div>
          {error && <p className="mt-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700" role="alert">{error}</p>}
          {isPending ? <p className="py-12 text-center text-neutral-500">{t("loading")}</p> : isError ? <p className="py-12 text-center text-danger-600">{t("loadError")}</p> : (
            <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card"><table className="w-full text-sm"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3 text-start">{t("colUser")}</th><th className="px-4 py-3 text-start">{t("colContact")}</th><th className="px-4 py-3 text-start">{t("colRole")}</th><th className="px-4 py-3 text-start">{t("colKyc")}</th><th className="px-4 py-3 text-start">{t("colStatus")}</th><th className="px-4 py-3 text-start">{t("colActions")}</th></tr></thead><tbody className="divide-y divide-neutral-100">{data.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-semibold text-neutral-900">{user.display_name || "—"}</p><p className="font-mono text-xs text-neutral-400">{user.id.slice(0, 8)}</p></td><td className="px-4 py-3 text-neutral-600">{user.email || user.phone_number || "—"}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{user.kyc_status}</td><td className="px-4 py-3">{user.is_active ? t("active") : t("suspended")}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{actionsFor(user).map((key) => <button key={key} type="button" disabled={action.isPending} onClick={() => run(user.id, key)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${key === "suspend" || key === "deactivate-hosting" ? "bg-danger-50 text-danger-700 hover:bg-danger-100" : "bg-accent-50 text-accent-700 hover:bg-accent-100"}`}>{t(`actions.${key}`)}</button>)}</div></td></tr>)}</tbody></table>{data.length === 0 && <p className="p-8 text-center text-neutral-500">{t("empty")}</p>}</div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
