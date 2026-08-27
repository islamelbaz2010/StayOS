import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMe } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { clearTokens } from "../lib/api";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner } from "../components/States";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AccountScreen() {
  const { locale, setLocale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: user, isLoading } = useMe();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>{t("login")}</Text>
        </Pressable>
      </View>
    );
  }

  const handleLogout = async () => {
    await clearTokens();
    navigation.navigate("Home");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.display_name?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.displayName}>{user.display_name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        {user.kyc_status === "verified" && (
          <Text style={styles.verifiedBadge}>✓ {t("verified")}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langButton, locale === "en" && styles.langButtonActive]}
            onPress={() => setLocale("en")}
          >
            <Text style={[styles.langText, locale === "en" && styles.langTextActive]}>
              {t("english")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, locale === "ar" && styles.langButtonActive]}
            onPress={() => setLocale("ar")}
          >
            <Text style={[styles.langText, locale === "ar" && styles.langTextActive]}>
              {t("arabic")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t("logout")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.white,
  },
  displayName: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
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
    marginBottom: spacing.md,
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  langButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  langTextActive: {
    color: colors.white,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginHorizontal: spacing.xl,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  logoutButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.error,
  },
});
