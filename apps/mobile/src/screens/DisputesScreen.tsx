import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";

import { useCreateDispute, useDisputes } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { Empty, Field, ListRow, PrimaryButton, Section, StatusBadge } from "../components/UI";
import { LoadingSpinner } from "../components/States";
import type { RootStackParamList } from "../../App";
import type { Dispute } from "../lib/types";

type Route = RouteProp<RootStackParamList, "Disputes">;

const CATEGORIES = [
  "property_issue",
  "payment_issue",
  "safety_concern",
  "host_conduct",
  "guest_conduct",
  "other",
];

const STATUS_TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  resolved: "ok",
  open: "warn",
  in_review: "info",
  closed: "info",
};

export function DisputesScreen() {
  const { t, locale } = useLocale();
  const route = useRoute<Route>();
  const bookingId = route.params?.bookingId;
  const { data, isLoading } = useDisputes();
  const create = useCreateDispute();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [composing, setComposing] = useState(!!bookingId);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;

  const submit = async () => {
    if (!bookingId || !description.trim()) return;
    try {
      await create.mutateAsync({
        booking_id: bookingId,
        category,
        description: description.trim(),
      });
      setComposing(false);
      setDescription("");
      Alert.alert("", t("disputeSubmitted"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {bookingId && composing ? (
        <Section title={t("reportProblem")}>
          <Text style={styles.groupLabel}>{t("disputeCategory")}</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Text
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                {t(`dispute_${c}`)}
              </Text>
            ))}
          </View>
          <Field
            label={t("disputeDescription")}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder={t("disputeDescriptionPlaceholder")}
          />
          <PrimaryButton
            label={create.isPending ? t("loading") : t("submitDispute")}
            onPress={submit}
            disabled={create.isPending || !description.trim()}
          />
        </Section>
      ) : null}

      <Section title={t("myDisputes")}>
        {(data?.data ?? []).length === 0 ? (
          <Empty text={t("noDisputes")} />
        ) : (
          (data?.data ?? []).map((d: Dispute) => (
            <ListRow
              key={d.id}
              title={t(`dispute_${d.category}`)}
              subtitle={d.description}
              right={<StatusBadge label={d.status} tone={STATUS_TONE[d.status] ?? "info"} />}
            />
          ))
        )}
      </Section>
      {data && data.data.length > 0 && (
        <Text style={styles.footer}>
          {t("lastUpdated")}: {new Date(data.data[0].updated_at).toLocaleDateString(dateLocale)}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
  },
  footer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
