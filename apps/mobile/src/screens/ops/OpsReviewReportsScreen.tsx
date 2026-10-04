import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { useReviewReports, useReviewReportUpdate } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { ReviewReport } from "../../lib/types";

export function OpsReviewReportsScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading, error, refetch } = useReviewReports();
  const update = useReviewReportUpdate();
  const [selected, setSelected] = useState<ReviewReport | null>(null);
  const [notes, setNotes] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const resolve = async (hide: boolean) => {
    if (!selected) return;
    try {
      await update.mutateAsync({
        reportId: selected.id,
        status: "resolved",
        admin_notes: notes.trim() || undefined,
        hide_review: hide,
      });
      setSelected(null);
      setNotes("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={t("reviewReport")}>
          <Row label={t("reason")} value={selected.reason} />
          <Row label={t("details")} value={selected.details} />
          <Row label={t("status")} value={selected.status} />
          <Row
            label={t("created")}
            value={new Date(selected.created_at).toLocaleString(dateLocale)}
          />
        </Section>
        <Section>
          <Field label={t("adminNotes")} value={notes} onChangeText={setNotes} multiline />
          <PrimaryButton
            label={update.isPending ? t("loading") : t("resolveKeepReview")}
            onPress={() => resolve(false)}
            disabled={update.isPending}
          />
          <PrimaryButton
            danger
            label={update.isPending ? t("loading") : t("resolveHideReview")}
            onPress={() => resolve(true)}
            disabled={update.isPending}
          />
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
        </Section>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={`${t("reviewReports")} (${data?.total ?? 0})`}>
        {(data?.data ?? []).length === 0 ? (
          <Empty text={t("queueEmpty")} />
        ) : (
          (data?.data ?? []).map((r: ReviewReport) => (
            <ListRow
              key={r.id}
              title={r.reason}
              subtitle={`${r.details ?? ""} · ${new Date(r.created_at).toLocaleDateString(dateLocale)}`}
              right={
                <StatusBadge
                  label={r.status}
                  tone={r.status === "resolved" ? "ok" : "warn"}
                />
              }
              onPress={() => {
                setSelected(r);
                setNotes(r.admin_notes ?? "");
              }}
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
});
