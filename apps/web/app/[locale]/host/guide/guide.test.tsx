import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

let mockUser: { role: string; kyc_status?: string } | null = {
  role: "host",
  kyc_status: "verified",
};
let mockListings:
  | {
      status: string;
      cover_image?: string | null;
      base_price_egp?: number;
    }[]
  | undefined = [];
let mockAccount: { payout_method?: string | null } | undefined = undefined;
let mockParams = { locale: "en", topic: "pricing" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/host/guide",
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

vi.mock("@/lib/queries/hostListings", () => ({
  useHostListings: () => ({ data: mockListings, isLoading: false }),
}));

vi.mock("@/lib/queries/account", () => ({
  useAccount: () => ({ data: mockAccount }),
}));

vi.mock("@/lib/queries/hostToday", () => ({
  useHostToday: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@/lib/queries/messages", () => ({
  useUnreadCount: () => ({ data: { total_unread: 0 } }),
}));

vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: () => ({ data: { unread_count: 0 } }),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useHostBookings: () => ({ data: [] }),
}));

vi.mock("@/components/layouts", () => ({
  HostLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Header: () => <div />,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({
    children,
    allowedRoles,
  }: {
    children: React.ReactNode;
    allowedRoles?: string[];
  }) => (
    <div data-allowed-roles={allowedRoles?.join(",")}>{children}</div>
  ),
}));

import HostGuidePage from "./page";
import HostGuideTopicPage from "./[topic]/page";

function renderWith(ui: React.ReactNode, messages = enMessages) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const t = enMessages.hostGuide;

describe("Hosting hub (guide index)", () => {
  beforeEach(() => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockListings = [];
    mockAccount = undefined;
    mockParams = { locale: "en", topic: "pricing" };
  });

  it("is gated to host and admin roles", () => {
    renderWith(<HostGuidePage />);
    expect(
      screen.getByText(t.title).closest("[data-allowed-roles]")
        ?.getAttribute("data-allowed-roles")
    ).toBe("host,admin");
  });

  it("renders every guide section with topic cards linking to guide routes", () => {
    const { container } = renderWith(<HostGuidePage />);
    for (const s of ["start", "manage", "improve", "money", "safety"]) {
      expect(
        screen.getByText(
          t.sections[s as keyof typeof t.sections].title
        )
      ).toBeInTheDocument();
    }
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/en/host/guide/pricing");
    expect(hrefs).toContain("/en/host/guide/safety");
    expect(hrefs).toContain("/en/host/guide/responsible-hosting");
    expect(hrefs).toContain("/en/host/guide/instant-book");
  });

  it("shows readiness from real states — all attention for an empty host", () => {
    renderWith(<HostGuidePage />);
    // identity is verified (ready); everything else needs attention
    expect(screen.getAllByText(t.status.ready).length).toBe(1);
    expect(
      screen.getAllByText(t.status.attention).length
    ).toBeGreaterThanOrEqual(4);
  });

  it("marks live listings, photos, pricing, and payout as ready", () => {
    mockListings = [
      { status: "LISTED", cover_image: "img.jpg", base_price_egp: 900 },
    ];
    mockAccount = { payout_method: "bank" };
    renderWith(<HostGuidePage />);
    expect(screen.getAllByText(t.status.ready).length).toBe(6);
    expect(screen.queryByText(t.status.attention)).toBeNull();
  });

  it("marks a pending listing review as pending, not ready", () => {
    mockListings = [
      { status: "PENDING_VERIFICATION", cover_image: null, base_price_egp: 0 },
    ];
    renderWith(<HostGuidePage />);
    expect(screen.getAllByText(t.status.pending).length).toBe(1);
  });

  it("support strip links to help, support, and standards", () => {
    const { container } = renderWith(<HostGuidePage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/en/help");
    expect(hrefs).toContain("/en/support");
    expect(hrefs).toContain("/en/host-standards");
  });
});

describe("Guide topic page", () => {
  beforeEach(() => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockParams = { locale: "en", topic: "pricing" };
  });

  it("renders the topic title, all points, and action links", () => {
    const { container } = renderWith(<HostGuideTopicPage />);
    expect(screen.getByText(t.topics.pricing.title)).toBeInTheDocument();
    const points = Object.values(t.topics.pricing.points);
    for (const p of points) {
      expect(screen.getByText(p)).toBeInTheDocument();
    }
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/en/host/listings");
    expect(hrefs).toContain("/en/host/earnings");
    expect(hrefs).toContain("/en/host/guide");
  });

  it("renders the safety topic with the no-insurance statement", () => {
    mockParams = { locale: "en", topic: "safety" };
    renderWith(<HostGuideTopicPage />);
    expect(
      screen.getByText(t.topics.safety.points.p5)
    ).toBeInTheDocument();
  });

  it("renders an unknown topic gracefully", () => {
    mockParams = { locale: "en", topic: "does-not-exist" };
    renderWith(<HostGuideTopicPage />);
    expect(screen.getByText(t.notFoundTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t.back })
    ).toHaveAttribute("href", "/en/host/guide");
  });

  it("renders a topic in Arabic", () => {
    mockParams = { locale: "ar", topic: "responsible-hosting" };
    renderWith(<HostGuideTopicPage />, arMessages);
    expect(
      screen.getByText(arMessages.hostGuide.topics["responsible-hosting"].title)
    ).toBeInTheDocument();
  });
});
