import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSupportQueue } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import { Empty, FilterChips, ListRow, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS = [
  { key: "", en: "All", ar: "الكل" },
  { key: "open", en: "Open", ar: "مفتوح" },
  { key: "waiting", en: "Waiting", ar: "بانتظار الرد" },
  { key: "resolved", en: "Resolved", ar: "تم الحل" },
];

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  open: "warn",
  waiting: "info",
  resolved: "ok",
};

export function OpsSupportScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const [status, setStatus] = useState<string | null>("open");
  const { data, isLoading, error, refetch } = useSupportQueue(status ?? undefined);
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
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.subject || item.counterparty_name || t("supportThread")}
              subtitle={`${item.counterparty_name ?? ""} · ${item.last_message?.content ?? ""} · ${new Date(
                item.updated_at
              ).toLocaleDateString(dateLocale)}`}
              right={
                <StatusBadge
                  label={item.support_status ?? item.status}
                  tone={TONE[item.support_status ?? ""] ?? "info"}
                />
              }
              badge={item.unread_count > 0 ? String(item.unread_count) : null}
              onPress={() =>
                navigation.navigate("Message", { conversationId: item.id })
              }
            />
          )}
          ListEmptyComponent={<Empty text={t("queueEmpty")} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  list: { padding: spacing.md },
});
