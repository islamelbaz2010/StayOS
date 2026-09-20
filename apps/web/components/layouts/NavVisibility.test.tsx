import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

let mockAuth: {
  user: { role: string; staff_permissions?: string[] } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
} = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  logout: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  usePathname: () => "/en",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/queries/messages", () => ({
  useUnreadCount: () => ({ data: { total_unread: 0 } }),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useHostBookings: () => ({ data: [] }),
}));

vi.mock("@/lib/queries/hostListings", () => ({
  usePendingListings: () => ({ data: [] }),
}));

import { Header } from "./Header";
import { Footer } from "./Footer";

function renderWith(ui: React.ReactNode) {
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

function as(role: string | null, staffPermissions: string[] = []) {
  mockAuth = {
    user: role ? { role, staff_permissions: staffPermissions } : null,
    isLoading: false,
    isAuthenticated: role !== null,
    logout: vi.fn(),
  };
}

const t = messages.nav as Record<string, string>;

describe("Header role visibility", () => {
  beforeEach(() => as(null));

  it("anonymous sees search/support/sign-in, no account or admin links", () => {
    renderWith(<Header />);
    expect(screen.getAllByText(t.search).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.signIn).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.admin)).toBeNull();
    expect(screen.queryByText(t.account)).toBeNull();
    expect(screen.queryByText(t.messages)).toBeNull();
  });

  it("guest sees trips/favorites/payments but no admin link", () => {
    as("guest");
    renderWith(<Header />);
    expect(screen.getAllByText(t.trips).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.favorites).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.account).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.admin)).toBeNull();
  });

  it("staff without permissions gets NO admin link (dead-end 403)", () => {
    as("staff", []);
    renderWith(<Header />);
    expect(screen.queryByText(t.admin)).toBeNull();
  });

  it("staff with a permission gets the admin link", () => {
    as("staff", ["listings"]);
    renderWith(<Header />);
    expect(screen.getAllByText(t.admin).length).toBeGreaterThan(0);
  });

  it("field_staff never gets an admin link", () => {
    as("field_staff");
    renderWith(<Header />);
    expect(screen.queryByText(t.admin)).toBeNull();
  });

  it("host sees host workspace + earnings but no admin link", () => {
    as("host");
    renderWith(<Header />);
    expect(screen.getAllByText(t.host).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.admin)).toBeNull();
    expect(screen.queryByText(t.trips)).toBeNull();
  });

  it("admin sees the admin link", () => {
    as("admin");
    renderWith(<Header />);
    expect(screen.getAllByText(t.admin).length).toBeGreaterThan(0);
  });
});

describe("Footer role visibility", () => {
  beforeEach(() => as(null));

  it("anonymous: search present, account link points to sign-in not /profile", () => {
    renderWith(<Footer />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/en/search");
    expect(links).toContain("/en/auth/login");
    expect(links).not.toContain("/en/profile");
    expect(links).not.toContain("/en/admin");
  });

  it("staff without permissions gets no admin links and no empty workspace", () => {
    as("staff", []);
    renderWith(<Footer />);
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs.filter((h) => h?.includes("/admin"))).toHaveLength(0);
    expect(hrefs).toContain("/en/profile");
  });

  it("staff with listings permission gets admin + pending links", () => {
    as("staff", ["listings"]);
    renderWith(<Footer />);
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/admin");
    expect(hrefs).toContain("/en/admin/pending");
  });

  it("staff with only kyc permission gets admin but no pending link", () => {
    as("staff", ["kyc"]);
    renderWith(<Footer />);
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/admin");
    expect(hrefs).not.toContain("/en/admin/pending");
  });

  it("field_staff sees no admin links and no empty workspace column", () => {
    as("field_staff");
    const { container } = renderWith(<Footer />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs.filter((h) => h?.includes("/admin"))).toHaveLength(0);
    expect(hrefs).toContain("/en/profile");
    expect(hrefs).toContain("/en/search");
  });

  it("host gets host workspace links, no admin, no become-host", () => {
    as("host");
    const { container } = renderWith(<Footer />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/en/host");
    expect(hrefs).toContain("/en/host/listings");
    expect(hrefs.filter((h) => h?.includes("/admin"))).toHaveLength(0);
    expect(hrefs).not.toContain("/en/kyc");
  });

  it("every role can reach search (header/footer policy parity)", () => {
    for (const role of [null, "guest", "host", "admin", "staff", "field_staff"]) {
      as(role);
      const { container, unmount } = renderWith(<Footer />);
      const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
        a.getAttribute("href")
      );
      expect(hrefs).toContain("/en/search");
      unmount();
    }
  });
});
