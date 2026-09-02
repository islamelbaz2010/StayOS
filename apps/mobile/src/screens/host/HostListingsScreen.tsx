import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostListings, useListingReadiness } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../../components/States";
import type { RootStackParamList } from "../../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "listingsDraft",
  PENDING_VERIFICATION: "listingsPending",
  LISTED: "listingsListed",
  UNLISTED: "listingsUnlisted",
  ARCHIVED: "listingsArchived",
  REJECTED: "listingRejected",
  SUSPENDED: "listingSuspended",
};

export function HostListingsScreen() {
  const { t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: listings, isLoading, isError, refetch } = useHostListings();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={t("error")} onRetry={refetch} />;
  if (!listings || listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyView title={t("listingsNoListings")} subtitle={t("listingsCreateNew")} />
        <Pressable
          style={styles.createButton}
          onPress={() => navigation.navigate("HostCreateListing")}
        >
          <Text style={styles.createButtonText}>+ {t("listingCreateNew")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t("hostListings")}</Text>
          <Text style={styles.subtitle}>
            {t("listingsTotal").replace("{count}", String(listings.length))}
          </Text>
        </View>
        <Pressable
          style={styles.createButtonSmall}
          onPress={() => navigation.navigate("HostCreateListing")}
        >
          <Text style={styles.createButtonTextSmall}>+</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {listings.map((listing: typeof listings[number]) => (
          <ListingCard key={listing.id} listing={listing} t={t} navigation={navigation} />
        ))}
      </View>
    </ScrollView>
  );
}

function ListingCard({
  listing,
  t,
  navigation,
}: {
  listing: {
    id: string;
    title_ar?: string;
    title_en?: string | null;
    title: string;
    status: string;
    base_price_egp: number;
    cover_image?: string | null;
  };
  t: (key: string) => string;
  navigation: Nav;
}) {
  const { data: readiness } = useListingReadiness(listing.id);
  const title = listing.title_ar || listing.title_en || listing.title;
  const statusLabel = STATUS_LABELS[listing.status] ? t(STATUS_LABELS[listing.status]) : listing.status;
  const isReady = readiness?.status === "ready";
  const isListed = listing.status === "LISTED";

  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate("HostListingDetail", { unitId: listing.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <View style={[styles.statusBadge, isListed ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, isListed ? styles.statusTextActive : styles.statusTextInactive]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.priceText}>
        {listing.base_price_egp} {t("egp")} / {t("perNight")}
      </Text>

      {readiness && (
        <View style={styles.readinessRow}>
          <View style={[styles.readinessDot, isReady ? styles.readinessReady : styles.readinessAction]} />
          <Text style={styles.readinessText}>
            {isReady
              ? t("listingsReady")
              : t("listingsMissingItems").replace("{count}", String(readiness.missing_items.length))}
          </Text>
          {!isReady && readiness.missing_items.length > 0 && (
            <Text style={styles.missingItems} numberOfLines={1}>
              {readiness.missing_items.join(", ")}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  createButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  createButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonTextSmall: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
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
  statusTextActive: {
    color: colors.primary,
  },
  statusTextInactive: {
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  readinessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  readinessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readinessReady: {
    backgroundColor: colors.success,
  },
  readinessAction: {
    backgroundColor: colors.warning,
  },
  readinessText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  missingItems: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    flex: 1,
  },
});
