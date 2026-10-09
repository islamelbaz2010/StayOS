import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { format } from "date-fns";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingRail } from "../components/ListingRail";
import { MakazohMark } from "../components/MakazohMark";
import { CardSkeleton } from "../components/States";
import { usePopularLocations, useMe, useUnreadCount, useLocationAutocomplete } from "../lib/hooks";
import { FadeIn } from "../lib/motion";
import { DateRangeCalendar } from "../components/DateRangeCalendar";
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
  const insets = useSafeAreaInsets();
  const { data: popular } = usePopularLocations();
  const { data: user } = useMe();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.total_unread ?? 0;
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [showDates, setShowDates] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const [debouncedDest, setDebouncedDest] = useState("");
  const [brokenCovers, setBrokenCovers] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

  // Debounce the destination query — react-query keys each request by the
  // debounced value, so stale responses can never overwrite newer input.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDest(destination.trim()), 300);
    return () => clearTimeout(timer);
  }, [destination]);

  const {
    data: destSuggestions,
    isFetching: destLoading,
    isError: destError,
    refetch: refetchDestinations,
  } = useLocationAutocomplete(debouncedDest);

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

  // All covers per destination (feed order) — a card falls back through
  // them on error, then to the branded pin tile when none survive.
  const coversByPlace = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of feed ?? []) {
      if (!l.cover_image) continue;
      for (const key of [
        l.city ? `c:${l.city}` : null,
        l.governorate ? `g:${l.governorate}` : null,
      ]) {
        if (!key) continue;
        const list = map.get(key) ?? [];
        if (!list.includes(l.cover_image)) list.push(l.cover_image);
        map.set(key, list);
      }
    }
    return map;
  }, [feed]);

  const heroImage = featured[0]?.cover_image ?? null;

  const goToSearch = (city?: string, propertyType?: string) => {
    navigation.navigate("Search", { city, propertyType });
  };

  const runSearch = () => {
    navigation.navigate("Search", {
      city: destination.trim() || undefined,
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : undefined,
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : undefined,
      guests,
    });
  };

  const goToDetail = (unitId: string) => {
    navigation.navigate("ListingDetail", { unitId });
  };

  const showDestPanel =
    destFocused && debouncedDest.length >= 2;

  const selectDestination = (suggestion: LocationSuggestion) => {
    const name =
      locale === "ar" ? suggestion.canonical_name_ar : suggestion.canonical_name_en;
    setDestination(name);
    setDebouncedDest(name);
    setDestFocused(false);
    Keyboard.dismiss();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
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
        <View style={styles.searchRow}>
          <Ionicons name="location-outline" size={18} color={colors.accentText} />
          <View style={styles.searchRowText}>
            <Text style={styles.searchLabel}>{t("whereTo")}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t("searchDestination")}
              placeholderTextColor={colors.textSecondary}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setDestFocused(true);
              }}
              onFocus={() => setDestFocused(true)}
              returnKeyType="search"
              onSubmitEditing={() => {
                setDestFocused(false);
                runSearch();
              }}
            />
          </View>
          {destination.length > 0 && (
            <Pressable
              onPress={() => {
                setDestination("");
                setDebouncedDest("");
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("searchClearMapArea")}
            >
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {showDestPanel && (
          <FadeIn trigger={debouncedDest} style={styles.destPanel}>
            {destLoading ? (
              <Text style={styles.destStatus}>{t("loading")}</Text>
            ) : destError ? (
              <Pressable onPress={() => refetchDestinations()} hitSlop={8}>
                <Text style={[styles.destStatus, styles.destError]}>{t("retry")}</Text>
              </Pressable>
            ) : (destSuggestions ?? []).length === 0 ? (
              <Text style={styles.destStatus}>{t("noResults")}</Text>
            ) : (
              (destSuggestions ?? []).map((s: LocationSuggestion, i: number) => (
                <Pressable
                  key={`${s.canonical_name_en}:${i}`}
                  style={({ pressed }) => [
                    styles.destItem,
                    i > 0 && styles.destItemBorder,
                    pressed && styles.destItemPressed,
                  ]}
                  onPress={() => selectDestination(s)}
                >
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <View style={styles.destItemText}>
                    <Text style={styles.destItemName}>
                      {locale === "ar" ? s.canonical_name_ar : s.canonical_name_en}
                    </Text>
                    <Text style={styles.destItemMeta}>
                      {s.city}, {s.governorate}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </FadeIn>
        )}
        <View style={styles.searchRowPair}>
          <Pressable
            style={[styles.searchRow, styles.searchRowHalf]}
            onPress={() => setShowDates(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.accentText} />
            <View style={styles.searchRowText}>
              <Text style={styles.searchLabel}>{t("checkIn")}</Text>
              <Text style={styles.searchPlaceholder} numberOfLines={1}>
                {checkIn ? format(checkIn, "d MMM yyyy") : t("addDates")}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.searchRow, styles.searchRowHalf]}
            onPress={() => setShowDates(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.accentText} />
            <View style={styles.searchRowText}>
              <Text style={styles.searchLabel}>{t("checkOut")}</Text>
              <Text style={styles.searchPlaceholder} numberOfLines={1}>
                {checkOut ? format(checkOut, "d MMM yyyy") : t("addDates")}
              </Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="people-outline" size={18} color={colors.accentText} />
          <View style={styles.searchRowText}>
            <Text style={styles.searchLabel}>{t("guests")}</Text>
            <Text style={styles.searchPlaceholder}>{guests}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Ionicons
                name="remove"
                size={18}
                color={guests <= 1 ? colors.border : colors.accentText}
              />
            </Pressable>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setGuests((g) => Math.min(16, g + 1))}
              disabled={guests >= 16}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Ionicons
                name="add"
                size={18}
                color={guests >= 16 ? colors.border : colors.accentText}
              />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          onPress={runSearch}
          accessibilityRole="button"
        >
          <Ionicons name="search" size={18} color={colors.onPrimary} />
          <Text style={styles.searchButtonText}>{t("search")}</Text>
        </Pressable>
      </View>

      <DateRangeCalendar
        visible={showDates}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        onClose={() => setShowDates(false)}
        onConfirm={(start, end) => {
          setCheckIn(start);
          setCheckOut(end);
          setShowDates(false);
        }}
      />

      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railBleed} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]}
              onPress={() => goToSearch(undefined, category)}
            >
              <View style={styles.categoryIconWrap}>
                <Ionicons
                  name={CATEGORY_ICONS[category]}
                  size={24}
                  color={colors.accentText}
                />
              </View>
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
        <FadeIn trigger={popular?.length}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railBleed} contentContainerStyle={styles.destinationRow}>
          {(popular ?? []).map((place: LocationSuggestion, i: number) => {
            const name = locale === "ar" ? place.canonical_name_ar : place.canonical_name_en;
            const candidates = (
              coversByPlace.get(`c:${place.city}`) ??
              coversByPlace.get(`g:${place.governorate}`) ??
              []
            ).filter((c) => !brokenCovers.has(c));
            const cover = candidates[0];
            return (
              <Pressable
                key={`${place.canonical_name_en}:${i}`}
                style={({ pressed }) => [styles.destinationCard, pressed && styles.cardPressed]}
                onPress={() => goToSearch(place.canonical_name_en)}
              >
                {cover ? (
                  <Image
                    source={{ uri: cover }}
                    style={styles.destinationImage}
                    resizeMode="cover"
                    onError={() =>
                      setBrokenCovers((prev) => {
                        if (prev.has(cover)) return prev;
                        const next = new Set(prev);
                        next.add(cover);
                        return next;
                      })
                    }
                  />
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
        </FadeIn>
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
          <FadeIn trigger={featured.length}>
            <ListingRail listings={featured} onPress={goToDetail} />
          </FadeIn>
        )}
      </View>

      {recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleSolo]}>{t("recentlyViewed")}</Text>
          <FadeIn trigger={recentlyViewed.length}>
            <ListingRail listings={recentlyViewed} onPress={goToDetail} />
          </FadeIn>
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
  destPanel: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  destStatus: {
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  destError: {
    color: colors.accentText,
    fontWeight: "600",
  },
  destItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  destItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  destItemPressed: {
    backgroundColor: colors.surface,
  },
  destItemText: { flex: 1 },
  destItemName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  destItemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
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
  searchInput: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 1,
    padding: 0,
  },
  stepper: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  sectionTitleSolo: {
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.accentText,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  categoryCard: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    width: 104,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  // Horizontal rails bleed out of the section padding so cards scroll to
  // the screen edge; content padding keeps the first card aligned with
  // the section title and the last card fully reachable.
  railBleed: {
    marginHorizontal: -spacing.lg,
  },
  destinationRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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
