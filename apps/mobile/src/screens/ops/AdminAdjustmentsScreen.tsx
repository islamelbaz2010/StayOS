import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useAdjustmentAction,
  useAdjustments,
  useCreateAdjustment,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  FilterChips,
  ListRow,
  PrimaryButton,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { Adjustment } from "../../lib/types";
import { formatMoney } from "../../lib/money";

const STATUS_FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "pending", en: "Pending", ar: "معلّقة" },
  { key: "approved", en: "Approved", ar: "مقبولة" },
  { key: "applied", en: "Applied", ar: "مطبّقة" },
  { key: "cancelled", en: "Cancelled", ar: "ملغاة" },
];

const ADJ_TYPES = ["host_credit", "host_debit", "guest_credit", "guest_debit"];

const ADJ_CATEGORIES = ["adjustment", "compensation", "promotion", "fee_waiver"];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  approved: "ok",
  applied: "ok",
  pending: "warn",
  rejected: "err",
  cancelled: "err",
};

export function AdminAdjustmentsScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useAdjustments({ status: status ?? undefined });
  const action = useAdjustmentAction();
  const create = useCreateAdjustment();

  const [creating, setCreating] = useState(false);
  const [adjType, setAdjType] = useState(ADJ_TYPES[0]);
  const [category, setCategory] = useState(ADJ_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [bookingId, setBookingId] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const run = async (adjustmentId: string, act: "decide" | "apply" | "cancel", approve = true) => {
    try {
      await action.mutateAsync({
        adjustmentId,
        action: act,
        payload: act === "decide" ? { approve } : {},
      });
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || !reason.trim()) {
      Alert.alert("", t("fillRequired"));
      return;
    }
    try {
      await create.mutateAsync({
        adjustment_type: adjType,
        category,
        amount_egp: amt,
        reason: reason.trim(),
        booking_id: bookingId.trim() || undefined,
      });
      setCreating(false);
      setAmount("");
      setReason("");
      setBookingId("");
      Alert.alert("", t("adjustmentCreated"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (creating) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={t("newAdjustment")}>
          <Text style={styles.groupLabel}>{t("type")}</Text>
          <View style={styles.chipRow}>
            {ADJ_TYPES.map((a) => (
              <Text
                key={a}
                style={[styles.chip, adjType === a && styles.chipActive]}
                onPress={() => setAdjType(a)}
              >
                {t(`adj_${a}`)}
              </Text>
            ))}
          </View>
          <Text style={styles.groupLabel}>{t("category")}</Text>
          <View style={styles.chipRow}>
            {ADJ_CATEGORIES.map((c) => (
              <Text
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                {t(`adjcat_${c}`)}
              </Text>
            ))}
          </View>
          <Field
            label={`${t("amount")} (EGP)`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Field label={t("reason")} value={reason} onChangeText={setReason} multiline />
          <Field
            label={t("bookingIdOptional")}
            value={bookingId}
            onChangeText={setBookingId}
          />
          <PrimaryButton
            label={create.isPending ? t("loading") : t("create")}
            onPress={submit}
            disabled={create.isPending}
          />
          <PrimaryButton secondary label={t("back")} onPress={() => setCreating(false)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={STATUS_FILTERS.map((f) => ({
            key: f.key,
            label: locale === "ar" ? f.ar : f.en,
          }))}
          value={status}
          onChange={setStatus}
        />
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Section>
            {(data ?? []).length === 0 ? (
              <Empty text={t("noAdjustments")} />
            ) : (
              (data ?? []).map((a: Adjustment) => (
                <View key={a.id}>
                  <ListRow
                    title={`${formatMoney(a.amount_egp, t("egp"))} · ${t(`adj_${a.adjustment_type}`)}`}
                    subtitle={`${a.category} · ${a.reason} · ${new Date(
                      a.created_at
                    ).toLocaleDateString(dateLocale)}`}
                    right={
                      <StatusBadge label={a.status} tone={TONE[a.status] ?? "info"} />
                    }
                  />
                  {a.status === "pending" && (
                    <View style={styles.actionRow}>
                      <PrimaryButton
                        secondary
                        label={t("approve")}
                        onPress={() => run(a.id, "decide", true)}
                        style={styles.miniBtn}
                      />
                      <PrimaryButton
                        secondary
                        label={t("reject")}
                        onPress={() => run(a.id, "decide", false)}
                        style={styles.miniBtn}
                      />
                      <PrimaryButton
                        danger
                        label={t("cancel")}
                        onPress={() => run(a.id, "cancel")}
                        style={styles.miniBtn}
                      />
                    </View>
                  )}
                  {a.status === "approved" && (
                    <View style={styles.actionRow}>
                      <PrimaryButton
                        secondary
                        label={t("apply")}
                        onPress={() => run(a.id, "apply")}
                        style={styles.miniBtn}
                      />
                    </View>
                  )}
                </View>
              ))
            )}
          </Section>
        </ScrollView>
      )}
      <View style={styles.footer}>
        <PrimaryButton label={t("newAdjustment")} onPress={() => setCreating(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  footer: { padding: spacing.lg, paddingTop: 0 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  miniBtn: { flex: 1, marginTop: 0, paddingVertical: spacing.xs },
});
