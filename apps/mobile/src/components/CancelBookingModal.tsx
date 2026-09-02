import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCancelBooking, useCancellationPreview } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";

interface CancelBookingModalProps {
  visible: boolean;
  bookingId: string;
  onClose: () => void;
  onCancelled: () => void;
}

/** Guest-facing cancel flow: shows the refund consequence (computed by the
 * same policy the backend will apply) before the guest confirms, then
 * cancels through the real cancellation lifecycle. */
export function CancelBookingModal({ visible, bookingId, onClose, onCancelled }: CancelBookingModalProps) {
  const { t } = useLocale();
  const [reason, setReason] = useState("");
  const preview = useCancellationPreview(bookingId, visible);
  const cancelBooking = useCancelBooking();

  const handleConfirm = async () => {
    try {
      await cancelBooking.mutateAsync({ bookingId, reason: reason.trim() || undefined });
      setReason("");
      onCancelled();
    } catch {
      Alert.alert(t("cancelError"));
    }
  };

  const p = preview.data;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("cancelModalTitle")}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {preview.isLoading && <ActivityIndicator color={colors.primary} />}

          {p && (
            <Text style={styles.refundText}>
              {p.total_paid_egp === 0
                ? t("cancelNoPayment")
                : p.refund_amount_egp === p.total_paid_egp
                  ? `${t("cancelRefundFull")} ${p.refund_amount_egp} ${t("egp")}.`
                  : p.refund_amount_egp === 0
                    ? t("cancelRefundNone")
                    : `${t("cancelRefundPartial")} ${p.refund_amount_egp} ${t("egp")} (${t("cancelRefundOf")} ${p.total_paid_egp} ${t("egp")} ${t("cancelRefundPaid")}).`}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder={t("cancelReasonPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actions}>
            <Pressable
              style={[styles.confirmButton, cancelBooking.isPending && styles.disabled]}
              onPress={handleConfirm}
              disabled={cancelBooking.isPending || preview.isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {cancelBooking.isPending ? t("cancelSubmitting") : t("confirm")}
              </Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>{t("back")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  refundText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 64,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
