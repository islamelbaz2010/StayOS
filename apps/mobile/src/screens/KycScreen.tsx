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
import * as ImagePicker from "expo-image-picker";

import { useInitiateKyc, useKycStatus, useMe, useSubmitKyc, useUpgradeRole } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView } from "../components/States";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Backend canonical contract (services.DOCUMENT_REQUIRED_SIDES) — used as
// the fallback when the status payload doesn't include required_sides.
const FALLBACK_SIDES: Record<string, string[]> = {
  passport: ["front", "selfie"],
  national_id: ["front", "back", "selfie"],
  driving_license: ["front", "back", "selfie"],
  residence_permit: ["front", "back", "selfie"],
};
const DOC_TYPES = ["passport", "national_id", "driving_license", "residence_permit"];
const SIDE_ORDER = ["front", "back", "selfie"];

interface PickedImage {
  uri: string;
  mimeType: string;
  size: number | null;
}

export function KycScreen() {
  const { t } = useLocale();
  const { data: user } = useMe();
  const { data: kycStatus, isLoading, isError, refetch } = useKycStatus();
  const initiate = useInitiateKyc();
  const submit = useSubmitKyc();
  const upgrade = useUpgradeRole();

  const [docType, setDocType] = useState("national_id");
  const [sides, setSides] = useState<Record<string, PickedImage | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !kycStatus) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const status = kycStatus.kyc_status ?? "unverified";
  const latestDoc = kycStatus.documents?.[0];
  const sidesMap = kycStatus.required_sides && Object.keys(kycStatus.required_sides).length > 0
    ? kycStatus.required_sides
    : FALLBACK_SIDES;
  const requiredSides: string[] = (
    sidesMap[docType] ?? FALLBACK_SIDES[docType] ?? ["front", "selfie"]
  )
    .slice()
    .sort((a: string, b: string) => SIDE_ORDER.indexOf(a) - SIDE_ORDER.indexOf(b));

  const pickImage = async (side: string, useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    if (!ALLOWED_TYPES.has(mimeType)) {
      setError(t("kycInvalidType"));
      return;
    }
    if (asset.fileSize !== undefined && asset.fileSize !== null && asset.fileSize > MAX_FILE_SIZE) {
      setError(t("kycFileTooLarge"));
      return;
    }
    setError(null);
    setSides((prev) => ({ ...prev, [side]: { uri: asset.uri, mimeType, size: asset.fileSize ?? null } }));
  };

  const uploadToS3 = async (url: string, file: PickedImage) => {
    const blob = await (await fetch(file.uri)).blob();
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.mimeType },
      body: blob,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  };

  const allCaptured = requiredSides.every((s: string) => sides[s]);

  const handleSubmit = async () => {
    if (!allCaptured) {
      setError(t("kycBothRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const initiated = await initiate.mutateAsync({ document_type: docType });
      const urls = initiated.upload_urls as unknown as Record<string, string>;
      for (const side of requiredSides) {
        const url = urls[side];
        const file = sides[side];
        if (url && file) await uploadToS3(url, file);
      }
      await submit.mutateAsync(initiated.document_id);
      Alert.alert("", t("kycSubmitted"));
    } catch {
      setError(t("kycSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBecomeHost = async () => {
    try {
      await upgrade.mutateAsync();
      Alert.alert("", t("kycBecomeHostSuccess"));
    } catch {
      setError(t("kycUpgradeFailed"));
    }
  };

  const isGuest = user?.role !== "host" && user?.role !== "admin";
  const sideLabel = (s: string) => t(`kycSide_${s}`);
  const sideHint = (s: string) => t(`kycSide_${s}Hint`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      {status === "verified" && (
        <View style={styles.section}>
          <Text style={styles.successTitle}>{t("kycVerifiedTitle")}</Text>
          <Text style={styles.bodyText}>{t("kycVerifiedMessage")}</Text>
          {isGuest && (
            <Pressable
              style={[styles.primaryButton, upgrade.isPending && styles.disabledButton]}
              onPress={handleBecomeHost}
              disabled={upgrade.isPending}
            >
              <Text style={styles.primaryButtonText}>
                {upgrade.isPending ? t("kycUpgrading") : t("kycBecomeHost")}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {status === "pending" && (
        <View style={styles.section}>
          <Text style={styles.infoTitle}>{t("kycPendingTitle")}</Text>
          <Text style={styles.bodyText}>{t("kycPendingMessage")}</Text>
        </View>
      )}

      {(status === "unverified" || status === "rejected") && (
        <>
          {status === "rejected" && (
            <View style={styles.rejectBanner}>
              <Text style={styles.rejectTitle}>{t("kycRejectedTitle")}</Text>
              <Text style={styles.rejectText}>
                {latestDoc?.rejection_reason || t("kycRejectedMessage")}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("kycInstructions")}</Text>
            <Text style={styles.bodyText}>1. {t("kycStep1")}</Text>
            <Text style={styles.bodyText}>2. {t("kycStep2")}</Text>
            <Text style={styles.bodyText}>3. {t("kycStep3")}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("kycDocType")}</Text>
            <View style={styles.chipRow}>
              {DOC_TYPES.map((dt) => (
                <Pressable
                  key={dt}
                  style={[styles.chip, docType === dt && styles.chipActive]}
                  onPress={() => {
                    setDocType(dt);
                    setSides({});
                  }}
                >
                  <Text style={[styles.chipText, docType === dt && styles.chipTextActive]}>
                    {t(`kycDoc_${dt}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {requiredSides.map((side: string) => (
            <View key={side} style={styles.section}>
              <Text style={styles.sectionTitle}>{sideLabel(side)}</Text>
              <Text style={styles.metaText}>{sideHint(side)}</Text>
              {sides[side] && (
                <Image source={{ uri: sides[side]!.uri }} style={styles.preview} resizeMode="cover" />
              )}
              <View style={styles.pickRow}>
                <Pressable
                  style={[styles.secondaryButton, submitting && styles.disabledButton]}
                  onPress={() => pickImage(side, false)}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryButtonText}>{t("kycPickGallery")}</Text>
                </Pressable>
                <Pressable
                  style={[styles.secondaryButton, submitting && styles.disabledButton]}
                  onPress={() => pickImage(side, true)}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryButtonText}>{t("kycPickCamera")}</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting || !allCaptured}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? t("kycSubmitting") : t("kycSubmit")}
            </Text>
          </Pressable>
        </>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.success,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accentText,
    marginBottom: spacing.sm,
  },
  rejectBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rejectTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.error,
    marginBottom: spacing.xs,
  },
  rejectText: {
    fontSize: fontSize.sm,
    color: colors.text,
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
  preview: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  pickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.accentText,
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
    textAlign: "center",
  },
});
