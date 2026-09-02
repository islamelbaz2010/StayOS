import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize } from "../lib/theme";
import { useLocale } from "../lib/LocaleContext";

interface RatingBadgeProps {
  averageRating?: number | null;
  reviewCount?: number;
  size?: "sm" | "md";
}

export function RatingBadge({ averageRating, reviewCount = 0, size = "sm" }: RatingBadgeProps) {
  const { t } = useLocale();
  const textStyle = size === "md" ? styles.textMd : styles.textSm;

  if (!averageRating || reviewCount === 0) {
    return (
      <View style={styles.row}>
        <Text style={[textStyle, styles.newText]}>{t("newListing")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={[textStyle, styles.star]}>★</Text>
      <Text style={textStyle}>{averageRating.toFixed(2)}</Text>
      <Text style={[textStyle, styles.count]}>({reviewCount})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  textSm: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  textMd: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  star: {
    color: colors.star,
  },
  count: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  newText: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
