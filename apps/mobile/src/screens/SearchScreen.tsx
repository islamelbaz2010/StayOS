import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { useSearchListings, useLocationAutocomplete, useToggleFavorite, useFavorites } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { LoadingSpinner, EmptyView } from "../components/States";
import { OsmMap, type OsmMapBounds } from "../components/OsmMap";
import { DateRangeCalendar } from "../components/DateRangeCalendar";
import type { LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";
import { currencyLabel, formatMoney } from "../lib/money";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<RootStackParamList, "Search">;

// Must match app.listings.constants + the web search vocabulary (DEC-019).
const CULTURAL_TAG_OPTIONS = [
  { value: "FAMILY_ONLY", key: "tagFamilyOnly" },
  { value: "HALAL_CERTIFIED", key: "tagHalal" },
  { value: "MIXED", key: "tagMixed" },
  { value: "COUPLES_WELCOME", key: "tagCouplesWelcome" },
];

const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "CHALET",
  "STUDIO",
  "HOTEL_ROOM",
  "RESORT_UNIT",
];

const LISTING_CATEGORIES = [
  { value: "ENTIRE_PLACE", key: "catEntirePlace" },
  { value: "PRIVATE_ROOM", key: "catPrivateRoom" },
  { value: "SHARED_ROOM", key: "catSharedRoom" },
];

const AMENITIES = [
  { value: "wifi", key: "listingWifi" },
  { value: "air_conditioning", key: "listingAc" },
  { value: "heating", key: "listingHeating" },
  { value: "kitchen", key: "listingKitchen" },
  { value: "parking", key: "listingParking" },
  { value: "pool", key: "listingPool" },
  { value: "gym", key: "listingGym" },
  { value: "washer", key: "listingWasher" },
  { value: "tv", key: "listingTv" },
  { value: "elevator", key: "listingElevator" },
];

const ACCESSIBILITY_FEATURES = [
  { value: "STEP_FREE_ENTRANCE", key: "accStepFreeEntrance" },
  { value: "WIDE_ENTRANCE", key: "accWideEntrance" },
  { value: "ACCESSIBLE_PARKING", key: "accAccessibleParking" },
  { value: "STEP_FREE_PATH", key: "accStepFreePath" },
  { value: "STEP_FREE_BEDROOM", key: "accStepFreeBedroom" },
  { value: "WIDE_BEDROOM", key: "accWideBedroom" },
  { value: "ACCESSIBLE_BATHROOM", key: "accAccessibleBathroom" },
  { value: "WIDE_BATHROOM", key: "accWideBathroom" },
  { value: "SHOWER_GRAB_BAR", key: "accShowerGrabBar" },
  { value: "TOILET_GRAB_BAR", key: "accToiletGrabBar" },
  { value: "STEP_FREE_SHOWER", key: "accStepFreeShower" },
  { value: "SHOWER_CHAIR", key: "accShowerChair" },
  { value: "CEILING_HOIST", key: "accCeilingHoist" },
];

const HOST_LANGUAGES = [
  "ar", "en", "fr", "de", "ru", "it", "es", "tr",
  "zh", "ja", "ko", "pt", "nl", "fi", "el", "he",
  "hi", "hu", "id", "ms", "sv", "th", "be", "bg",
  "gu", "ht", "fa", "pa", "tl", "uk", "ur", "vi",
  "sign",
];

const SORT_OPTIONS = [
  { value: undefined, key: "sortRecommended" },
  { value: "price_asc", key: "sortPriceAsc" },
  { value: "price_desc", key: "sortPriceDesc" },
  { value: "rating_desc", key: "sortRatingDesc" },
] as const;

interface DraftFilters {
  guests: number | undefined;
  propertyType: string | undefined;
  category: string | undefined;
  minPrice: string;
  maxPrice: string;
  bedrooms: number | undefined;
  beds: number | undefined;
  bathrooms: number | undefined;
  amenities: string[];
  freeCancellation: boolean;
  instantBook: boolean;
  pets: boolean;
  selfCheckIn: boolean;
  accessibility: string[];
  hostLanguage: string | undefined;
}

const EMPTY_FILTERS: DraftFilters = {
  guests: undefined,
  propertyType: undefined,
  category: undefined,
  minPrice: "",
  maxPrice: "",
  bedrooms: undefined,
  beds: undefined,
  bathrooms: undefined,
  amenities: [],
  freeCancellation: false,
  instantBook: false,
  pets: false,
  selfCheckIn: false,
  accessibility: [],
  hostLanguage: undefined,
};

