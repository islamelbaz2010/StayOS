import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { useMe, useNotifications, useUpgradeRole, useHasTokens } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { api, clearTokens, getRefreshToken } from "../lib/api";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { MenuCard } from "../components/UI";
import { MakazohMark } from "../components/MakazohMark";
import { LoadingSpinner } from "../components/States";
import { OPS_GROUPS } from "../lib/opsGroups";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AccountScreen() {
  const { locale, setLocale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const { data: notifs } = useNotifications();
  const upgradeRole = useUpgradeRole();
  const authed = useHasTokens();

  if (!authed || !user) {
    if (authed && isLoading) return <LoadingSpinner />;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.guestContainer,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.guestHero}>
          <MakazohMark fontSize={34} />
          <Text style={styles.guestTitle}>{t("accountGuestTitle")}</Text>
          <Text style={styles.guestSubtitle}>{t("accountGuestSubtitle")}</Text>
        </View>

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

        <View style={[styles.section, styles.guestLangSection]}>
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
      </ScrollView>
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
  const isAdmin = user.role === "admin";
  const permissions = user.staff_permissions ?? [];

  const openGroup = (
    title: string,
    items: { key: string; label: string; route: string; icon?: string; params?: Record<string, unknown> }[]
  ) => navigation.navigate("MenuGroup", { title, items });

  const visibleOpsGroups = OPS_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (s) => isAdmin || (s.permission !== null && permissions.includes(s.permission))
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileSection}>
        {isStaff && (
          <Pressable
            style={styles.bellButton}
            onPress={() => navigation.navigate("Notifications")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unread > 9 ? "9+" : unread}
                </Text>
              </View>
            )}
          </Pressable>
        )}
        <Pressable onPress={() => navigation.navigate("ProfileSettings")} style={styles.profileBody}>
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
      </View>

      <View style={styles.section}>
        {isStaff && (
          <>
            {/* Admin Console is a single top-level entry: all operational
                groups live inside its submenu, never duplicated here. */}
            <MenuCard
              icon="speedometer-outline"
              title={t("adminConsole")}
              subtitle={t("menuConsoleDesc")}
              onPress={() =>
                openGroup(t("adminConsole"), [
                  {
                    key: "console",
                    label: t("opsConsole"),
                    route: "Home",
                    params: { screen: "OpsHomeTab" },
                    icon: "speedometer-outline",
                  },
                  ...visibleOpsGroups.map((group) => ({
                    key: group.key,
                    label: t(group.labelKey),
                    route: "MenuGroup" as const,
                    params: {
                      title: t(group.labelKey),
                      items: group.items.map((s) => ({
                        key: s.key,
                        label: locale === "ar" ? s.labelAr : s.labelEn,
                        route: s.route,
                        icon: s.icon,
                      })),
                    },
                    icon: group.icon,
                  })),
                ])
              }
            />
            <MenuCard
              icon="airplane-outline"
              title={t("travelerSection")}
              subtitle={t("menuTravelerDesc")}
              onPress={() =>
                openGroup(t("travelerSection"), [
                  { key: "trips", label: t("trips"), route: "Trips", icon: "airplane-outline" },
                  { key: "favorites", label: t("favorites"), route: "Favorites", icon: "heart-outline" },
                  { key: "payments", label: t("myPayments"), route: "Payments", icon: "card-outline" },
                  { key: "disputes", label: t("myDisputes"), route: "Disputes", icon: "alert-circle-outline" },
                ])
              }
            />
          </>
        )}

        {!isStaff && (
          <>
            <MenuCard
              icon="airplane-outline"
              title={t("stays")}
              subtitle={t("menuStaysDesc")}
              badge={unread || undefined}
              onPress={() =>
                openGroup(t("stays"), [
                  { key: "trips", label: t("trips"), route: "Trips", icon: "airplane-outline" },
                  { key: "favorites", label: t("favorites"), route: "Favorites", icon: "heart-outline" },
                  { key: "notifications", label: t("notifications"), route: "Notifications", icon: "notifications-outline" },
                  { key: "payments", label: t("myPayments"), route: "Payments", icon: "card-outline" },
                  { key: "disputes", label: t("myDisputes"), route: "Disputes", icon: "alert-circle-outline" },
                ])
              }
            />
            {user.role === "guest" && (
              user.kyc_status !== "verified" ? (
                <MenuCard
                  icon="shield-checkmark-outline"
                  title={t("verifyIdentity")}
                  subtitle={t("verifyIdentityHint")}
                  onPress={() => navigation.navigate("Kyc")}
                />
              ) : (
                <MenuCard
                  icon="home-outline"
                  title={upgradeRole.isPending ? t("loading") : t("becomeHost")}
                  subtitle={t("menuBecomeHostDesc")}
                  onPress={async () => {
                    try {
                      await upgradeRole.mutateAsync();
                      Alert.alert("", t("becomeHostSuccess"));
                    } catch {
                      Alert.alert("", t("becomeHostError"));
                    }
                  }}
                />
              )
            )}
            {user.role !== "guest" && user.kyc_status !== "verified" && (
              <MenuCard
                icon="shield-checkmark-outline"
                title={t("verifyIdentity")}
                subtitle={t("verifyIdentityHint")}
                onPress={() => navigation.navigate("Kyc")}
              />
            )}
          </>
        )}

        <MenuCard
          icon="person-outline"
          title={t("account")}
          subtitle={t("menuAccountDesc")}
          onPress={() =>
            openGroup(t("account"), [
              ...(isStaff
                ? [{ key: "notifications", label: t("notifications"), route: "Notifications", icon: "notifications-outline" }]
                : []),
              { key: "editProfile", label: t("editProfile"), route: "ProfileSettings", icon: "create-outline" },
              { key: "personalInfo", label: t("personalInfo"), route: "PersonalData", icon: "id-card-outline" },
              { key: "loginSecurity", label: t("loginSecurity"), route: "SecuritySettings", icon: "lock-closed-outline" },
              { key: "privacy", label: t("privacyNotifications"), route: "PrivacySettings", icon: "shield-checkmark-outline" },
            ])
          }
        />
        <MenuCard
          icon="help-circle-outline"
          title={t("helpSupport")}
          subtitle={t("menuSupportDesc")}
          onPress={() =>
            openGroup(t("helpSupport"), [
              { key: "help", label: t("helpCenter"), route: "HelpCenter", icon: "help-circle-outline" },
              { key: "support", label: t("contactSupport"), route: "Support", icon: "chatbubble-outline" },
            ])
          }
        />
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
    paddingVertical: spacing.xl,
  },
  profileBody: {
    alignItems: "center",
  },
  bellButton: {
    position: "absolute",
    top: spacing.md,
    end: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    end: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  bellBadgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "700",
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
    color: colors.onPrimary,
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
    color: colors.onPrimary,
  },
  guestContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  guestHero: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  guestTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  guestLangSection: {
    marginTop: spacing.xxl,
    marginBottom: 0,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  registerButton: { marginTop: spacing.md },
  loginButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  helpLink: { alignItems: "center", marginTop: spacing.xl },
  helpLinkText: { color: colors.accentText, fontSize: fontSize.md, fontWeight: "600" },
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
