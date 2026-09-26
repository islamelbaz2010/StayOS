import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

let mockUser: Record<string, unknown> | null = null;
let mockAccount: Record<string, unknown> | null = null;
let mockPrivacy: Record<string, unknown> = {
  profile_public: true,
  read_receipts: true,
};
let mockPrefs: Record<string, unknown> = {
  preferences: {
    account_policies: true,
    reservations: true,
    reminders: true,
    messages: true,
    host_activity: true,
    offers: false,
  },
};
let mockSessions: Record<string, unknown> = {
  sessions: [
    {
      id: "s1",
      created_at: "2026-02-01T10:00:00Z",
      expires_at: "2026-03-01T10:00:00Z",
    },
  ],
};
const mockPatchPrivacy = vi.fn(async (p: unknown) => p);
const mockPutPrefs = vi.fn(async (p: unknown) => p);
const mockPatchProfile = vi.fn(async (p: unknown) => p);

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/account-settings",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: mockUser !== null,
    refreshUser: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
  }),
}));

vi.mock("@/lib/queries/account", () => ({
  useAccount: () => ({ data: mockAccount }),
  useUpdateAccount: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}));

vi.mock("@/lib/queries/kyc", () => ({
  useKycStatus: () => ({ data: null }),
}));

vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: () => ({
    data: {
      items: [
        {
          id: "n1",
          event_type: "reservation.confirmed",
          category: "reservations",
          subject: "Booking confirmed",
          body: "Your booking is confirmed.",
          locale: "en",
          read_at: null,
          created_at: "2026-02-02T12:00:00Z",
        },
        {
          id: "n2",
          event_type: "kyc.approved",
          category: "account_policies",
          subject: "Identity verified",
          body: "Your identity was verified.",
          locale: "en",
          read_at: "2026-02-01T12:00:00Z",
          created_at: "2026-02-01T12:00:00Z",
        },
      ],
      unread_count: 1,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/lib/queries/settings", () => ({
  usePrivacySettings: () => ({ data: mockPrivacy, isLoading: false }),
  useUpdatePrivacySettings: () => ({
    mutate: mockPatchPrivacy,
    isPending: false,
  }),
  useNotificationPreferences: () => ({ data: mockPrefs, isLoading: false }),
  useUpdateNotificationPreferences: () => ({
    mutate: mockPutPrefs,
    isPending: false,
  }),
  useSessions: () => ({ data: mockSessions, isLoading: false }),
  useUpdateProfile: () => ({
    mutateAsync: mockPatchProfile,
    isPending: false,
  }),
  logoutAllSessions: vi.fn(async () => 2),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async () => ({ data: {} })),
    post: vi.fn(async () => ({ data: {} })),
    patch: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: {} })),
  },
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/profile/Avatar", () => ({
  Avatar: () => <div data-testid="avatar" />,
}));

import AccountSettingsPage from "./page";
import SecurityPage from "./security/page";
import PrivacyPage from "./privacy/page";
import NotificationPreferencesPage from "./notifications/page";
import AccountActivityPage from "./activity/page";
import LanguageCurrencyPage from "./language/page";
import PaymentsSettingsPage from "./payments/page";
import PersonalInfoPage from "./personal/page";

const settings = messages.settings as Record<string, unknown>;
const cards = settings.cards as Record<string, { title: string }>;
const notif = settings.notifPage as Record<string, unknown>;
const notifCats = notif.categories as Record<string, { title: string }>;
const privacy = settings.privacyPage as Record<string, string>;

const baseUser = {
  id: "u1",
  display_name: "Test User",
  phone_number: "+20100000000",
  email: "u@example.com",
  role: "guest",
  is_active: true,
  kyc_status: "unverified",
  locale: "en",
  created_at: "2026-01-01T00:00:00Z",
};

function renderPage(Page: React.ComponentType) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <Page />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { ...baseUser };
  mockAccount = null;
  mockPrivacy = { profile_public: true, read_receipts: true };
});

describe("Account settings hub", () => {
  it("renders every settings card", () => {
    renderPage(AccountSettingsPage);
    for (const key of [
      "personal",
      "security",
      "privacy",
      "notifications",
      "activity",
      "language",
      "payments",
      "taxes",
    ]) {
      expect(screen.getByText(cards[key].title)).toBeInTheDocument();
    }
  });

  it("shows 'Become a host' for guests and 'Hosting' for hosts", () => {
    renderPage(AccountSettingsPage);
    expect(screen.getByText(cards.becomeHost.title)).toBeInTheDocument();
    mockUser = { ...baseUser, role: "host" };
    renderPage(AccountSettingsPage);
    expect(screen.getByText(cards.hosting.title)).toBeInTheDocument();
  });
});

