import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCreateReview } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";

interface LeaveReviewModalProps {
  visible: boolean;
  bookingId: string;
  unitId: string;
  onClose: () => void;
}

export function LeaveReviewModal({ visible, bookingId, unitId, onClose }: LeaveReviewModalProps) {
  const { t } = useLocale();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const handleSubmit = async () => {
    try {
      await createReview.mutateAsync({ bookingId, unitId, rating, comment: comment.trim() || undefined });
      Alert.alert(t("reviewSubmitted"));
      setComment("");
      setRating(5);
      onClose();
    } catch {
      Alert.alert(t("error"));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("leaveReview")}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t("yourRating")}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={8}>
                <Text style={value <= rating ? styles.starFilled : styles.starEmpty}>★</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t("reviewCommentPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          <Pressable
            style={[styles.submitButton, createReview.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createReview.isPending}
          >
            <Text style={styles.submitButtonText}>
              {createReview.isPending ? t("loading") : t("submitReview")}
            </Text>
          </Pressable>
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
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  starFilled: {
    fontSize: 32,
    color: colors.star,
  },
  starEmpty: {
    fontSize: 32,
    color: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 96,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
