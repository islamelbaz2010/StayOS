"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useCmsPages, useCreateCmsPage } from "@/lib/queries/cms";
import { getApiErrorMessage } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-neutral-100 text-neutral-700",
  archived: "bg-amber-100 text-amber-800",
};

export default function AdminContentPage() {
  const { locale } = useParams<{ locale: string }>();
  const { data: pages, isPending, isError, refetch } = useCmsPages();
  const createMutation = useCreateCmsPage();

  const [showCreate, setShowCreate] = useState(false);
  const [slug, setSlug] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    try {
      const page = await createMutation.mutateAsync({
        slug: slug.trim(),
        title_en: titleEn.trim() || undefined,
        title_ar: titleAr.trim() || undefined,
      });
      setShowCreate(false);
      setSlug("");
      setTitleEn("");
      setTitleAr("");
      window.location.href = `/${locale}/admin/content/${page.id}`;
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create page"));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="mx-auto w-full max-w-[1600px] py-2">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                Content
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Marketing pages — draft, preview, publish. Changes appear on
                the public site only after publishing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New page
            </button>
          </div>

          {showCreate && (
            <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug (e.g. about)"
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Title (English)"
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="العنوان (العربية)"
                  dir="rtl"
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending || !slug.trim()}
                className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Create draft
              </button>
            </div>
          )}

          {isError && (
            <ErrorState onRetry={() => refetch()} />
          )}

          {isPending ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium text-neutral-600">
                      Page
                    </th>
                    <th className="px-4 py-3 text-start font-medium text-neutral-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-start font-medium text-neutral-600">
                      Version
                    </th>
                    <th className="px-4 py-3 text-start font-medium text-neutral-600">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(pages ?? []).map((page) => (
                    <tr key={page.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/${locale}/admin/content/${page.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          /{page.slug}
                        </Link>
                        <div className="text-xs text-neutral-500">
                          {page.title_en || page.title_ar || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[page.status] ?? ""}`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        v{page.version}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(pages ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-neutral-500"
                      >
                        No content pages yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
