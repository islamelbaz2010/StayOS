import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAdminReport, useReportCatalog } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Empty, ListRow, PrimaryButton, Section } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { ReportCatalogEntry } from "../../lib/types";

export function AdminReportsScreen() {
  const { t, locale } = useLocale();
  const { data: catalog, isLoading, error, refetch } = useReportCatalog();
  const [selected, setSelected] = useState<string | null>(null);
  const report = useAdminReport(selected, { page_size: "50" });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  if (selected) {
    const entry = catalog?.find((r: ReportCatalogEntry) => r.key === selected);
    const result = report.data;
    const cols = result?.columns ?? entry?.columns ?? [];
    const moneyCols = new Set(entry?.money_columns ?? []);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={entry?.key ?? selected}>
          {result?.note ? <Text style={styles.note}>{result.note}</Text> : null}
          {report.isLoading ? (
            <LoadingSpinner />
          ) : report.error ? (
            <ErrorView message={t("error")} onRetry={report.refetch} />
          ) : (result?.rows ?? []).length === 0 ? (
            <Empty text={t("noRows")} />
          ) : (
            (result?.rows ?? []).map((row: Record<string, unknown>, i: number) => (
              <View key={i} style={styles.reportRow}>
                {cols.map((c: { key: string; label_en?: string; label_ar?: string }) => {
                  const v = row[c.key];
                  if (v === null || v === undefined) return null;
                  const label = locale === "ar" ? (c.label_ar ?? c.key) : (c.label_en ?? c.key);
                  return (
                    <View key={c.key} style={styles.reportCell}>
                      <Text style={styles.cellLabel}>{label}</Text>
                      <Text style={styles.cellValue}>
                        {moneyCols.has(c.key) ? `${Number(v).toLocaleString()} ` : ""}
                        {String(v)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </Section>
        {result && (
          <Text style={styles.total}>
            {t("totalRows")}: {result.total}
          </Text>
        )}
        <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={t("reports")}>
        {(catalog ?? []).length === 0 ? (
          <Empty text={t("noReports")} />
        ) : (
          (catalog ?? []).map((r: ReportCatalogEntry) => (
            <ListRow
              key={r.key}
              title={r.key}
              subtitle={r.category}
              badge={r.implemented ? undefined : t("unavailable")}
              onPress={r.implemented ? () => setSelected(r.key) : undefined}
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
  note: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  reportRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  reportCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  cellLabel: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
  cellValue: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600", flex: 1.4, textAlign: "right" },
  total: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
});
