"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  STAFF_PERMISSIONS,
  useCreateStaff,
  useSetStaffPermissions,
  useStaffList,
  useUpdateStaff,
  type StaffMember,
} from "@/lib/queries/staff";
import { cn, getApiErrorMessage } from "@/lib/utils";

export default function AdminStaffPage() {
  const t = useTranslations("adminStaff");
  const tc = useTranslations("common");

  const { data: staff, isPending, isError, refetch } = useStaffList();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const permsMutation = useSetStaffPermissions();

  const [showCreate, setShowCreate] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createPerms, setCreatePerms] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const togglePerm = (
    list: string[],
    perm: string,
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]
    );
  };

  const handleCreate = async () => {
    setError(null);
    if (!/^\+[1-9]\d{1,14}$/.test(phone.trim())) {
      setError(t("invalidPhone"));
      return;
    }
    try {
      await createMutation.mutateAsync({
        phone_number: phone.trim(),
        display_name: name,
        email: email.trim() || undefined,
        permissions: createPerms,
      });
      setShowCreate(false);
      setPhone("");
      setName("");
      setEmail("");
      setCreatePerms([]);
    } catch (err) {
      setError(getApiErrorMessage(err, t("createFailed")));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary text-sm"
            >
              {t("addStaff")}
            </button>
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="card p-8 text-center text-neutral-600">
              {tc("loading")}
            </div>
          ) : !staff || staff.length === 0 ? (
            <div className="card p-12 text-center text-neutral-500">
              {t("empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-900">
                        {member.display_name ?? member.phone_number}
                        <span className="ms-2 rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          {member.role}
                        </span>
                        {!member.is_active && (
                          <span className="ms-2 rounded bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                            {t("inactive")}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {member.phone_number}
                        {member.email ? ` · ${member.email}` : ""}
                      </p>
                      {member.permissions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {member.permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700"
                            >
                              {t(`permission.${p}`)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {member.role === "staff" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(member);
                            setEditPerms(member.permissions);
                          }}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          {t("editPermissions")}
                        </button>
                        <button
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              user_id: member.id,
                              is_active: !member.is_active,
                            })
                          }
                          className={cn(
                            "px-3 py-1.5 text-xs",
                            member.is_active ? "btn-danger" : "btn-primary"
                          )}
                        >
                          {member.is_active ? t("deactivate") : t("activate")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create staff modal */}
          {showCreate && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowCreate(false)}
            >
              <div
                className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-brand-900">
                  {t("addStaff")}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreate();
                  }}
                  className="mt-4 space-y-3"
                >
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    required
                    className="input w-full text-sm"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    type="tel"
                    dir="ltr"
                    required
                    className="input w-full text-sm"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    dir="ltr"
                    className="input w-full text-sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      {t("permissions")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {STAFF_PERMISSIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            togglePerm(createPerms, p, setCreatePerms)
                          }
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition",
                            createPerms.includes(p)
                              ? "bg-accent-600 text-white"
                              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                          )}
                        >
                          {t(`permission.${p}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-danger-600" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      {tc("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createMutation.isPending || !phone.trim() || !name.trim()
                      }
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {createMutation.isPending ? tc("loading") : t("create")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit permissions modal */}
          {editTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setEditTarget(null)}
            >
              <div
                className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-brand-900">
                  {t("editPermissions")} —{" "}
                  {editTarget.display_name ?? editTarget.phone_number}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {STAFF_PERMISSIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePerm(editPerms, p, setEditPerms)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        editPerms.includes(p)
                          ? "bg-accent-600 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      )}
                    >
                      {t(`permission.${p}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {tc("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={permsMutation.isPending}
                    onClick={() =>
                      permsMutation.mutate(
                        { user_id: editTarget.id, permissions: editPerms },
                        { onSuccess: () => setEditTarget(null) }
                      )
                    }
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {tc("save")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
