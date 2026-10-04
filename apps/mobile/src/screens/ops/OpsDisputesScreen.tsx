import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { useAdminDisputes, useDisputeAdminUpdate } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  FilterChips,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { Dispute } from "../../lib/types";

const FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "open", en: "Open", ar: "مفتوح" },
  { key: "in_review", en: "In review", ar: "قيد المراجعة" },
  { key: "resolved", en: "Resolved", ar: "تم الحل" },
];

const NEXT_STATUSES = ["in_review", "resolved", "closed"];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  open: "warn",
  in_review: "info",
  resolved: "ok",
  closed: "info",
};

export function OpsDisputesScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>("open");
  const { data, isLoading, error, refetch } = useAdminDisputes(status ?? undefined);
  const update = useDisputeAdminUpdate();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [notes, setNotes] = useState("");
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] = useState(NEXT_STATUSES[0]);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const save = async () => {
    if (!selected) return;
    try {
      await update.mutateAsync({
        disputeId: selected.id,
        status: nextStatus,
        admin_notes: notes.trim() || undefined,
        reply: reply.trim() || undefined,
      });
      setSelected(null);
      setNotes("");
      setReply("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={t(`dispute_${selected.category}`)}>
          <Row label={t("status")} value={selected.status} />
          <Row label={t("reportedBy")} value={selected.reporter_name} />
          <Row label={t("reporterRole")} value={selected.reporter_role} />
          <Row
            label={t("created")}
            value={new Date(selected.created_at).toLocaleString(dateLocale)}
          />
        </Section>
        <Section title={t("disputeDescription")}>
          <Field label="" value={selected.description} editable={false} multiline />
        </Section>
        <Section title={t("resolution")}>
          <Field label={t("adminNotes")} value={notes} onChangeText={setNotes} multiline />
          <Field
            label={t("replyToReporter")}
            value={reply}
            onChangeText={setReply}
            multiline
          />
          <View style={styles.chipRow}>
            {NEXT_STATUSES.map((s) => (
              <StatusBadge
                key={s}
                label={s}
                tone={nextStatus === s ? "ok" : "info"}
              />
            ))}
          </View>
          <View style={styles.chipRow}>
            {NEXT_STATUSES.map((s) => (
              <PrimaryButton
                key={s}
                secondary={nextStatus !== s}
                label={s}
                onPress={() => setNextStatus(s)}
                style={styles.statusBtn}
              />
            ))}
          </View>
          <PrimaryButton
            label={update.isPending ? t("loading") : t("save")}
            onPress={save}
            disabled={update.isPending}
          />
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={FILTERS.map((f) => ({ key: f.key, label: locale === "ar" ? f.ar : f.en }))}
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
            {(data?.data ?? []).length === 0 ? (
              <Empty text={t("queueEmpty")} />
            ) : (
              (data?.data ?? []).map((d: Dispute) => (
                <ListRow
                  key={d.id}
                  title={t(`dispute_${d.category}`)}
                  subtitle={`${d.reporter_name ?? d.reporter_id.slice(0, 8)} · ${new Date(
                    d.created_at
                  ).toLocaleDateString(dateLocale)}`}
                  right={<StatusBadge label={d.status} tone={TONE[d.status] ?? "info"} />}
                  onPress={() => {
                    setSelected(d);
                    setNotes(d.admin_notes ?? "");
                  }}
                />
              ))
            )}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  statusBtn: { flex: 1, marginTop: 0 },
});
