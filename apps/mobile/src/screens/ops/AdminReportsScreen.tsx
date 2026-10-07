import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAdminReport, useReportCatalog } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Empty, PrimaryButton, Section } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import {
  REPORT_CATEGORIES,
  REPORT_REPORTS,
  REPORT_DATEBASIS,
  REPORT_REASONS,
} from "../../lib/reportNames";
import type { ReportCatalogEntry } from "../../lib/types";

// Same ordering as the web admin reports page.
const CATEGORY_ORDER = [
  "overview",
  "bookings",
  "financial",
  "payments",
  "payouts",
  "operations",
  "users_trust",
  "listings",
  "disputes",
  "reviews",
];

export function AdminReportsScreen() {
  const { t, locale } = useLocale();
  const { data: catalog, isLoading, error, refetch } = useReportCatalog();
  const [selected, setSelected] = useState<string | null>(null);
  const report = useAdminReport(selected, { page_size: "50" });

  const name = (key: string) =>
    (locale === "ar" ? REPORT_REPORTS[key]?.ar : REPORT_REPORTS[key]?.en) ??
    key;
  const catName = (cat: string) =>
    (locale === "ar" ? REPORT_CATEGORIES[cat]?.ar : REPORT_CATEGORIES[cat]?.en) ??
    cat;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  if (selected) {
    const entry = catalog?.find((r: ReportCatalogEntry) => r.key === selected);
    const result = report.data;
    const cols = result?.columns ?? entry?.columns ?? [];
    const moneyCols = new Set(entry?.money_columns ?? []);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={name(selected)}>
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

  const entries: ReportCatalogEntry[] = catalog ?? [];
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: entries.filter((r: ReportCatalogEntry) => r.category === cat),
  })).filter((g) => g.items.length > 0);
  const uncategorized = entries.filter(
    (r: ReportCatalogEntry) => !CATEGORY_ORDER.includes(r.category)
  );
  if (uncategorized.length > 0) {
    grouped.push({ cat: "other", items: uncategorized });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{t("reports")}</Text>
      {entries.length === 0 ? (
        <Empty text={t("noReports")} />
      ) : (
        grouped.map((group) => (
          <Section key={group.cat} title={catName(group.cat)}>
            {group.items.map((r: ReportCatalogEntry) => {
              const basis = locale === "ar"
                ? REPORT_DATEBASIS[r.date_basis]?.ar
                : REPORT_DATEBASIS[r.date_basis]?.en;
              const subtitle = r.implemented
                ? basis
                : `${t("unavailable")}${r.unavailable_reason
                    ? ` — ${(locale === "ar"
                        ? REPORT_REASONS[r.unavailable_reason]?.ar
                        : REPORT_REASONS[r.unavailable_reason]?.en) ??
                      r.unavailable_reason}`
                    : ""}`;
              return (
                <Pressable
                  key={r.key}
                  style={[styles.reportCard, !r.implemented && styles.reportCardDim]}
                  disabled={!r.implemented}
                  onPress={() => setSelected(r.key)}
                >
                  <Text
                    style={[
                      styles.reportTitle,
                      !r.implemented && styles.reportTitleDim,
                    ]}
                  >
                    {name(r.key)}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.reportSubtitle}>{subtitle}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Section>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  note: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportCardDim: {
    borderStyle: "dashed",
    opacity: 0.7,
  },
  reportTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  reportTitleDim: {
    color: colors.textSecondary,
  },
  reportSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
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
