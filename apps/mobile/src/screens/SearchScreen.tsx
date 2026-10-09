import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import { useSearchListings, useLocationAutocomplete, useToggleFavorite, useFavorites, usePriceDistribution, type PriceDistribution } from "../lib/hooks";
import { useLocale } from "../lib/LocaleContext";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { ListingCard } from "../components/ListingCard";
import { EmptyView, ErrorView, CardSkeleton } from "../components/States";
import { OsmMap, type OsmMapBounds } from "../components/OsmMap";
import { FadeIn } from "../lib/motion";
import { DateRangeCalendar } from "../components/DateRangeCalendar";
import { Ionicons } from "@expo/vector-icons";
import type { LocationSuggestion } from "../lib/types";
import type { RootStackParamList } from "../../App";
import { currencyLabel, formatMoney } from "../lib/money";
import { AMENITY_VALUES, amenityLabel } from "../lib/amenities";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<RootStackParamList, "Search">;

// Must match app.listings.constants + the web search vocabulary (DEC-019).
// Web removed HALAL_CERTIFIED from the search filter surface — it remains a
// display-only cultural tag on listing detail, never a search criterion.
const CULTURAL_TAG_OPTIONS = [
  { value: "FAMILY_ONLY", key: "tagFamilyOnly" },
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

const AMENITIES = AMENITY_VALUES.map((value) => ({ value }));


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

// Product languages are Arabic and English only (DEC-019 allows more in
// the backend enum, but the filter surface is limited to supported UI
// languages).
const HOST_LANGUAGES = ["ar", "en"];

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
  const insets = useSafeAreaInsets();
  const initialCity = route.params?.city;

  const [query, setQuery] = useState(initialCity || "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialCity || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(
    route.params?.checkIn ? new Date(route.params.checkIn) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    route.params?.checkOut ? new Date(route.params.checkOut) : null
  );
  const [filters, setFilters] = useState<DraftFilters>({
    ...EMPTY_FILTERS,
    propertyType: route.params?.propertyType,
    guests: route.params?.guests,
  });
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [mapBounds, setMapBounds] = useState<OsmMapBounds | null>(null);
  const [boundsDirty, setBoundsDirty] = useState(false);
  const [appliedBounds, setAppliedBounds] = useState<OsmMapBounds | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: suggestions, isFetching: isLoadingSuggestions, isError: suggestionsError, refetch: refetchSuggestions } = useLocationAutocomplete(debouncedQuery);
  const { data: favorites } = useFavorites();
  const toggleFav = useToggleFavorite();

  const favoriteIds = new Set(favorites?.data?.map((f: { id: string }) => f.id));

  const params = {
    // Web parity: the input text is sent as `q` — the backend resolves
    // location terms (city/governorate) server-side.
    q: debouncedQuery || undefined,
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
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchListings(params);
  const listings = searchResult?.pages.flatMap((p) => p.data) ?? [];
  const total = searchResult?.pages[0]?.pagination.total_count ?? 0;
  const { data: priceDistribution, isLoading: priceDistLoading } =
    usePriceDistribution(params);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const name = locale === "ar" ? suggestion.canonical_name_ar : suggestion.canonical_name_en;
    setQuery(name);
    setDebouncedQuery(name);
    setShowAutocomplete(false);
    Keyboard.dismiss();
  };

  const clearSelection = () => {
    setQuery("");
    setDebouncedQuery("");
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
    showAutocomplete && debouncedQuery.length >= 2;

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
      selected: l.id === selectedMarkerId,
    }));

  const selectedListing = selectedMarkerId
    ? listings.find((l: any) => l.id === selectedMarkerId)
    : undefined;

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
      <View style={[styles.searchSection, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchLocation")}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setShowAutocomplete(true);
            }}
            onFocus={() => setShowAutocomplete(true)}
            onSubmitEditing={() => setShowAutocomplete(false)}
          />
          {query.length > 0 && (
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
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("filters")}
          >
            <Ionicons name="options-outline" size={22} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterButtonBadge}>
                <Text style={styles.filterButtonBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {isLoadingSuggestions && showAutocomplete && (
          <Text style={styles.loadingText}>{t("loading")}</Text>
        )}

        {shouldShowSuggestions && suggestionsError && (
          <Pressable
            style={styles.autocomplete}
            onPress={() => refetchSuggestions()}
          >
            <View style={styles.suggestionItem}>
              <Text style={[styles.suggestionText, styles.suggestionError]}>{t("retry")}</Text>
            </View>
          </Pressable>
        )}

        {shouldShowSuggestions && !suggestionsError && suggestions && (
          <FadeIn trigger={debouncedQuery} style={styles.autocomplete}>
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
          </FadeIn>
        )}


        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
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
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
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

      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          <OsmMap
            markers={mapMarkers}
            onMarkerPress={(id) => setSelectedMarkerId(id)}
            onRegionChanged={(b) => {
              setMapBounds(b);
              setBoundsDirty(true);
            }}
          />
          {selectedListing && (
            <Pressable
              style={styles.mapPreviewCard}
              onPress={() => goToDetail(selectedListing.id)}
            >
              {selectedListing.cover_image ? (
                <Image
                  source={{ uri: selectedListing.cover_image }}
                  style={styles.mapPreviewImage}
                />
              ) : (
                <View style={[styles.mapPreviewImage, styles.mapPreviewPlaceholder]} />
              )}
              <View style={styles.mapPreviewBody}>
                <Text style={styles.mapPreviewTitle} numberOfLines={1}>
                  {locale === "ar"
                    ? selectedListing.title_ar || selectedListing.title
                    : selectedListing.title_en || selectedListing.title}
                </Text>
                <Text style={styles.mapPreviewMeta} numberOfLines={1}>
                  {selectedListing.city}, {selectedListing.governorate}
                </Text>
                <Text style={styles.mapPreviewPrice}>
                  {formatMoney(
                    selectedListing.price,
                    currencyLabel(selectedListing.currency, t("egp"))
                  )}{" "}
                  / {t("perNight")}
                </Text>
              </View>
              <Pressable
                style={styles.mapPreviewClose}
                onPress={() => setSelectedMarkerId(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("close")}
              >
                <Text style={styles.mapPreviewCloseText}>✕</Text>
              </Pressable>
            </Pressable>
          )}
          {boundsDirty && (
            <Pressable style={styles.searchAreaButton} onPress={applyMapArea}>
              <Text style={styles.searchAreaButtonText}>{t("searchArea")}</Text>
            </Pressable>
          )}
          {isLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={colors.accentText} />
            </View>
          ) : (
            listings.length === 0 && (
              <View style={styles.mapEmpty}>
                <Text style={styles.mapEmptyText}>{t("noResults")}</Text>
              </View>
            )
          )}
        </View>
      ) : isLoading ? (
        <View style={styles.list}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : listings.length === 0 ? (
        <EmptyView
          icon="🔍"
          title={t("noResults")}
          subtitle={t("tryDifferentSearch")}
          actionLabel={activeFilterCount > 0 ? t("searchClearFilters") : undefined}
          onAction={activeFilterCount > 0 ? clearSheetFilters : undefined}
        />
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
                <ActivityIndicator size="small" color={colors.accentText} />
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
        priceDistribution={priceDistribution}
        priceDistLoading={priceDistLoading}
        t={t}
      />
    </View>
  );
}

