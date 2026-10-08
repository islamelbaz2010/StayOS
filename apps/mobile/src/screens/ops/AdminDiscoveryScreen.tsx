import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useDiscoveryCandidates,
  useDiscoveryImport,
  useDiscoveryStats,
  useDiscoveryStatusUpdate,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
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
import type { DiscoveryCandidate } from "../../lib/types";

const STATUS_FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "new", en: "New", ar: "جديد" },
  { key: "qualified", en: "Qualified", ar: "مؤهل" },
  { key: "contacted", en: "Contacted", ar: "تم التواصل" },
  { key: "imported", en: "Imported", ar: "مستورد" },
  { key: "rejected", en: "Rejected", ar: "مرفوض" },
];

const NEXT_STATUSES = ["qualified", "contacted", "interested", "rejected"];

const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "HOTEL_ROOM",
  "RESORT_UNIT",
  "STUDIO",
];

export function AdminDiscoveryScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>(null);
  const stats = useDiscoveryStats();
  const { data, isLoading, error, refetch } = useDiscoveryCandidates({
    status: status ?? undefined,
    limit: 50,
  });
  const statusUpdate = useDiscoveryStatusUpdate();
  const importCandidate = useDiscoveryImport();

  const [selected, setSelected] = useState<DiscoveryCandidate | null>(null);
  const [notes, setNotes] = useState("");
  const [importName, setImportName] = useState("");
  const [importPhone, setImportPhone] = useState("");
  const [importEmail, setImportEmail] = useState("");
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const openCandidate = (c: DiscoveryCandidate) => {
    setSelected(c);
    setNotes(c.notes ?? "");
    setPropertyType(c.property_type ?? null);
    setPrice(c.nightly_price != null ? String(c.nightly_price) : "");
    setImportPhone(c.contact_type === "phone" ? c.contact_value ?? "" : "");
    setImportEmail(c.contact_type === "email" ? c.contact_value ?? "" : "");
    setImportName("");
  };

  const runStatus = async (next: string) => {
    if (!selected) return;
    try {
      await statusUpdate.mutateAsync({
        candidateId: selected.id,
        status: next,
        notes: notes.trim() || undefined,
      });
      setSelected(null);
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const runImport = async () => {
    if (!selected) return;
    if (!propertyType) {
      Alert.alert("", t("propertyTypeRequired"));
      return;
    }
    const overrides: Record<string, unknown> = { property_type: propertyType };
    if (price.trim()) overrides.price = Number(price.trim());
    try {
      await importCandidate.mutateAsync({
        candidateId: selected.id,
        host_name: importName.trim() || undefined,
        host_phone: importPhone.trim() || undefined,
        host_email: importEmail.trim() || undefined,
        overrides,
      });
      setSelected(null);
      Alert.alert("", t("importSuccess"));
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.title ?? selected.raw_title ?? selected.id.slice(0, 8)}>
          <Row label={t("source")} value={selected.source} />
          <Row
            label={t("location")}
            value={[selected.zone, selected.city, selected.governorate]
              .filter(Boolean)
              .join(", ")}
          />
          <Row label={t("propertyType")} value={selected.property_type} />
          <Row
            label={t("nightlyPrice")}
            value={selected.nightly_price != null ? `${selected.nightly_price} ${t("egp")}` : null}
          />
          <Row label={t("contact")} value={selected.contact_value} />
          <Row label={t("score")} value={selected.qualification_score?.toFixed?.(0) ?? selected.qualification_score} />
          <Row label={t("status")} value={selected.status} />
          <Row
            label={t("discovered")}
            value={new Date(selected.discovered_at).toLocaleDateString(dateLocale)}
          />
        </Section>

        <Section title={t("status")}>
          <Field label={t("adminNotes")} value={notes} onChangeText={setNotes} />
          <View style={styles.chipRow}>
            {NEXT_STATUSES.map((s) => (
              <PrimaryButton
                key={s}
                secondary
                label={t(`disc_${s}`)}
                onPress={() => runStatus(s)}
                disabled={statusUpdate.isPending}
                style={styles.statusBtn}
              />
            ))}
          </View>
        </Section>

        {selected.status !== "imported" && !selected.imported_unit_id && (
          <Section title={t("importCandidate")}>
            <Field
              label={t("contactName")}
              value={importName}
              onChangeText={setImportName}
            />
            <Field
              label={t("contactPhone")}
              value={importPhone}
              onChangeText={setImportPhone}
              keyboardType="phone-pad"
            />
            <Field
              label={t("contactEmail")}
              value={importEmail}
              onChangeText={setImportEmail}
              keyboardType="email-address"
            />
            <Text style={styles.groupLabel}>{t("propertyType")} *</Text>
            <View style={styles.chipRow}>
              {PROPERTY_TYPES.map((pt) => (
                <Text
                  key={pt}
                  style={[styles.chip, propertyType === pt && styles.chipActive]}
                  onPress={() => setPropertyType(pt)}
                >
                  {t(`ptype_${pt}`)}
                </Text>
              ))}
            </View>
            <Field
              label={`${t("nightlyPrice")} (${t("adminEntered")})`}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <PrimaryButton
              label={importCandidate.isPending ? t("loading") : t("importConfirm")}
              onPress={runImport}
              disabled={importCandidate.isPending}
            />
          </Section>
        )}
        <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {stats.data && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {t("statCandidates")}: {stats.data.total_candidates} · {t("statQualified")}:{" "}
            {stats.data.qualified_candidates} · {t("statImported")}: {stats.data.imported}
          </Text>
        </View>
      )}
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
            {(data?.data ?? []).length === 0 ? (
              <Empty text={t("queueEmpty")} />
            ) : (
              (data?.data ?? []).map((c: DiscoveryCandidate) => (
                <ListRow
                  key={c.id}
                  title={c.title ?? c.raw_title ?? c.id.slice(0, 8)}
                  subtitle={`${[c.city, c.governorate].filter(Boolean).join(", ")} · ${c.source}`}
                  right={<StatusBadge label={c.status} tone={c.status === "imported" ? "ok" : "info"} />}
                  onPress={() => openCandidate(c)}
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
  statsBar: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: 8,
  },
  statsText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center" },
  filters: { padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
    color: colors.onPrimary,
    borderColor: colors.primary,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusBtn: { flex: 1, minWidth: "45%", marginTop: 0 },
});
