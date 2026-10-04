import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { useListingModeration, usePendingListings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  ListRow,
  PrimaryButton,
  Row,
  Section,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { AdminListing } from "../../lib/types";

export function OpsListingsScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading, error, refetch } = usePendingListings();
  const action = useListingModeration();
  const [selected, setSelected] = useState<AdminListing | null>(null);
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

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.title}>
          <Row label={t("status")} value={selected.status} />
          <Row label={t("city")} value={`${selected.city}, ${selected.governorate}`} />
          <Row label={t("pendingChanges")} value={selected.has_pending_changes ? t("yes") : t("no")} />
          <Row
            label={t("created")}
            value={new Date(selected.created_at).toLocaleDateString(dateLocale)}
          />
        </Section>
        <Section>
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
          (data ?? []).map((l: AdminListing) => (
            <ListRow
              key={l.id}
              title={l.title}
              subtitle={`${l.city}, ${l.governorate}${l.has_pending_changes ? ` · ${t("pendingChanges")}` : ""}`}
              badge={l.status}
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
  btnRow: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
