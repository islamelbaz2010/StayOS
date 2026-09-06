"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { useHostListingDetail } from "@/lib/queries/hostListings";
import {
  useCoHosts,
  useInviteCoHost,
  useRemoveCoHost,
  useUpdateCoHost,
} from "@/lib/queries/coHosts";

const SCOPE_OPTIONS = [
  { value: "full_access", labelKey: "scopeFullAccess" },
  { value: "calendar_messaging", labelKey: "scopeCalendarMessaging" },
  { value: "calendar_only", labelKey: "scopeCalendarOnly" },
];

const SCOPE_LABELS: Record<string, string> = {
  full_access: "scopeFullAccess",
  calendar_messaging: "scopeCalendarMessaging",
  calendar_only: "scopeCalendarOnly",
};

export default function ListingCoHostsPage() {
  const t = useTranslations("coHosts");
  const tc = useTranslations("common");
  const th = useTranslations("hostListings");
  const params = useParams<{ locale: string; unitId: string }>();
  const locale = params?.locale ?? "ar";
  const unitId = params?.unitId ?? "";

  const { data: listing } = useHostListingDetail(unitId);
  const { data: coHosts, isLoading, isError, refetch } = useCoHosts(unitId);
  const invite = useInviteCoHost();
  const update = useUpdateCoHost();
  const remove = useRemoveCoHost();

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [scope, setScope] = useState("calendar_only");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner =
    listing?.permission_scope === "owner" || listing?.permission_scope === "admin";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    await invite.mutateAsync({
      unitId,
      payload: { co_host_user_id: userId.trim(), permission_scope: scope },
    });
    setUserId("");
    setScope("calendar_only");
    setShowForm(false);
  }

  function handleToggle(coHostId: string, isActive: boolean) {
    update.mutate({ unitId, coHostId, payload: { is_active: !isActive } });
  }

  function handleScopeChange(coHostId: string, permissionScope: string) {
    update.mutate({ unitId, coHostId, payload: { permission_scope: permissionScope } });
  }

  async function handleRemove(coHostId: string) {
    if (!confirm(t("removeConfirm"))) return;
    setRemovingId(coHostId);
    try {
      await remove.mutateAsync({ unitId, coHostId });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["host", "admin"]}>
      <HostLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/${locale}/host/listings`}
                className="text-sm text-brand-600 hover:underline"
              >
                ← {th("backToListings")}
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-neutral-900">
                {th("coHostsTitle")}
              </h1>
            </div>
            <Link
              href={`/${locale}/host/listings/${unitId}/edit`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {th("editListing")}
            </Link>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-neutral-500">{tc("loading")}</div>
          )}

          {isError && (
            <div className="rounded-xl bg-white p-8 text-center text-danger-600 shadow-card">
              {t("loadError")}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 font-medium text-brand-600 hover:underline"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-6">
              {isOwner && (
                <div className="rounded-xl bg-white p-6 shadow-card">
                  <button
                    type="button"
                    onClick={() => setShowForm((s) => !s)}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    {showForm ? t("hideInvite") : t("inviteCoHost")}
                  </button>

                  {showForm && (
                    <form onSubmit={handleInvite} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="co-host-user-id" className="block text-sm font-medium text-neutral-700">
                          {t("coHostUserId")}
                        </label>
                        <input
                          id="co-host-user-id"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder={t("coHostUserIdPlaceholder")}
                          required
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-96"
                        />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-neutral-700">{t("permissionScope")}</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {SCOPE_OPTIONS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setScope(s.value)}
                              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                scope === s.value
                                  ? "bg-brand-100 text-brand-800 ring-1 ring-brand-600"
                                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              }`}
                            >
                              {t(s.labelKey)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={invite.isPending}
                          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-neutral-400"
                        >
                          {invite.isPending ? tc("loading") : t("sendInvite")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                      {invite.isError && <p className="text-sm text-danger-600">{t("inviteError")}</p>}
                    </form>
                  )}
                </div>
              )}

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t("coHostsList")}</h2>
                {!coHosts || coHosts.length === 0 ? (
                  <p className="text-center text-neutral-500">{t("noCoHosts")}</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {coHosts.map((coHost) => (
                      <div key={coHost.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {coHost.co_host_display_name || coHost.co_host_user_id}
                          </p>
                          {coHost.co_host_phone && (
                            <p className="text-sm text-neutral-500">{coHost.co_host_phone}</p>
                          )}
                          <p className="text-xs text-neutral-400">{coHost.co_host_user_id}</p>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          {isOwner ? (
                            <>
                              <div className="flex items-center gap-2">
                                <select
                                  value={coHost.permission_scope}
                                  onChange={(e) => handleScopeChange(coHost.id, e.target.value)}
                                  className="rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-700 focus:border-brand-500 focus:outline-none"
                                >
                                  {SCOPE_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {t(s.labelKey)}
                                    </option>
                                  ))}
                                </select>
                                <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                                  <input
                                    type="checkbox"
                                    checked={coHost.is_active}
                                    onChange={() => handleToggle(coHost.id, coHost.is_active)}
                                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                  />
                                  {t("active")}
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemove(coHost.id)}
                                disabled={removingId === coHost.id}
                                className="text-sm font-medium text-danger-600 hover:text-danger-700 disabled:text-neutral-400"
                              >
                                {removingId === coHost.id ? tc("loading") : t("remove")}
                              </button>
                            </>
                          ) : (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                              {t(SCOPE_LABELS[coHost.permission_scope] ?? "scopeCalendarOnly")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </HostLayout>
    </ProtectedRoute>
  );
}
