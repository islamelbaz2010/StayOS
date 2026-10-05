import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGuestBookings } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, EmptyView } from "../components/States";
import { LeaveReviewModal } from "../components/LeaveReviewModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CANCELLABLE_STATUSES = new Set(["requested", "accepted", "confirmed"]);
const ACTIVE_STATUSES = new Set(["requested", "accepted", "confirmed"]);
const TERMINAL_STATUSES = new Set(["completed", "rejected", "no_show"]);
const TRIP_TABS = ["upcoming", "past", "cancelled", "all"] as const;
type TripTab = (typeof TRIP_TABS)[number];
const TAB_LABEL_KEYS: Record<TripTab, string> = {
  upcoming: "upcoming",
  past: "past",
  cancelled: "filterCancelled",
  all: "filterAll",
};

const STATUS_KEYS: Record<string, string> = {
  requested: "statusRequested",
  accepted: "statusAccepted",
  confirmed: "statusConfirmed",
  rejected: "statusRejected",
  cancelled: "statusCancelled",
  no_show: "statusNoShow",
};

export function TripsScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<TripTab>("upcoming");
  const [reviewTarget, setReviewTarget] = useState<{ bookingId: string; unitId: string } | null>(
    null
  );
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: bookings, isLoading, refetch } = useGuestBookings();

  if (isLoading) return <LoadingSpinner />;

  // Same bucketing as the web trips page: past = terminal status or an
  // active booking whose check-out has already passed.
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const filtered = (bookings || []).filter((b: any) => {
    const checkOut = new Date(b.check_out);
    const isCancelled = b.status === "cancelled";
    const isPast =
      TERMINAL_STATUSES.has(b.status) ||
      (ACTIVE_STATUSES.has(b.status) && checkOut < now);
    switch (tab) {
      case "upcoming":
        return !isCancelled && !isPast;
      case "past":
        return isPast;
      case "cancelled":
        return isCancelled;
      case "all":
        return true;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TRIP_TABS.map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {t(TAB_LABEL_KEYS[key])}
            </Text>
          </Pressable>
        ))}
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
              onPress={() => navigation.navigate("TripDetail", { bookingId: item.id })}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingStatus}>{t(STATUS_KEYS[item.status] ?? item.status)}</Text>
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
              {item.status === "completed" && (
                <Pressable
                  style={styles.reviewButton}
                  onPress={() => setReviewTarget({ bookingId: item.id, unitId: item.unit_id })}
                >
                  <Text style={styles.reviewButtonText}>{t("leaveReview")}</Text>
                </Pressable>
              )}
              {CANCELLABLE_STATUSES.has(item.status) && (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setCancelTarget(item.id)}
                >
                  <Text style={styles.cancelButtonText}>{t("cancelBooking")}</Text>
                </Pressable>
              )}
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {reviewTarget && (
        <LeaveReviewModal
          visible={Boolean(reviewTarget)}
          bookingId={reviewTarget.bookingId}
          unitId={reviewTarget.unitId}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {cancelTarget && (
        <CancelBookingModal
          visible={Boolean(cancelTarget)}
          bookingId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            refetch();
          }}
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
  reviewButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reviewButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
