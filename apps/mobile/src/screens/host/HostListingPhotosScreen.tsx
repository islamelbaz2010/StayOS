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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  useCreatePhoto,
  useDeletePhoto,
  useHostListingDetail,
  usePresignPhoto,
  useReorderPhotos,
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
  const reorderMut = useReorderPhotos();
  const [busy, setBusy] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !listing) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const canEdit = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin" ||
    listing.permission_scope === "full_access";

  const photos = [...listing.photos].sort(
    (a, b) => a.display_order - b.display_order
  );

  // Same three-step upload as the web PhotoUpload: presign → PUT to the
  // presigned URL → POST the stored photo record.
  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;

    setBusy(true);
    try {
      let order = photos.length;
      for (const asset of result.assets) {
        const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
        const contentType = asset.mimeType ?? "image/jpeg";
        const presign = await presignMut.mutateAsync({
          unitId,
          filename,
          contentType,
        });
        const upload = await FileSystem.uploadAsync(
          presign.upload_url,
          asset.uri,
          {
            httpMethod: "PUT",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: { "Content-Type": contentType },
          }
        );
        if (upload.status < 200 || upload.status >= 300) {
          throw new Error(`Upload failed: ${upload.status}`);
        }
        await createPhotoMut.mutateAsync({
          unitId,
          payload: {
            s3_key: presign.photo_key,
            url: presign.upload_url.split("?")[0],
            is_cover: order === 0,
            display_order: order,
          },
        });
        order += 1;
      }
    } catch {
      Alert.alert(t("listingUploadError"));
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const a = photos[index];
    const b = photos[target];
    setBusy(true);
    try {
      await reorderMut.mutateAsync({
        unitId,
        photoOrders: [
          { photo_id: a.id, display_order: b.display_order },
          { photo_id: b.id, display_order: a.display_order },
        ],
      });
    } catch {
      Alert.alert(t("listingSaveError"));
    } finally {
      setBusy(false);
    }
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
          {photos.map((photo: HostListingPhoto, index: number) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.url }} style={styles.photoImage} />
              {photo.is_cover && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Cover</Text>
                </View>
              )}
              {canEdit && (
                <View style={styles.photoActions}>
                  {index > 0 && (
                    <Pressable
                      style={styles.photoAction}
                      disabled={busy}
                      accessibilityLabel={t("listingMoveEarlier")}
                      onPress={() => handleMove(index, -1)}
                    >
                      <Ionicons name="arrow-up" size={16} color={colors.text} />
                    </Pressable>
                  )}
                  {index < photos.length - 1 && (
                    <Pressable
                      style={styles.photoAction}
                      disabled={busy}
                      accessibilityLabel={t("listingMoveLater")}
                      onPress={() => handleMove(index, 1)}
                    >
                      <Ionicons name="arrow-down" size={16} color={colors.text} />
                    </Pressable>
                  )}
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
    color: colors.onPrimary,
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
    color: colors.onPrimary,
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
