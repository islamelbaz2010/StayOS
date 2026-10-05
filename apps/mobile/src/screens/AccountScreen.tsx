import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { useMe, useNotifications, useUpgradeRole, useHasTokens } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { api, clearTokens, getRefreshToken } from "../lib/api";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner } from "../components/States";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function MenuRow({ label, onPress, badge }: { label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function AccountScreen() {
  const { locale, setLocale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const { data: notifs } = useNotifications();
  const upgradeRole = useUpgradeRole();
  const authed = useHasTokens();

  if (!authed) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginButtonText}>{t("login")}</Text>
        </Pressable>
        <Pressable
          style={[styles.loginButton, styles.registerButton]}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.loginButtonText}>{t("createAccount")}</Text>
        </Pressable>
        <Pressable
          style={styles.helpLink}
          onPress={() => navigation.navigate("HelpCenter")}
        >
          <Text style={styles.helpLinkText}>{t("helpCenter")} ›</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginButtonText}>{t("login")}</Text>
        </Pressable>
        <Pressable
          style={[styles.loginButton, styles.registerButton]}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.loginButtonText}>{t("createAccount")}</Text>
        </Pressable>
        <Pressable
          style={styles.helpLink}
          onPress={() => navigation.navigate("HelpCenter")}
        >
          <Text style={styles.helpLinkText}>{t("helpCenter")} ›</Text>
        </Pressable>
      </View>
    );
  }

  const handleLogout = () => {
    getRefreshToken()
      .then((refreshToken) => {
        if (refreshToken) {
          api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
        }
      })
      .catch(() => {});
    clearTokens().catch(() => {});
    queryClient.clear();
    navigation.navigate("Home");
  };

  const unread = notifs?.unread_count ?? 0;
  const isStaff = user.role === "staff" || user.role === "admin";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.profileSection} onPress={() => navigation.navigate("ProfileSettings")}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.display_name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <Text style={styles.displayName}>{user.display_name}</Text>
        <Text style={styles.phone}>{user.email ?? user.phone_number}</Text>
        {user.kyc_status === "verified" && (
          <Text style={styles.verifiedBadge}>✓ {t("verified")}</Text>
        )}
      </Pressable>

      {!isStaff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("stays")}</Text>
          <MenuRow label={t("notifications")} badge={unread || undefined} onPress={() => navigation.navigate("Notifications")} />
          <MenuRow label={t("myPayments")} onPress={() => navigation.navigate("Payments")} />
          <MenuRow label={t("myDisputes")} onPress={() => navigation.navigate("Disputes", {})} />
        </View>
      )}
      {isStaff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account")}</Text>
          <MenuRow label={t("adminConsole")} onPress={() => navigation.navigate("Home")} />
          <MenuRow label={t("notifications")} badge={unread || undefined} onPress={() => navigation.navigate("Notifications")} />
        </View>
      )}
      {isStaff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("stays")}</Text>
          <MenuRow label={t("trips")} onPress={() => navigation.navigate("Trips")} />
          <MenuRow label={t("favorites")} onPress={() => navigation.navigate("Favorites")} />
        </View>
      )}

      {user.role === "guest" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("hosting")}</Text>
          {user.kyc_status !== "verified" ? (
            <>
              <Text style={styles.hintText}>{t("verifyIdentityHint")}</Text>
              <MenuRow label={t("verifyIdentity")} onPress={() => navigation.navigate("Kyc")} />
            </>
          ) : (
            <Pressable
              style={styles.menuRow}
              onPress={async () => {
                try {
                  await upgradeRole.mutateAsync();
                  Alert.alert("", t("becomeHostSuccess"));
                } catch {
                  Alert.alert("", t("becomeHostError"));
                }
              }}
              disabled={upgradeRole.isPending}
            >
              <Text style={styles.menuText}>
                {upgradeRole.isPending ? t("loading") : t("becomeHost")}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {user.role !== "guest" && user.kyc_status !== "verified" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("verification")}</Text>
          <MenuRow label={t("verifyIdentity")} onPress={() => navigation.navigate("Kyc")} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("preferences")}</Text>
        <MenuRow label={t("editProfile")} onPress={() => navigation.navigate("ProfileSettings")} />
        <MenuRow label={t("personalInfo")} onPress={() => navigation.navigate("PersonalData")} />
        <MenuRow label={t("loginSecurity")} onPress={() => navigation.navigate("SecuritySettings")} />
        <MenuRow label={t("privacyNotifications")} onPress={() => navigation.navigate("PrivacySettings")} />
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
        <Text style={styles.sectionTitle}>{t("helpSupport")}</Text>
        <MenuRow label={t("helpCenter")} onPress={() => navigation.navigate("HelpCenter")} />
        <MenuRow label={t("contactSupport")} onPress={() => navigation.navigate("Support")} />
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
  avatarImg: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md },
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
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  menuText: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: "500" },
  menuBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: "700" },
  chevron: { fontSize: 20, color: colors.textTertiary },
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
  registerButton: { marginTop: spacing.md },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  helpLink: { alignItems: "center", marginTop: spacing.xl },
  helpLinkText: { color: colors.primary, fontSize: fontSize.md, fontWeight: "600" },
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
