import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Generic second-level menu: the account/ops hubs push here with a title
 * and a list of destinations, so each section becomes a real submenu
 * (Main menu → Submenu → destination) instead of one long link list.
 */
export function MenuGroupScreen() {
  const { isRTL } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, "MenuGroup">>();
  const { items } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => navigation.navigate(item.route as never)}
          accessibilityRole="button"
        >
          {item.icon ? (
            <View style={styles.iconWrap}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.accentText}
              />
            </View>
          ) : null}
          <Text style={styles.rowText}>{item.label}</Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.surface },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
});
