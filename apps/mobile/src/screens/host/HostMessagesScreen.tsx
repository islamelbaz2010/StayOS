import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostReservations } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HostMessagesScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: reservations, isLoading, isError, refetch } = useHostReservations();

  // Only show reservations that have an active conversation (confirmed, accepted, checked-in)
  const conversable = (reservations || []).filter(
    (r: { status: string; checked_in_at: string | null }) =>
      ["confirmed", "accepted"].includes(r.status) || r.checked_in_at
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (conversable.length === 0) {
    return <EmptyView title={t("noMessages")} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t("hostMessages")}</Text>
      <View style={styles.list}>
        {conversable.map((r: typeof conversable[number]) => (
          <Pressable
            key={r.id}
            style={styles.card}
            onPress={() => navigation.navigate("Message", { bookingId: r.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.guestName}>{r.guest_name || "Guest"}</Text>
              <Text style={styles.unitTitle} numberOfLines={1}>{r.unit_title || ""}</Text>
            </View>
            <Text style={styles.dates}>
              {r.check_in} → {r.check_out}
            </Text>
            <Text style={styles.status}>{r.status}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    marginBottom: spacing.xs,
  },
  guestName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  unitTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dates: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  status: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
