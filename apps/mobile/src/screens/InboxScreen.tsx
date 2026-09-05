import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useConversations } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../components/States";
import type { ConversationListItem } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString();
}

export function InboxScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: conversations, isLoading, isError, refetch } = useConversations();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!conversations || conversations.length === 0) {
    return <EmptyView title={t("noMessages")} />;
  }

  const renderItem = ({ item }: { item: ConversationListItem }) => {
    const title = item.counterparty_name || item.unit_title || t("inboxConversation");
    const preview = item.last_message?.content ?? "";
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate("Message", {
            conversationId: item.id,
            bookingId: item.booking_id ?? undefined,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {item.last_message && (
            <Text style={styles.cardTime}>{formatTime(item.last_message.created_at)}</Text>
          )}
        </View>
        {item.unit_title && item.counterparty_name && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.unit_title}
          </Text>
        )}
        <View style={styles.previewRow}>
          <Text
            style={[styles.preview, item.unread_count > 0 && styles.previewUnread]}
            numberOfLines={2}
          >
            {preview}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Text style={styles.title}>{t("messagesTitle")}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  cardTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginStart: spacing.sm,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    marginStart: spacing.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
});
