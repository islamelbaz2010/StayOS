import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMe,
  useNotifications,
} from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { EmptyView, LoadingSpinner, ErrorView } from "../components/States";
import type { InAppNotification } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const { t, locale } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, error, refetch } = useNotifications();
  const { data: me } = useMe();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={t("error")} onRetry={refetch} />;

  const items = data?.items ?? [];
  const unread = data?.unread_count ?? 0;
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const open = (item: InAppNotification) => {
    if (!item.read_at) markRead.mutate(item.id);
    if (item.booking_id) {
      // Hosts get the operational reservation view; travelers get their trip.
      navigation.navigate(
        me?.role === "host" ? "HostReservationDetail" : "TripDetail",
        { bookingId: item.booking_id }
      );
    }
  };

  return (
    <View style={styles.container}>
      {unread > 0 && (
        <Pressable style={styles.markAll} onPress={() => markAll.mutate()}>
          <Text style={styles.markAllText}>
            {t("markAllRead")} ({unread})
          </Text>
        </Pressable>
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, !item.read_at && styles.itemUnread]}
            onPress={() => open(item)}
          >
            <View style={styles.itemBody}>
              {item.subject ? <Text style={styles.subject}>{item.subject}</Text> : null}
              <Text style={styles.bodyText} numberOfLines={3}>
                {item.body}
              </Text>
              <Text style={styles.time}>
                {new Date(item.created_at).toLocaleString(dateLocale)}
              </Text>
            </View>
            {!item.read_at && <View style={styles.dot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyView title={t("noNotifications")} subtitle={t("noNotificationsHint")} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  markAll: { padding: spacing.md, alignItems: "flex-end" },
  markAllText: { color: colors.accentText, fontSize: fontSize.sm, fontWeight: "700" },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemUnread: { borderColor: colors.primary },
  itemBody: { flex: 1 },
  subject: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  bodyText: { fontSize: fontSize.sm, color: colors.text, marginTop: 2, lineHeight: 19 },
  time: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginStart: spacing.sm,
    marginTop: 4,
  },
});
