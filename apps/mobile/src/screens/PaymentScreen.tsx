import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";

import { usePaymentByBooking, usePresignProof, useStayInfo, useUploadProof } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView } from "../components/States";
import type { RootStackParamList } from "../../App";

type PaymentRoute = RouteProp<RootStackParamList, "Payment">;

const STATUS_KEYS: Record<string, string> = {
  pending: "payStatusPending",
  proof_uploaded: "payStatusProofUploaded",
  verified: "payStatusVerified",
  rejected: "payStatusRejected",
  cancelled: "payStatusCancelled",
  refund_pending: "payStatusRefundPending",
  refunded: "payStatusRefunded",
};

const UPLOADABLE_STATUSES = new Set<string>(["pending", "rejected"]);
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
}

export function PaymentScreen() {
  const { t, locale } = useLocale();
  const route = useRoute<PaymentRoute>();
  const { bookingId } = route.params;

  const stayQuery = useStayInfo(bookingId);
  const paymentQuery = usePaymentByBooking(bookingId);
  const presign = usePresignProof();
  const uploadProof = useUploadProof();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const payment = paymentQuery.data;
  const paymentNotFound =
    axios.isAxiosError(paymentQuery.error) &&
    paymentQuery.error.response?.status === 404;

  const handleFile = async (file: PickedFile) => {
    if (!payment) return;
    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.mimeType)) {
      setUploadError(t("payInvalidType"));
      return;
    }
    if (file.size !== null && file.size > MAX_FILE_SIZE) {
      setUploadError(t("payFileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const presigned = await presign.mutateAsync({
        paymentId: payment.id,
        filename: file.name,
        contentType: file.mimeType,
      });

      const blob = await (await fetch(file.uri)).blob();
      const putResponse = await fetch(presigned.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.mimeType },
        body: blob,
      });
      if (!putResponse.ok) {
        throw new Error(`S3 upload failed: ${putResponse.status}`);
      }

      await uploadProof.mutateAsync({
        paymentId: payment.id,
        s3Key: presigned.proof_key,
        url: presigned.upload_url.split("?")[0],
      });
      Alert.alert(t("payUploadSuccess"));
    } catch {
      setUploadError(t("payUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await handleFile({
      uri: asset.uri,
      name: asset.fileName ?? `receipt_${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize ?? null,
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await handleFile({
      uri: asset.uri,
      name: asset.name ?? `receipt_${Date.now()}.pdf`,
      mimeType: asset.mimeType ?? "application/pdf",
      size: asset.size ?? null,
    });
  };

  if (stayQuery.isLoading || paymentQuery.isLoading) return <LoadingSpinner />;

  if (paymentNotFound) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.infoTitle}>{t("payNoPaymentYet")}</Text>
        <Text style={styles.infoHint}>{t("payNoPaymentHint")}</Text>
      </View>
    );
  }

  if (stayQuery.error || !stayQuery.data || paymentQuery.error || !payment) {
    return <ErrorView message={t("loadStayError")} onRetry={() => {
      stayQuery.refetch();
      paymentQuery.refetch();
    }} />;
  }

  const { booking, property } = stayQuery.data;
  const canUpload = UPLOADABLE_STATUSES.has(payment.status);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const deadlineText = payment.payment_deadline_at
    ? new Date(payment.payment_deadline_at).toLocaleString(dateLocale)
    : null;
  const attemptsRemaining = Math.max(0, 3 - (payment.proof_rejection_count ?? 0));
  const showFee = (payment.guest_service_fee_egp ?? 0) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("paymentStatus")}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {t(STATUS_KEYS[payment.status] ?? payment.status)}
          </Text>
        </View>
        {payment.reject_reason && (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectLabel}>{t("payRejectedReason")}</Text>
            <Text style={styles.bodyText}>{payment.reject_reason}</Text>
          </View>
        )}
      </View>

      {canUpload && deadlineText && (
        <View style={styles.deadlineBanner}>
          <Text style={styles.deadlineText}>
            {t("payDeadlineWarning").replace("{deadline}", deadlineText)}
          </Text>
        </View>
      )}

      {canUpload && (payment.proof_rejection_count ?? 0) > 0 && (
        <Text style={styles.metaText}>
          {t("payAttemptsRemaining").replace("{count}", String(attemptsRemaining))}
        </Text>
      )}

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("paySummary")}</Text>
        {property.title && <Text style={styles.propertyTitle}>{property.title}</Text>}
        <Row label={t("payReference")} value={payment.reference_number} mono />
        <Row label={t("payCheckIn")} value={booking.check_in} />
        <Row label={t("payCheckOut")} value={booking.check_out} />
        <Row label={t("payNights")} value={String(payment.nights)} />
        {payment.accommodation_amount_egp != null && (
          <Row
            label={t("payAccommodation")}
            value={`${payment.accommodation_amount_egp.toLocaleString()} ${t("egp")}`}
          />
        )}
        {showFee && (
          <Row
            label={t("payServiceFee")}
            value={`${payment.guest_service_fee_egp?.toLocaleString()} ${t("egp")}`}
          />
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t("payTotal")}</Text>
          <Text style={styles.totalValue}>
            {payment.amount_egp.toLocaleString()} {t("egp")}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {canUpload && payment.instructions ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payInstructions")}</Text>
          <Text style={styles.bodyText}>{payment.instructions}</Text>
        </View>
      ) : null}

      {/* Proof upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("payUploadTitle")}</Text>
        {canUpload && (
          <Text style={styles.metaText}>{t("payUploadHint")}</Text>
        )}

        {payment.proof_url && !payment.proof_url.endsWith(".pdf") && (
          <View style={styles.proofBox}>
            <Text style={styles.metaText}>{t("payCurrentProof")}</Text>
            <Image
              source={{ uri: payment.proof_url }}
              style={styles.proofImage}
              resizeMode="contain"
            />
          </View>
        )}

        {canUpload ? (
          <View style={styles.uploadButtons}>
            <Pressable
              style={[styles.primaryButton, uploading && styles.disabledButton]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Text style={styles.primaryButtonText}>
                {uploading ? t("payUploading") : t("paySelectImage")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, uploading && styles.disabledButton]}
              onPress={pickDocument}
              disabled={uploading}
            >
              <Text style={styles.secondaryButtonText}>{t("paySelectDocument")}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.mutedText}>{t("payUploadDisabled")}</Text>
        )}

        {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]}>{value}</Text>
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  infoHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
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
  rejectBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  rejectLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.error,
    marginBottom: spacing.xs,
  },
  deadlineBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deadlineText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.warning,
  },
  propertyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  mono: {
    fontFamily: "monospace",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 22,
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
  proofBox: {
    marginBottom: spacing.md,
  },
  proofImage: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  uploadButtons: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.sm,
  },
});
