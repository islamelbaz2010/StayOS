"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { DiscoveryCandidate } from "@/lib/queries/discovery";

// Canonical StayOS taxonomy — mirrors PropertyType in src/app/listings/constants.py
const PROPERTY_TYPES = [
  { value: "APARTMENT", labelKey: "apartment" },
  { value: "VILLA", labelKey: "villa" },
  { value: "CHALET", labelKey: "chalet" },
  { value: "HOTEL_ROOM", labelKey: "hotelRoom" },
  { value: "RESORT_UNIT", labelKey: "resortUnit" },
  { value: "STUDIO", labelKey: "studio" },
] as const;

export interface ImportCandidatePayload {
  host_name?: string;
  host_phone?: string;
  host_email?: string;
  overrides?: Record<string, unknown>;
}

interface ImportCandidateModalProps {
  candidate: DiscoveryCandidate;
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: ImportCandidatePayload) => void;
}

export function ImportCandidateModal({
  candidate,
  isPending,
  error,
  onClose,
  onSubmit,
}: ImportCandidateModalProps) {
  const t = useTranslations("common");
  const td = useTranslations("adminDiscovery");
  const tl = useTranslations("listingForm");

  const discoveredType = PROPERTY_TYPES.some(
    (pt) => pt.value === candidate.property_type?.toUpperCase()
  )
    ? candidate.property_type!.toUpperCase()
    : "";
  const discoveredPrice =
    candidate.nightly_price != null && candidate.nightly_price >= 100;

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState(
    candidate.contact_type === "phone" ? candidate.contact_value ?? "" : ""
  );
  const [contactEmail, setContactEmail] = useState(
    candidate.contact_type === "email" ? candidate.contact_value ?? "" : ""
  );
  const [propertyType, setPropertyType] = useState(discoveredType);
  const [price, setPrice] = useState(
    discoveredPrice ? String(candidate.nightly_price) : ""
  );

  const enteredPrice = price.trim() !== "" ? Number(price) : null;
  const priceValid = discoveredPrice || (enteredPrice != null && enteredPrice >= 100);
  const canSubmit = propertyType !== "" && priceValid && !isPending;

  const handleConfirm = () => {
    const overrides: Record<string, unknown> = { property_type: propertyType };
    // Only send an override when the admin changed/supplied the value —
    // this keeps "discovered" vs "admin-entered" provenance distinguishable.
    if (enteredPrice != null && enteredPrice !== candidate.nightly_price) {
      overrides.price = enteredPrice;
    }
    onSubmit({
      host_name: contactName.trim() || undefined,
      host_phone: contactPhone.trim() || undefined,
      host_email: contactEmail.trim() || undefined,
      overrides,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-brand-900">{td("importTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-600">{td("importDescription")}</p>
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-sm font-medium text-neutral-700">
              {td("propertyName")}:{" "}
            </span>
            <span className="text-sm text-neutral-600">
              {candidate.title || td("untitled")}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              {td("propertyType")} *
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="input mt-1 text-sm"
              required
            >
              <option value="" disabled>
                {td("selectPropertyType")}
              </option>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {tl(`propertyTypes.${pt.labelKey}`)}
                </option>
              ))}
            </select>
            {propertyType === "" && (
              <p className="mt-1 text-xs text-warning-600">
                {td("propertyTypeRequired")}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              {td("hostName")}
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input mt-1 text-sm"
              placeholder={td("hostNamePlaceholder")}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              {td("hostPhone")}
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="input mt-1 text-sm"
              placeholder="+20..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              {td("hostEmail")}
            </label>
            <input
              type="text"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="input mt-1 text-sm"
              placeholder="owner@example.com"
            />
          </div>
          <p className="text-xs text-neutral-500">{td("contactNote")}</p>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              {td("nightlyPriceEgp")}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input mt-1 text-sm"
              placeholder={td("pricePlaceholder")}
              min={100}
            />
            {discoveredPrice ? (
              <p className="mt-1 text-xs text-neutral-500">
                {td("priceSourceDiscovered")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-warning-600">
                {td("priceSourceAdminEntered")}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {isPending ? td("importing") : td("confirmImport")}
          </button>
        </div>
      </div>
    </div>
  );
}
