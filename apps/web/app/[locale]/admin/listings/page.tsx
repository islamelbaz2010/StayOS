"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { useAdminListings } from "@/lib/queries/admin";

export default function AdminListingsPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const search = useSearchParams();
  const status = search.get("status") || undefined;
  const governorate = search.get("governorate") || undefined;
  const { data = [], isPending, isError } = useAdminListings(status, governorate);
  const title = governorate
    ? `Listings in ${governorate}`
    : status
      ? `${status.replaceAll("_", " ")} listings`
      : "All listings";

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-brand-900">{title}</h1><p className="mt-1 text-sm text-neutral-500">{data.length} matching listings</p></div>
            <Link href={`/${locale}/admin`} className="text-sm font-semibold text-accent-600">Marketplace overview</Link>
          </div>
          {isPending ? <p className="py-12 text-center text-neutral-500">Loading…</p> : isError ? <p className="py-12 text-center text-danger-600">Could not load listings.</p> : (
            <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card">
              <table className="w-full text-sm"><thead className="bg-neutral-50 text-start text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3 text-start">Listing</th><th className="px-4 py-3 text-start">Location</th><th className="px-4 py-3 text-start">Status</th><th className="px-4 py-3 text-start">Host</th></tr></thead><tbody className="divide-y divide-neutral-100">
                {data.map((listing) => <tr key={listing.id}><td className="px-4 py-3"><Link href={`/${locale}/host/listings/${listing.id}/edit`} className="font-semibold text-accent-700 hover:underline">{listing.title || listing.id.slice(0, 8)}</Link>{listing.has_pending_changes && <span className="ms-2 rounded bg-warning-100 px-2 py-0.5 text-xs text-warning-700">Pending edits</span>}</td><td className="px-4 py-3 text-neutral-600">{listing.governorate} · {listing.city}</td><td className="px-4 py-3">{listing.status}</td><td className="px-4 py-3 font-mono text-xs text-neutral-500">{listing.host_id.slice(0, 8)}</td></tr>)}
              </tbody></table>
              {data.length === 0 && <p className="p-8 text-center text-neutral-500">No matching listings.</p>}
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