function PriceRangeControl({
  distribution,
  isLoading,
  minPrice,
  maxPrice,
  onChange,
  t,
}: {
  distribution: PriceDistribution | undefined;
  isLoading: boolean;
  minPrice: string;
  maxPrice: string;
  onChange: (min: string, max: string) => void;
  t: (key: string) => string;
}) {
  const distMin = distribution?.min_price_egp ?? null;
  const distMax = distribution?.max_price_egp ?? null;
  const hasData = distMin != null && distMax != null && distMax > distMin;

  const appliedMin = minPrice.trim() !== "" ? Number(minPrice) : distMin ?? 0;
  const appliedMax = maxPrice.trim() !== "" ? Number(maxPrice) : distMax ?? 0;

  const [lo, setLo] = useState(appliedMin);
  const [hi, setHi] = useState(appliedMax);
  const [trackW, setTrackW] = useState(0);

  // PanResponders are created once — every value they need is read through
  // this ref so callbacks never see stale trackWidth/bounds/positions.
  const st = useRef({ trackW: 0, min: 0, max: 1, lo, hi });
  st.current = {
    trackW,
    min: distMin ?? 0,
    max: distMax ?? 1,
    lo,
    hi,
  };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLo(appliedMin);
    setHi(appliedMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, distMin, distMax]);

  const span = hasData ? distMax! - distMin! : 1;
  const toValue = (x: number) =>
    Math.round(distMin! + (Math.max(0, Math.min(trackW, x)) / Math.max(1, trackW)) * span);
  const toX = (v: number) => ((v - distMin!) / span) * trackW;

  const commit = () => {
    if (!hasData) return;
    onChange(
      lo > distMin! ? String(lo) : "",
      hi < distMax! ? String(hi) : ""
    );
  };

  const dragStart = useRef({ lo: 0, hi: 0 });
  const panFor = (which: "lo" | "hi") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const s = st.current;
        const w = Math.max(1, s.trackW);
        const v = which === "lo" ? s.lo : s.hi;
        dragStart.current[which] = ((v - s.min) / Math.max(1, s.max - s.min)) * w;
      },
      onPanResponderMove: (_e, g) => {
        const s = st.current;
        const w = Math.max(1, s.trackW);
        const x = Math.max(0, Math.min(w, dragStart.current[which] + g.dx));
        const v = Math.round(s.min + (x / w) * Math.max(1, s.max - s.min));
        if (which === "lo") setLo(Math.min(v, s.hi));
        else setHi(Math.max(v, s.lo));
      },
      onPanResponderRelease: () => {
        const s = st.current;
        onChangeRef.current(
          s.lo > s.min ? String(s.lo) : "",
          s.hi < s.max ? String(s.hi) : ""
        );
      },
    });

  const loPan = useRef(panFor("lo")).current;
  const hiPan = useRef(panFor("hi")).current;

  if (isLoading) {
    return <View style={sheetStyles.priceSkeleton} />;
  }

  if (!hasData) {
    return (
      <View style={sheetStyles.priceRow}>
        <TextInput
          style={sheetStyles.priceInput}
          placeholder={t("searchMinPrice")}
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={minPrice}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ""), maxPrice)}
        />
        <Text style={sheetStyles.priceSep}>–</Text>
        <TextInput
          style={sheetStyles.priceInput}
          placeholder={t("searchMaxPrice")}
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
          value={maxPrice}
          onChangeText={(v) => onChange(minPrice, v.replace(/[^0-9]/g, ""))}
        />
      </View>
    );
  }

  const maxCount = Math.max(1, ...(distribution!.buckets.map((b) => b.count)));

  return (
    <View>
      {/* Histogram — LTR regardless of locale (web parity). */}
      <View style={sheetStyles.histogram}>
        {distribution!.buckets.map((b, i) => {
          const inRange = b.to_egp >= lo && b.from_egp <= hi;
          return (
            <View
              key={i}
              style={[
                sheetStyles.histBar,
                { height: `${Math.max(8, (b.count / maxCount) * 100)}%` },
                inRange ? sheetStyles.histBarActive : sheetStyles.histBarDim,
              ]}
            />
          );
        })}
      </View>

      <Pressable
        style={sheetStyles.sliderTrack}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        // Tap on the track nudges the nearest thumb — keeps the control
        // usable where a system edge gesture would otherwise eat the drag.
        onPress={(e) => {
          const s = st.current;
          const x = e.nativeEvent.locationX;
          const w = Math.max(1, s.trackW);
          const v = Math.round(
            s.min + (Math.max(0, Math.min(w, x)) / w) * Math.max(1, s.max - s.min)
          );
          const loX = ((s.lo - s.min) / Math.max(1, s.max - s.min)) * w;
          const hiX = ((s.hi - s.min) / Math.max(1, s.max - s.min)) * w;
          const nlo = Math.abs(x - loX) <= Math.abs(x - hiX) ? Math.min(v, s.hi) : s.lo;
          const nhi = Math.abs(x - loX) <= Math.abs(x - hiX) ? s.hi : Math.max(v, s.lo);
          setLo(nlo);
          setHi(nhi);
          onChangeRef.current(
            nlo > s.min ? String(nlo) : "",
            nhi < s.max ? String(nhi) : ""
          );
        }}
      >
        <View style={sheetStyles.sliderRail} />
        <View
          style={[
            sheetStyles.sliderFill,
            { left: toX(lo), width: Math.max(0, toX(hi) - toX(lo)) },
          ]}
        />
        <View
          style={[sheetStyles.thumb, { left: toX(lo) - 22 }]}
          {...loPan.panHandlers}
        >
          <View style={sheetStyles.thumbDot} />
        </View>
        <View
          style={[sheetStyles.thumb, { left: toX(hi) - 22 }]}
          {...hiPan.panHandlers}
        >
          <View style={sheetStyles.thumbDot} />
        </View>
      </Pressable>

      <View style={sheetStyles.priceRow}>
        <View style={sheetStyles.priceField}>
          <Text style={sheetStyles.priceFieldLabel}>{t("searchMinPrice")}</Text>
          <TextInput
            style={sheetStyles.priceInput}
            keyboardType="numeric"
            value={String(lo)}
            onChangeText={(v) => {
              const n = Number(v.replace(/[^0-9]/g, ""));
              setLo(Math.min(isNaN(n) ? distMin! : n, st.current.hi));
            }}
            onEndEditing={commit}
          />
        </View>
        <Text style={sheetStyles.priceSep}>–</Text>
        <View style={sheetStyles.priceField}>
          <Text style={sheetStyles.priceFieldLabel}>{t("searchMaxPrice")}</Text>
          <TextInput
            style={sheetStyles.priceInput}
            keyboardType="numeric"
            value={String(hi)}
            onChangeText={(v) => {
              const n = Number(v.replace(/[^0-9]/g, ""));
              setHi(Math.max(isNaN(n) ? distMax! : n, st.current.lo));
            }}
            onEndEditing={commit}
          />
        </View>
      </View>
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
  priceDistribution,
  priceDistLoading,
  t,
}: {
  visible: boolean;
  draft: DraftFilters;
  onChange: (f: DraftFilters) => void;
  onClose: () => void;
  onClear: () => void;
  resultsCount: number;
  activeQuickCount: number;
  priceDistribution: PriceDistribution | undefined;
  priceDistLoading: boolean;
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
            <View style={{ direction: "ltr" }}>
              <PriceRangeControl
                distribution={priceDistribution}
                isLoading={priceDistLoading}
                minPrice={draft.minPrice}
                maxPrice={draft.maxPrice}
                onChange={(min, max) => set({ minPrice: min, maxPrice: max })}
                t={t}
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
                  label={amenityLabel(a.value, t)}
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
    color: colors.accentText,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonBadge: {
    position: "absolute",
    top: -6,
    end: -6,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterButtonBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "700",
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
  suggestionError: {
    color: colors.accentText,
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
    color: colors.accentText,
    fontWeight: "600",
  },
  chipsScroll: {
    marginHorizontal: -spacing.lg,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
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
    color: colors.onPrimary,
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
    color: colors.accentText,
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
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  mapLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  mapEmpty: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  mapEmptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  mapPreviewCard: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mapPreviewImage: {
    width: 88,
    height: 88,
    backgroundColor: colors.surface,
  },
  mapPreviewPlaceholder: {},
  mapPreviewBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  mapPreviewTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  mapPreviewMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  mapPreviewPrice: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accentText,
  },
  mapPreviewClose: {
    padding: spacing.md,
    alignSelf: "flex-start",
  },
  mapPreviewCloseText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    fontWeight: "600",
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
    color: colors.accentText,
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
    marginTop: spacing.md,
  },
  priceSkeleton: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  histogram: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 64,
    gap: 1,
    marginTop: spacing.sm,
    // Inset matches sliderTrack so thumb centers never sit inside the
    // Android back-gesture edge zone when at range extremes.
    marginHorizontal: spacing.md,
  },
  histBar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  histBarActive: {
    backgroundColor: colors.primary,
  },
  histBarDim: {
    backgroundColor: colors.border,
  },
  sliderTrack: {
    height: 40,
    justifyContent: "center",
    marginTop: -spacing.xs,
    marginHorizontal: spacing.md,
  },
  sliderRail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sliderFill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: "absolute",
    // 44dp touch target — PanResponder ignores hitSlop, so the view itself
    // must be large; the visible handle is the inner dot.
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  priceField: {
    flex: 1,
  },
  priceFieldLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
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
    color: colors.accentText,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  applyButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
