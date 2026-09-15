"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  useCreateListing,
  useUpdateListing,
  useSubmitForReview,
  type HostListing,
  type ListingCreateInput,
  type ListingUpdateInput,
} from "@/lib/queries/hostListings";
import { LocationPicker } from "@/components/listings/LocationPicker";

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

const BED_TYPES = [
  "SINGLE",
  "DOUBLE",
  "QUEEN",
  "KING",
  "SOFA_BED",
  "BUNK_BED",
  "AIR_MATTRESS",
  "CRIB",
  "FLOOR_MATTRESS",
  "TODDLER_BED",
  "WATER_BED",
  "HAMMOCK",
];

const CANCELLATION_POLICIES = [
  { value: "FLEXIBLE", labelKey: "flexible" },
  { value: "MODERATE", labelKey: "moderate" },
  { value: "STRICT", labelKey: "strict" },
];

const COMMON_AMENITIES = [
  "wifi",
  "air_conditioning",
  "heating",
  "kitchen",
  "parking",
  "pool",
  "gym",
  "washer",
  "tv",
  "elevator",
];

// Must match app.listings.constants.AccessibilityFeature (DEC-019).
const ACCESSIBILITY_FEATURES = [
  { value: "STEP_FREE_ENTRANCE", labelKey: "stepFreeEntrance" },
  { value: "WIDE_ENTRANCE", labelKey: "wideEntrance" },
  { value: "ACCESSIBLE_PARKING", labelKey: "accessibleParking" },
  { value: "STEP_FREE_PATH", labelKey: "stepFreePath" },
  { value: "STEP_FREE_BEDROOM", labelKey: "stepFreeBedroom" },
  { value: "WIDE_BEDROOM", labelKey: "wideBedroom" },
  { value: "ACCESSIBLE_BATHROOM", labelKey: "accessibleBathroom" },
  { value: "WIDE_BATHROOM", labelKey: "wideBathroom" },
  { value: "SHOWER_GRAB_BAR", labelKey: "showerGrabBar" },
  { value: "TOILET_GRAB_BAR", labelKey: "toiletGrabBar" },
  { value: "STEP_FREE_SHOWER", labelKey: "stepFreeShower" },
  { value: "SHOWER_CHAIR", labelKey: "showerChair" },
  { value: "CEILING_HOIST", labelKey: "ceilingHoist" },
];