function countActiveFilters(f: DraftFilters): number {
  let count = 0;
  for (const key of [
    "guests", "propertyType", "category", "bedrooms", "beds",
    "bathrooms", "hostLanguage",
  ] as const) {
    if (f[key] !== undefined && f[key] !== "") count += 1;
  }
  if (f.minPrice.trim() !== "") count += 1;
  if (f.maxPrice.trim() !== "") count += 1;
  for (const key of ["freeCancellation", "instantBook", "pets", "selfCheckIn"] as const) {
    if (f[key]) count += 1;
  }
  return count + f.amenities.length + f.accessibility.length;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [filters, setFilters] = useState<DraftFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [mapBounds, setMapBounds] = useState<OsmMapBounds | null>(null);
  const [boundsDirty, setBoundsDirty] = useState(false);
  const [appliedBounds, setAppliedBounds] = useState<OsmMapBounds | null>(null);

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
    check_in: checkIn ? format(checkIn, "yyyy-MM-dd") : undefined,
    check_out: checkOut ? format(checkOut, "yyyy-MM-dd") : undefined,
    guests: filters.guests,
    property_type: filters.propertyType,
    category: filters.category,
    cultural_tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
    min_price: filters.minPrice.trim() ? Number(filters.minPrice) : undefined,
    max_price: filters.maxPrice.trim() ? Number(filters.maxPrice) : undefined,
    bedrooms: filters.bedrooms,
    beds: filters.beds,
    bathrooms: filters.bathrooms,
    amenities: filters.amenities.length > 0 ? filters.amenities.join(",") : undefined,
    free_cancellation: filters.freeCancellation || undefined,
    instant_book: filters.instantBook || undefined,
    pets: filters.pets || undefined,
    self_check_in: filters.selfCheckIn || undefined,
    accessibility: filters.accessibility.length > 0 ? filters.accessibility.join(",") : undefined,
    host_language: filters.hostLanguage,
    sort,
    ...(appliedBounds ?? {}),
    limit: 20,
  };

  const {
    data: searchResult,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchListings(params);
  const listings = searchResult?.pages.flatMap((p) => p.data) ?? [];
  const total = searchResult?.pages[0]?.pagination.total_count ?? 0;

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

  const activeFilterCount = countActiveFilters(filters);
  const sheetClearable = countActiveFilters({
    ...filters,
    guests: undefined,
    freeCancellation: false,
  });

  // Mirrors the web filters modal: clear resets the filter-sheet fields but
  // keeps location, dates, guests, cultural tags, free cancellation and any
  // applied map bounds.
  const clearSheetFilters = () => {
    setFilters((f) => ({
      ...EMPTY_FILTERS,
      guests: f.guests,
      freeCancellation: f.freeCancellation,
    }));
  };

  const shouldShowSuggestions =
    showAutocomplete &&
    debouncedQuery.length >= 2 &&
    !selectedCity;

  const datesLabel =
    checkIn && checkOut
      ? `${format(checkIn, "MMM d")} — ${format(checkOut, "MMM d")}`
      : t("searchDates");

  const mapMarkers = listings
    .filter((l: any) => typeof l.lat === "number" && typeof l.lng === "number")
    .map((l: any) => ({
      id: l.id,
      lat: l.lat,
      lng: l.lng,
      label: formatMoney(l.price, currencyLabel(l.currency, t("egp"))),
    }));

  const applyMapArea = () => {
    if (!mapBounds) return;
    setAppliedBounds(mapBounds);
    setBoundsDirty(false);
  };

  const clearMapArea = () => {
    setAppliedBounds(null);
    setBoundsDirty(false);
  };

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
            <Text style={styles.activeFilterText}>{selectedCity}</Text>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={datesLabel}
            active={Boolean(checkIn && checkOut)}
            onPress={() => setShowDates(true)}
          />
          <Chip
            label={
              filters.guests
                ? `${filters.guests} ${t("guests_plural")}`
                : t("guests")
            }
            active={filters.guests !== undefined}
            onPress={() => setShowFilters(true)}
          />
          {CULTURAL_TAG_OPTIONS.map((tag) => (
            <Chip
              key={tag.value}
              label={t(tag.key)}
              active={selectedTags.includes(tag.value)}
              onPress={() => toggleTag(tag.value)}
            />
          ))}
          <Chip
            label={t("searchFreeCancellation")}
            active={filters.freeCancellation}
            onPress={() =>
              setFilters((f) => ({ ...f, freeCancellation: !f.freeCancellation }))
            }
          />
          <Chip
            label={t("searchInstantBook")}
            active={filters.instantBook}
            onPress={() =>
              setFilters((f) => ({ ...f, instantBook: !f.instantBook }))
            }
          />
          <Pressable
            style={[styles.chip, styles.filtersChip]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filtersChipText}>{t("filters")}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              label={t(opt.key)}
              active={sort === opt.value}
              onPress={() => setSort(opt.value)}
            />
          ))}
        </ScrollView>

        {appliedBounds && (
          <View style={styles.mapAreaRow}>
            <Text style={styles.mapAreaText}>{t("searchFilteredByMapArea")}</Text>
            <Pressable onPress={clearMapArea} hitSlop={8}>
              <Text style={styles.mapAreaClear}>{t("searchClearMapArea")}</Text>
            </Pressable>
          </View>
        )}

        {listings.length > 0 && (
          <Text style={styles.resultsCount}>
            {t("searchResultsCount").replace("{count}", String(total))}
          </Text>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <EmptyView title={t("noResults")} subtitle={t("tryDifferentSearch")} />
      ) : viewMode === "map" ? (
        <View style={styles.mapContainer}>
          <OsmMap
            markers={mapMarkers}
            onMarkerPress={goToDetail}
            onRegionChanged={(b) => {
              setMapBounds(b);
              setBoundsDirty(true);
            }}
          />
          {boundsDirty && (
            <Pressable style={styles.searchAreaButton} onPress={applyMapArea}>
              <Text style={styles.searchAreaButtonText}>{t("searchArea")}</Text>
            </Pressable>
          )}
        </View>
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
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      <DateRangeCalendar
        visible={showDates}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        onClose={() => setShowDates(false)}
        onConfirm={(ci, co) => {
          setCheckIn(ci);
          setCheckOut(co);
          setShowDates(false);
        }}
      />

      <FiltersSheet
        visible={showFilters}
        draft={filters}
        onChange={setFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearSheetFilters}
        resultsCount={total}
        activeQuickCount={sheetClearable}
        t={t}
      />
    </View>
  );
}

