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
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useCreatePhoto,
  useDeletePhoto,
  useHostListingDetail,
  usePresignPhoto,
  useSetCoverPhoto,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { HostListingPhoto } from "../../lib/types";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PhotosRoute = RouteProp<RootStackParamList, "HostListingPhotos">;

export function HostListingPhotosScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PhotosRoute>();
  const unitId = route.params.unitId;
  const { data: listing, isLoading, isError, refetch } = useHostListingDetail(unitId);
  const presignMut = usePresignPhoto();
  const createPhotoMut = useCreatePhoto();
  const deleteMut = useDeletePhoto();
  const coverMut = useSetCoverPhoto();
  const [busy, setBusy] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !listing) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const canEdit = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin" ||
    listing.permission_scope === "full_access";

  const photos = listing.photos;

  const handleAddPhoto = async () => {
    // In a real app, this would use an image picker + presigned URL upload.
    // For now, we simulate with a placeholder URL since the mobile app
    // doesn't have an image picker library installed.
    Alert.alert(
      t("listingAddPhoto"),
      "Photo upload requires an image picker. This is a placeholder — connect your image picker library here.",
      [{ text: t("listingCancel"), style: "cancel" }]
    );
  };

  const handleDelete = (photoId: string) => {
    Alert.alert(t("listingConfirm"), t("listingDeleteConfirm"), [
      { text: t("listingCancel"), style: "cancel" },
      {
        text: t("listingConfirm"),
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await deleteMut.mutateAsync({ unitId, photoId });
          } catch {
            Alert.alert(t("listingUploadError"));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleSetCover = async (photoId: string) => {
    setBusy(true);
    try {
      await coverMut.mutateAsync({ unitId, photoId });
    } catch {
      Alert.alert(t("listingSaveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("listingPhotos")}</Text>
        <Text style={styles.subtitle}>
          {t("listingPhotoCount").replace("{count}", String(photos.length))}
        </Text>
      </View>

      {canEdit && (
        <Pressable
          style={[styles.addButton, busy && styles.addButtonDisabled]}
          disabled={busy}
          onPress={handleAddPhoto}
        >
          <Text style={styles.addButtonText}>+ {t("listingAddPhoto")}</Text>
        </Pressable>
      )}

      {photos.length === 0 ? (
        <EmptyView title={t("listingNoPhotos")} />
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((photo: HostListingPhoto) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.url }} style={styles.photoImage} />
              {photo.is_cover && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Cover</Text>
                </View>
              )}
              {canEdit && (
                <View style={styles.photoActions}>
                  {!photo.is_cover && (
                    <Pressable
                      style={styles.photoAction}
                      disabled={busy}
                      onPress={() => handleSetCover(photo.id)}
                    >
                      <Text style={styles.photoActionText}>{t("listingSetCover")}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.photoAction, styles.photoActionDanger]}
                    disabled={busy}
                    onPress={() => handleDelete(photo.id)}
                  >
                    <Text style={styles.photoActionDangerText}>{t("listingDeletePhoto")}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  photoGrid: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: {
    width: "100%",
    height: 200,
  },
  coverBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  coverBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  photoActions: {
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  photoAction: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  photoActionText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
  },
  photoActionDanger: {
    borderColor: colors.error,
  },
  photoActionDangerText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: "600",
  },
});
