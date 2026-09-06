import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useHostReservationDetail,
  useHostBookingUpdate,
  useCancelBooking,
  useCheckIn,
  useCheckOut,
} from "../../lib/hooks";
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
  const updateBooking = useHostBookingUpdate();
  const cancelBooking = useCancelBooking();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [action, setAction] = useState<"reject" | "cancel" | null>(null);
  const [reason, setReason] = useState("");

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!data) return <LoadingSpinner />;

  const { booking, property, payment, cancellation_preview } = data;

  const handleAccept = async () => {
    try {
      await updateBooking.mutateAsync({ bookingId, status: "accepted" });
      Alert.alert(t("success"), t("reservationAccepted"));
    } catch {
      Alert.alert(t("error"), t("reservationActionFailed"));
    }
  };

  const handleReject = async () => {
    try {
      await updateBooking.mutateAsync({ bookingId, status: "rejected", rejectReason: reason });
      setAction(null);
      setReason("");
      Alert.alert(t("success"), t("reservationRejected"));
    } catch {
      Alert.alert(t("error"), t("reservationActionFailed"));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync({ bookingId, reason });
      setAction(null);
      setReason("");
      Alert.alert(t("success"), t("reservationCancelled"));
    } catch {
      Alert.alert(t("error"), t("reservationActionFailed"));
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync(bookingId);
      Alert.alert(t("success"), t("reservationCheckedIn"));
    } catch {
      Alert.alert(t("error"), t("reservationActionFailed"));
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(bookingId);
      Alert.alert(t("success"), t("reservationCheckedOut"));
    } catch {
      Alert.alert(t("error"), t("reservationActionFailed"));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Guest section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("reservationGuest")}</Text>
        <InfoRow label={t("hostProfileDisplayName")} value={booking.guest_name || "—"} />
        {booking.guest_phone && (
          <InfoRow label={t("reservationGuestPhone")} value={booking.guest_phone} />
        )}
        <InfoRow
          label={t("reservationStatus")}
          value={booking.status === "no_show" ? t("statusNoShow") : booking.status}
        />
        <InfoRow
          label={t("stayStatus")}
          value={booking.stay_phase === "no_show" ? t("statusNoShow") : booking.stay_phase}
        />
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
        {booking.status === "requested" && (
          <View style={styles.actionRow}>
            <ActionButton label={t("accept")} onPress={handleAccept} primary />
            <ActionButton label={t("reject")} onPress={() => setAction("reject")} variant="danger" />
            <ActionButton label={t("cancel")} onPress={() => setAction("cancel")} variant="secondary" />
          </View>
        )}

        {booking.status === "accepted" && (
          <View style={styles.actionRow}>
            <ActionButton label={t("cancel")} onPress={() => setAction("cancel")} variant="secondary" />
          </View>
        )}

        {booking.status === "confirmed" && (
          <View style={styles.actionRow}>
            {!booking.checked_in_at && (
              <ActionButton label={t("checkIn")} onPress={handleCheckIn} primary />
            )}
            {booking.checked_in_at && !booking.checked_out_at && (
              <ActionButton label={t("checkOut")} onPress={handleCheckOut} primary />
            )}
            {booking.checked_in_at && booking.checked_out_at && (
              <Text style={styles.completedText}>{t("stayCompleted")}</Text>
            )}
          </View>
        )}

        {action && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>
              {action === "reject" ? t("rejectReason") : t("cancelReason")}
            </Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.actionRow}>
              <ActionButton
                label={action === "reject" ? t("confirmReject") : t("confirmCancel")}
                onPress={action === "reject" ? handleReject : handleCancel}
                variant={action === "reject" ? "danger" : "secondary"}
              />
              <ActionButton
                label={t("back")}
                onPress={() => { setAction(null); setReason(""); }}
                variant="ghost"
              />
            </View>
          </View>
        )}

        <Pressable
          style={styles.messageButton}
          onPress={() => navigation.navigate("Message", { bookingId: booking.id })}
        >
          <Text style={styles.messageButtonText}>{t("messageGuest")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
  variant,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  variant?: "danger" | "secondary" | "ghost";
}) {
  const bg =
    primary ? colors.primary :
    variant === "danger" ? colors.error :
    variant === "ghost" ? "transparent" :
    colors.surface;
  const text =
    primary || variant === "danger" ? colors.white :
    variant === "ghost" ? colors.textSecondary :
    colors.text;
  const border =
    variant === "secondary" ? `1px solid ${colors.border}` :
    "none";
  return (
    <Pressable
      style={[styles.actionButton, { backgroundColor: bg, borderWidth: 1, borderColor: border } as any]}
      onPress={onPress}
    >
      <Text style={[styles.actionButtonText, { color: text }]}>{label}</Text>
    </Pressable>
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
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  completedText: {
    fontSize: fontSize.md,
    color: colors.success,
    fontWeight: "600",
  },
  reasonBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reasonLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  reasonInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
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
