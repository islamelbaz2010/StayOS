import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAdminListings } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import { Empty, FilterChips, ListRow, Section, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { AdminListing } from "../../lib/types";

const FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "listed", en: "Listed", ar: "منشور" },
  { key: "pending_verification", en: "Pending", ar: "قيد المراجعة" },
  { key: "draft", en: "Draft", ar: "مسودة" },
  { key: "rejected", en: "Rejected", ar: "مرفوض" },
];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  listed: "ok",
  pending_verification: "warn",
  rejected: "err",
  draft: "info",
};

export function AdminListingsScreen() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useAdminListings({
    status: status ?? undefined,
  });
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

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
            {(data ?? []).length === 0 ? (
              <Empty text={t("noListings")} />
            ) : (
              (data ?? []).map((l: AdminListing) => (
                <ListRow
                  key={l.id}
                  title={l.title}
                  subtitle={`${l.city}, ${l.governorate} · ${new Date(
                    l.created_at
                  ).toLocaleDateString(dateLocale)}${l.has_pending_changes ? ` · ${t("pendingChanges")}` : ""}`}
                  right={<StatusBadge label={l.status} tone={TONE[l.status] ?? "info"} />}
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
  content: { padding: spacing.lg },
});
