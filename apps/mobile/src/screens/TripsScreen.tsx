import { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGuestBookings } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, EmptyView, ErrorView } from "../components/States";
import { LeaveReviewModal } from "../components/LeaveReviewModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import type { Booking } from "../lib/types";
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
  completed: "stayPhaseCompleted",
};

const STATUS_TONES: Record<string, "ok" | "warn" | "err" | "info"> = {
  confirmed: "ok",
  accepted: "ok",
  requested: "warn",
  completed: "info",
  cancelled: "err",
  rejected: "err",
  no_show: "err",
};

const PHASE_KEYS: Record<string, string> = {
  check_in_ready: "stayPhaseCheckInReady",
  checked_in: "stayPhaseCheckedIn",
  checkout_ready: "stayPhaseCheckoutReady",
  checked_out: "stayPhaseCheckedOut",
};

function TripStatusBadge({ status, label }: { status: string; label: string }) {
  const tone = STATUS_TONES[status] ?? "info";
  const bg =
    tone === "ok"
      ? colors.success
      : tone === "warn"
        ? colors.warning
        : tone === "err"
          ? colors.error
          : colors.primary50;
  const fg = tone === "info" ? colors.primary : colors.white;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function TripCard({
  booking,
  onPress,
  onReview,
  onCancel,
}: {
  booking: Booking;
  onPress: () => void;
  onReview: () => void;
  onCancel: () => void;
}) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
    });
  const phaseKey = PHASE_KEYS[booking.stay_phase];

  return (
    <Pressable style={styles.bookingCard} onPress={onPress}>
      <View style={styles.cardTop}>
        {booking.unit_cover_image ? (
          <Image source={{ uri: booking.unit_cover_image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbIcon}>🏠</Text>
          </View>
        )}
        <View style={styles.cardTopBody}>
          <Text style={styles.bookingTitle} numberOfLines={2}>
            {booking.unit_title || t("booking")}
          </Text>
          <Text style={styles.bookingDates}>
            {fmt(booking.check_in)} → {fmt(booking.check_out)}
          </Text>
          <Text style={styles.bookingGuests}>
            {booking.adults} {t("adults")}
            {booking.children > 0 && ` · ${booking.children} ${t("children")}`}
            {booking.infants > 0 && ` · ${booking.infants} ${t("infants")}`}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <TripStatusBadge
          status={booking.status}
          label={t(STATUS_KEYS[booking.status] ?? booking.status)}
        />
        {phaseKey ? <Text style={styles.phaseText}>{t(phaseKey)}</Text> : null}
      </View>
      {booking.status === "completed" && (
        <Pressable style={styles.actionButton} onPress={onReview}>
          <Text style={styles.actionButtonPrimaryText}>{t("leaveReview")}</Text>
        </Pressable>
      )}
      {CANCELLABLE_STATUSES.has(booking.status) && (
        <Pressable style={styles.actionButton} onPress={onCancel}>
          <Text style={styles.actionButtonSecondaryText}>{t("cancelBooking")}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export function TripsScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<TripTab>("upcoming");
  const [reviewTarget, setReviewTarget] = useState<{ bookingId: string; unitId: string } | null>(
    null
  );
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: bookings, isLoading, isError, refetch } = useGuestBookings();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView onRetry={() => refetch()} />;

  // Same bucketing as the web trips page: past = terminal status or an
  // active booking whose check-out has already passed.
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const filtered = (bookings || []).filter((b: Booking) => {
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
        <EmptyView
          icon="🧳"
          title={t("noBookings")}
          actionLabel={t("exploreStays")}
          onAction={() => navigation.navigate("Search", undefined)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              booking={item}
              onPress={() => navigation.navigate("TripDetail", { bookingId: item.id })}
              onReview={() => setReviewTarget({ bookingId: item.id, unitId: item.unit_id })}
              onCancel={() => setCancelTarget(item.id)}
            />
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
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: {
    fontSize: 24,
  },
  cardTopBody: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
  },
  bookingTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  bookingDates: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  bookingGuests: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  phaseText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.accentText,
  },
  actionButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: "center",
  },
  actionButtonPrimaryText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.accentText,
  },
  actionButtonSecondaryText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
