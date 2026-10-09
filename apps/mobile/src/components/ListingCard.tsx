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
            <Ionicons name="checkmark-circle" size={12} color={colors.onPrimary} />
            <Text style={styles.verifiedText}>{t("verified")}</Text>
          </View>
        )}
        {listing.available_for_dates && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>{t("availableForDates")}</Text>
          </View>
        )}
        {onToggleFavorite && (
          <Pressable
            style={styles.heartButton}
            onPress={handleToggleFavorite}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("favorites")}
          >
            <Animated.Text style={[styles.heart, { transform: [{ scale: heartScale }] }]}>
              {isFavorite ? "♥" : "♡"}
            </Animated.Text>
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
        <View style={styles.stats}>
          <Text style={styles.stat}>{listing.max_guests} {t("guests")}</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{listing.bedrooms} {t("bedrooms")}</Text>
          {listing.beds != null && listing.beds > 0 && (
            <>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.stat}>{listing.beds} {t("bedsLabel")}</Text>
            </>
          )}
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>{listing.bathrooms} {t("bathrooms")}</Text>
        </View>
        <Text style={styles.price}>
          {formatMoney(listing.price, currencyLabel(listing.currency, t("egp")))} / {t("perNight")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
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
  heartButton: {
    position: "absolute",
    top: spacing.sm,
    end: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    fontSize: 20,
    color: colors.error,
  },
  verifiedBadge: {
    position: "absolute",
    top: spacing.sm,
    start: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  availableBadge: {
    position: "absolute",
    bottom: spacing.sm,
    start: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  availableText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.white,
  },
  info: {
    padding: spacing.md,
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
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statDot: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
});
