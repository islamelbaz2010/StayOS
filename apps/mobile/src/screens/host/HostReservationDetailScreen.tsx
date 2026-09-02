import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostReservationDetail } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: colors.surface, text: colors.textSecondary },
  PROOF_UPLOADED: { bg: "#FEF3C7", text: "#92400E" },
  VERIFIED: { bg: colors.primary50, text: colors.primary },
  REJECTED: { bg: "#FEE2E2", text: colors.error },
  REFUND_PENDING: { bg: "#FEF3C7", text: "#92400E" },
  REFUNDED: { bg: colors.surface, text: colors.textSecondary },
  CANCELLED: { bg: colors.surface, text: colors.textTertiary },
};

export function HostReservationDetailScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const bookingId = (route.params as { bookingId: string }).bookingId;
  const { data, isLoading, isError, refetch } = useHostReservationDetail(bookingId);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!data) return <LoadingSpinner />;

  const { booking, property, payment, cancellation_preview } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Guest section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("reservationGuest")}</Text>
        <InfoRow label={t("hostProfileDisplayName")} value={booking.guest_name || "—"} />
        {booking.guest_phone && (
          <InfoRow label={t("reservationGuestPhone")} value={booking.guest_phone} />
        )}
        <InfoRow label={t("reservationStatus")} value={booking.status} />
        <InfoRow label={t("stayStatus")} value={booking.stay_phase} />
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("tripSummary")}</Text>
        <InfoRow label={t("checkIn")} value={booking.check_in} />
        <InfoRow label={t("checkOut")} value={booking.check_out} />
        <InfoRow
          label={t("guests")}
          value={`${booking.adults + booking.children + booking.infants}`}
        />
      </View>

      {/* Property */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("reservationProperty")}</Text>
        <InfoRow label={t("hostListings")} value={property.title || property.unit_id} />
        {property.address && <InfoRow label={t("location")} value={property.address} />}
        <InfoRow label={t("propertyType")} value={property.property_type || "—"} />
        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate("ListingDetail", { unitId: property.unit_id })}
        >
          <Text style={styles.linkText}>{t("viewDetails")} →</Text>
        </Pressable>
      </View>

      {/* Payment */}
      {payment ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reservationPayment")}</Text>
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatusLabel}>{t("calendarStatus")}</Text>
            <View
              style={[
                styles.paymentBadge,
                { backgroundColor: (PAYMENT_STATUS_COLORS[payment.status] || PAYMENT_STATUS_COLORS.PENDING).bg },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  { color: (PAYMENT_STATUS_COLORS[payment.status] || PAYMENT_STATUS_COLORS.PENDING).text },
                ]}
              >
                {payment.status}
              </Text>
            </View>
          </View>
          <InfoRow label={t("reservationAmount")} value={`${payment.amount_egp} ${t("egp")}`} />
          <InfoRow label={t("reservationNights").replace("{count}", String(payment.nights))} value="" />
          <InfoRow label={t("reservationReference")} value={payment.reference_number} />
          {payment.verified_at && (
            <InfoRow label={t("reservationPaymentVerified")} value={payment.verified_at} />
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reservationPayment")}</Text>
          <Text style={styles.noPayment}>{t("reservationNoPayment")}</Text>
        </View>
      )}

      {/* Cancellation */}
      {cancellation_preview && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reservationCancellation")}</Text>
          <InfoRow
            label={t("reservationCancellable")}
            value={cancellation_preview.cancellable ? "✓" : "✗"}
          />
          <InfoRow
            label={t("reservationTotalPaid")}
            value={`${cancellation_preview.total_paid_egp} ${t("egp")}`}
          />
          <InfoRow
            label={t("reservationRefundAmount")}
            value={`${cancellation_preview.refund_amount_egp} ${t("egp")}`}
          />
          <InfoRow
            label={t("reservationRefundPolicy")}
            value={cancellation_preview.refund_policy_applied}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.messageButton}
          onPress={() => navigation.navigate("Message", { bookingId: booking.id })}
        >
          <Text style={styles.messageButtonText}>{t("messageHost")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  paymentStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  paymentStatusLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  paymentBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  noPayment: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  linkButton: {
    marginTop: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  actions: {
    marginTop: spacing.md,
  },
  messageButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  messageButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
