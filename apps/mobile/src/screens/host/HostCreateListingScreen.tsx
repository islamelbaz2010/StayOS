import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCreateListing } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import type { ListingCreatePayload } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "studio",
  "chalet",
  "room",
  "farm",
];

const CATEGORIES = [
  { value: "entire_place", labelKey: "listingCategoryEntirePlace" },
  { value: "private_room", labelKey: "listingCategoryPrivateRoom" },
  { value: "shared_room", labelKey: "listingCategorySharedRoom" },
];

export function HostCreateListingScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const createMut = useCreateListing();

  const [form, setForm] = useState({
    property_type: "apartment",
    lat: 30.0444,
    lng: 31.2357,
    governorate: "Cairo",
    city: "Cairo",
    district: "",
    address: "",
    max_guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    category: "entire_place",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    base_price_egp: 500,
    cleaning_fee_egp: 0,
    cancellation_policy: "flexible",
    min_nights: 1,
    max_nights: 30,
    country: "Egypt",
    currency: "EGP",
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.title_ar.trim()) {
      Alert.alert(t("listingSaveError"), t("listingTitle"));
      return;
    }
    if (!form.description_ar.trim()) {
      Alert.alert(t("listingSaveError"), t("listingDescription"));
      return;
    }

    const payload: ListingCreatePayload = {
      ...form,
      is_draft: true,
    };

    try {
      const result = await createMut.mutateAsync(payload);
      navigation.replace("HostListingDetail", { unitId: result.id });
    } catch {
      Alert.alert(t("listingCreateError"));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("listingCreateNew")}</Text>
        <Text style={styles.subtitle}>{t("listingBasics")}</Text>
      </View>

      <View style={styles.section}>
        <Field label={t("listingTitle")}>
          <TextInput
            style={styles.input}
            value={form.title_ar}
            onChangeText={(v) => setField("title_ar", v)}
            placeholder={t("listingTitle")}
          />
        </Field>
        <Field label={t("listingTitleEn")}>
          <TextInput
            style={styles.input}
            value={form.title_en}
            onChangeText={(v) => setField("title_en", v)}
            placeholder={t("listingTitleEn")}
          />
        </Field>
        <Field label={t("listingDescription")}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description_ar}
            onChangeText={(v) => setField("description_ar", v)}
            placeholder={t("listingDescription")}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingPropertyType")}</Text>
        <View style={styles.chipRow}>
          {PROPERTY_TYPES.map((pt) => (
            <Pressable
              key={pt}
              style={[styles.chip, form.property_type === pt && styles.chipSelected]}
              onPress={() => setField("property_type", pt)}
            >
              <Text style={[styles.chipText, form.property_type === pt && styles.chipTextSelected]}>
                {pt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingCategory")}</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              style={[styles.chip, form.category === cat.value && styles.chipSelected]}
              onPress={() => setField("category", cat.value)}
            >
              <Text style={[styles.chipText, form.category === cat.value && styles.chipTextSelected]}>
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingCapacity")}</Text>
        <View style={styles.capacityRow}>
          <CapacityField label={t("listingMaxGuests")} value={form.max_guests} onChange={(v) => setField("max_guests", v)} />
          <CapacityField label={t("listingBedrooms")} value={form.bedrooms} onChange={(v) => setField("bedrooms", v)} />
          <CapacityField label={t("listingBeds")} value={form.beds} onChange={(v) => setField("beds", v)} />
          <CapacityField label={t("listingBathrooms")} value={form.bathrooms} onChange={(v) => setField("bathrooms", v)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingLocation")}</Text>
        <Field label={t("listingGovernorate")}>
          <TextInput
            style={styles.input}
            value={form.governorate}
            onChangeText={(v) => setField("governorate", v)}
          />
        </Field>
        <Field label={t("listingCity")}>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={(v) => setField("city", v)}
          />
        </Field>
        <Field label={t("listingDistrict")}>
          <TextInput
            style={styles.input}
            value={form.district}
            onChangeText={(v) => setField("district", v)}
          />
        </Field>
        <Field label={t("listingAddress")}>
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(v) => setField("address", v)}
          />
        </Field>
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>{t("listingLatitude")}</Text>
            <TextInput
              style={styles.input}
              value={String(form.lat)}
              keyboardType="decimal-pad"
              onChangeText={(v) => setField("lat", Number(v) || 0)}
            />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>{t("listingLongitude")}</Text>
            <TextInput
              style={styles.input}
              value={String(form.lng)}
              keyboardType="decimal-pad"
              onChangeText={(v) => setField("lng", Number(v) || 0)}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingPricing")}</Text>
        <Field label={t("listingBasePrice")}>
          <TextInput
            style={styles.input}
            value={String(form.base_price_egp)}
            keyboardType="numeric"
            onChangeText={(v) => setField("base_price_egp", Number(v) || 0)}
          />
        </Field>
        <Field label={t("listingCleaningFee")}>
          <TextInput
            style={styles.input}
            value={String(form.cleaning_fee_egp)}
            keyboardType="numeric"
            onChangeText={(v) => setField("cleaning_fee_egp", Number(v) || 0)}
          />
        </Field>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.createButton, createMut.isPending && styles.createButtonDisabled]}
          disabled={createMut.isPending}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>
            {createMut.isPending ? t("listingCreating") : t("listingCreate")}
          </Text>
        </Pressable>
        {createMut.isError && (
          <Text style={styles.errorText}>{t("listingCreateError")}</Text>
        )}
      </View>
    </ScrollView>
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

function CapacityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.capacityItem}>
      <TextInput
        style={styles.capacityInput}
        value={String(value)}
        keyboardType="numeric"
        onChangeText={(v) => onChange(Number(v) || 0)}
      />
      <Text style={styles.capacityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
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
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formField: {
    flex: 1,
  },
  chipRow: {
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
  capacityRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  capacityItem: {
    alignItems: "center",
  },
  capacityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: "center",
  },
  capacityLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },
});
