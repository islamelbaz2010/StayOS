import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { LocaleProvider, useLocale } from "./src/lib/LocaleContext";
import { colors } from "./src/lib/theme";
import { useMe, useUnreadCount, useHasTokens } from "./src/lib/hooks";
import { getTokens } from "./src/lib/api";
import { registerForPushNotifications } from "./src/lib/push";

import { HomeScreen } from "./src/screens/HomeScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { TripsScreen } from "./src/screens/TripsScreen";
import { TripDetailScreen } from "./src/screens/TripDetailScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";
import { PaymentsScreen } from "./src/screens/PaymentsScreen";
import { KycScreen } from "./src/screens/KycScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { HostProfileScreen as GuestHostProfileScreen } from "./src/screens/HostProfileScreen";
import { MessageScreen } from "./src/screens/MessageScreen";

// Host Operating System screens
import { HostTodayScreen } from "./src/screens/host/HostTodayScreen";
import { HostCalendarScreen } from "./src/screens/host/HostCalendarScreen";
import { HostListingsScreen } from "./src/screens/host/HostListingsScreen";
import { InboxScreen } from "./src/screens/InboxScreen";
import { HostProfileScreen } from "./src/screens/host/HostProfileScreen";
import { HostReservationDetailScreen } from "./src/screens/host/HostReservationDetailScreen";
import { HostEarningsScreen } from "./src/screens/host/HostEarningsScreen";
import { HostListingDetailScreen } from "./src/screens/host/HostListingDetailScreen";
import { HostListingEditorScreen } from "./src/screens/host/HostListingEditorScreen";
import { HostListingPhotosScreen } from "./src/screens/host/HostListingPhotosScreen";
import { HostListingAvailabilityScreen } from "./src/screens/host/HostListingAvailabilityScreen";
import { HostListingCoHostsScreen } from "./src/screens/host/HostListingCoHostsScreen";
import { HostCreateListingScreen } from "./src/screens/host/HostCreateListingScreen";
import { SupportScreen } from "./src/screens/SupportScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { ForgotPasswordScreen } from "./src/screens/ForgotPasswordScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { HelpCenterScreen } from "./src/screens/HelpCenterScreen";
import { HelpArticleScreen } from "./src/screens/HelpArticleScreen";
import { DisputesScreen } from "./src/screens/DisputesScreen";
import { ProfileScreen } from "./src/screens/settings/ProfileScreen";
import { PersonalDataScreen } from "./src/screens/settings/PersonalDataScreen";
import { SecurityScreen } from "./src/screens/settings/SecurityScreen";
import { PrivacyScreen } from "./src/screens/settings/PrivacyScreen";
import { HostBookingsScreen } from "./src/screens/host/HostBookingsScreen";
import { HostPaymentsScreen } from "./src/screens/host/HostPaymentsScreen";
import { OpsHomeScreen } from "./src/screens/ops/OpsHomeScreen";
import { OpsKycScreen } from "./src/screens/ops/OpsKycScreen";
import { OpsPaymentsScreen } from "./src/screens/ops/OpsPaymentsScreen";
import { OpsSupportScreen } from "./src/screens/ops/OpsSupportScreen";
import { OpsTasksScreen } from "./src/screens/ops/OpsTasksScreen";
import { OpsDisputesScreen } from "./src/screens/ops/OpsDisputesScreen";
import { OpsListingsScreen } from "./src/screens/ops/OpsListingsScreen";
import { OpsReviewReportsScreen } from "./src/screens/ops/OpsReviewReportsScreen";
import { AdminUsersScreen } from "./src/screens/ops/AdminUsersScreen";
import { AdminBookingsScreen } from "./src/screens/ops/AdminBookingsScreen";
import { AdminDiscoveryScreen } from "./src/screens/ops/AdminDiscoveryScreen";
import { AdminReportsScreen } from "./src/screens/ops/AdminReportsScreen";
import { AdminStaffScreen } from "./src/screens/ops/AdminStaffScreen";
import { AdminAdjustmentsScreen } from "./src/screens/ops/AdminAdjustmentsScreen";
import { AdminFinanceScreen } from "./src/screens/ops/AdminFinanceScreen";
import { AdminListingsScreen } from "./src/screens/ops/AdminListingsScreen";

