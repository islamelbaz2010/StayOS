import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useListingDetail, useListingPhotos, useListingReviews, useSimilarListings, useToggleFavorite, useFavorites } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../components/States";
import { ListingCard } from "../components/ListingCard";
import { RatingBadge } from "../components/RatingBadge";
import { ReviewsList } from "../components/ReviewsList";
import { addRecentlyViewed } from "../lib/recentlyViewed";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "ListingDetail">;

function getCancellationLabel(policy: string, t: (key: string) => string): string {
  const p = policy?.toUpperCase() || "FLEXIBLE";
  if (p === "MODERATE") return t("cancellationModerate");
  if (p === "STRICT") return t("cancellationStrict");
  return t("cancellationFlexible");
}

function getCulturalTagLabel(tag: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    FAMILY_ONLY: "عائلات فقط",
    HALAL_CERTIFIED: "حلال",
    MIXED: "مختلط",
    COUPLES_WELCOME: "مرحب بالأزواج",
  };
  return labels[tag.toUpperCase()] || tag.replace(/_/g, " ").toLowerCase();
}

function GalleryImage({ uri, width }: { uri: string; width: number }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.galleryImage, { width }, styles.placeholder]}>
        <Text style={styles.placeholderText}>{t("appName")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.galleryImage, { width }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading && (
        <View style={styles.imageLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

export function ListingDetailScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const unitId = route.params?.unitId || "";
  const hasMapKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

  const { data: listing, isLoading, isError, refetch } = useListingDetail(unitId);
  const { data: photos } = useListingPhotos(unitId);
  const { data: reviews } = useListingReviews(unitId);
  const { data: similar } = useSimilarListings(unitId);
  const { data: favorites } = useFavorites();
  const toggleFav = useToggleFavorite();

  const isFavorite = favorites?.data?.some((f: { id: string }) => f.id === unitId);

  useEffect(() => {
    if (listing) addRecentlyViewed(listing);
  }, [listing]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !listing) return <ErrorView onRetry={() => refetch()} />;

  const title = locale === "ar" ? listing.title_ar || listing.title : listing.title_en || listing.title;
  const description = locale === "ar" ? listing.description_ar || listing.description : listing.description_en || listing.description;

  const { width: windowWidth } = Dimensions.get("window");

  const galleryImages = photos && photos.length > 0
    ? photos.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order).map((p: { url: string }) => p.url)
    : listing.cover_image
      ? [listing.cover_image]
      : [];

  const handleBook = () => {
    navigation.navigate("Booking", { unitId, title, price: listing.price, currency: listing.currency, maxGuests: listing.max_guests });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gallery}>
          {galleryImages.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {galleryImages.map((uri: string, i: number) => (
                <GalleryImage key={i} uri={uri} width={windowWidth} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, { width: windowWidth }, styles.placeholder]}>
              <Text style={styles.placeholderText}>{t("appName")}</Text>
            </View>
          )}
          <Pressable
            style={styles.heartButton}
            onPress={() => toggleFav.mutate(unitId)}
            hitSlop={12}
          >
            <Text style={styles.heart}>{isFavorite ? "♥" : "♡"}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.location}>
              {listing.district ? `${listing.district} ` : ""}{listing.city}, {listing.governorate}
            </Text>
            <RatingBadge averageRating={listing.average_rating} reviewCount={listing.review_count} size="md" />
          </View>

          <View style={styles.statsRow}>
            <Stat icon="🛏" value={`${listing.bedrooms}`} label={t("bedrooms")} />
            <Stat icon="🚿" value={`${listing.bathrooms}`} label={t("bathrooms")} />
            <Stat icon="👤" value={`${listing.max_guests}`} label={t("maxGuests")} />
          </View>

          {listing.host_display_name && (
            <Pressable
              style={styles.hostRow}
              onPress={() => navigation.navigate("HostProfile", { hostId: listing.host_id })}
            >
              <Text style={styles.hostLabel}>{t("profile")}: </Text>
              <Text style={styles.hostName}>{listing.host_display_name}</Text>
              {listing.host_kyc_status === "verified" && (
                <Text style={styles.verifiedBadge}> ✓ {t("verified")}</Text>
              )}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}

          <Section title={t("description")}>
            <Text style={styles.bodyText}>{description}</Text>
          </Section>

          {listing.amenities.length > 0 && (
            <Section title={t("amenities")}>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((a: string) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{a.replace(/_/g, " ").toLowerCase()}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {listing.cultural_tags.length > 0 && (
            <Section title={t("filters")}>
              <View style={styles.amenitiesGrid}>
                {listing.cultural_tags.map((tag: string) => (
                  <View key={tag} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{getCulturalTagLabel(tag, t)}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          <Section
            title={`${t("reviews")}${listing.review_count ? ` (${listing.review_count})` : ""}`}
          >
            <ReviewsList reviews={reviews?.data || []} />
          </Section>

          <Section title={t("location")}>
            <Text style={styles.addressText}>
              {listing.district ? `${listing.district}, ` : ""}{listing.city}, {listing.governorate}
            </Text>
            {hasMapKey ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: listing.lat,
                  longitude: listing.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: listing.lat, longitude: listing.lng }}
                  title={title}
                />
              </MapView>
            ) : (
              <View style={styles.map}>
                <EmptyView title={t("noMapKey")} />
              </View>
            )}
          </Section>

          {listing.house_rules && (
            <Section title={t("houseRules")}>
              <Text style={styles.bodyText}>{listing.house_rules}</Text>
            </Section>
          )}

          <Section title={t("cancellationPolicy")}>
            <Text style={styles.bodyText}>{getCancellationLabel(listing.cancellation_policy, t)}</Text>
          </Section>

          {similar && similar.length > 0 && (
            <Section title={t("similarProperties")}>
              {similar.map((s: any) => (
                <ListingCard
                  key={s.id}
                  listing={s}
                  onPress={(id: string) => navigation.navigate("ListingDetail", { unitId: id })}
                />
              ))}
            </Section>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bookingBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View>
          <Text style={styles.bookingPrice}>
            {listing.price} {listing.currency}
          </Text>
          <Text style={styles.bookingPerNight}>{t("perNight")}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBook}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>{t("bookNow")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  gallery: {
    position: "relative",
    height: 280,
  },
  galleryImage: {
    height: 280,
    overflow: "hidden",
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: fontSize.xl,
  },
  heartButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.full,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    fontSize: 22,
    color: colors.error,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  hostLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  hostName: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  verifiedBadge: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: "600",
  },
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.text,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary50,
    borderRadius: radius.sm,
  },
  amenityText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textTransform: "capitalize",
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  map: {
    height: 200,
    borderRadius: radius.md,
  },
  bookingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  bookingPrice: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  bookingPerNight: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
