import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHostProfile } from "../lib/hooks";
import type { Listing } from "../lib/types";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { LoadingSpinner, ErrorView, EmptyView } from "../components/States";
import { ListingCard } from "../components/ListingCard";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type HostRoute = RouteProp<RootStackParamList, "HostProfile">;

export function HostProfileScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<HostRoute>();
  const hostId = route.params?.hostId || "";

  const { data: host, isLoading, isError, refetch } = useHostProfile(hostId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !host) return <ErrorView onRetry={() => refetch()} />;

  const displayName = host.display_name || t("profile");
  const joinedYear = host.joined_at ? new Date(host.joined_at).getFullYear() : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {host.kyc_status === "verified" && (
          <Text style={styles.verifiedBadge}>✓ {t("verified")}</Text>
        )}
        {joinedYear && (
          <Text style={styles.joined}>
            {t("hostSince")} {joinedYear}
          </Text>
        )}
      </View>

      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>{t("otherListings")}</Text>
        {host.listings.length === 0 ? (
          <EmptyView title={t("noOtherListings")} />
        ) : (
          host.listings.map((listing: Listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={(id: string) => navigation.navigate("ListingDetail", { unitId: id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  name: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: "600",
    marginBottom: 4,
  },
  joined: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listingsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
});
