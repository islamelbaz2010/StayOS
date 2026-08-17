import { ScrollView, StyleSheet, Text, View, Image, Pressable, Dimensions } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";
import { useListingDetail, useListingPhotos, useSimilarListings, useToggleFavorite, useFavorites, useCreateBooking } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../components/States";
import { ListingCard } from "../components/ListingCard";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "ListingDetail">;

export function ListingDetailScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const unitId = route.params?.unitId || "";
  const hasMapKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

  const { data: listing, isLoading, isError, refetch } = useListingDetail(unitId);
  const { data: photos } = useListingPhotos(unitId);
  const { data: similar } = useSimilarListings(unitId);
  const { data: favorites } = useFavorites();
  const toggleFav = useToggleFavorite();
  const createBooking = useCreateBooking();

  const isFavorite = favorites?.data?.some((f: { id: string }) => f.id === unitId);

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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.gallery}>
          {galleryImages.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {galleryImages.map((uri: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.galleryImage, { width: windowWidth }]}
                  resizeMode="cover"
                  onError={() => {}}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.placeholder]}>
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
          <Text style={styles.location}>
            {listing.district ? `${listing.district} ` : ""}{listing.city}, {listing.governorate}
          </Text>

          <View style={styles.statsRow}>
            <Stat icon="🛏" value={`${listing.bedrooms}`} label={t("bedrooms")} />
            <Stat icon="🚿" value={`${listing.bathrooms}`} label={t("bathrooms")} />
            <Stat icon="👤" value={`${listing.max_guests}`} label={t("maxGuests")} />
          </View>

          {listing.host_display_name && (
            <View style={styles.hostRow}>
              <Text style={styles.hostLabel}>{t("profile")}: </Text>
              <Text style={styles.hostName}>{listing.host_display_name}</Text>
              {listing.host_kyc_status === "verified" && (
                <Text style={styles.verifiedBadge}> ✓ {t("verified")}</Text>
              )}
            </View>
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

      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.bookingPrice}>
            {listing.price} {listing.currency}
          </Text>
          <Text style={styles.bookingPerNight}>{t("perNight")}</Text>
        </View>
        <Pressable style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>{t("bookNow")}</Text>
        </Pressable>
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
  gallery: {
    position: "relative",
    height: 280,
  },
  galleryImage: {
    width: 400,
    height: 280,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    width: "100%",
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
    paddingBottom: 100,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