export type RootStackParamList = {
  Home: { screen?: "TripsTab" } | undefined;
  Search: { city?: string } | undefined;
  ListingDetail: { unitId: string };
  HostProfile: { hostId: string };
  Booking: { unitId: string; title: string; price: number; currency: string; maxGuests: number; instantBook?: boolean; hostId?: string };
  TripDetail: { bookingId: string };
  Payment: { bookingId: string };
  Payments: undefined;
  Kyc: undefined;
  Message: { bookingId?: string; conversationId?: string };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Favorites: undefined;
  Trips: undefined;
  Account: undefined;
  Notifications: undefined;
  HelpCenter: undefined;
  HelpArticle: { slug: string };
  Disputes: { bookingId?: string };
  ProfileSettings: undefined;
  PersonalData: undefined;
  SecuritySettings: undefined;
  PrivacySettings: undefined;
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
  HostBookings: undefined;
  HostPayments: undefined;
  // Staff / Admin operations routes
  OpsKyc: undefined;
  OpsPayments: undefined;
  OpsSupport: undefined;
  OpsTasks: undefined;
  OpsDisputes: undefined;
  OpsListings: undefined;
  OpsReviewReports: undefined;
  AdminUsers: undefined;
  AdminBookings: undefined;
  AdminDiscovery: undefined;
  AdminReports: undefined;
  AdminStaff: undefined;
  AdminAdjustments: undefined;
  AdminFinance: undefined;
  AdminListings: undefined;
  // Shared
  Support: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ["stayos://"],
  config: {
    screens: {
      Home: "home",
      Search: "search",
      ListingDetail: "listing/:unitId",
      HostProfile: "host/:hostId",
      Booking: "booking/:unitId",
      TripDetail: "trip/:bookingId",
      Payment: "payment/:bookingId",
      Payments: "payments",
      Kyc: "kyc",
      Message: "message",
      Login: "login",
      Register: "register",
      ForgotPassword: "forgot-password",
      Favorites: "favorites",
      Trips: "trips",
      Account: "account",
      Notifications: "notifications",
      HelpCenter: "help",
      HelpArticle: "help/article/:slug",
      Disputes: "disputes",
      ProfileSettings: "settings/profile",
      PersonalData: "settings/personal",
      SecuritySettings: "settings/security",
      PrivacySettings: "settings/privacy",
      Support: "support",
      HostToday: "host/today",
      HostCalendar: "host/calendar",
      HostListings: "host/listings",
      HostMessages: "host/messages",
      HostReservationDetail: "host/reservation/:bookingId",
      HostEarnings: "host/earnings",
      HostSettings: "host/settings",
      HostListingDetail: "host/listing/:unitId",
      HostListingEditor: "host/listing/:unitId/edit/:section",
      HostListingPhotos: "host/listing/:unitId/photos",
      HostListingAvailability: "host/listing/:unitId/availability",
      HostListingCoHosts: "host/listing/:unitId/cohosts",
      HostCreateListing: "host/create-listing",
      HostBookings: "host/bookings",
      HostPayments: "host/payments",
      OpsKyc: "ops/kyc",
      OpsPayments: "ops/payments",
      OpsSupport: "ops/support",
      OpsTasks: "ops/tasks",
      OpsDisputes: "ops/disputes",
      OpsListings: "ops/listings",
      OpsReviewReports: "ops/review-reports",
      AdminUsers: "admin/users",
      AdminBookings: "admin/bookings",
      AdminDiscovery: "admin/discovery",
      AdminReports: "admin/reports",
      AdminStaff: "admin/staff",
      AdminAdjustments: "admin/adjustments",
      AdminFinance: "admin/finance",
      AdminListings: "admin/listings",
    },
  },
};
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
    case "MessagesTab":
      return focused ? "chatbubble" : "chatbubble-outline";
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
    case "HostExploreTab":
      return focused ? "compass" : "compass-outline";
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

function getOpsTabIconName(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "OpsHomeTab":
      return focused ? "briefcase" : "briefcase-outline";
    case "OpsExploreTab":
      return focused ? "compass" : "compass-outline";
    case "OpsMessagesTab":
      return focused ? "chatbubble" : "chatbubble-outline";
    case "OpsAccountTab":
      return focused ? "person" : "person-outline";
    default:
      return "help-circle-outline";
  }
}

