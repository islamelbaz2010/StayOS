import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGuestBookings } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, EmptyView } from "../components/States";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TripsScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: bookings, isLoading } = useGuestBookings();

  if (isLoading) return <LoadingSpinner />;

  const now = new Date();
  const filtered = (bookings || []).filter((b: any) => {
    const checkIn = new Date(b.check_in);
    if (tab === "upcoming") return checkIn >= now && b.status !== "cancelled";
    return checkIn < now || b.status === "cancelled";
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "upcoming" && styles.tabActive]}
          onPress={() => setTab("upcoming")}
        >
          <Text style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}>
            {t("upcoming")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "past" && styles.tabActive]}
          onPress={() => setTab("past")}
        >
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>
            {t("past")}
          </Text>
        </Pressable>
      </View>

      {filtered.length === 0 ? (
        <EmptyView title={t("noBookings")} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.bookingCard}
              onPress={() => navigation.navigate("ListingDetail", { unitId: item.unit_id })}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingStatus}>{item.status}</Text>
                <Text style={styles.bookingDates}>
                  {item.check_in} → {item.check_out}
                </Text>
              </View>
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingGuests}>
                  {item.adults} {t("adults")}
                  {item.children > 0 && ` · ${item.children} ${t("children")}`}
                </Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bookingStatus: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  bookingDates: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  bookingDetails: {
    flexDirection: "row",
  },
  bookingGuests: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
