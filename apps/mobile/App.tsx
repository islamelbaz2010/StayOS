import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { LocaleProvider, useLocale } from "./src/lib/LocaleContext";
import { colors } from "./src/lib/theme";
import { useMe } from "./src/lib/hooks";

import { HomeScreen } from "./src/screens/HomeScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { TripsScreen } from "./src/screens/TripsScreen";
import { TripDetailScreen } from "./src/screens/TripDetailScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { HostProfileScreen as GuestHostProfileScreen } from "./src/screens/HostProfileScreen";
import { MessageScreen } from "./src/screens/MessageScreen";

// Host Operating System screens
import { HostTodayScreen } from "./src/screens/host/HostTodayScreen";
import { HostCalendarScreen } from "./src/screens/host/HostCalendarScreen";
import { HostListingsScreen } from "./src/screens/host/HostListingsScreen";
import { HostMessagesScreen } from "./src/screens/host/HostMessagesScreen";
import { HostProfileScreen } from "./src/screens/host/HostProfileScreen";
import { HostReservationDetailScreen } from "./src/screens/host/HostReservationDetailScreen";
import { HostEarningsScreen } from "./src/screens/host/HostEarningsScreen";
import { HostListingDetailScreen } from "./src/screens/host/HostListingDetailScreen";
import { HostListingEditorScreen } from "./src/screens/host/HostListingEditorScreen";
import { HostListingPhotosScreen } from "./src/screens/host/HostListingPhotosScreen";
import { HostListingAvailabilityScreen } from "./src/screens/host/HostListingAvailabilityScreen";
import { HostListingCoHostsScreen } from "./src/screens/host/HostListingCoHostsScreen";
import { HostCreateListingScreen } from "./src/screens/host/HostCreateListingScreen";

export type RootStackParamList = {
  Home: { screen?: "TripsTab" } | undefined;
  Search: { city?: string } | undefined;
  ListingDetail: { unitId: string };
  HostProfile: { hostId: string };
  Booking: { unitId: string; title: string; price: number; currency: string; maxGuests: number };
  TripDetail: { bookingId: string };
  Message: { bookingId: string };
  Login: undefined;
  Favorites: undefined;
  Trips: undefined;
  Account: undefined;
  // Host routes
  HostToday: undefined;
  HostCalendar: undefined;
  HostListings: undefined;
  HostMessages: undefined;
  HostReservationDetail: { bookingId: string };
  HostEarnings: undefined;
  HostSettings: undefined;
  HostListingDetail: { unitId: string };
  HostListingEditor: { unitId: string; section: string };
  HostListingPhotos: { unitId: string };
  HostListingAvailability: { unitId: string };
  HostListingCoHosts: { unitId: string };
  HostCreateListing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function getGuestTabIconName(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "HomeTab":
      return focused ? "home" : "home-outline";
    case "SearchTab":
      return focused ? "search" : "search-outline";
    case "FavoritesTab":
      return focused ? "heart" : "heart-outline";
    case "TripsTab":
      return focused ? "airplane" : "airplane-outline";
    case "AccountTab":
      return focused ? "person" : "person-outline";
    default:
      return "help-circle-outline";
  }
}

function getHostTabIconName(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "HostTodayTab":
      return focused ? "today" : "today-outline";
    case "HostCalendarTab":
      return focused ? "calendar" : "calendar-outline";
    case "HostListingsTab":
      return focused ? "business" : "business-outline";
    case "HostMessagesTab":
      return focused ? "chatbubble" : "chatbubble-outline";
    case "HostAccountTab":
      return focused ? "person" : "person-outline";
    default:
      return "help-circle-outline";
  }
}

function GuestTabs() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getGuestTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: t("home") }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: t("search") }} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ tabBarLabel: t("favorites") }} />
      <Tab.Screen name="TripsTab" component={TripsScreen} options={{ tabBarLabel: t("trips") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function HostTabs() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getHostTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HostTodayTab" component={HostTodayScreen} options={{ tabBarLabel: t("hostToday") }} />
      <Tab.Screen name="HostCalendarTab" component={HostCalendarScreen} options={{ tabBarLabel: t("hostCalendar") }} />
      <Tab.Screen name="HostListingsTab" component={HostListingsScreen} options={{ tabBarLabel: t("hostListings") }} />
      <Tab.Screen name="HostMessagesTab" component={HostMessagesScreen} options={{ tabBarLabel: t("hostMessages") }} />
      <Tab.Screen name="HostAccountTab" component={HostProfileScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isRTL } = useLocale();
  const { data: user } = useMe();

  if (isRTL && !I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  } else if (!isRTL && I18nManager.isRTL) {
    I18nManager.forceRTL(false);
  }

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.white,
      text: colors.text,
      border: colors.border,
    },
  };

  // Role-aware root: hosts (and admins) get the host tab navigator as
  // their default home screen; guests get the guest tab navigator.
  const isHost = user?.role === "host" || user?.role === "admin";
  const HomeComponent = isHost ? HostTabs : GuestTabs;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeComponent} options={{ headerShown: false }} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: "Search" }}
        />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: "Booking" }}
        />
        <Stack.Screen
          name="HostProfile"
          component={GuestHostProfileScreen}
          options={{ title: "Host" }}
        />
        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{ title: "Trip" }}
        />
        <Stack.Screen
          name="Message"
          component={MessageScreen}
          options={{ title: "Messages" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="HostReservationDetail"
          component={HostReservationDetailScreen}
          options={{ title: "Reservation" }}
        />
        <Stack.Screen
          name="HostEarnings"
          component={HostEarningsScreen}
          options={{ title: "Earnings" }}
        />
        <Stack.Screen
          name="HostListingDetail"
          component={HostListingDetailScreen}
          options={{ title: "Listing" }}
        />
        <Stack.Screen
          name="HostListingEditor"
          component={HostListingEditorScreen}
          options={{ title: "Edit listing" }}
        />
        <Stack.Screen
          name="HostListingPhotos"
          component={HostListingPhotosScreen}
          options={{ title: "Photos" }}
        />
        <Stack.Screen
          name="HostListingAvailability"
          component={HostListingAvailabilityScreen}
          options={{ title: "Availability" }}
        />
        <Stack.Screen
          name="HostListingCoHosts"
          component={HostListingCoHostsScreen}
          options={{ title: "Co-hosts" }}
        />
        <Stack.Screen
          name="HostCreateListing"
          component={HostCreateListingScreen}
          options={{ title: "New listing" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AppContent />
          <StatusBar style="auto" />
        </LocaleProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
