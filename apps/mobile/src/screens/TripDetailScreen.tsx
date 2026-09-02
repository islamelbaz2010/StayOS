import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";

import { useCheckIn, useCheckOut, useStayInfo } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView } from "../components/States";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { LeaveReviewModal } from "../components/LeaveReviewModal";
import type { StayPhase } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "TripDetail">;

const CANCELLABLE_PHASES = new Set<StayPhase>(["upcoming", "check_in_ready"]);
const PHASE_KEYS: Record<StayPhase, string> = {
  upcoming: "stayPhaseUpcoming",
  check_in_ready: "stayPhaseCheckInReady",
  checked_in: "stayPhaseCheckedIn",
  checkout_ready: "stayPhaseCheckoutReady",
  checked_out: "stayPhaseCheckedOut",
  completed: "stayPhaseCompleted",
  cancelled: "statusCancelled",
  rejected: "statusRejected",
};

const hasMapKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

export function TripDetailScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { bookingId } = route.params;

  const { data: stay, isLoading, error, refetch } = useStayInfo(bookingId);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error || !stay) return <ErrorView message={t("loadStayError")} onRetry={() => refetch()} />;

  const { booking, property, host, arrival, review_eligible: reviewEligible } = stay;
  const phase: StayPhase = booking.stay_phase;

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync(bookingId);
      Alert.alert(t("checkInSuccess"));
    } catch {
      Alert.alert(t("checkInError"));
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(bookingId);
      Alert.alert(t("checkOutSuccess"));
    } catch {
      Alert.alert(t("checkOutError"));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Trip summary + stay status */}
      <Section title={t("tripSummary")}>
        {property.title && <Text style={styles.propertyTitle}>{property.title}</Text>}
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{t(PHASE_KEYS[phase] ?? phase)}</Text>
        </View>
        <Text style={styles.datesText}>
          {booking.check_in} → {booking.check_out}
        </Text>
        <Text style={styles.guestsText}>
          {booking.adults} {t("adults")}
          {booking.children > 0 && ` · ${booking.children} ${t("children")}`}
        </Text>
      </Section>

      {/* Arrival */}
      {phase !== "cancelled" && phase !== "rejected" && (
        <Section title={t("arrivalInfo")}>
          {property.address && <Text style={styles.bodyText}>{property.address}</Text>}
          <Text style={styles.metaText}>
            {t("checkInTime")}: {arrival.default_check_in_time}
          </Text>
          {hasMapKey && property.lat != null && property.lng != null ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: property.lat,
                longitude: property.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: property.lat, longitude: property.lng }} />
            </MapView>
          ) : null}

          {arrival.eligible ? (
            arrival.check_in_instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>{t("checkInInstructions")}</Text>
                <Text style={styles.bodyText}>{arrival.check_in_instructions}</Text>
              </View>
            )
          ) : (
            <Text style={styles.mutedText}>{t("arrivalReleasesAt")}</Text>
          )}
        </Section>
      )}

      {/* Stay */}
      {(phase === "checked_in" || phase === "checkout_ready" || phase === "check_in_ready" || phase === "upcoming") && (
        <Section title={t("stayInfo")}>
          {host.name && <Text style={styles.bodyText}>{host.name}</Text>}
          {host.phone && (
            <Pressable onPress={() => Linking.openURL(`tel:${host.phone}`)}>
              <Text style={styles.linkText}>{t("callHost")}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => navigation.navigate("Message", { bookingId })}>
            <Text style={styles.linkText}>{t("messageHost")}</Text>
          </Pressable>
          {property.house_rules && (
            <>
              <Text style={styles.instructionsLabel}>{t("houseRules")}</Text>
              <Text style={styles.bodyText}>{property.house_rules}</Text>
            </>
          )}
        </Section>
      )}

      {/* Check-in / active stay / checkout actions */}
      {phase === "check_in_ready" && (
        <Pressable
          style={[styles.primaryButton, checkIn.isPending && styles.disabledButton]}
          onPress={handleCheckIn}
          disabled={checkIn.isPending}
        >
          <Text style={styles.primaryButtonText}>{t("checkInAction")}</Text>
        </Pressable>
      )}
      {(phase === "checked_in" || phase === "checkout_ready") && (
        <Pressable
          style={[styles.primaryButton, checkOut.isPending && styles.disabledButton]}
          onPress={handleCheckOut}
          disabled={checkOut.isPending}
        >
          <Text style={styles.primaryButtonText}>{t("checkOutAction")}</Text>
        </Pressable>
      )}

      {/* Checkout info */}
      {(phase === "checked_in" || phase === "checkout_ready" || phase === "checked_out") && (
        <Section title={t("checkoutInfo")}>
          <Text style={styles.metaText}>
            {t("checkOutTime")}: {arrival.default_check_out_time}
          </Text>
        </Section>
      )}

      {/* Post-stay review */}
      {reviewEligible && (
        <Pressable style={styles.secondaryButton} onPress={() => setReviewOpen(true)}>
          <Text style={styles.secondaryButtonText}>{t("leaveReview")}</Text>
        </Pressable>
      )}

      {/* Cancellation */}
      {CANCELLABLE_PHASES.has(phase) && (
        <Pressable style={styles.cancelLink} onPress={() => setCancelOpen(true)}>
          <Text style={styles.cancelLinkText}>{t("cancelBooking")}</Text>
        </Pressable>
      )}

      <CancelBookingModal
        visible={cancelOpen}
        bookingId={bookingId}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => {
          setCancelOpen(false);
          refetch();
          navigation.goBack();
        }}
      />
      <LeaveReviewModal
        visible={reviewOpen}
        bookingId={bookingId}
        unitId={booking.unit_id}
        onClose={() => setReviewOpen(false)}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  propertyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  datesText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guestsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mutedText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  instructionsBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  instructionsLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  map: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  cancelLinkText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