// Must match app.listings.constants.SelfCheckInMethod (DEC-019).
const SELF_CHECK_IN_METHODS = [
  { value: "LOCKBOX", labelKey: "lockbox" },
  { value: "SMART_LOCK", labelKey: "smartLock" },
  { value: "KEYPAD", labelKey: "keypad" },
  { value: "BUILDING_STAFF", labelKey: "buildingStaff" },
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
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const t = useTranslations("listingForm");
  const tc = useTranslations("common");
  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  const submitMutation = useSubmitForReview();

  const isEdit = Boolean(existingListing);
  // Submit-for-review is only valid for DRAFT, REJECTED, or UNLISTED
  // listings. LISTED/ARCHIVED listings are already published or retired
  // and the API rejects submit attempts with a validation error.
  const canSubmitForReview =
    !isEdit ||
    !existingListing?.status ||
    ["DRAFT", "REJECTED", "UNLISTED"].includes(existingListing.status);

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
    allows_pets: existingListing?.allows_pets ?? false,
    self_check_in: existingListing?.self_check_in ?? false,
    self_check_in_methods: existingListing?.self_check_in_methods ?? [],
    accessibility_features: existingListing?.accessibility_features ?? [],
    base_price_egp: existingListing?.base_price_egp ?? 500,
    cleaning_fee_egp: existingListing?.cleaning_fee_egp ?? 0,
    cancellation_policy: existingListing?.cancellation_policy ?? "FLEXIBLE",
    instant_book: existingListing?.instant_book ?? false,
    weekend_mult: existingListing?.weekend_mult ?? 1.0,
    peak_mult: existingListing?.peak_mult ?? 1.0,
    min_nights: existingListing?.min_nights ?? 1,
    max_nights: existingListing?.max_nights ?? 30,
    house_rules: existingListing?.house_rules ?? "",
    check_in_instructions: existingListing?.check_in_instructions ?? "",
    check_in_time: existingListing?.check_in_time ?? "",
    check_out_time: existingListing?.check_out_time ?? "",
    policies: existingListing?.policies ?? "",
    pre_arrival_info_release_hours: existingListing?.pre_arrival_info_release_hours ?? undefined,
    sleeping_arrangements: existingListing?.sleeping_arrangements ?? null,
    country: existingListing?.country ?? "Egypt",
    currency: existingListing?.currency ?? "EGP",
    is_draft: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosave] = useState<"idle" | "saving" | "saved">("idle");
  const formRef = useRef(form);
  const isDirtyRef = useRef(false);
  const createdIdRef = useRef<string | undefined>(undefined);

  formRef.current = form;

  const update = (field: keyof ListingCreateInput, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    isDirtyRef.current = true;
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

  const toggleAccessibility = (feature: string) => {
    const current = form.accessibility_features ?? [];
    if (current.includes(feature)) {
      update(
        "accessibility_features",
        current.filter((f) => f !== feature)
      );
    } else {
      update("accessibility_features", [...current, feature]);
    }
  };

  const toggleSelfCheckInMethod = (method: string) => {
    const current = form.self_check_in_methods ?? [];
    if (current.includes(method)) {
      update(
        "self_check_in_methods",
        current.filter((m) => m !== method)
      );
    } else {
      update("self_check_in_methods", [...current, method]);
    }
  };

  const validate = (forSubmit = false): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title_ar.trim()) errs.title_ar = t("errors.titleRequired");
    else if (form.title_ar.length > 255) errs.title_ar = t("errors.titleTooLong");
    if (!form.description_ar.trim())
      errs.description_ar = t("errors.descriptionRequired");
    else if (form.description_ar.length < 10)
      errs.description_ar = t("errors.descriptionTooShort");
    if (!form.governorate) errs.governorate = t("errors.governorateRequired");
    if (!form.city.trim()) errs.city = t("errors.cityRequired");
    if (form.base_price_egp < 100)
      errs.base_price_egp = t("errors.priceMin");
    if (form.max_guests < 1) errs.max_guests = t("errors.guestsMin");
    if (form.bedrooms < 0) errs.bedrooms = t("errors.bedroomsMin");
    if (form.bathrooms < 1) errs.bathrooms = t("errors.bathroomsMin");
    if (forSubmit && (!form.title_ar.trim() || !form.description_ar.trim())) {
      errs.submit = t("errors.fillRequiredFields");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildUpdatePayload = (): ListingUpdateInput => ({
    property_type: form.property_type,
    lat: form.lat,
    lng: form.lng,
    governorate: form.governorate,
    city: form.city,
    district: form.district || undefined,
    address: form.address || undefined,
    max_guests: form.max_guests,
    bedrooms: form.bedrooms,
    beds: form.beds,
    bathrooms: form.bathrooms,
    title_ar: form.title_ar,
    title_en: form.title_en || undefined,
    description_ar: form.description_ar,
    description_en: form.description_en || undefined,
    amenities: form.amenities,
    cultural_tags: form.cultural_tags,
    allows_pets: form.allows_pets,
    self_check_in: form.self_check_in,
    self_check_in_methods: form.self_check_in_methods,
    accessibility_features: form.accessibility_features,
    base_price_egp: form.base_price_egp,
    cleaning_fee_egp: form.cleaning_fee_egp,
    cancellation_policy: form.cancellation_policy,
    instant_book: form.instant_book,
    category: form.category,
    weekend_mult: form.weekend_mult,
    peak_mult: form.peak_mult,
    min_nights: form.min_nights,
    max_nights: form.max_nights,
    house_rules: form.house_rules || undefined,
    check_in_instructions: form.check_in_instructions || undefined,
    check_in_time: form.check_in_time || undefined,
    check_out_time: form.check_out_time || undefined,
    policies: form.policies || undefined,
    pre_arrival_info_release_hours: form.pre_arrival_info_release_hours ?? undefined,
    sleeping_arrangements: form.sleeping_arrangements || undefined,
    country: form.country,
    currency: form.currency,
  });

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      if (isEdit && unitId) {
        await updateMutation.mutateAsync({ unitId, payload: buildUpdatePayload() });
      } else {
        const created = await createMutation.mutateAsync({ ...form, is_draft: true });
        createdIdRef.current = created.id;
      }
      setIsDirty(false);
      isDirtyRef.current = false;
      setAutosave("saved");
      router.push(`/${locale}/host/listings`);
    } catch (err) {
      const detail = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setErrors({ submit: detail || t("errors.saveFailed") });
    }
  };

  const handleSubmitForReview = async () => {
    if (!validate(true)) return;
    try {
      let id = unitId ?? createdIdRef.current;
      if (!isEdit && !createdIdRef.current) {
        const created = await createMutation.mutateAsync({
          ...form,
          is_draft: true,
        });
        id = created.id;
        createdIdRef.current = created.id;
      } else if (isEdit && unitId) {
        await updateMutation.mutateAsync({ unitId, payload: buildUpdatePayload() });
      }
      if (id) {
        await submitMutation.mutateAsync(id);
      }
      setIsDirty(false);
      isDirtyRef.current = false;
      router.push(`/${locale}/host/listings`);
    } catch (err) {
      const detail = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setErrors({ submit: detail || t("errors.submitFailed") });
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending;

  const doAutosave = useCallback(async () => {
    if (!isDirtyRef.current) return;
    const current = formRef.current;
    if (!current.title_ar.trim() && !current.description_ar.trim()) return;
    setAutosave("saving");
    try {
      if (isEdit && unitId) {
        await updateMutation.mutateAsync({ unitId, payload: buildUpdatePayload() });
      } else if (createdIdRef.current) {
        await updateMutation.mutateAsync({
          unitId: createdIdRef.current,
          payload: buildUpdatePayload(),
        });
      } else {
        const created = await createMutation.mutateAsync({
          ...current,
          is_draft: true,
        });
        createdIdRef.current = created.id;
      }
      setIsDirty(false);
      isDirtyRef.current = false;
      setAutosave("saved");
    } catch {
      setAutosave("idle");
    }
  }, [isEdit, unitId, updateMutation, createMutation, t]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      void doAutosave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isDirty, doAutosave]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const inputClass = "input text-sm";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";
  const errorClass = "mt-1 text-xs text-danger-600";

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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

          <div className="sm:col-span-2">
            <LocationPicker
              lat={form.lat}
              lng={form.lng}
              address={form.address ?? ""}
              city={form.city}
              governorate={form.governorate}
              onLocationChange={(newLat, newLng) => {
                update("lat", newLat);
                update("lng", newLng);
              }}
            />
          </div>
        </div>
      </section>

      {/* Capacity */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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

      {/* Sleeping arrangements */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-1 text-lg font-semibold text-brand-900">
          {t("sleepingArrangements")}
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          {t("sleepingArrangementsHint")}
        </p>
        {(form.sleeping_arrangements ?? []).map((room, idx) => (
          <div key={idx} className="mb-3 rounded-lg border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">
                {t("bedroomLabel", { number: idx + 1 })}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = [...(form.sleeping_arrangements ?? [])];
                  next.splice(idx, 1);
                  update("sleeping_arrangements", next.length ? next : null);
                }}
                className="text-sm text-danger-600 hover:text-danger-700"
              >
                {t("removeBedroom")}
              </button>
            </div>
            {(room.beds ?? []).map((bed, bidx) => (
              <div key={bidx} className="mb-2 flex items-center gap-2">
                <select
                  value={bed.type}
                  onChange={(e) => {
                    const next = [...(form.sleeping_arrangements ?? [])];
                    next[idx] = {
                      ...next[idx],
                      beds: next[idx].beds.map((b, i) =>
                        i === bidx ? { ...b, type: e.target.value } : b
                      ),
                    };
                    update("sleeping_arrangements", next);
                  }}
                  className="input flex-1 text-sm"
                >
                  {BED_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {t(`bedType.${bt.toLowerCase()}`, { count: 1 })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={bed.count}
                  onChange={(e) => {
                    const next = [...(form.sleeping_arrangements ?? [])];
                    next[idx] = {
                      ...next[idx],
                      beds: next[idx].beds.map((b, i) =>
                        i === bidx
                          ? { ...b, count: parseInt(e.target.value) || 1 }
                          : b
                      ),
                    };
                    update("sleeping_arrangements", next);
                  }}
                  className="input w-20 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(form.sleeping_arrangements ?? [])];
                    next[idx] = {
                      ...next[idx],
                      beds: next[idx].beds.filter((_, i) => i !== bidx),
                    };
                    update("sleeping_arrangements", next);
                  }}
                  className="text-sm text-danger-600 hover:text-danger-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(form.sleeping_arrangements ?? [])];
                next[idx] = {
                  ...next[idx],
                  beds: [...next[idx].beds, { type: "QUEEN", count: 1 }],
                };
                update("sleeping_arrangements", next);
              }}
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              {t("addBed")}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const next = [...(form.sleeping_arrangements ?? []), { beds: [{ type: "QUEEN", count: 1 }] }];
            update("sleeping_arrangements", next);
          }}
          className="text-sm font-medium text-accent-600 hover:text-accent-700"
        >
          {t("addBedroom")}
        </button>
      </section>

      {/* Amenities */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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
                  className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                />
                <span className="text-neutral-700">
                  {t(`amenities.${amenity.toLowerCase()}`)}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Discovery attributes (DEC-019): pets, self check-in, accessibility */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          {t("sections.discovery")}
        </h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={form.allows_pets ?? false}
                onChange={(e) => update("allows_pets", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
              />
              <span className="text-neutral-700">{t("allowsPets")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={form.self_check_in ?? false}
                onChange={(e) => update("self_check_in", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
              />
              <span className="text-neutral-700">{t("selfCheckIn")}</span>
            </label>
          </div>

          {form.self_check_in && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                {t("selfCheckInMethods")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {SELF_CHECK_IN_METHODS.map((method) => {
                  const checked = (form.self_check_in_methods ?? []).includes(method.value);
                  return (
                    <label
                      key={method.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelfCheckInMethod(method.value)}
                        className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="text-neutral-700">
                        {t(`selfCheckInMethod.${method.labelKey}`)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">
              {t("accessibilityFeatures")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {ACCESSIBILITY_FEATURES.map((feature) => {
                const checked = (form.accessibility_features ?? []).includes(feature.value);
                return (
                  <label
                    key={feature.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAccessibility(feature.value)}
                      className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                    />
                    <span className="text-neutral-700">
                      {t(`accessibility.${feature.labelKey}`)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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

        <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
          <input
            type="checkbox"
            checked={form.instant_book ?? false}
            onChange={(e) => update("instant_book", e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
          />
          <span className="text-neutral-700">{t("instantBook")}</span>
          <span className="ms-auto text-xs text-neutral-500">
            {t("instantBookHint")}
          </span>
        </label>
      </section>

      {/* Rules */}
      <section className="rounded-card bg-surface-card p-5 sm:p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("checkInTime")}</label>
              <input
                type="time"
                value={form.check_in_time ?? ""}
                onChange={(e) => update("check_in_time", e.target.value)}
                className={inputClass}
                placeholder="14:00"
              />
            </div>
            <div>
              <label className={labelClass}>{t("checkOutTime")}</label>
              <input
                type="time"
                value={form.check_out_time ?? ""}
                onChange={(e) => update("check_out_time", e.target.value)}
                className={inputClass}
                placeholder="12:00"
              />
            </div>
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

          <div>
            <label className={labelClass}>{t("preArrivalInfoReleaseHours")}</label>
            <input
              type="number"
              min={0}
              max={168}
              value={form.pre_arrival_info_release_hours ?? ""}
              onChange={(e) =>
                update(
                  "pre_arrival_info_release_hours",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className={inputClass}
              placeholder={t("placeholders.preArrivalInfoReleaseHours")}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t("hints.preArrivalInfoReleaseHours")}
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          {autosaveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-500" />
              {t("autosaving")}
            </span>
          )}
          {autosaveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-success-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t("autosaved")}
            </span>
          )}
          {isDirty && autosaveStatus === "idle" && (
            <span className="text-warning-600">{t("unsavedChanges")}</span>
          )}
          {errors.submit && (
            <span className="text-danger-600">{errors.submit}</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {isLoading ? tc("loading") : isEdit ? t("saveChanges") : t("saveDraft")}
          </button>
          {canSubmitForReview && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isLoading}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isLoading ? tc("loading") : t("submitForReview")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
