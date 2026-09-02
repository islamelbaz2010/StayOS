import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostToday } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { RootStackParamList } from "../../../App";
import type { HostTodayItem } from "../../lib/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ITEM_TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  check_in_today: { bg: colors.primary50, border: colors.primary, text: colors.primary },
  check_out_today: { bg: "#FEF3C7", border: colors.warning, text: "#92400E" },
  current_stay: { bg: colors.primary50, border: colors.primaryLight, text: colors.primary },
  pending_request: { bg: "#FEE2E2", border: colors.error, text: colors.error },
  upcoming_arrival: { bg: colors.primary50, border: colors.primaryLight, text: colors.primary },
  upcoming_departure: { bg: "#FEF3C7", border: colors.warning, text: "#92400E" },
  unread_message: { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  incomplete_listing: { bg: colors.surface, border: colors.border, text: colors.textSecondary },
};

export function HostTodayScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useHostToday();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!data || data.items.length === 0) {
    return <EmptyView title={t("todayNoItems")} subtitle={t("todayNoItemsSubtitle")} />;
  }

  const handleItemPress = (item: HostTodayItem) => {
    if (item.booking_id) {
      navigation.navigate("HostReservationDetail", { bookingId: item.booking_id });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("hostToday")}</Text>
        <SummaryBadges summary={data.summary} t={t} />
      </View>

      <View style={styles.itemsList}>
        {data.items.map((item: HostTodayItem, idx: number) => {
          const style = ITEM_TYPE_STYLES[item.item_type] || ITEM_TYPE_STYLES.incomplete_listing;
          return (
            <Pressable
              key={`${item.item_type}-${item.booking_id || item.unit_id || idx}`}
              style={[styles.itemCard, { backgroundColor: style.bg, borderColor: style.border }]}
              onPress={() => handleItemPress(item)}
              disabled={!item.booking_id}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: style.text }]}>{item.title}</Text>
                {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
              </View>
              {item.check_in && item.check_out && (
                <Text style={styles.itemDates}>
                  {item.check_in} → {item.check_out}
                </Text>
              )}
              {item.booking_id && (
                <Text style={[styles.itemAction, { color: style.text }]}>
                  {t("viewDetails")} →
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function SummaryBadges({
  summary,
  t,
}: {
  summary: Record<string, number>;
  t: (key: string) => string;
}) {
  const badges: Array<{ key: string; label: string; value: number }> = [
    { key: "check_ins_today", label: t("todayCheckIns"), value: summary.check_ins_today || 0 },
    { key: "check_outs_today", label: t("todayCheckOuts"), value: summary.check_outs_today || 0 },
    { key: "pending_requests", label: t("todayPendingRequests"), value: summary.pending_requests || 0 },
    { key: "unread_messages", label: t("todayUnreadMessages"), value: summary.unread_messages || 0 },
  ];
  const visible = badges.filter((b) => b.value > 0);
  if (visible.length === 0) return null;
  return (
    <View style={styles.badgeRow}>
      {visible.map((b) => (
        <View key={b.key} style={styles.badge}>
          <Text style={styles.badgeValue}>{b.value}</Text>
          <Text style={styles.badgeLabel}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primary,
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  itemHeader: {
    marginBottom: spacing.xs,
  },
  itemTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  itemDates: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  itemAction: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
