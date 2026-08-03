"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  useCreateListing,
  useUpdateListing,
  useSubmitForReview,
  type HostListing,
  type ListingCreateInput,
  type ListingUpdateInput,
} from "@/lib/queries/hostListings";

const PROPERTY_TYPES = [
  { value: "APARTMENT", labelKey: "apartment" },
  { value: "VILLA", labelKey: "villa" },
  { value: "CHALET", labelKey: "chalet" },
  { value: "HOTEL_ROOM", labelKey: "hotelRoom" },
  { value: "RESORT_UNIT", labelKey: "resortUnit" },
  { value: "STUDIO", labelKey: "studio" },
];

const CATEGORIES = [
  { value: "ENTIRE_PLACE", labelKey: "entirePlace" },
  { value: "PRIVATE_ROOM", labelKey: "privateRoom" },
  { value: "SHARED_ROOM", labelKey: "sharedRoom" },
];

const CANCELLATION_POLICIES = [
  { value: "FLEXIBLE", labelKey: "flexible" },
  { value: "MODERATE", labelKey: "moderate" },
  { value: "STRICT", labelKey: "strict" },
];

const COMMON_AMENITIES = [
  "WIFI",
  "AIR_CONDITIONING",
  "HEATING",
  "KITCHEN",
  "PARKING",
  "POOL",
  "GYM",
  "WASHER",
  "TV",
  "ELEVATOR",
];

const EGYPT_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Luxor",
  "Aswan",
  "Red Sea",
  "South Sinai",
  "Matrouh",
  "Fayoum",
  "Port Said",
  "Suez",
  "Ismailia",
  "Dakahlia",
  "Beheira",
  "Sharqia",
  "Qalyubia",
  "Menoufia",
  "Gharbia",
  "Kafr El Sheikh",
  "Damietta",
];

interface ListingFormProps {
  existingListing?: HostListing | null;
  unitId?: string;
}