function FiltersSheet({
  visible,
  draft,
  onChange,
  onClose,
  onClear,
  resultsCount,
  activeQuickCount,
  t,
}: {
  visible: boolean;
  draft: DraftFilters;
  onChange: (f: DraftFilters) => void;
  onClose: () => void;
  onClear: () => void;
  resultsCount: number;
  activeQuickCount: number;
  t: (key: string) => string;
}) {
  const set = (patch: Partial<DraftFilters>) => onChange({ ...draft, ...patch });
  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.backdrop}>
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title}>{t("filters")}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={sheetStyles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={sheetStyles.body} showsVerticalScrollIndicator={false}>
            <Text style={sheetStyles.sectionTitle}>{t("guests")}</Text>
            <View style={sheetStyles.stepperRow}>
              <Pressable
                style={[sheetStyles.stepButton, !draft.guests && sheetStyles.stepButtonDisabled]}
                disabled={!draft.guests}
                onPress={() =>
                  set({ guests: draft.guests && draft.guests > 1 ? draft.guests - 1 : undefined })
                }
              >
                <Text style={sheetStyles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={sheetStyles.stepValue}>
                {draft.guests ?? t("searchAny")}
              </Text>
              <Pressable
                style={sheetStyles.stepButton}
                onPress={() => set({ guests: Math.min(16, (draft.guests ?? 0) + 1) })}
              >
                <Text style={sheetStyles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("propertyType")}</Text>
            <View style={sheetStyles.chipWrap}>
              <Chip
                label={t("searchAnyType")}
                active={!draft.propertyType}
                onPress={() => set({ propertyType: undefined })}
              />
              {PROPERTY_TYPES.map((pt) => (
                <Chip
                  key={pt}
                  label={t(`ptype_${pt}`)}
                  active={draft.propertyType === pt}
                  onPress={() => set({ propertyType: pt })}
                />
              ))}
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("searchTypeOfPlace")}</Text>
            <View style={sheetStyles.chipWrap}>
              <Chip
                label={t("searchAnyCategory")}
                active={!draft.category}
                onPress={() => set({ category: undefined })}
              />
              {LISTING_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.value}
                  label={t(cat.key)}
                  active={draft.category === cat.value}
                  onPress={() => set({ category: cat.value })}
                />
              ))}
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("priceRange")}</Text>
            <View style={sheetStyles.priceRow}>
              <TextInput
                style={sheetStyles.priceInput}
                placeholder={t("searchMinPrice")}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={draft.minPrice}
                onChangeText={(v) => set({ minPrice: v.replace(/[^0-9]/g, "") })}
              />
              <Text style={sheetStyles.priceSep}>–</Text>
              <TextInput
                style={sheetStyles.priceInput}
                placeholder={t("searchMaxPrice")}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={draft.maxPrice}
                onChangeText={(v) => set({ maxPrice: v.replace(/[^0-9]/g, "") })}
              />
            </View>

            {(
              [
                { field: "bedrooms", label: t("bedrooms"), max: 5 },
                { field: "beds", label: t("searchBeds"), max: 7 },
                { field: "bathrooms", label: t("bathrooms"), max: 4 },
              ] as const
            ).map(({ field, label, max }) => (
              <View key={field}>
                <Text style={sheetStyles.sectionTitle}>{label}</Text>
                <View style={sheetStyles.chipWrap}>
                  <Chip
                    label={t("searchAny")}
                    active={draft[field] === undefined}
                    onPress={() => set({ [field]: undefined } as Partial<DraftFilters>)}
                  />
                  {Array.from({ length: max + 1 }, (_, n) => n).map((n) => (
                    <Chip
                      key={n}
                      label={`${n}+`}
                      active={draft[field] === n}
                      onPress={() => set({ [field]: n } as Partial<DraftFilters>)}
                    />
                  ))}
                </View>
              </View>
            ))}

            <Text style={sheetStyles.sectionTitle}>{t("amenities")}</Text>
            <View style={sheetStyles.chipWrap}>
              {AMENITIES.map((a) => (
                <Chip
                  key={a.value}
                  label={t(a.key)}
                  active={draft.amenities.includes(a.value)}
                  onPress={() =>
                    set({ amenities: toggleIn(draft.amenities, a.value) })
                  }
                />
              ))}
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("searchBookingOptions")}</Text>
            <View style={sheetStyles.chipWrap}>
              <Chip
                label={t("searchPetsAllowed")}
                active={draft.pets}
                onPress={() => set({ pets: !draft.pets })}
              />
              <Chip
                label={t("searchSelfCheckIn")}
                active={draft.selfCheckIn}
                onPress={() => set({ selfCheckIn: !draft.selfCheckIn })}
              />
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("searchAccessibility")}</Text>
            <View style={sheetStyles.chipWrap}>
              {ACCESSIBILITY_FEATURES.map((f) => (
                <Chip
                  key={f.value}
                  label={t(f.key)}
                  active={draft.accessibility.includes(f.value)}
                  onPress={() =>
                    set({ accessibility: toggleIn(draft.accessibility, f.value) })
                  }
                />
              ))}
            </View>

            <Text style={sheetStyles.sectionTitle}>{t("searchHostLanguage")}</Text>
            <View style={sheetStyles.chipWrap}>
              <Chip
                label={t("searchAny")}
                active={!draft.hostLanguage}
                onPress={() => set({ hostLanguage: undefined })}
              />
              {HOST_LANGUAGES.map((lang) => (
                <Chip
                  key={lang}
                  label={t(`lang_${lang}`)}
                  active={draft.hostLanguage === lang}
                  onPress={() => set({ hostLanguage: lang })}
                />
              ))}
            </View>
          </ScrollView>

          <View style={sheetStyles.footer}>
            {activeQuickCount > 0 ? (
              <Pressable onPress={onClear} hitSlop={8}>
                <Text style={sheetStyles.clearText}>{t("searchClearFilters")}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable style={sheetStyles.applyButton} onPress={onClose}>
              <Text style={sheetStyles.applyButtonText}>
                {t("searchShowResults").replace("{count}", String(resultsCount))}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  chipsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.white,
  },
  filtersChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderColor: colors.textTertiary,
  },
  filtersChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "700",
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  mapAreaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mapAreaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mapAreaClear: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  resultsCount: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: "center",
  },
  list: {
    padding: spacing.lg,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  searchAreaButton: {
    position: "absolute",
    top: spacing.lg,
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchAreaButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  closeText: {
    fontSize: 26,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonDisabled: {
    backgroundColor: colors.surface,
  },
  stepButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: "700",
  },
  stepValue: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    minWidth: 48,
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  priceSep: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
