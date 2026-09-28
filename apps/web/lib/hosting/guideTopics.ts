/**
 * R2 Hosting Experience — guide topic registry.
 *
 * Pure navigation/education layer: every action points at an EXISTING
 * operational route. No duplicated engines, no fake capabilities.
 * Point counts must match the `points` objects in messages/*.json.
 */

export type GuideSection =
  | "start"
  | "manage"
  | "improve"
  | "money"
  | "safety";

export interface GuideAction {
  /** Locale-agnostic route — the locale prefix is applied at render. */
  href: string;
  labelKey: string;
}

export interface GuideTopic {
  id: string;
  section: GuideSection;
  /** Number of bullet points defined under topics.<id>.points. */
  points: number;
  actions: GuideAction[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  "start",
  "manage",
  "improve",
  "money",
  "safety",
];

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "verification",
    section: "start",
    points: 4,
    actions: [{ href: "/host/kyc", labelKey: "openKyc" }],
  },
  {
    id: "listing-setup",
    section: "start",
    points: 5,
    actions: [
      { href: "/host/listings/new", labelKey: "newListing" },
      { href: "/host/listings", labelKey: "manageListings" },
    ],
  },
  {
    id: "calendar",
    section: "manage",
    points: 4,
    actions: [{ href: "/host/calendar", labelKey: "openCalendar" }],
  },
  {
    id: "instant-book",
    section: "manage",
    points: 4,
    actions: [{ href: "/host/listings", labelKey: "manageListings" }],
  },
  {
    id: "reservations",
    section: "manage",
    points: 4,
    actions: [{ href: "/host/bookings", labelKey: "openReservations" }],
  },
  {
    id: "messaging",
    section: "manage",
    points: 4,
    actions: [{ href: "/messages", labelKey: "openMessages" }],
  },
  {
    id: "check-in-out",
    section: "improve",
    points: 4,
    actions: [{ href: "/host/listings", labelKey: "editListing" }],
  },
  {
    id: "house-rules",
    section: "improve",
    points: 4,
    actions: [{ href: "/host/listings", labelKey: "editListing" }],
  },
  {
    id: "listing-quality",
    section: "improve",
    points: 4,
    actions: [{ href: "/host/listings", labelKey: "manageListings" }],
  },
  {
    id: "reviews",
    section: "improve",
    points: 4,
    actions: [{ href: "/host/bookings", labelKey: "openReservations" }],
  },
  {
    id: "pricing",
    section: "improve",
    points: 5,
    actions: [
      { href: "/host/listings", labelKey: "editListing" },
      { href: "/host/earnings", labelKey: "openEarnings" },
    ],
  },
  {
    id: "earnings",
    section: "money",
    points: 4,
    actions: [{ href: "/host/earnings", labelKey: "openEarnings" }],
  },
  {
    id: "payouts",
    section: "money",
    points: 4,
    actions: [
      { href: "/account-settings/payments", labelKey: "openPayouts" },
    ],
  },
  {
    id: "safety",
    section: "safety",
    points: 5,
    actions: [
      { href: "/host-standards", labelKey: "standards" },
      { href: "/support", labelKey: "support" },
    ],
  },
  {
    id: "responsible-hosting",
    section: "safety",
    points: 5,
    actions: [
      { href: "/host-standards", labelKey: "standards" },
      { href: "/help", labelKey: "help" },
    ],
  },
];

export function getGuideTopic(id: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((t) => t.id === id);
}

export function topicsBySection(section: GuideSection): GuideTopic[] {
  return GUIDE_TOPICS.filter((t) => t.section === section);
}
