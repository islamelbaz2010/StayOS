import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

/**
 * MAKAZOH wordmark — near-black lettering with the "O" rendered as the
 * brand's lime location pin, matching the approved visual reference.
 *
 * Rendered as a single Text run so the latin sequence stays LTR inside
 * RTL layouts (flex children would be reordered by I18nManager's
 * row/row-reverse swap).
 */
export function MakazohMark({
  fontSize = 20,
  light = false,
}: {
  fontSize?: number;
  light?: boolean;
}) {
  const textColor = light ? colors.white : colors.text;
  return (
    <Text
      style={[styles.word, { fontSize, color: textColor }]}
      accessibilityLabel="MAKAZOH"
      accessibilityRole="text"
    >
      MAKAZ
      <Ionicons name="location" size={fontSize * 1.05} color={colors.primary} />
      H
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {
    fontWeight: "900",
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});
