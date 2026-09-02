import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingRail } from "../components/ListingRail";
import { LoadingSpinner } from "../components/States";
import { usePopularLocations } from "../lib/hooks";
import { getRecentlyViewed } from "../lib/recentlyViewed";
import type { Listing, LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const { data: popular } = usePopularLocations();
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await api.get<{ data: any[] }>("/listings", {
        params: { limit: 10 },
      });
      return data.data;
    },
  });

  const goToSearch = (city?: string) => {
    navigation.navigate("Search", { city });
  };

  const goToDetail = (unitId: string) => {
    navigation.navigate("ListingDetail", { unitId });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.appName}>{t("appName")}</Text>
      </View>

      <Pressable style={styles.searchBar} onPress={() => goToSearch()}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>{t("whereTo")}</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("popularDestinations")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.citiesScroll}>
          {popular?.map((city: LocationSuggestion) => (
            <Pressable
              key={city.canonical_name_en}
              style={styles.cityChip}
              onPress={() => goToSearch(city.canonical_name_en)}
            >
              <Text style={styles.cityChipText}>
                {locale === "ar" ? city.canonical_name_ar : city.canonical_name_en}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("featuredListings")}</Text>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ListingRail listings={featured || []} onPress={goToDetail} />
        )}
      </View>

      {recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recentlyViewed")}</Text>
          <ListingRail listings={recentlyViewed} onPress={goToDetail} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
    color: colors.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  citiesScroll: {
    flexDirection: "row",
    marginHorizontal: -spacing.xs,
  },
  cityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary50,
    borderRadius: radius.full,
    marginHorizontal: spacing.xs,
  },
  cityChipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
});