export function ListingForm({ existingListing, unitId }: ListingFormProps) {
  const router = useRouter();
  const t = useTranslations("listingForm");
  const tc = useTranslations("common");
  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  const submitMutation = useSubmitForReview();

  const isEdit = Boolean(existingListing);

  const [form, setForm] = useState<ListingCreateInput>({
    property_type: existingListing?.property_type ?? "APARTMENT",
    lat: existingListing?.lat ?? 30.0444,
    lng: existingListing?.lng ?? 31.2357,
    governorate: existingListing?.governorate ?? "",
    city: existingListing?.city ?? "",
    district: existingListing?.district ?? "",
    address: existingListing?.address ?? "",
    max_guests: existingListing?.max_guests ?? 2,
    bedrooms: existingListing?.bedrooms ?? 1,
    beds: existingListing?.beds ?? 1,
    bathrooms: existingListing?.bathrooms ?? 1,
    category: existingListing?.category ?? "ENTIRE_PLACE",
    title_ar: existingListing?.title_ar ?? "",
    title_en: existingListing?.title_en ?? "",
    description_ar: existingListing?.description_ar ?? "",
    description_en: existingListing?.description_en ?? "",
    amenities: existingListing?.amenities ?? [],
    cultural_tags: existingListing?.cultural_tags ?? [],
    base_price_egp: existingListing?.base_price_egp ?? 500,
    cleaning_fee_egp: existingListing?.cleaning_fee_egp ?? 0,
    cancellation_policy: existingListing?.cancellation_policy ?? "FLEXIBLE",
    weekend_mult: existingListing?.weekend_mult ?? 1.0,
    peak_mult: existingListing?.peak_mult ?? 1.0,
    min_nights: existingListing?.min_nights ?? 1,
    max_nights: existingListing?.max_nights ?? 30,
    house_rules: existingListing?.house_rules ?? "",
    check_in_instructions: existingListing?.check_in_instructions ?? "",
    policies: existingListing?.policies ?? "",
    country: existingListing?.country ?? "Egypt",
    currency: existingListing?.currency ?? "EGP",
    is_draft: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof ListingCreateInput, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = form.amenities ?? [];
    if (current.includes(amenity)) {
      update("amenities", current.filter((a) => a !== amenity));
    } else {
      update("amenities", [...current, amenity]);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title_ar.trim()) errs.title_ar = t("errors.titleRequired");
    if (!form.description_ar.trim())
      errs.description_ar = t("errors.descriptionRequired");
    if (!form.governorate) errs.governorate = t("errors.governorateRequired");
    if (!form.city.trim()) errs.city = t("errors.cityRequired");
    if (form.base_price_egp < 100)
      errs.base_price_egp = t("errors.priceMin");
    if (form.max_guests < 1) errs.max_guests = t("errors.guestsMin");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      if (isEdit && unitId) {
        const payload: ListingUpdateInput = {
          title_ar: form.title_ar,
          title_en: form.title_en || undefined,
          description_ar: form.description_ar,
          description_en: form.description_en || undefined,
          amenities: form.amenities,
          cultural_tags: form.cultural_tags,
          base_price_egp: form.base_price_egp,
          cleaning_fee_egp: form.cleaning_fee_egp,
          cancellation_policy: form.cancellation_policy,
          category: form.category,
          address: form.address || undefined,
          beds: form.beds,
          house_rules: form.house_rules || undefined,
          check_in_instructions: form.check_in_instructions || undefined,
          policies: form.policies || undefined,
        };
        await updateMutation.mutateAsync({ unitId, payload });
      } else {
        await createMutation.mutateAsync({ ...form, is_draft: true });
      }
      router.push("/host/listings");
    } catch {
      setErrors({ submit: t("errors.saveFailed") });
    }
  };

  const handleSubmitForReview = async () => {
    if (!validate()) return;
    try {
      let id = unitId;
      if (!isEdit) {
        const created = await createMutation.mutateAsync({
          ...form,
          is_draft: true,
        });
        id = created.id;
      } else if (unitId) {
        const payload: ListingUpdateInput = {
          title_ar: form.title_ar,
          title_en: form.title_en || undefined,
          description_ar: form.description_ar,
          description_en: form.description_en || undefined,
          amenities: form.amenities,
          cultural_tags: form.cultural_tags,
          base_price_egp: form.base_price_egp,
          cleaning_fee_egp: form.cleaning_fee_egp,
          cancellation_policy: form.cancellation_policy,
          category: form.category,
          address: form.address || undefined,
          beds: form.beds,
          house_rules: form.house_rules || undefined,
          check_in_instructions: form.check_in_instructions || undefined,
          policies: form.policies || undefined,
        };
        await updateMutation.mutateAsync({ unitId, payload });
      }
      if (id) {
        await submitMutation.mutateAsync(id);
      }
      router.push("/host/listings");
    } catch {
      setErrors({ submit: t("errors.submitFailed") });
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending;

  const inputClass =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";
  const errorClass = "mt-1 text-xs text-danger-600";

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.basic")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>{t("titleAr")}</label>
            <input
              type="text"
              value={form.title_ar}
              onChange={(e) => update("title_ar", e.target.value)}
              className={inputClass}
              placeholder={t("placeholders.titleAr")}
            />
            {errors.title_ar && (
              <p className={errorClass}>{errors.title_ar}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>{t("titleEn")}</label>
            <input
              type="text"
              value={form.title_en ?? ""}
              onChange={(e) => update("title_en", e.target.value)}
              className={inputClass}
              placeholder={t("placeholders.titleEn")}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>{t("descriptionAr")}</label>
            <textarea
              value={form.description_ar}
              onChange={(e) => update("description_ar", e.target.value)}
              rows={4}
              className={inputClass}
              placeholder={t("placeholders.descriptionAr")}
            />
            {errors.description_ar && (
              <p className={errorClass}>{errors.description_ar}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>{t("descriptionEn")}</label>
            <textarea
              value={form.description_en ?? ""}
              onChange={(e) => update("description_en", e.target.value)}
              rows={4}
              className={inputClass}
              placeholder={t("placeholders.descriptionEn")}
            />
          </div>

          <div>
            <label className={labelClass}>{t("propertyType")}</label>
            <select
              value={form.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              className={inputClass}
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {t(`propertyTypes.${pt.labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("category")}</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(`categories.${c.labelKey}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.location")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("country")}</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("governorate")}</label>
            <select
              value={form.governorate}
              onChange={(e) => update("governorate", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("placeholders.selectGovernorate")}</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.governorate && (
              <p className={errorClass}>{errors.governorate}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("city")}</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
              placeholder={t("placeholders.city")}
            />
            {errors.city && <p className={errorClass}>{errors.city}</p>}
          </div>

          <div>
            <label className={labelClass}>{t("district")}</label>
            <input
              type="text"
              value={form.district ?? ""}
              onChange={(e) => update("district", e.target.value)}
              className={inputClass}
              placeholder={t("placeholders.district")}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>{t("address")}</label>
            <input
              type="text"
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              className={inputClass}
              placeholder={t("placeholders.address")}
            />
          </div>

          <div>
            <label className={labelClass}>{t("latitude")}</label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => update("lat", parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("longitude")}</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => update("lng", parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Capacity */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.capacity")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>{t("maxGuests")}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.max_guests}
              onChange={(e) =>
                update("max_guests", parseInt(e.target.value) || 1)
              }
              className={inputClass}
            />
            {errors.max_guests && (
              <p className={errorClass}>{errors.max_guests}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("bedrooms")}</label>
            <input
              type="number"
              min={0}
              value={form.bedrooms}
              onChange={(e) =>
                update("bedrooms", parseInt(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("beds")}</label>
            <input
              type="number"
              min={0}
              value={form.beds ?? 1}
              onChange={(e) => update("beds", parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("bathrooms")}</label>
            <input
              type="number"
              min={1}
              value={form.bathrooms}
              onChange={(e) =>
                update("bathrooms", parseInt(e.target.value) || 1)
              }
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.amenities")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {COMMON_AMENITIES.map((amenity) => {
            const checked = (form.amenities ?? []).includes(amenity);
            return (
              <label
                key={amenity}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(amenity)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-neutral-700">
                  {t(`amenities.${amenity.toLowerCase()}`)}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.pricing")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>{t("basePrice")}</label>
            <div className="relative">
              <input
                type="number"
                min={100}
                value={form.base_price_egp}
                onChange={(e) =>
                  update("base_price_egp", parseInt(e.target.value) || 0)
                }
                className={inputClass}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                {t("egp")}
              </span>
            </div>
            {errors.base_price_egp && (
              <p className={errorClass}>{errors.base_price_egp}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("cleaningFee")}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={form.cleaning_fee_egp ?? 0}
                onChange={(e) =>
                  update("cleaning_fee_egp", parseInt(e.target.value) || 0)
                }
                className={inputClass}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                {t("egp")}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("cancellationPolicy")}</label>
            <select
              value={form.cancellation_policy}
              onChange={(e) => update("cancellation_policy", e.target.value)}
              className={inputClass}
            >
              {CANCELLATION_POLICIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(`cancellationPolicies.${p.labelKey}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          {t("sections.rules")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t("houseRules")}</label>
            <textarea
              value={form.house_rules ?? ""}
              onChange={(e) => update("house_rules", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder={t("placeholders.houseRules")}
            />
          </div>

          <div>
            <label className={labelClass}>{t("checkInInstructions")}</label>
            <textarea
              value={form.check_in_instructions ?? ""}
              onChange={(e) => update("check_in_instructions", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder={t("placeholders.checkInInstructions")}
            />
          </div>

          <div>
            <label className={labelClass}>{t("policies")}</label>
            <textarea
              value={form.policies ?? ""}
              onChange={(e) => update("policies", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder={t("placeholders.policies")}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {errors.submit && (
          <p className="text-sm text-danger-600">{errors.submit}</p>
        )}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isLoading}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isLoading ? tc("loading") : t("saveDraft")}
        </button>
        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={isLoading}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? tc("loading") : t("submitForReview")}
        </button>
      </div>
    </div>
  );
}
