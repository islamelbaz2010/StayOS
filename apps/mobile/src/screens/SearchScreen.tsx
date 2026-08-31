import { useState, useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";
import { useSearchListings, useLocationAutocomplete, useToggleFavorite, useFavorites } from "../lib/hooks";
import { useAuth } from "../lib/AuthContext";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { LoadingSpinner, EmptyView, ErrorView } from "../components/States";
import type { Listing, LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<RootStackParamList, "Search">;

export function SearchScreen() {
  const { locale, t } = useLocale();
  const navigation = useNavigation<Nav>();
  const route = useRoute<SearchRoute>();
  const { isAuthenticated } = useAuth();
  const initialCity = route.params?.city;

  const [query, setQuery] = useState(initialCity || "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialCity || "");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(initialCity);
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
    limit: 20,
  };

  const searchEnabled = Boolean(selectedCity) || (debouncedQuery.length > 0 && !showAutocomplete);
  const { data: searchResult, isLoading, isError, refetch } = useSearchListings(params, { enabled: searchEnabled });
  const listings: Listing[] = searchResult?.data || [];
  const currency = listings[0]?.currency;
  const averagePrice = useMemo(() => {
    if (listings.length === 0) return null;
    return Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length);
  }, [listings]);

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

  const handleToggleFavorite = (unitId: string) => {
    if (isAuthenticated) {
      toggleFav.mutate(unitId);
    }
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
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
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

        {(selectedCity || (listings.length > 0 && !showAutocomplete)) && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              {locale === "ar" ? t("search") : ""} {selectedCity || debouncedQuery}
              {averagePrice !== null && currency ? ` — ${t("averagePrice")}: ${averagePrice} ${currency} / ${t("perNight")}` : ""}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorView message={t("error")} onRetry={() => refetch()} />
      ) : listings.length === 0 ? (
        <EmptyView title={t("noResults")} subtitle={t("tryDifferentSearch")} />
      ) : viewMode === "map" ? (
        hasMapKey ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: listings[0]?.lat || 30.0444,
              longitude: listings[0]?.lng || 31.2357,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {listings.map((listing: any) => (
              <Marker
                key={listing.id}
                coordinate={{ latitude: listing.lat, longitude: listing.lng }}
                title={listing.title}
                onPress={() => goToDetail(listing.id)}
              />
            ))}
          </MapView>
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
              onToggleFavorite={isAuthenticated ? handleToggleFavorite : undefined}
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
  map: {
    flex: 1,
  },
});
