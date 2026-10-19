import { useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Listing } from "../lib/types";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { useLocale } from "../lib/LocaleContext";
import { RatingBadge } from "./RatingBadge";
import { currencyLabel, formatMoney } from "../lib/money";
import { usePrefersReducedMotion } from "../lib/motion";

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function ListingCard({ listing, onPress, isFavorite, onToggleFavorite }: ListingCardProps) {
  const { locale, t } = useLocale();
  const title = locale === "ar" ? listing.title_ar || listing.title : listing.title_en || listing.title;
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const showPlaceholder = !listing.cover_image || imageFailed;
  const heartScale = useRef(new Animated.Value(1)).current;
  const reducedMotion = usePrefersReducedMotion();

  const handleToggleFavorite = () => {
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.35, duration: 110, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    onToggleFavorite?.(listing.id);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(listing.id)}
    >
      <View style={styles.imageContainer}>
        {showPlaceholder ? (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{t("appName")}</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: listing.cover_image as string }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageFailed(true);
              }}
            />
            {imageLoading && (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="small" color={colors.accentText} />
              </View>
            )}
          </>
        )}
        {listing.host_kyc_status === "verified" && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.accentText} />
            <Text style={styles.verifiedText}>{t("verified")}</Text>
          </View>
        )}
        {listing.available_for_dates && (
          <View style={[styles.verifiedBadge, styles.availableBadge]}>
            <Text style={styles.verifiedText}>{t("availableForDates")}</Text>
          </View>
        )}
        {onToggleFavorite && (
          <Pressable
            style={styles.heartButton}
            onPress={handleToggleFavorite}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={t("favorites")}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isFavorite ? "heart" : "heart"}
                size={24}
                color={isFavorite ? colors.primary : colors.white}
                style={styles.heartIcon}
              />
            </Animated.View>
          </Pressable>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <RatingBadge averageRating={listing.average_rating} reviewCount={listing.review_count} />
        </View>
        <Text style={styles.location} numberOfLines={1}>
          {listing.city}, {listing.governorate}
        </Text>
        <Text style={styles.stat} numberOfLines={1}>
          {[
            `${listing.max_guests} ${t("guests")}`,
            `${listing.bedrooms} ${t("bedrooms")}`,
            listing.beds != null && listing.beds > 0 ? `${listing.beds} ${t("bedsLabel")}` : null,
            `${listing.bathrooms} ${t("bathrooms")}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={styles.priceLine} numberOfLines={1}>
          <Text style={styles.priceAmount}>
            {formatMoney(listing.price, currencyLabel(listing.currency, t("egp")))}
          </Text>
          <Text style={styles.priceUnit}> {t("perNight")}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Flat photo-first card (Airbnb reference): no container chrome, no
  // shadow — the image and whitespace carry the card.
  card: {
    marginBottom: spacing.lg,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: fontSize.lg,
  },
  // Reference wishlist heart: transparent hit-area, white heart with a
  // soft photo-legibility shadow, lime fill when saved.
  heartButton: {
    position: "absolute",
    top: spacing.xs,
    end: spacing.xs,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  // White overlay pill — the reference "Guest favorite" badge pattern.
  verifiedBadge: {
    position: "absolute",
    top: spacing.sm,
    start: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  availableBadge: {
    top: spacing.sm + 32,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.text,
  },
  // Metadata sits directly under the image — tight, no padding chrome.
  info: {
    paddingTop: spacing.md,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceLine: {
    marginTop: spacing.xs,
  },
  priceAmount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  priceUnit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
