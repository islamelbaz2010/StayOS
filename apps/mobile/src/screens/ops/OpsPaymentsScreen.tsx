import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";

import { usePaymentQueueAction, usePaymentsQueue } from "../../lib/hooks";
import { api } from "../../lib/api";
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
import type { AdminPaymentItem } from "../../lib/types";
import { formatMoney } from "../../lib/money";

const STATUS_FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "proof_uploaded", en: "Proof uploaded", ar: "إثبات مرفوع" },
  { key: "pending", en: "Pending", ar: "قيد الانتظار" },
  { key: "verified", en: "Verified", ar: "موثّق" },
  { key: "rejected", en: "Rejected", ar: "مرفوض" },
];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  verified: "ok",
  proof_uploaded: "warn",
  pending: "warn",
  rejected: "err",
  refunded: "info",
};

export function OpsPaymentsScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>("proof_uploaded");
  const { data, isLoading, error, refetch } = usePaymentsQueue(status ?? undefined);
  const action = usePaymentQueueAction();
  const [selected, setSelected] = useState<AdminPaymentItem | null>(null);
  const [reason, setReason] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const run = async (act: "verify" | "reject" | "refund") => {
    if (!selected) return;
    try {
      await action.mutateAsync({
        paymentId: selected.id,
        action: act,
        payload: act === "reject" ? { reject_reason: reason.trim() || undefined } : {},
      });
      setSelected(null);
      setReason("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const openProof = async (paymentId: string) => {
    try {
      const { data: proof } = await api.get<{ download_url: string }>(
        `/payments/${paymentId}/proof/download`
      );
      if (proof.download_url) Linking.openURL(proof.download_url);
    } catch {
      Alert.alert("", t("error"));
    }
  };

  if (selected) {
    const actionable = selected.status === "proof_uploaded" || selected.status === "pending";
    const refundable = selected.status === "verified";
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.reference_number}>
          <Row label={t("amount")} value={formatMoney(selected.amount_egp, t("egp"))} />
          <Row label={t("status")} value={selected.status} />
          <Row label={t("method")} value={selected.method} />
          <Row label={t("property")} value={selected.unit_title} />
          <Row label={t("payCheckIn")} value={selected.check_in} />
          <Row label={t("payCheckOut")} value={selected.check_out} />
          <Row
            label={t("proofUploaded")}
            value={
              selected.proof_uploaded_at
                ? new Date(selected.proof_uploaded_at).toLocaleString(dateLocale)
                : null
            }
          />
        </Section>
        <Section>
          <PrimaryButton
            secondary
            label={t("viewProof")}
            onPress={() => openProof(selected.id)}
          />
          {actionable ? (
            <>
              <Field
                label={t("rejectReason")}
                value={reason}
                onChangeText={setReason}
              />
              <View style={styles.btnRow}>
                <PrimaryButton
                  label={t("verify")}
                  onPress={() => run("verify")}
                  disabled={action.isPending}
                  style={styles.btn}
                />
                <PrimaryButton
                  danger
                  label={t("reject")}
                  onPress={() => run("reject")}
                  disabled={action.isPending}
                  style={styles.btn}
                />
              </View>
            </>
          ) : null}
          {refundable ? (
            <PrimaryButton
              secondary
              label={t("issueRefund")}
              onPress={() => run("refund")}
              disabled={action.isPending}
            />
          ) : null}
          <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
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
              <Empty text={t("queueEmpty")} />
            ) : (
              (data ?? []).map((p: AdminPaymentItem) => (
                <ListRow
                  key={p.id}
                  title={`${formatMoney(p.amount_egp, t("egp"))} · ${p.reference_number}`}
                  subtitle={`${p.unit_title ?? p.unit_id.slice(0, 8)} · ${new Date(
                    p.created_at
                  ).toLocaleDateString(dateLocale)}`}
                  right={<StatusBadge label={p.status} tone={TONE[p.status] ?? "info"} />}
                  onPress={() => setSelected(p)}
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
  btnRow: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
