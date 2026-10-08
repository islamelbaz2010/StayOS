"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import { useAccount, useUpdateAccount } from "@/lib/queries/account";
import { getApiErrorMessage } from "@/lib/utils";

export default function PaymentsSettingsPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const t = useTranslations("settings.paymentsPage");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const { data: account } = useAccount();
  const updateAccount = useUpdateAccount();
  const isHost = user?.role === "host";

  const [taxId, setTaxId] = useState("");
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  useEffect(() => {
    setTaxId(account?.tax_id ?? "");
  }, [account?.tax_id]);

  async function saveTaxId() {
    setTaxSaving(true);
    setTaxError(null);
    try {
      await updateAccount.mutateAsync({ tax_id: taxId.trim() || null });
    } catch (err) {
      setTaxError(getApiErrorMessage(err, tc("error")));
    } finally {
      setTaxSaving(false);
    }
  }

  const payoutRows: { label: string; value: string | null | undefined }[] = [
    { label: t("payoutMethod"), value: account?.payout_method },
    { label: t("payoutBank"), value: account?.payout_bank_name },
    { label: t("payoutAccount"), value: account?.payout_account_number },
    { label: t("payoutWallet"), value: account?.payout_wallet_msisdn },
    { label: t("payoutHolder"), value: account?.payout_holder_name },
  ];
  const hasPayout = payoutRows.some((r) => r.value);

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link
            href={`/${locale}/account-settings`}
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            ← {t("back")}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-brand-900">
            {t("title")}
          </h1>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("history")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t("historyBody")}
              </p>
              <Link
                href={`/${locale}/payments`}
                className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                {t("viewPayments")} →
              </Link>
            </div>

            {isHost && (
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-neutral-900">
                  {t("payouts")}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("payoutsBody")}
                </p>
                {hasPayout ? (
                  <dl className="mt-4 space-y-2">
                    {payoutRows
                      .filter((r) => r.value)
                      .map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between gap-4"
                        >
                          <dt className="text-sm text-neutral-500">
                            {row.label}
                          </dt>
                          <dd className="text-sm font-medium text-neutral-900">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-neutral-500">
                    {t("noPayout")}
                  </p>
                )}
                <Link
                  href={`/${locale}/host/profile`}
                  className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  {t("editPayouts")} →
                </Link>
              </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-neutral-900">
                {t("taxes")}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">{t("taxesBody")}</p>
              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-700">
                  {t("taxId")}
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    maxLength={64}
                    placeholder={t("notConfigured")}
                    className="input mt-1 w-full text-sm"
                  />
                </label>
              </div>
              {taxError && (
                <p className="mt-2 text-sm text-danger-600" role="alert">
                  {taxError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void saveTaxId()}
                disabled={taxSaving}
                className="btn-secondary mt-3 text-sm disabled:opacity-50"
              >
                {taxSaving ? tc("loading") : t("editTax")}
              </button>
            </div>
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
