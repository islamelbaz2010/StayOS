import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostListingDetail, useUpdateListing } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { ListingUpdatePayload } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type EditorRoute = RouteProp<RootStackParamList, "HostListingEditor">;

const AMENITIES = [
  "WIFI", "AC", "KITCHEN", "PARKING", "POOL", "GYM",
  "WASHER", "TV", "HEATING", "ELEVATOR", "GARDEN", "SEA_VIEW",
];

const AMENITY_LABELS: Record<string, string> = {
  WIFI: "listingWifi",
  AC: "listingAc",
  KITCHEN: "listingKitchen",
  PARKING: "listingParking",
  POOL: "listingPool",
  GYM: "listingGym",
  WASHER: "listingWasher",
  TV: "listingTv",
  HEATING: "listingHeating",
  ELEVATOR: "listingElevator",
  GARDEN: "listingGarden",
  SEA_VIEW: "listingSeaView",
};

const CANCELLATION_POLICIES = ["FLEXIBLE", "MODERATE", "STRICT"];

export function HostListingEditorScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditorRoute>();
  const { unitId, section } = route.params;
  const { data: listing, isLoading, isError, refetch } = useHostListingDetail(unitId);
  const updateMut = useUpdateListing();

  const [form, setForm] = useState<ListingUpdatePayload>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (listing) {
      setForm({
        title_ar: listing.title_ar,
        title_en: listing.title_en,
        description_ar: listing.description_ar,
        description_en: listing.description_en,
        amenities: listing.amenities,
        cultural_tags: listing.cultural_tags,
        base_price_egp: listing.base_price_egp,
        cleaning_fee_egp: listing.cleaning_fee_egp,
        cancellation_policy: listing.cancellation_policy,
        category: listing.category,
        address: listing.address,
        beds: listing.beds,
        weekend_mult: listing.weekend_mult,
        peak_mult: listing.peak_mult,
        min_nights: listing.min_nights,
        max_nights: listing.max_nights,
        house_rules: listing.house_rules,
        check_in_instructions: listing.check_in_instructions,
        check_in_time: listing.check_in_time,
        check_out_time: listing.check_out_time,
        pre_arrival_info_release_hours: listing.pre_arrival_info_release_hours,
        policies: listing.policies,
        country: listing.country,
        currency: listing.currency,
      });
    }
  }, [listing]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !listing) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const canEdit = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin" ||
    listing.permission_scope === "full_access";

  const setField = <K extends keyof ListingUpdatePayload>(
    key: K,
    value: ListingUpdatePayload[K]
  ) => {
    setForm((prev: ListingUpdatePayload) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleAmenity = (amenity: string) => {
    const current = form.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a: string) => a !== amenity)
      : [...current, amenity];
    setField("amenities", next);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({ unitId, payload: form });
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  const sectionTitle = t(`listing${section.charAt(0).toUpperCase()}${section.slice(1)}`) || section;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        {!canEdit && (
          <Text style={styles.permissionWarning}>{t("noHostAccess")}</Text>
        )}
      </View>

      {section === "basics" && (
        <BasicsSection form={form} setField={setField} t={t} />
      )}
      {section === "capacity" && (
        <CapacitySection form={form} setField={setField} t={t} />
      )}
      {section === "amenities" && (
        <AmenitiesSection form={form} toggleAmenity={toggleAmenity} t={t} />
      )}
      {section === "location" && (
        <LocationSection form={form} setField={setField} t={t} />
      )}
      {section === "rules" && (
        <RulesSection form={form} setField={setField} t={t} />
      )}
      {section === "arrival" && (
        <ArrivalSection form={form} setField={setField} t={t} />
      )}
      {section === "pricing" && (
        <PricingSection form={form} setField={setField} t={t} />
      )}

      {canEdit && (
        <View style={styles.footer}>
          {saved && <Text style={styles.savedText}>{t("listingSaved")}</Text>}
          <Pressable
            style={[styles.saveButton, updateMut.isPending && styles.saveButtonDisabled]}
            disabled={updateMut.isPending}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {updateMut.isPending ? t("listingSaving") : t("listingSave")}
            </Text>
          </Pressable>
          {updateMut.isError && (
            <Text style={styles.errorText}>{t("listingSaveError")}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

type FormProps = {
  form: ListingUpdatePayload;
  setField: <K extends keyof ListingUpdatePayload>(key: K, value: ListingUpdatePayload[K]) => void;
  t: (key: string) => string;
};

function BasicsSection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingTitle")}>
        <TextInput
          style={styles.input}
          value={form.title_ar || ""}
          onChangeText={(v) => setField("title_ar", v)}
          placeholder={t("listingTitle")}
        />
      </Field>
      <Field label={t("listingTitleEn")}>
        <TextInput
          style={styles.input}
          value={form.title_en || ""}
          onChangeText={(v) => setField("title_en", v)}
          placeholder={t("listingTitleEn")}
        />
      </Field>
      <Field label={t("listingDescription")}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description_ar || ""}
          onChangeText={(v) => setField("description_ar", v)}
          placeholder={t("listingDescription")}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
      <Field label={t("listingDescriptionEn")}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description_en || ""}
          onChangeText={(v) => setField("description_en", v)}
          placeholder={t("listingDescriptionEn")}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
      <Field label={t("listingCategory")}>
        <View style={styles.chipRow}>
          {["entire_place", "private_room", "shared_room"].map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                form.category === cat && styles.chipSelected,
              ]}
              onPress={() => setField("category", cat)}
            >
              <Text style={[styles.chipText, form.category === cat && styles.chipTextSelected]}>
                {t(`listingCategory${cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
    </View>
  );
}

function CapacitySection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingBeds")}>
        <NumberInput
          value={form.beds ?? 0}
          onChange={(v) => setField("beds", v)}
        />
      </Field>
      <Text style={styles.fieldHint}>
        {t("listingMaxGuests")}, {t("listingBedrooms")}, {t("listingBathrooms")} —
        {" "}{t("listingPropertyType")}
      </Text>
    </View>
  );
}

function AmenitiesSection({
  form,
  toggleAmenity,
  t,
}: {
  form: ListingUpdatePayload;
  toggleAmenity: (a: string) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>{t("listingAmenitiesList")}</Text>
      <View style={styles.amenityGrid}>
        {AMENITIES.map((amenity) => {
          const selected = (form.amenities || []).includes(amenity);
          const labelKey = AMENITY_LABELS[amenity] || amenity;
          return (
            <Pressable
              key={amenity}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LocationSection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingAddress")}>
        <TextInput
          style={styles.input}
          value={form.address || ""}
          onChangeText={(v) => setField("address", v)}
          placeholder={t("listingAddress")}
        />
      </Field>
    </View>
  );
}

function RulesSection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingHouseRules")}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.house_rules || ""}
          onChangeText={(v) => setField("house_rules", v)}
          placeholder={t("listingHouseRules")}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
      <Field label={t("listingPolicies")}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.policies || ""}
          onChangeText={(v) => setField("policies", v)}
          placeholder={t("listingPolicies")}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
    </View>
  );
}

function ArrivalSection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingCheckInTime")}>
        <TextInput
          style={styles.input}
          value={form.check_in_time || ""}
          onChangeText={(v) => setField("check_in_time", v)}
          placeholder="14:00"
        />
      </Field>
      <Field label={t("listingCheckOutTime")}>
        <TextInput
          style={styles.input}
          value={form.check_out_time || ""}
          onChangeText={(v) => setField("check_out_time", v)}
          placeholder="12:00"
        />
      </Field>
      <Field label={t("listingCheckInInstructions")}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.check_in_instructions || ""}
          onChangeText={(v) => setField("check_in_instructions", v)}
          placeholder={t("listingCheckInInstructions")}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
      <Field label={t("listingPreArrivalHours")}>
        <NumberInput
          value={form.pre_arrival_info_release_hours ?? 0}
          onChange={(v) => setField("pre_arrival_info_release_hours", v)}
        />
      </Field>
    </View>
  );
}

function PricingSection({ form, setField, t }: FormProps) {
  return (
    <View style={styles.section}>
      <Field label={t("listingBasePrice")}>
        <NumberInput
          value={form.base_price_egp ?? 0}
          onChange={(v) => setField("base_price_egp", v)}
        />
      </Field>
      <Field label={t("listingCleaningFee")}>
        <NumberInput
          value={form.cleaning_fee_egp ?? 0}
          onChange={(v) => setField("cleaning_fee_egp", v)}
        />
      </Field>
      <Field label={t("listingWeekendMultiplier")}>
        <DecimalInput
          value={form.weekend_mult ?? 1.0}
          onChange={(v) => setField("weekend_mult", v)}
        />
      </Field>
      <Field label={t("listingPeakMultiplier")}>
        <DecimalInput
          value={form.peak_mult ?? 1.0}
          onChange={(v) => setField("peak_mult", v)}
        />
      </Field>
      <Field label={t("listingMinNights")}>
        <NumberInput
          value={form.min_nights ?? 1}
          onChange={(v) => setField("min_nights", v)}
        />
      </Field>
      <Field label={t("listingMaxNights")}>
        <NumberInput
          value={form.max_nights ?? 30}
          onChange={(v) => setField("max_nights", v)}
        />
      </Field>
      <Field label={t("listingCancellationPolicy")}>
        <View style={styles.chipRow}>
          {CANCELLATION_POLICIES.map((policy) => (
            <Pressable
              key={policy}
              style={[
                styles.chip,
                (form.cancellation_policy || "").toUpperCase() === policy && styles.chipSelected,
              ]}
              onPress={() => setField("cancellation_policy", policy.toLowerCase())}
            >
              <Text style={[styles.chipText, (form.cancellation_policy || "").toUpperCase() === policy && styles.chipTextSelected]}>
                {t(`listingCancellation${policy.charAt(0)}${policy.slice(1).toLowerCase()}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <TextInput
      style={styles.input}
      value={String(value)}
      keyboardType="numeric"
      onChangeText={(v) => onChange(Number(v) || 0)}
    />
  );
}

function DecimalInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <TextInput
      style={styles.input}
      value={String(value)}
      keyboardType="decimal-pad"
      onChangeText={(v) => onChange(Number(v) || 0)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  permissionWarning: {
    fontSize: fontSize.sm,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 100,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  amenityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  savedText: {
    fontSize: fontSize.sm,
    color: colors.success,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },
});
