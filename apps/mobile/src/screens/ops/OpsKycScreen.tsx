import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { useKycDocAction, useKycImages, useKycQueue } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { Empty, Field, ListRow, PrimaryButton, Row, Section } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { KycDocument } from "../../lib/types";

export function OpsKycScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading, error, refetch } = useKycQueue();
  const [selected, setSelected] = useState<KycDocument | null>(null);
  const action = useKycDocAction();
  const images = useKycImages(selected?.id ?? null);
  const [legalName, setLegalName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const docs = data?.data ?? [];

  const run = async (act: "approve" | "reject" | "process") => {
    if (!selected) return;
    try {
      await action.mutateAsync({
        documentId: selected.id,
        action: act,
        payload:
          act === "approve"
            ? { legal_name: legalName.trim() || undefined }
            : act === "reject"
              ? { reason: rejectReason.trim() || "Rejected" }
              : {},
      });
      setSelected(null);
      setLegalName("");
      setRejectReason("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    const img = images.data;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.document_type}>
          <Row label={t("status")} value={selected.status} />
          <Row label={t("legalName")} value={selected.legal_name} />
          <Row label={t("documentNumber")} value={selected.document_number} />
          <Row
            label={t("submitted")}
            value={new Date(selected.created_at).toLocaleString(dateLocale)}
          />
        </Section>

        {img && (img.front_url || img.back_url || img.selfie_url) ? (
          <Section title={t("documents")}>
            {img.front_url ? (
              <Image source={{ uri: img.front_url }} style={styles.docImage} resizeMode="contain" />
            ) : null}
            {img.back_url ? (
              <Image source={{ uri: img.back_url }} style={styles.docImage} resizeMode="contain" />
            ) : null}
            {img.selfie_url ? (
              <Image source={{ uri: img.selfie_url }} style={styles.docImage} resizeMode="contain" />
            ) : null}
          </Section>
        ) : null}

        <Section title={t("kycReview")}>
          <Field
            label={t("legalName")}
            value={legalName}
            onChangeText={setLegalName}
            placeholder={selected.legal_name ?? ""}
          />
          <Field
            label={t("rejectReason")}
            value={rejectReason}
            onChangeText={setRejectReason}
          />
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
              disabled={action.isPending || !rejectReason.trim()}
              style={styles.btn}
            />
          </View>
          <PrimaryButton
            secondary
            label={t("back")}
            onPress={() => setSelected(null)}
          />
        </Section>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={`${t("kycQueue")} (${data?.total ?? 0})`}>
        {docs.length === 0 ? (
          <Empty text={t("queueEmpty")} />
        ) : (
          docs.map((d: KycDocument) => (
            <ListRow
              key={d.id}
              title={d.legal_name ?? d.document_type}
              subtitle={`${d.document_type} · ${new Date(d.created_at).toLocaleDateString(dateLocale)}`}
              badge={d.status}
              onPress={() => setSelected(d)}
            />
          ))
        )}
      </Section>

      {(data?.inflight ?? []).length > 0 && (
        <Section title={`${t("inflightVerifications")} (${data?.inflight.length ?? 0})`}>
          {(data?.inflight ?? []).map((d: KycDocument) => (
            <ListRow
              key={d.id}
              title={d.legal_name ?? d.document_type}
              subtitle={`${d.provider ?? "provider"} · ${new Date(d.created_at).toLocaleDateString(dateLocale)}`}
              badge={d.status}
            />
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  docImage: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  btnRow: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
