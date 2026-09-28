import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

let mockUser: { role: string; kyc_status?: string } | null = null;
let mockListings: { status: string }[] | undefined = undefined;
let mockEnabled: boolean | undefined = undefined;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/become-a-host",
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
  useHostListings: (opts?: { enabled?: boolean }) => {
    mockEnabled = opts?.enabled;
    return { data: mockListings, isLoading: false };
  },
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import BecomeAHostPage from "./page";

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

const t = enMessages.becomeHost;

describe("Become a Host page", () => {
  beforeEach(() => {
    mockUser = null;
    mockListings = undefined;
    mockEnabled = undefined;
  });

  it("renders the lifecycle steps and earnings explainer", () => {
    renderWith(<BecomeAHostPage />);
    expect(screen.getByText(t.title)).toBeInTheDocument();
    for (const id of ["account", "verify", "activate", "listing", "live"]) {
      expect(
        screen.getByText(t.steps[id as keyof typeof t.steps].title)
      ).toBeInTheDocument();
    }
    expect(screen.getByText(t.earningsTitle)).toBeInTheDocument();
    // The 6% host commission statement must be visible to prospective hosts.
    expect(
      screen.getByText(t.earningsPoints.commission)
    ).toBeInTheDocument();
  });

  it("does not fetch host listings for anonymous visitors", () => {
    renderWith(<BecomeAHostPage />);
    expect(mockEnabled).toBe(false);
    const cta = screen.getByRole("link", { name: t.cta.signIn });
    expect(cta).toHaveAttribute("href", "/en/auth/login");
  });

  it("guests with unverified KYC get routed to verification", () => {
    mockUser = { role: "guest", kyc_status: "unverified" };
    renderWith(<BecomeAHostPage />);
    expect(mockEnabled).toBe(false);
    const cta = screen.getByRole("link", { name: t.cta.verifyIdentity });
    expect(cta).toHaveAttribute("href", "/en/kyc");
    expect(screen.getAllByText(t.stepStatus.todo).length).toBeGreaterThan(0);
  });

  it("guests with pending KYC see the in-review state", () => {
    mockUser = { role: "guest", kyc_status: "pending" };
    renderWith(<BecomeAHostPage />);
    expect(
      screen.getAllByText(t.stepStatus.pending).length
    ).toBeGreaterThan(0);
  });

  it("verified guests are sent back to verification to activate hosting", () => {
    mockUser = { role: "guest", kyc_status: "verified" };
    renderWith(<BecomeAHostPage />);
    const cta = screen.getByRole("link", {
      name: t.cta.continueVerification,
    });
    expect(cta).toHaveAttribute("href", "/en/kyc");
  });

  it("hosts without listings are routed to listing creation", () => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockListings = [];
    renderWith(<BecomeAHostPage />);
    expect(mockEnabled).toBe(true);
    const cta = screen.getByRole("link", { name: t.cta.createListing });
    expect(cta).toHaveAttribute("href", "/en/host/listings/new");
  });

  it("hosts with a live listing get the dashboard CTA and done states", () => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockListings = [{ status: "LISTED" }];
    renderWith(<BecomeAHostPage />);
    const cta = screen.getByRole("link", { name: t.cta.openDashboard });
    expect(cta).toHaveAttribute("href", "/en/host");
    expect(screen.getAllByText(t.stepStatus.done).length).toBe(5);
  });

  it("a listing under review shows the pending state", () => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockListings = [{ status: "PENDING_VERIFICATION" }];
    renderWith(<BecomeAHostPage />);
    expect(
      screen.getAllByText(t.stepStatus.pending).length
    ).toBeGreaterThan(0);
  });

  it("renders in Arabic", () => {
    const at = arMessages.becomeHost;
    renderWith(<BecomeAHostPage />, arMessages);
    expect(screen.getByText(at.title)).toBeInTheDocument();
    expect(
      screen.getByText(at.steps.verify.title)
    ).toBeInTheDocument();
  });
});
