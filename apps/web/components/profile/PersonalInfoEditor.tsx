"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useAccount,
  useUpdateAccount,
  type AccountUpdate,
} from "@/lib/queries/account";
import { getApiErrorMessage } from "@/lib/utils";

function mapToFields(m: Record<string, unknown> | null | undefined) {
  const v = (k: string) => String(m?.[k] ?? "");
  return {
    street: v("street"),
    city: v("city"),
    governorate: v("governorate"),
    postalCode: v("postal_code"),
    name: v("name"),
    phone: v("phone"),
    relationship: v("relationship"),
  };
}

/**
 * Canonical personal-information editor — Profile and Account Settings
 * both read the same user + account records, so edits here are the
 * single source of truth (never a duplicate copy).
 */
export function PersonalInfoEditor({ kycVerified }: { kycVerified: boolean }) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, refreshUser } = useAuth();
  const { data: account } = useAccount();
  const updateAccount = useUpdateAccount();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dob, setDob] = useState("");
  const [taxId, setTaxId] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [mail, setMail] = useState({ street: "", city: "", governorate: "", postalCode: "" });
  const [emergency, setEmergency] = useState({ name: "", phone: "", relationship: "" });

  const formatMap = (m: Record<string, unknown> | null | undefined) =>
    m ? Object.values(m).filter(Boolean).join(", ") : "";

  const addressStr = formatMap(account?.address as Record<string, unknown>);
  const mailingStr = formatMap(account?.mailing_address as Record<string, unknown>);
  const emergencyStr = account?.emergency_contact
    ? [
        account.emergency_contact.name,
        account.emergency_contact.relationship,
        account.emergency_contact.phone,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  function startEdit() {
    setDisplayName(user?.display_name ?? "");
    setLegalName(account?.legal_name ?? "");
    setDob(account?.date_of_birth ?? "");
    setTaxId(account?.tax_id ?? "");
    setStreet(String(account?.address?.street ?? ""));
    setCity(String(account?.address?.city ?? ""));
    setGovernorate(String(account?.address?.governorate ?? ""));
    const m = mapToFields(account?.mailing_address as Record<string, unknown>);
    setMail({ street: m.street, city: m.city, governorate: m.governorate, postalCode: m.postalCode });
    const e = mapToFields(account?.emergency_contact as Record<string, unknown>);
    setEmergency({ name: e.name, phone: e.phone, relationship: e.relationship });
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if ((displayName.trim() || null) !== (user?.display_name ?? null)) {
        await api.patch("/auth/me", {
          display_name: displayName.trim() || null,
        });
        await refreshUser();
      }
      const buildAddress = (
        s: string, c: string, g: string, postal?: string
      ) => {
        const out: Record<string, string> = {};
        if (s.trim()) out.street = s.trim();
        if (c.trim()) out.city = c.trim();
        if (g.trim()) out.governorate = g.trim();
        if (postal?.trim()) out.postal_code = postal.trim();
        return Object.keys(out).length ? out : null;
      };
      const emergencyContact =
        emergency.name.trim() || emergency.phone.trim() || emergency.relationship.trim()
          ? {
              ...(emergency.name.trim() && { name: emergency.name.trim() }),
              ...(emergency.phone.trim() && { phone: emergency.phone.trim() }),
              ...(emergency.relationship.trim() && {
                relationship: emergency.relationship.trim(),
              }),
            }
          : null;
      const payload: AccountUpdate = {
        date_of_birth: dob || null,
        tax_id: taxId.trim() || null,
        address: buildAddress(street, city, governorate),
        mailing_address: buildAddress(mail.street, mail.city, mail.governorate, mail.postalCode),
        emergency_contact: emergencyContact,
      };
      if (!kycVerified) payload.legal_name = legalName.trim() || null;
      await updateAccount.mutateAsync(payload);
      setEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err, tc("error")));
    } finally {
      setSaving(false);
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: t("displayName"), value: user?.display_name || t("notSet") },
    { label: t("legalName"), value: account?.legal_name || t("notSet") },
    { label: t("dateOfBirth"), value: account?.date_of_birth || t("notSet") },
    { label: t("email"), value: user?.email || t("notSet") },
    { label: t("phone"), value: user?.phone_number || t("notSet") },
    { label: t("address"), value: addressStr || t("notSet") },
    { label: t("mailingAddress"), value: mailingStr || t("notSet") },
    { label: t("emergencyContact"), value: emergencyStr || t("notSet") },
    { label: t("taxId"), value: account?.tax_id || t("notSet") },
  ];

  const textField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { disabled?: boolean; type?: string; hint?: string }
  ) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        <input
        type={opts?.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={255}
        disabled={opts?.disabled}
        className="input mt-1 w-full text-sm disabled:bg-neutral-100"
        />
      </label>
      {opts?.hint && (
        <p className="mt-1 text-xs text-neutral-500">{opts.hint}</p>
      )}
    </div>
  );

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-neutral-900">
          {t("personalInfo")}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="btn-secondary text-sm"
          >
            {t("edit")}
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-4 space-y-3"
        >
          {textField(t("displayName"), displayName, setDisplayName)}
          {textField(t("legalName"), legalName, setLegalName, {
            disabled: kycVerified,
            hint: kycVerified ? t("legalNameLocked") : undefined,
          })}
          {textField(t("dateOfBirth"), dob, setDob, { type: "date" })}
          {textField(t("taxId"), taxId, setTaxId)}

          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">
              {t("address")}
            </legend>
            <div className="mt-1 grid gap-3 sm:grid-cols-3">
              {textField(t("addressStreet"), street, setStreet)}
              {textField(t("addressCity"), city, setCity)}
              {textField(t("addressGovernorate"), governorate, setGovernorate)}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">
              {t("mailingAddress")}
            </legend>
            <div className="mt-1 grid gap-3 sm:grid-cols-4">
              {textField(t("addressStreet"), mail.street, (v) =>
                setMail((m) => ({ ...m, street: v }))
              )}
              {textField(t("addressCity"), mail.city, (v) =>
                setMail((m) => ({ ...m, city: v }))
              )}
              {textField(t("addressGovernorate"), mail.governorate, (v) =>
                setMail((m) => ({ ...m, governorate: v }))
              )}
              {textField(t("postalCode"), mail.postalCode, (v) =>
                setMail((m) => ({ ...m, postalCode: v }))
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">
              {t("emergencyContact")}
            </legend>
            <div className="mt-1 grid gap-3 sm:grid-cols-3">
              {textField(t("emergencyName"), emergency.name, (v) =>
                setEmergency((e) => ({ ...e, name: v }))
              )}
              {textField(t("emergencyPhone"), emergency.phone, (v) =>
                setEmergency((e) => ({ ...e, phone: v }))
              )}
              {textField(t("emergencyRelationship"), emergency.relationship, (v) =>
                setEmergency((e) => ({ ...e, relationship: v }))
              )}
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? tc("loading") : tc("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary text-sm"
            >
              {tc("cancel")}
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-sm text-neutral-500">{row.label}</dt>
              <dd className="text-end text-sm font-medium text-neutral-900">
                {row.value}
              </dd>
            </div>
          ))}
          <p className="text-xs text-neutral-500">{t("contactLocked")}</p>
          {kycVerified && (
            <p className="text-xs text-neutral-500">{t("legalNameLocked")}</p>
          )}
        </dl>
      )}
    </div>
  );
}
