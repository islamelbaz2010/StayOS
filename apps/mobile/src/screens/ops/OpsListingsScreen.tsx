import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useListingModeration, usePendingListings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  ListRow,
  PrimaryButton,
  Row,
  Section,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { PendingListing } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "https://web-amber-pi-98.vercel.app";

// Mirrors web admin/pending DIFFABLE_FIELDS — keys the diff table recognises.
const DIFFABLE_FIELDS = new Set([
  "title_ar", "title_en", "description_ar", "description_en",
  "property_type", "category", "governorate", "city", "district", "address",
  "lat", "lng", "max_guests", "bedrooms", "beds", "bathrooms",
  "amenities", "cultural_tags", "accessibility_features",
  "self_check_in", "self_check_in_methods", "allows_pets",
  "base_price_egp", "cleaning_fee_egp",
  "listing_discount_pct", "weekly_discount_pct", "monthly_discount_pct",
  "weekend_mult", "peak_mult", "min_nights", "max_nights",
  "cancellation_policy", "instant_book", "house_rules", "policies",
  "check_in_time", "check_out_time", "sleeping_arrangements", "cover_photo_id",
]);

function formatDiffValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function OpsListingsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, error, refetch } = usePendingListings();
  const action = useListingModeration();
  const [selected, setSelected] = useState<PendingListing | null>(null);
  const [reason, setReason] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const run = async (act: "approve" | "reject") => {
    if (!selected) return;
    try {
      await action.mutateAsync({
        unitId: selected.id,
        action: act,
        payload: act === "reject" ? { reason: reason.trim() || undefined } : {},
      });
      setSelected(null);
      setReason("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(dateLocale);
  };

  const statusLabel = (status: string) => {
    const key = `status_${status.toLowerCase()}`;
    const localized = t(key);
    return localized === key ? status : localized;
  };

  if (selected) {
    const pending = selected.pending_changes;
    const diffEntries = pending
      ? Object.entries({
          ...(pending.unit ?? {}),
          ...(pending.listing ?? {}),
          ...(pending.lat != null ? { lat: pending.lat } : {}),
          ...(pending.lng != null ? { lng: pending.lng } : {}),
        })
      : [];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          {selected.cover_image ? (
            <Image source={{ uri: selected.cover_image }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <Text style={styles.title}>{selected.title}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {selected.status === "LISTED" && selected.has_pending_changes
                  ? t("pendingEdit")
                  : statusLabel(selected.status)}
              </Text>
            </View>
          </View>
          <Row
            label={t("location")}
            value={`${selected.city}, ${selected.governorate}`}
          />
          <Row label={t("created")} value={formatDate(selected.created_at)} />
          {pending?.submitted_at ? (
            <Row label={t("submittedAt")} value={formatDate(pending.submitted_at)} />
          ) : null}
        </View>

        {diffEntries.length > 0 && (
          <Section title={t("reviewChanges")}>
            <View style={styles.diffHeader}>
              <Text style={[styles.diffCell, styles.diffFieldCol]}>{t("field")}</Text>
              <Text style={[styles.diffCell, styles.diffCol]}>{t("currentValue")}</Text>
              <Text style={[styles.diffCell, styles.diffCol]}>{t("proposedValue")}</Text>
            </View>
            {diffEntries.map(([fieldName, proposed]) => {
              const current = (selected as Record<string, unknown>)[fieldName];
              return (
                <View key={fieldName} style={styles.diffRow}>
                  <Text style={[styles.diffCell, styles.diffFieldCol, styles.diffField]}>
                    {fieldName}
                    {!DIFFABLE_FIELDS.has(fieldName) ? " *" : ""}
                  </Text>
                  <Text style={[styles.diffCell, styles.diffCol, styles.diffMuted]} numberOfLines={3}>
                    {formatDiffValue(current)}
                  </Text>
                  <Text style={[styles.diffCell, styles.diffCol]} numberOfLines={3}>
                    {formatDiffValue(proposed)}
                  </Text>
                </View>
              );
            })}
          </Section>
        )}

        {(selected.pending_photos?.length ?? 0) > 0 && (
          <Section title={t("pendingPhotos")}>
            <View style={styles.photoRow}>
              {selected.pending_photos.map((p) => (
                <View key={p.id} style={styles.photoWrap}>
                  <Image source={{ uri: p.url }} style={styles.photo} resizeMode="cover" />
                  <Text style={styles.photoLabel}>
                    {p.moderation_state === "pending_remove"
                      ? t("photoPendingRemove")
                      : t("photoPendingAdd")}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.linkButton}
              onPress={() => navigation.navigate("ListingDetail", { unitId: selected.id })}
              accessibilityRole="button"
            >
              <Ionicons name="open-outline" size={16} color={colors.accentText} />
              <Text style={styles.linkText}>{t("viewListing")}</Text>
            </Pressable>
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                Linking.openURL(`${WEB_URL}/${locale}/listings/${selected.id}`)
              }
              accessibilityRole="link"
            >
              <Ionicons name="globe-outline" size={16} color={colors.accentText} />
              <Text style={styles.linkText}>{t("viewOnWebsite")}</Text>
            </Pressable>
          </View>
          <Field label={t("rejectReason")} value={reason} onChangeText={setReason} />
          <View style={styles.btnRow}>
            <PrimaryButton
              label={t("approve")}
              onPress={() => run("approve")}
              disabled={action.isPending}
              style={styles.btn}
            />
            <PrimaryButton
              danger
              label={t("reject")}
              onPress={() => run("reject")}
              disabled={action.isPending || !reason.trim()}
              style={styles.btn}
            />
          </View>
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={`${t("pendingListings")} (${data?.length ?? 0})`}>
        {(data ?? []).length === 0 ? (
          <Empty text={t("queueEmpty")} />
        ) : (
          (data ?? []).map((l: PendingListing) => (
            <ListRow
              key={l.id}
              title={l.title}
              subtitle={`${l.city}, ${l.governorate}${l.has_pending_changes ? ` · ${t("pendingChanges")}` : ""}`}
              badge={l.status === "LISTED" && l.has_pending_changes ? t("pendingEdit") : statusLabel(l.status)}
              onPress={() => setSelected(l)}
            />
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: { flexDirection: "row", marginBottom: spacing.md },
  statusBadge: {
    backgroundColor: colors.warningSoft ?? "#FEF3C7",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: "#92400E",
  },
  diffHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  diffRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  diffCell: { fontSize: fontSize.xs },
  diffFieldCol: { width: "34%", paddingEnd: spacing.xs },
  diffCol: { width: "33%", paddingEnd: spacing.xs },
  diffField: { fontWeight: "600", color: colors.text },
  diffMuted: { color: colors.textSecondary },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoWrap: { width: 84 },
  photo: {
    width: 84,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  photoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.accentText,
  },
  btnRow: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
