"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
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
    listing?.permission_scope === "owner" ||
    listing?.permission_scope === "admin";

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
    update.mutate({
      unitId,
      coHostId,
      payload: { permission_scope: permissionScope },
    });
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
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                <svg
                  className="h-4 w-4 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                {th("backToListings")}
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">
                {th("coHostsTitle")}
              </h1>
            </div>
            <Link
              href={`/${locale}/host/listings/${unitId}/edit`}
              className="btn-secondary text-sm"
            >
              {th("editListing")}
            </Link>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-neutral-500">
              {tc("loading")}
            </div>
          )}

          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading && !isError && (
            <div className="space-y-6">
              {isOwner && (
                <div className="card p-5 sm:p-6">
                  <button
                    type="button"
                    onClick={() => setShowForm((s) => !s)}
                    className="btn-primary text-sm"
                  >
                    {showForm ? t("hideInvite") : t("inviteCoHost")}
                  </button>

                  {showForm && (
                    <form onSubmit={handleInvite} className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="co-host-user-id"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          {t("coHostUserId")}
                        </label>
                        <input
                          id="co-host-user-id"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder={t("coHostUserIdPlaceholder")}
                          required
                          className="input mt-1 text-sm sm:w-96"
                        />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-neutral-700">
                          {t("permissionScope")}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {SCOPE_OPTIONS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setScope(s.value)}
                              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                scope === s.value
                                  ? "bg-accent-100 text-accent-700 ring-1 ring-accent-500"
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
                          className="btn-primary text-sm"
                        >
                          {invite.isPending ? tc("loading") : t("sendInvite")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="btn-secondary text-sm"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                      {invite.isError && (
                        <p className="text-sm text-danger-600">
                          {t("inviteError")}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-brand-900">
                  {t("coHostsList")}
                </h2>
                {!coHosts || coHosts.length === 0 ? (
                  <p className="text-center text-neutral-500">{t("noCoHosts")}</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {coHosts.map((coHost) => (
                      <div
                        key={coHost.id}
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-brand-900">
                            {coHost.co_host_display_name || coHost.co_host_user_id}
                          </p>
                          {coHost.co_host_phone && (
                            <p className="text-sm text-neutral-500">
                              {coHost.co_host_phone}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400">
                            {coHost.co_host_user_id}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          {isOwner ? (
                            <>
                              <div className="flex items-center gap-2">
                                <select
                                  value={coHost.permission_scope}
                                  onChange={(e) =>
                                    handleScopeChange(coHost.id, e.target.value)
                                  }
                                  className="input py-1.5 text-sm"
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
                                    onChange={() =>
                                      handleToggle(coHost.id, coHost.is_active)
                                    }
                                    className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
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
                                {removingId === coHost.id
                                  ? tc("loading")
                                  : t("remove")}
                              </button>
                            </>
                          ) : (
                            <span className="badge-neutral">
                              {t(
                                SCOPE_LABELS[coHost.permission_scope] ??
                                  "scopeCalendarOnly"
                              )}
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
