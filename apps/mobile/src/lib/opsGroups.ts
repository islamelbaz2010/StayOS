import type { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";

export interface OpsItem {
  key: string;
  route: keyof RootStackParamList;
  permission: string | null; // null = admin-only
  labelEn: string;
  labelAr: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface OpsGroup {
  key: string;
  labelKey: string;
  descKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: OpsItem[];
}

// Mirrors the web AdminLayout navGroups (adminNav.groups.*). Shared between
// the ops console home and the staff/admin account menu so both surfaces
// expose the same permission-gated destinations.
export const OPS_GROUPS: OpsGroup[] = [
  {
    key: "marketplace",
    labelKey: "opsGroupMarketplace",
    descKey: "opsDescMarketplace",
    icon: "business-outline",
    items: [
      { key: "listings", route: "OpsListings", permission: "listings", labelEn: "Listing moderation", labelAr: "مراجعة الإعلانات", icon: "checkmark-done-outline" },
      { key: "listingsAll", route: "AdminListings", permission: "listings", labelEn: "All listings", labelAr: "كل الإعلانات", icon: "business-outline" },
      { key: "discovery", route: "AdminDiscovery", permission: "discovery", labelEn: "Discovery & import", labelAr: "الاكتشاف والاستيراد", icon: "cloud-download-outline" },
    ],
  },
  {
    key: "usersTrust",
    labelKey: "opsGroupUsersTrust",
    descKey: "opsDescUsersTrust",
    icon: "people-circle-outline",
    items: [
      { key: "users", route: "AdminUsers", permission: null, labelEn: "Users", labelAr: "المستخدمون", icon: "people-outline" },
      { key: "kyc", route: "OpsKyc", permission: "kyc", labelEn: "KYC verification queue", labelAr: "قائمة توثيق الهوية", icon: "id-card-outline" },
    ],
  },
  {
    key: "money",
    labelKey: "opsGroupMoney",
    descKey: "opsDescMoney",
    icon: "wallet-outline",
    items: [
      { key: "payments", route: "OpsPayments", permission: "payments", labelEn: "Payment review queue", labelAr: "قائمة مراجعة المدفوعات", icon: "card-outline" },
      // /admin/adjustments* is guarded by the "payments" permission
      { key: "adjustments", route: "AdminAdjustments", permission: "payments", labelEn: "Adjustments", labelAr: "التسويات", icon: "swap-horizontal-outline" },
      { key: "finance", route: "AdminFinance", permission: "payments", labelEn: "Finance", labelAr: "المالية", icon: "wallet-outline" },
    ],
  },
  {
    key: "insights",
    labelKey: "opsGroupInsights",
    descKey: "opsDescInsights",
    icon: "bar-chart-outline",
    items: [
      { key: "reports", route: "AdminReports", permission: "reports", labelEn: "Reports", labelAr: "التقارير", icon: "stats-chart-outline" },
    ],
  },
  {
    key: "operations",
    labelKey: "opsGroupOperations",
    descKey: "opsDescOperations",
    icon: "construct-outline",
    items: [
      // AdminBookingsScreen lists via /host/bookings → "operations" grant
      { key: "bookings", route: "AdminBookings", permission: "operations", labelEn: "Bookings", labelAr: "الحجوزات", icon: "clipboard-outline" },
      { key: "support", route: "OpsSupport", permission: "operations", labelEn: "Support queue", labelAr: "قائمة الدعم", icon: "chatbubble-outline" },
      { key: "disputes", route: "OpsDisputes", permission: "disputes", labelEn: "Disputes", labelAr: "النزاعات", icon: "alert-circle-outline" },
      { key: "reviews", route: "OpsReviewReports", permission: "disputes", labelEn: "Review reports", labelAr: "بلاغات التقييمات", icon: "flag-outline" },
      // /operations/* is role-gated (admin/operations/field_staff), not
      // permission-gated — staff with the "operations" grant still 403.
      { key: "tasks", route: "OpsTasks", permission: null, labelEn: "Maintenance & readiness", labelAr: "الصيانة والجاهزية", icon: "construct-outline" },
    ],
  },
  {
    key: "admin",
    labelKey: "opsGroupAdmin",
    descKey: "opsDescAdmin",
    icon: "shield-checkmark-outline",
    items: [
      { key: "staff", route: "AdminStaff", permission: null, labelEn: "Staff & permissions", labelAr: "الموظفون والصلاحيات", icon: "shield-outline" },
    ],
  },
];
