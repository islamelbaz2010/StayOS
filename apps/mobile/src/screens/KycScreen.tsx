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

type Side = "front" | "selfie";

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

  const [front, setFront] = useState<PickedImage | null>(null);
  const [selfie, setSelfie] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !kycStatus) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const status = kycStatus.kyc_status ?? "unverified";
  const latestDoc = kycStatus.documents?.[0];

  const pickImage = async (side: Side, useCamera: boolean) => {
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
    const picked: PickedImage = { uri: asset.uri, mimeType, size: asset.fileSize ?? null };
    if (side === "front") setFront(picked);
    else setSelfie(picked);
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

  const handleSubmit = async () => {
    if (!front || !selfie) {
      setError(t("kycBothRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const initiated = await initiate.mutateAsync({ document_type: "national_id" });
      await uploadToS3(initiated.upload_urls.front, front);
      await uploadToS3(initiated.upload_urls.selfie, selfie);
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
            <Text style={styles.sectionTitle}>{t("kycFrontId")}</Text>
            <Text style={styles.metaText}>{t("kycFrontIdHint")}</Text>
            {front && (
              <Image source={{ uri: front.uri }} style={styles.preview} resizeMode="cover" />
            )}
            <View style={styles.pickRow}>
              <Pressable
                style={[styles.secondaryButton, submitting && styles.disabledButton]}
                onPress={() => pickImage("front", false)}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>{t("kycPickGallery")}</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, submitting && styles.disabledButton]}
                onPress={() => pickImage("front", true)}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>{t("kycPickCamera")}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("kycSelfie")}</Text>
            <Text style={styles.metaText}>{t("kycSelfieHint")}</Text>
            {selfie && (
              <Image source={{ uri: selfie.uri }} style={styles.preview} resizeMode="cover" />
            )}
            <View style={styles.pickRow}>
              <Pressable
                style={[styles.secondaryButton, submitting && styles.disabledButton]}
                onPress={() => pickImage("selfie", true)}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>{t("kycPickCamera")}</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, submitting && styles.disabledButton]}
                onPress={() => pickImage("selfie", false)}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>{t("kycPickGallery")}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
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
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.success,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
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
    color: colors.white,
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
    textAlign: "center",
  },
});
