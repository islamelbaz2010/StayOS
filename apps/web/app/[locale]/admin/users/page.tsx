"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { useAdminUsers } from "@/lib/queries/admin";

export default function AdminUsersPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const search = useSearchParams();
  const role = search.get("role") || undefined;
  const kycStatus = search.get("kyc_status") || undefined;
  const { data = [], isPending, isError } = useAdminUsers(role, kycStatus);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-brand-900">Marketplace users</h1><p className="mt-1 text-sm text-neutral-500">{data.length} matching users{role ? ` · ${role}` : ""}{kycStatus ? ` · KYC ${kycStatus}` : ""}</p></div><Link href={`/${locale}/admin`} className="text-sm font-semibold text-accent-600">Marketplace overview</Link></div>
          {isPending ? <p className="py-12 text-center text-neutral-500">Loading…</p> : isError ? <p className="py-12 text-center text-danger-600">Could not load users.</p> : (
            <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card"><table className="w-full text-sm"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3 text-start">User</th><th className="px-4 py-3 text-start">Contact</th><th className="px-4 py-3 text-start">Role</th><th className="px-4 py-3 text-start">KYC</th><th className="px-4 py-3 text-start">Status</th></tr></thead><tbody className="divide-y divide-neutral-100">{data.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-semibold text-neutral-900">{user.display_name || "—"}</p><p className="font-mono text-xs text-neutral-400">{user.id.slice(0, 8)}</p></td><td className="px-4 py-3 text-neutral-600">{user.email || user.phone_number || "—"}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{user.kyc_status}</td><td className="px-4 py-3">{user.is_active ? "Active" : "Inactive"}</td></tr>)}</tbody></table>{data.length === 0 && <p className="p-8 text-center text-neutral-500">No matching users.</p>}</div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
