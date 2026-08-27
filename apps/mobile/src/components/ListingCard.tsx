import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import type { Listing } from "../lib/types";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { useLocale } from "../lib/LocaleContext";

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

  return (
    <Pressable style={styles.card} onPress={() => onPress(listing.id)}>
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
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </>
        )}
        {onToggleFavorite && (
          <Pressable
            style={styles.heartButton}
            onPress={() => onToggleFavorite(listing.id)}
            hitSlop={12}
          >
            <Text style={styles.heart}>{isFavorite ? "♥" : "♡"}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {listing.city}, {listing.governorate}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{listing.bedrooms} {t("bedrooms")}</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{listing.max_guests} {t("guests")}</Text>
        </View>
        <Text style={styles.price}>
          {listing.price} {listing.currency} / {t("perNight")}
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
  imageContainer: {
    position: "relative",
    height: 200,
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
    right: spacing.sm,
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
  info: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
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