function GuestTabs() {
  const { t } = useLocale();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.total_unread ?? 0;
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
      <Tab.Screen
        name="MessagesTab"
        component={InboxScreen}
        options={{
          tabBarLabel: t("messages"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function HostTabs() {
  const { t } = useLocale();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.total_unread ?? 0;
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
      <Tab.Screen name="HostExploreTab" component={HomeScreen} options={{ tabBarLabel: t("explore") }} />
      <Tab.Screen name="HostCalendarTab" component={HostCalendarScreen} options={{ tabBarLabel: t("hostCalendar") }} />
      <Tab.Screen name="HostListingsTab" component={HostListingsScreen} options={{ tabBarLabel: t("hostListings") }} />
      <Tab.Screen
        name="HostMessagesTab"
        component={InboxScreen}
        options={{
          tabBarLabel: t("hostMessages"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="HostAccountTab" component={HostProfileScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function OpsTabs() {
  const { t } = useLocale();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.total_unread ?? 0;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getOpsTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="OpsHomeTab" component={OpsHomeScreen} options={{ tabBarLabel: t("opsConsole") }} />
      <Tab.Screen name="OpsExploreTab" component={HomeScreen} options={{ tabBarLabel: t("explore") }} />
      <Tab.Screen
        name="OpsMessagesTab"
        component={InboxScreen}
        options={{
          tabBarLabel: t("hostMessages"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="OpsAccountTab" component={AccountScreen} options={{ tabBarLabel: t("account") }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isRTL } = useLocale();
  const { data: user } = useMe();
  const authed = useHasTokens();
  const queryClient = useQueryClient();
  const prevAuthed = useRef(authed);

  // Hydrate the in-memory token flag from SecureStore on mount so
  // `enabled: hasTokens()` queries start correctly after a restart.
  useEffect(() => {
    getTokens().catch(() => {});
  }, []);

  // Any transition to unauthenticated (logout, 401 refresh failure) must
  // drop user-scoped query caches — otherwise `useMe` keeps serving the
  // stale profile and the UI looks logged in.
  useEffect(() => {
    if (prevAuthed.current && !authed) {
      queryClient.clear();
    }
    prevAuthed.current = authed;
  }, [authed, queryClient]);

  useEffect(() => {
    if (user?.id) {
      registerForPushNotifications().catch(() => {
        // Push registration is best-effort; never block the app on it.
      });
    }
  }, [user?.id]);

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

  // Role-aware root: guests get the guest tabs, hosts get the host tabs,
  // staff/admin/field staff get the operations console tabs. All
  // permission enforcement remains server-side; tabs only choose the
  // default landing surface.
  const role = user?.role;
  const HomeComponent =
    role === "host" ? HostTabs : role === "admin" || role === "staff" || role === "field_staff" ? OpsTabs : GuestTabs;

  // I18nManager.forceRTL alone cannot flip a running app — it needs a
  // native restart. Wrapping the container in a direction-controlled
  // View mirrors the whole subtree (tab bar included) at runtime.
  return (
    <View style={{ flex: 1, direction: isRTL ? "rtl" : "ltr" }}>
    <NavigationContainer theme={theme} linking={linking}>
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
          name="Payment"
          component={PaymentScreen}
          options={{ title: "Payment" }}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{ title: "Payments" }}
        />
        <Stack.Screen
          name="Kyc"
          component={KycScreen}
          options={{ title: "Identity verification" }}
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
          name="Register"
          component={RegisterScreen}
          options={{ title: "Create account" }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Reset password" }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="Trips"
          component={TripsScreen}
          options={{ title: "Trips" }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: "Favorites" }}
        />
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
          options={{ title: "Help Center" }}
        />
        <Stack.Screen
          name="HelpArticle"
          component={HelpArticleScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="Disputes"
          component={DisputesScreen}
          options={{ title: "Disputes" }}
        />
        <Stack.Screen
          name="ProfileSettings"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="PersonalData"
          component={PersonalDataScreen}
          options={{ title: "Personal information" }}
        />
        <Stack.Screen
          name="SecuritySettings"
          component={SecurityScreen}
          options={{ title: "Login & security" }}
        />
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacyScreen}
          options={{ title: "Privacy & notifications" }}
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
        <Stack.Screen
          name="HostBookings"
          component={HostBookingsScreen}
          options={{ title: "Bookings" }}
        />
        <Stack.Screen
          name="HostPayments"
          component={HostPaymentsScreen}
          options={{ title: "Payments" }}
        />
        <Stack.Screen
          name="OpsKyc"
          component={OpsKycScreen}
          options={{ title: "KYC queue" }}
        />
        <Stack.Screen
          name="OpsPayments"
          component={OpsPaymentsScreen}
          options={{ title: "Payments queue" }}
        />
        <Stack.Screen
          name="OpsSupport"
          component={OpsSupportScreen}
          options={{ title: "Support queue" }}
        />
        <Stack.Screen
          name="OpsTasks"
          component={OpsTasksScreen}
          options={{ title: "Operations" }}
        />
        <Stack.Screen
          name="OpsDisputes"
          component={OpsDisputesScreen}
          options={{ title: "Disputes" }}
        />
        <Stack.Screen
          name="OpsListings"
          component={OpsListingsScreen}
          options={{ title: "Listing moderation" }}
        />
        <Stack.Screen
          name="OpsReviewReports"
          component={OpsReviewReportsScreen}
          options={{ title: "Review reports" }}
        />
        <Stack.Screen
          name="AdminUsers"
          component={AdminUsersScreen}
          options={{ title: "Users" }}
        />
        <Stack.Screen
          name="AdminBookings"
          component={AdminBookingsScreen}
          options={{ title: "Bookings" }}
        />
        <Stack.Screen
          name="AdminDiscovery"
          component={AdminDiscoveryScreen}
          options={{ title: "Discovery" }}
        />
        <Stack.Screen
          name="AdminReports"
          component={AdminReportsScreen}
          options={{ title: "Reports" }}
        />
        <Stack.Screen
          name="AdminStaff"
          component={AdminStaffScreen}
          options={{ title: "Staff" }}
        />
        <Stack.Screen
          name="AdminAdjustments"
          component={AdminAdjustmentsScreen}
          options={{ title: "Adjustments" }}
        />
        <Stack.Screen
          name="AdminFinance"
          component={AdminFinanceScreen}
          options={{ title: "Finance" }}
        />
        <Stack.Screen
          name="AdminListings"
          component={AdminListingsScreen}
          options={{ title: "Listings" }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ title: "Support" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </View>
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
