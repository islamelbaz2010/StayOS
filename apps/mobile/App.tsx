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
import { MenuGroupScreen } from "./src/screens/MenuGroupScreen";

export type RootStackParamList = {
  Home: { screen?: string } | undefined;
  Search:
    | {
        city?: string;
        propertyType?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: number;
      }
    | undefined;
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
  MenuGroup: {
    title: string;
    items: {
      key: string;
      label: string;
      route: string;
      params?: Record<string, unknown>;
      icon?: string;
    }[];
  };
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
      MenuGroup: "menu",
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
      return focused ? "compass" : "compass-outline";
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
      return focused ? "search" : "search-outline";
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
      return focused ? "search" : "search-outline";
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
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getGuestTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: t("home") }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: t("explore") }} />
      <Tab.Screen name="TripsTab" component={TripsScreen} options={{ tabBarLabel: t("trips") }} />
      <Tab.Screen
        name="MessagesTab"
        component={InboxScreen}
        options={{
          tabBarLabel: t("inbox"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ tabBarLabel: t("profile") }} />
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
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getHostTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HostTodayTab" component={HostTodayScreen} options={{ tabBarLabel: t("hostToday") }} />
      <Tab.Screen name="HostExploreTab" component={SearchScreen} options={{ tabBarLabel: t("explore") }} />
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
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getOpsTabIconName(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="OpsHomeTab" component={OpsHomeScreen} options={{ tabBarLabel: t("opsConsole") }} />
      <Tab.Screen name="OpsExploreTab" component={SearchScreen} options={{ tabBarLabel: t("explore") }} />
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
  const { isRTL, loaded, t } = useLocale();
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

  // Sync the native RTL flag only after the persisted locale has hydrated —
  // otherwise the "ar" boot default would write forceRTL(true) on every
  // cold start before the real (e.g. English) locale loads.
  useEffect(() => {
    if (!loaded) return;
    if (isRTL !== I18nManager.isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  }, [loaded, isRTL]);

  // Hold render until the persisted locale is known — prevents an Arabic
  // flash for English users and a wrong-direction first frame.
  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
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
          options={{ title: t("search") }}
        />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: t("titleBooking") }}
        />
        <Stack.Screen
          name="HostProfile"
          component={GuestHostProfileScreen}
          options={{ title: t("titleHost") }}
        />
        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{ title: t("titleTrip") }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ title: t("titlePayment") }}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{ title: t("paymentsTitle") }}
        />
        <Stack.Screen
          name="Kyc"
          component={KycScreen}
          options={{ title: t("verifyIdentity") }}
        />
        <Stack.Screen
          name="Message"
          component={MessageScreen}
          options={{ title: t("messages") }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: t("login") }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: t("createAccount") }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: t("titleResetPassword") }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: t("notifications") }}
        />
        <Stack.Screen
          name="Trips"
          component={TripsScreen}
          options={{ title: t("trips") }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: t("favorites") }}
        />
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenterScreen}
          options={{ title: t("helpCenter") }}
        />
        <Stack.Screen
          name="HelpArticle"
          component={HelpArticleScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="Disputes"
          component={DisputesScreen}
          options={{ title: t("disputes") }}
        />
        <Stack.Screen
          name="ProfileSettings"
          component={ProfileScreen}
          options={{ title: t("profile") }}
        />
        <Stack.Screen
          name="PersonalData"
          component={PersonalDataScreen}
          options={{ title: t("personalInfo") }}
        />
        <Stack.Screen
          name="SecuritySettings"
          component={SecurityScreen}
          options={{ title: t("loginSecurity") }}
        />
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacyScreen}
          options={{ title: t("privacyNotifications") }}
        />
        <Stack.Screen
          name="HostReservationDetail"
          component={HostReservationDetailScreen}
          options={{ title: t("titleReservation") }}
        />
        <Stack.Screen
          name="HostEarnings"
          component={HostEarningsScreen}
          options={{ title: t("hostEarnings") }}
        />
        <Stack.Screen
          name="HostListingDetail"
          component={HostListingDetailScreen}
          options={{ title: t("titleListing") }}
        />
        <Stack.Screen
          name="HostListingEditor"
          component={HostListingEditorScreen}
          options={{ title: t("titleEditListing") }}
        />
        <Stack.Screen
          name="HostListingPhotos"
          component={HostListingPhotosScreen}
          options={{ title: t("titlePhotos") }}
        />
        <Stack.Screen
          name="HostListingAvailability"
          component={HostListingAvailabilityScreen}
          options={{ title: t("titleAvailability") }}
        />
        <Stack.Screen
          name="HostListingCoHosts"
          component={HostListingCoHostsScreen}
          options={{ title: t("titleCoHosts") }}
        />
        <Stack.Screen
          name="HostCreateListing"
          component={HostCreateListingScreen}
          options={{ title: t("hostNewListing") }}
        />
        <Stack.Screen
          name="HostBookings"
          component={HostBookingsScreen}
          options={{ title: t("hostBookings") }}
        />
        <Stack.Screen
          name="HostPayments"
          component={HostPaymentsScreen}
          options={{ title: t("paymentsTitle") }}
        />
        <Stack.Screen
          name="OpsKyc"
          component={OpsKycScreen}
          options={{ title: t("titleKycQueue") }}
        />
        <Stack.Screen
          name="OpsPayments"
          component={OpsPaymentsScreen}
          options={{ title: t("titlePaymentsQueue") }}
        />
        <Stack.Screen
          name="OpsSupport"
          component={OpsSupportScreen}
          options={{ title: t("titleSupportQueue") }}
        />
        <Stack.Screen
          name="OpsTasks"
          component={OpsTasksScreen}
          options={{ title: t("titleOperations") }}
        />
        <Stack.Screen
          name="OpsDisputes"
          component={OpsDisputesScreen}
          options={{ title: t("disputes") }}
        />
        <Stack.Screen
          name="OpsListings"
          component={OpsListingsScreen}
          options={{ title: t("titleListingModeration") }}
        />
        <Stack.Screen
          name="OpsReviewReports"
          component={OpsReviewReportsScreen}
          options={{ title: t("titleReviewReports") }}
        />
        <Stack.Screen
          name="AdminUsers"
          component={AdminUsersScreen}
          options={{ title: t("titleUsers") }}
        />
        <Stack.Screen
          name="AdminBookings"
          component={AdminBookingsScreen}
          options={{ title: t("hostBookings") }}
        />
        <Stack.Screen
          name="AdminDiscovery"
          component={AdminDiscoveryScreen}
          options={{ title: t("titleDiscovery") }}
        />
        <Stack.Screen
          name="AdminReports"
          component={AdminReportsScreen}
          options={{ title: t("titleReports") }}
        />
        <Stack.Screen
          name="AdminStaff"
          component={AdminStaffScreen}
          options={{ title: t("titleStaff") }}
        />
        <Stack.Screen
          name="AdminAdjustments"
          component={AdminAdjustmentsScreen}
          options={{ title: t("titleAdjustments") }}
        />
        <Stack.Screen
          name="AdminFinance"
          component={AdminFinanceScreen}
          options={{ title: t("titleFinance") }}
        />
        <Stack.Screen
          name="AdminListings"
          component={AdminListingsScreen}
          options={{ title: t("titleListings") }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ title: t("support") }}
        />
        <Stack.Screen
          name="MenuGroup"
          component={MenuGroupScreen}
          options={({ route }) => ({ title: route.params?.title ?? t("titleMenuGroup") })}
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
