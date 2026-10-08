import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

/**
 * MAKAZOH wordmark — near-black lettering with the "O" rendered as the
 * brand's lime location pin, matching the approved visual reference.
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
    <View style={styles.row} accessibilityLabel="MAKAZOH" accessibilityRole="text">
      <Text style={[styles.word, { fontSize, color: textColor }]}>MAKAZ</Text>
      <View style={[styles.pinWrap, { height: fontSize * 1.15 }]}>
        <Ionicons
          name="location"
          size={fontSize * 1.05}
          color={colors.primary}
          style={styles.pin}
        />
      </View>
      <Text style={[styles.word, { fontSize, color: textColor }]}>H</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    // Latin wordmark must stay LTR inside RTL layouts.
    direction: "ltr",
  },
  word: {
    fontWeight: "900",
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  pinWrap: {
    justifyContent: "flex-end",
    marginHorizontal: -1,
  },
  pin: {
    marginBottom: -2,
  },
});
