import { useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSearchListings, useLocationAutocomplete, useToggleFavorite, useFavorites } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { LoadingSpinner, EmptyView } from "../components/States";
import type { LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<RootStackParamList, "Search">;

function getMapRegion(listings: any[]) {
  const fallback = { latitude: 30.0444, longitude: 31.2357, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  if (listings.length === 0) return fallback;

  const lats = listings.map((l) => l.lat);
  const lngs = listings.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max(0.02, (maxLat - minLat) * 1.4);
  const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.4);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

function getAveragePrice(listings: any[]) {
  if (listings.length === 0) return 0;
  const total = listings.reduce((sum, l) => sum + (l.price || 0), 0);
  return Math.round(total / listings.length);
}

const CULTURAL_TAG_OPTIONS = [
  { value: "FAMILY_ONLY", labelAr: "عائلات فقط" },
  { value: "HALAL_CERTIFIED", labelAr: "حلال" },
  { value: "MIXED", labelAr: "مختلط" },
  { value: "COUPLES_WELCOME", labelAr: "مرحب بالأزواج" },
];

export function SearchScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<SearchRoute>();
  const initialCity = route.params?.city;

  const [query, setQuery] = useState(initialCity || "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialCity || "");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(initialCity);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const hasMapKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: suggestions, isFetching: isLoadingSuggestions } = useLocationAutocomplete(debouncedQuery);
  const { data: favorites } = useFavorites();
  const toggleFav = useToggleFavorite();

  const favoriteIds = new Set(favorites?.data?.map((f: { id: string }) => f.id));

  const params = {
    q: selectedCity ? undefined : debouncedQuery || undefined,
    city: selectedCity,
    cultural_tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
    limit: 20,
  };

  const { data: searchResult, isLoading } = useSearchListings(params);
  const listings = searchResult?.data || [];

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const name = locale === "ar" ? suggestion.canonical_name_ar : suggestion.canonical_name_en;
    setQuery(name);
    setDebouncedQuery(name);
    setSelectedCity(suggestion.canonical_name_en);
    setShowAutocomplete(false);
  };

  const clearSelection = () => {
    setQuery("");
    setDebouncedQuery("");
    setSelectedCity(undefined);
    setShowAutocomplete(false);
  };

  const goToDetail = (unitId: string) => {
    navigation.navigate("ListingDetail", { unitId });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const shouldShowSuggestions =
    showAutocomplete &&
    debouncedQuery.length >= 2 &&
    !selectedCity;

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchLocation")}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelectedCity(undefined);
              setShowAutocomplete(true);
            }}
            onFocus={() => setShowAutocomplete(true)}
            onSubmitEditing={() => setShowAutocomplete(false)}
          />
          {(query.length > 0 || selectedCity) && (
            <Pressable style={styles.clearButton} onPress={clearSelection}>
              <Text style={styles.clearButtonText}>×</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.viewToggle}
            onPress={() => setViewMode((prev) => (prev === "list" ? "map" : "list"))}
            hitSlop={16}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === "list" ? t("mapView") : t("listView")}
            </Text>
          </Pressable>
        </View>

        {isLoadingSuggestions && (
          <Text style={styles.loadingText}>{t("loading")}</Text>
        )}

        {shouldShowSuggestions && suggestions && (
          <View style={styles.autocomplete}>
            {suggestions.length === 0 ? (
              <View style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>{t("noResults")}</Text>
              </View>
            ) : (
              suggestions.map((s: LocationSuggestion, i: number) => (
                <Pressable
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(s)}
                >
                  <Text style={styles.suggestionText}>
                    {locale === "ar" ? s.canonical_name_ar : s.canonical_name_en}
                  </Text>
                  <Text style={styles.suggestionCity}>
                    {s.city}, {s.governorate}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {selectedCity && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              {locale === "ar" ? t("search") : ""} {selectedCity}
            </Text>
          </View>
        )}

        <View style={styles.tagsRow}>
          {CULTURAL_TAG_OPTIONS.map((tag) => {
            const active = selectedTags.includes(tag.value);
            return (
              <Pressable
                key={tag.value}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => toggleTag(tag.value)}
              >
                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                  {locale === "ar" ? tag.labelAr : tag.value.replace(/_/g, " ").toLowerCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <EmptyView title={t("noResults")} subtitle={t("tryDifferentSearch")} />
      ) : viewMode === "map" ? (
        hasMapKey ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={getMapRegion(listings)}
            >
              {listings.map((listing: any) => (
                <Marker
                  key={listing.id}
                  coordinate={{ latitude: listing.lat, longitude: listing.lng }}
                  onPress={() => goToDetail(listing.id)}
                >
                  <View style={styles.priceMarker}>
                    <Text style={styles.priceMarkerText}>
                      {listing.price} {listing.currency}
                    </Text>
                  </View>
                </Marker>
              ))}
            </MapView>
            {listings.length > 0 && (
              <View style={styles.averagePill}>
                <Text style={styles.averagePillText}>
                  {t("avgPriceInResults")}: {getAveragePrice(listings)} {listings[0]?.currency}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.map}>
            <EmptyView title={t("noMapKey")} />
          </View>
        )
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={goToDetail}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={(id) => toggleFav.mutate(id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    zIndex: 10,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: "left",
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  viewToggle: {
    paddingHorizontal: spacing.md,
    minWidth: 80,
    height: 48,
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  autocomplete: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 250,
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  suggestionCity: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeFilter: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activeFilterText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  list: {
    padding: spacing.lg,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  tagChipTextActive: {
    color: colors.white,
  },
  priceMarker: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.white,
    minWidth: 60,
    alignItems: "center",
  },
  priceMarkerText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  averagePill: {
    position: "absolute",
    top: spacing.lg,
    alignSelf: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averagePillText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
});
