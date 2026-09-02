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
  useArchiveListing,
  useHostListingDetail,
  usePublishListing,
  useSubmitForReview,
  useUnpublishListing,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "HostListingDetail">;

const STATUS_KEYS: Record<string, string> = {
  DRAFT: "listingDraft",
  PENDING_VERIFICATION: "listingPendingReview",
  LISTED: "listingPublished",
  UNLISTED: "listingUnlisted",
  REJECTED: "listingRejected",
  ARCHIVED: "listingArchived",
  SUSPENDED: "listingSuspended",
};

export function HostListingDetailScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const unitId = route.params.unitId;
  const { data: listing, isLoading, isError, refetch } = useHostListingDetail(unitId);
  const publishMut = usePublishListing();
  const unpublishMut = useUnpublishListing();
  const submitMut = useSubmitForReview();
  const archiveMut = useArchiveListing();
  const [actionLoading, setActionLoading] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !listing) {
    return <ErrorView message={t("error")} onRetry={refetch} />;
  }

  const statusLabel = STATUS_KEYS[listing.status] ? t(STATUS_KEYS[listing.status]) : listing.status;
  const isListed = listing.status === "LISTED";
  const isDraft = listing.status === "DRAFT";
  const isUnlisted = listing.status === "UNLISTED";
  const isRejected = listing.status === "REJECTED";
  const isArchived = listing.status === "ARCHIVED";
  const isReady = listing.readiness?.status === "ready";
  const canPublish = (isUnlisted || isDraft || isRejected) && isReady;
  const canEdit = listing.permission_scope === "owner" ||
    listing.permission_scope === "admin" ||
    listing.permission_scope === "full_access";

  const title = listing.title_ar || listing.title_en || t("listingEditor");

  const handleAction = async (
    mut: ReturnType<typeof usePublishListing>,
    confirmMsg: string
  ) => {
    Alert.alert(t("listingConfirm"), confirmMsg, [
      { text: t("listingCancel"), style: "cancel" },
      {
        text: t("listingConfirm"),
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await mut.mutateAsync(unitId);
          } catch {
            Alert.alert(t("listingSaveError"));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover image */}
      {listing.cover_image ? (
        <Image source={{ uri: listing.cover_image }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverImage, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>{t("listingNoPhotos")}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isListed ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, isListed ? styles.statusTextActive : styles.statusTextInactive]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.permissionText}>
            {t("listingPermissionScope")}: {t(`listingPermission${listing.permission_scope.charAt(0).toUpperCase()}${listing.permission_scope.slice(1)}`) || listing.permission_scope}
          </Text>
        </View>
        <Text style={styles.priceText}>
          {listing.base_price_egp} {t("listingEgp")} / {t("listingPerNight")}
        </Text>
      </View>

      {/* Readiness */}
      {listing.readiness && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("listingReadinessSection")}</Text>
          <View style={styles.readinessCard}>
            <View style={[styles.readinessDot, isReady ? styles.dotReady : styles.dotAction]} />
            <Text style={styles.readinessText}>
              {isReady ? t("listingReadyToPublish") : t("listingNotReady")}
            </Text>
          </View>
            {!isReady && listing.readiness.missing_items.length > 0 && (
              <View style={styles.missingList}>
                {listing.readiness.missing_items.map((item: string) => (
                  <Text key={item} style={styles.missingItem}>
                    • {listing.readiness?.missing_item_labels?.[item] || item}
                  </Text>
                ))}
              </View>
            )}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.section}>
        {canPublish && (
          <Pressable
            style={[styles.actionButton, styles.primaryButton]}
            disabled={actionLoading}
            onPress={() => handleAction(publishMut, t("listingUnpublishConfirm"))}
          >
            <Text style={styles.primaryButtonText}>{t("listingPublish")}</Text>
          </Pressable>
        )}
        {isListed && (
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            disabled={actionLoading}
            onPress={() => handleAction(unpublishMut, t("listingUnpublishConfirm"))}
          >
            <Text style={styles.secondaryButtonText}>{t("listingUnpublish")}</Text>
          </Pressable>
        )}
        {(isDraft || isRejected) && (
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            disabled={actionLoading}
            onPress={async () => {
              setActionLoading(true);
              try {
                await submitMut.mutateAsync(unitId);
              } catch {
                Alert.alert(t("listingSaveError"));
              } finally {
                setActionLoading(false);
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>{t("listingSubmitReview")}</Text>
          </Pressable>
        )}
        {!isArchived && canEdit && (
          <Pressable
            style={[styles.actionButton, styles.dangerButton]}
            disabled={actionLoading}
            onPress={() => handleAction(archiveMut, t("listingArchiveConfirm"))}
          >
            <Text style={styles.dangerButtonText}>{t("listingArchive")}</Text>
          </Pressable>
        )}
      </View>

      {/* Management sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingBasics")}</Text>
        <SectionRow
          label={t("listingEditDetails")}
          onPress={() => navigation.navigate("HostListingEditor", { unitId, section: "basics" })}
        />
        <SectionRow
          label={t("listingManagePhotos")}
          value={t("listingPhotoCount").replace("{count}", String(listing.photos.length))}
          onPress={() => navigation.navigate("HostListingPhotos", { unitId })}
        />
        <SectionRow
          label={t("listingManageAvailability")}
          onPress={() => navigation.navigate("HostListingAvailability", { unitId })}
        />
        {canEdit && (
          <SectionRow
            label={t("listingManageCoHosts")}
            onPress={() => navigation.navigate("HostListingCoHosts", { unitId })}
          />
        )}
      </View>

      {/* Property summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingCapacity")}</Text>
        <View style={styles.summaryRow}>
          <SummaryItem label={t("maxGuests")} value={String(listing.max_guests)} />
          <SummaryItem label={t("bedrooms")} value={String(listing.bedrooms)} />
          <SummaryItem label={t("bathrooms")} value={String(listing.bathrooms)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("listingLocation")}</Text>
        <Text style={styles.summaryText}>
          {listing.address ? `${listing.address}, ` : ""}
          {listing.district ? `${listing.district}, ` : ""}
          {listing.city}, {listing.governorate}
        </Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate("ListingDetail", { unitId })}
        >
          <Text style={styles.secondaryButtonText}>{t("listingViewAsGuest")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.sectionRow} onPress={onPress}>
      <Text style={styles.sectionRowLabel}>{label}</Text>
      <View style={styles.sectionRowRight}>
        {value && <Text style={styles.sectionRowValue}>{value}</Text>}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coverImage: {
    width: "100%",
    height: 220,
  },
  coverPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    flexWrap: "wrap",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  statusInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  statusTextActive: { color: colors.primary },
  statusTextInactive: { color: colors.textSecondary },
  permissionText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  priceText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  readinessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  readinessDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotReady: { backgroundColor: colors.success },
  dotAction: { backgroundColor: colors.warning },
  readinessText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  missingList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  missingItem: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionRowLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  sectionRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionRowValue: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textTertiary,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