describe("Privacy settings page", () => {
  it("renders enforced toggles with current values", () => {
    renderPage(PrivacyPage);
    const profileSwitch = screen.getByRole("switch", {
      name: privacy.profilePublic,
    });
    const receiptsSwitch = screen.getByRole("switch", {
      name: privacy.readReceipts,
    });
    expect(profileSwitch).toHaveAttribute("aria-checked", "true");
    expect(receiptsSwitch).toHaveAttribute("aria-checked", "true");
  });

  it("persists a toggle change via the update mutation", () => {
    renderPage(PrivacyPage);
    fireEvent.click(
      screen.getByRole("switch", { name: privacy.readReceipts })
    );
    expect(mockPatchPrivacy).toHaveBeenCalledWith(
      { read_receipts: false },
      expect.anything()
    );
  });

  it("offers data export and account deactivation", () => {
    renderPage(PrivacyPage);
    expect(screen.getByText(privacy.export)).toBeInTheDocument();
    expect(screen.getByText(privacy.deactivate)).toBeInTheDocument();
  });
});

describe("Notification preferences page", () => {
  it("renders locked categories as always-on, not as switches", () => {
    renderPage(NotificationPreferencesPage);
    for (const key of ["account_policies", "reservations", "reminders"]) {
      expect(
        screen.getByText(notifCats[key].title)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("switch", { name: notifCats[key].title })
      ).toBeNull();
    }
    // 3 category badges + the section heading share the "Always on" copy
    expect(
      screen.getAllByText(notif.alwaysOn as string).length
    ).toBeGreaterThanOrEqual(3);
  });

  it("renders toggleable categories and persists changes", () => {
    renderPage(NotificationPreferencesPage);
    const offers = screen.getByRole("switch", {
      name: notifCats.offers.title,
    });
    expect(offers).toHaveAttribute("aria-checked", "false");
    fireEvent.click(offers);
    expect(mockPutPrefs).toHaveBeenCalledWith(
      { preferences: { offers: true } },
      expect.anything()
    );
  });
});

describe("Account activity page", () => {
  it("groups notification history by category", () => {
    renderPage(AccountActivityPage);
    expect(screen.getByText("Booking confirmed")).toBeInTheDocument();
    expect(screen.getByText("Identity verified")).toBeInTheDocument();
  });

  it("filters by category", () => {
    renderPage(AccountActivityPage);
    fireEvent.click(
      screen.getAllByText("Account & policies").find(
        (el) => el.tagName === "BUTTON"
      )!
    );
    expect(screen.queryByText("Booking confirmed")).toBeNull();
    expect(screen.getByText("Identity verified")).toBeInTheDocument();
  });
});

describe("Language & currency page", () => {
  it("offers Arabic and English and shows EGP as fixed currency", () => {
    renderPage(LanguageCurrencyPage);
    expect(screen.getByText("العربية")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText(/EGP/)).toBeInTheDocument();
  });

  it("persists the locale on the user profile", async () => {
    renderPage(LanguageCurrencyPage);
    fireEvent.click(screen.getByText("English"));
    await waitFor(() =>
      expect(mockPatchProfile).toHaveBeenCalledWith({ locale: "en" })
    );
  });
});

describe("Security page", () => {
  it("lists active sessions and offers sign-out-everywhere", () => {
    renderPage(SecurityPage);
    const security = settings.securityPage as Record<string, string>;
    expect(screen.getByText(security.session)).toBeInTheDocument();
    expect(screen.getByText(security.logoutAll)).toBeInTheDocument();
  });
});

describe("Payments settings page", () => {
  it("links to payment history without fake saved cards", () => {
    renderPage(PaymentsSettingsPage);
    const payments = settings.paymentsPage as Record<string, string>;
    expect(
      screen.getByText(new RegExp(payments.viewPayments))
    ).toBeInTheDocument();
    expect(screen.queryByText(payments.payouts)).toBeNull();
  });

  it("shows masked payout fields for hosts", () => {
    mockUser = { ...baseUser, role: "host" };
    mockAccount = {
      payout_method: "bank",
      payout_bank_name: "CIB",
      payout_account_number: "••••1234",
      payout_holder_name: "Test User",
    };
    renderPage(PaymentsSettingsPage);
    expect(screen.getByText("••••1234")).toBeInTheDocument();
  });
});

describe("Personal information page", () => {
  it("renders the shared personal-information editor", () => {
    renderPage(PersonalInfoPage);
    const profile = messages.profile as Record<string, unknown>;
    expect(
      screen.getAllByText(profile.personalInfo as string).length
    ).toBeGreaterThanOrEqual(1);
  });
});
