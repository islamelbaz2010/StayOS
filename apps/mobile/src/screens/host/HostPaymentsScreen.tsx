import { FlatList, StyleSheet, View } from "react-native";

import { useHostPayments } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import { Empty, ListRow, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  verified: "ok",
  refunded: "info",
  pending: "warn",
  proof_uploaded: "warn",
  rejected: "err",
  cancelled: "err",
};

export function HostPaymentsScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading, error, refetch } = useHostPayments();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListRow
            title={`${item.amount_egp.toLocaleString()} ${t("egp")}`}
            subtitle={`${item.reference_number} · ${new Date(
              item.created_at
            ).toLocaleDateString(dateLocale)}`}
            right={<StatusBadge label={item.status} tone={TONE[item.status] ?? "info"} />}
          />
        )}
        ListEmptyComponent={<Empty text={t("noPayments")} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
});
