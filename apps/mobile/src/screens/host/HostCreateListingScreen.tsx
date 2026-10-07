import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  useCreateListing,
  useLocationTree,
  type LocationGovernorate,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { OsmMap } from "../../components/OsmMap";
import type { ListingCreatePayload } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Same seed list as the web listing form — the canonical location tree is
// unioned on top so curated areas stay selectable in both surfaces.
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
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const createMut = useCreateListing();
  const { data: locationTree } = useLocationTree();
  const [geocoding, setGeocoding] = useState(false);
  const [picker, setPicker] = useState<{
    title: string;
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
  } | null>(null);

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

  const tree: LocationGovernorate[] = locationTree ?? [];
  const governorates = Array.from(
    new Set([...EGYPT_GOVERNORATES, ...tree.map((g) => g.name)])
  );
  const cities =
    tree.find((g) => g.name === form.governorate)?.cities ?? [];
  const areas = cities.find((c) => c.name === form.city)?.areas ?? [];
  const selectedArea = areas.find((a) => a.name_en === form.district);
  const districtLabel = selectedArea
    ? locale === "ar"
      ? selectedArea.name_ar
      : selectedArea.name_en
    : form.district;

  // Same Nominatim geocoding as the web LocationPicker — best-effort, the pin
  // stays draggable either way.
  const geocodeAddress = async () => {
    const query = [form.address, form.district, form.city, form.governorate, "Egypt"]
      .filter(Boolean)
      .join(", ");
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=eg`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = (await res.json()) as { lat: string; lon: string }[];
      const first = results[0];
      const lat = first ? parseFloat(first.lat) : NaN;
      const lng = first ? parseFloat(first.lon) : NaN;
      if (!isNaN(lat) && !isNaN(lng)) {
        setForm((prev) => ({ ...prev, lat, lng }));
      }
    } catch {
      // Host can still position the pin manually — same fallback as web.
    } finally {
      setGeocoding(false);
    }
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
          <PickerField
            value={form.governorate}
            placeholder={t("listingSelectGovernorate")}
            onPress={() =>
              setPicker({
                title: t("listingGovernorate"),
                options: governorates.map((g) => ({ value: g, label: g })),
                onSelect: (v) => {
                  setForm((prev) => ({
                    ...prev,
                    governorate: v,
                    city: "",
                    district: "",
                  }));
                },
              })
            }
          />
        </Field>
        <Field label={t("listingCity")}>
          {cities.length > 0 ? (
            <PickerField
              value={form.city}
              placeholder={t("listingSelectCity")}
              onPress={() =>
                setPicker({
                  title: t("listingCity"),
                  options: cities.map((c) => ({ value: c.name, label: c.name })),
                  onSelect: (v) => {
                    setForm((prev) => ({ ...prev, city: v, district: "" }));
                  },
                })
              }
            />
          ) : (
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(v) => setField("city", v)}
            />
          )}
        </Field>
        <Field label={t("listingDistrict")}>
          {areas.length > 0 ? (
            <PickerField
              value={districtLabel}
              placeholder={t("listingSelectDistrict")}
              onPress={() =>
                setPicker({
                  title: t("listingDistrict"),
                  options: areas.map((a) => ({
                    value: a.name_en,
                    label: locale === "ar" ? a.name_ar : a.name_en,
                  })),
                  onSelect: (v) => {
                    const area = areas.find((a) => a.name_en === v);
                    setForm((prev) => ({
                      ...prev,
                      district: v,
                      ...(area?.lat != null && area?.lng != null
                        ? { lat: area.lat, lng: area.lng }
                        : {}),
                    }));
                  },
                })
              }
            />
          ) : (
            <TextInput
              style={styles.input}
              value={form.district}
              onChangeText={(v) => setField("district", v)}
            />
          )}
        </Field>
        <Field label={t("listingAddress")}>
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(v) => setField("address", v)}
          />
        </Field>
        <Pressable
          style={styles.locateButton}
          onPress={geocodeAddress}
          disabled={geocoding}
        >
          {geocoding ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate-outline" size={16} color={colors.primary} />
          )}
          <Text style={styles.locateButtonText}>{t("listingLocateOnMap")}</Text>
        </Pressable>
        <View style={styles.mapWrap}>
          <OsmMap
            markers={[]}
            pin={{ lat: form.lat, lng: form.lng }}
            onPinMoved={(lat, lng) =>
              setForm((prev) => ({ ...prev, lat, lng }))
            }
          />
        </View>
        <Text style={styles.pinHint}>{t("listingPinHint")}</Text>
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

      <Modal
        visible={picker != null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPicker(null)} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{picker?.title}</Text>
            <Pressable onPress={() => setPicker(null)} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={picker?.options ?? []}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                style={styles.pickerOption}
                onPress={() => {
                  picker?.onSelect(item.value);
                  setPicker(null);
                }}
              >
                <Text style={styles.pickerOptionText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function PickerField({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={pickerStyles.field} onPress={onPress}>
      <Text
        style={[
          pickerStyles.fieldText,
          !value && pickerStyles.fieldPlaceholder,
        ]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const pickerStyles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  fieldText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  fieldPlaceholder: {
    color: colors.textTertiary,
  },
});

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
  mapWrap: {
    height: 220,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  pinHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.xs,
  },
  locateButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "60%",
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  pickerOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
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
