import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingRail } from "../components/ListingRail";
import { MakazohMark } from "../components/MakazohMark";
import { CardSkeleton } from "../components/States";
import { usePopularLocations, useMe, useUnreadCount } from "../lib/hooks";
import { getRecentlyViewed } from "../lib/recentlyViewed";
import type { Listing, LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Same six property-type categories as the web CategoryChips strip.
const CATEGORIES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "STUDIO",
  "HOTEL_ROOM",
  "RESORT_UNIT",
] as const;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  APARTMENT: "business-outline",
  VILLA: "home-outline",
  CHALET: "umbrella-outline",
  STUDIO: "bed-outline",
  HOTEL_ROOM: "key-outline",
  RESORT_UNIT: "leaf-outline",
};

export function HomeScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: popular } = usePopularLocations();
  const { data: user } = useMe();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.total_unread ?? 0;
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

  // One feed powers both the featured rail and the destination cover
  // images — real listings only, no mock content.
  const { data: feed, isLoading, isError, refetch } = useQuery({
    queryKey: ["home", "featured"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Listing[] }>("/listings", {
        params: { limit: 20 },
      });
      return data.data;
    },
  });

  const featured = useMemo(() => (feed ?? []).slice(0, 10), [feed]);

  // Cover image per destination, taken from real listings in that city or
  // governorate — falls back to the branded pin tile when none exists.
  const coverByPlace = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of feed ?? []) {
      if (!l.cover_image) continue;
      if (l.city && !map.has(`c:${l.city}`)) map.set(`c:${l.city}`, l.cover_image);
      if (l.governorate && !map.has(`g:${l.governorate}`)) {
        map.set(`g:${l.governorate}`, l.cover_image);
      }
    }
    return map;
  }, [feed]);

  const heroImage = featured[0]?.cover_image ?? null;

  const goToSearch = (city?: string, propertyType?: string) => {
    navigation.navigate("Search", { city, propertyType });
  };

  const goToDetail = (unitId: string) => {
    navigation.navigate("ListingDetail", { unitId });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.navigate("Home", { screen: "AccountTab" } as never)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("account")}
          style={styles.topBarSide}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
        <MakazohMark fontSize={19} />
        <Pressable
          onPress={() => navigation.navigate("Notifications")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("notifications")}
          style={styles.topBarSide}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <View style={styles.hero}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]} />
        )}
        <View style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{t("heroTitle")}</Text>
          <Text style={styles.heroSubtitle}>{t("heroSubtitle")}</Text>
        </View>
      </View>

      <View style={styles.searchCard}>
        <Pressable style={styles.searchRow} onPress={() => goToSearch()}>
          <Ionicons name="location-outline" size={18} color={colors.accentText} />
          <View style={styles.searchRowText}>
            <Text style={styles.searchLabel}>{t("whereTo")}</Text>
            <Text style={styles.searchPlaceholder}>{t("searchDestination")}</Text>
          </View>
        </Pressable>
        <View style={styles.searchRowPair}>
          <Pressable style={[styles.searchRow, styles.searchRowHalf]} onPress={() => goToSearch()}>
            <Ionicons name="calendar-outline" size={18} color={colors.accentText} />
            <View style={styles.searchRowText}>
              <Text style={styles.searchLabel}>{t("checkIn")}</Text>
              <Text style={styles.searchPlaceholder}>{t("addDates")}</Text>
            </View>
          </Pressable>
          <Pressable style={[styles.searchRow, styles.searchRowHalf]} onPress={() => goToSearch()}>
            <Ionicons name="calendar-outline" size={18} color={colors.accentText} />
            <View style={styles.searchRowText}>
              <Text style={styles.searchLabel}>{t("checkOut")}</Text>
              <Text style={styles.searchPlaceholder}>{t("addDates")}</Text>
            </View>
          </Pressable>
        </View>
        <Pressable style={styles.searchRow} onPress={() => goToSearch()}>
          <Ionicons name="people-outline" size={18} color={colors.accentText} />
          <View style={styles.searchRowText}>
            <Text style={styles.searchLabel}>{t("guests")}</Text>
            <Text style={styles.searchPlaceholder}>1</Text>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          onPress={() => goToSearch()}
          accessibilityRole="button"
        >
          <Ionicons name="search" size={18} color={colors.onPrimary} />
          <Text style={styles.searchButtonText}>{t("search")}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]}
              onPress={() => goToSearch(undefined, category)}
            >
              <Ionicons
                name={CATEGORY_ICONS[category]}
                size={26}
                color={colors.accentText}
              />
              <Text style={styles.categoryLabel}>{t(`ptype_${category}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("popularDestinations")}</Text>
          <Pressable onPress={() => goToSearch()} hitSlop={8}>
            <Text style={styles.viewAll}>{t("viewAll")} →</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationRow}>
          {(popular ?? []).map((place: LocationSuggestion, i: number) => {
            const name = locale === "ar" ? place.canonical_name_ar : place.canonical_name_en;
            const cover =
              coverByPlace.get(`c:${place.city}`) ??
              coverByPlace.get(`g:${place.governorate}`);
            return (
              <Pressable
                key={`${place.canonical_name_en}:${i}`}
                style={({ pressed }) => [styles.destinationCard, pressed && styles.cardPressed]}
                onPress={() => goToSearch(place.canonical_name_en)}
              >
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.destinationImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.destinationImage, styles.destinationFallback]}>
                    <Ionicons name="location" size={28} color={colors.accentText} />
                  </View>
                )}
                <View style={styles.destinationScrim} />
                <Text style={styles.destinationName} numberOfLines={1}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("featuredListings")}</Text>
          <Pressable onPress={() => goToSearch()} hitSlop={8}>
            <Text style={styles.viewAll}>{t("viewAll")} →</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <CardSkeleton />
        ) : isError ? (
          <Pressable style={styles.retryBox} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t("retry")}</Text>
          </Pressable>
        ) : featured.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t("noResults")}</Text>
          </View>
        ) : (
          <ListingRail listings={featured} onPress={goToDetail} />
        )}
      </View>

      {recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recentlyViewed")}</Text>
          <ListingRail listings={recentlyViewed} onPress={goToDetail} />
        </View>
      )}

      {user?.display_name ? (
        <View style={[styles.section, styles.footerNote]}>
          <Text style={styles.footerText}>
            {t("welcomeBack")}, {user.display_name}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  topBarSide: {
    width: 36,
    alignItems: "center",
  },
  bellDot: {
    position: "absolute",
    top: -2,
    end: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.white,
  },
  hero: {
    height: 200,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: colors.primary100,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFallback: {
    backgroundColor: colors.primary100,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroCopy: {
    padding: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginTop: spacing.xs,
    opacity: 0.95,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 4,
  },
  searchCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  searchRowPair: {
    flexDirection: "row",
  },
  searchRowHalf: {
    flex: 1,
  },
  searchRowText: {
    flex: 1,
  },
  searchLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.text,
  },
  searchPlaceholder: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  searchButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  searchButtonText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.accentText,
    marginBottom: spacing.md,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingEnd: spacing.lg,
  },
  categoryCard: {
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 96,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  destinationRow: {
    gap: spacing.sm,
    paddingEnd: spacing.lg,
  },
  destinationCard: {
    width: 132,
    height: 132,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.primary50,
    justifyContent: "flex-end",
  },
  destinationImage: {
    ...StyleSheet.absoluteFillObject,
  },
  destinationFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary100,
  },
  destinationScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  destinationName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.white,
    padding: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  cardPressed: {
    opacity: 0.9,
  },
  retryBox: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accentText,
  },
  emptyBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerNote: {
    paddingBottom: spacing.xxl,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
