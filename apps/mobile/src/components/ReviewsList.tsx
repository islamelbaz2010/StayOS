import { StyleSheet, Text, View } from "react-native";
import type { Review } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
  });
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  const { t, locale } = useLocale();

  if (reviews.length === 0) {
    return <Text style={styles.empty}>{t("noReviewsYet")}</Text>;
  }

  return (
    <View style={styles.list}>
      {reviews.map((review) => (
        <View key={review.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.name}>{review.guest_display_name || t("guest")}</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Text key={i} style={i < review.rating ? styles.starFilled : styles.starEmpty}>
                  ★
                </Text>
              ))}
            </View>
          </View>
          <Text style={styles.date}>{formatDate(review.created_at, locale)}</Text>
          {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  stars: {
    flexDirection: "row",
  },
  starFilled: {
    color: colors.star,
    fontSize: fontSize.sm,
  },
  starEmpty: {
    color: colors.border,
    fontSize: fontSize.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  comment: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
