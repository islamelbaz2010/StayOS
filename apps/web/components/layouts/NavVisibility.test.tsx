import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

let mockLocale = "en";
let mockUnread = { total_unread: 0 };
let mockNotificationsUnread = { unread_count: 0 };
let mockHostBookings: unknown[] = [];

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
  useParams: () => ({ locale: mockLocale }),
  usePathname: () => `/${mockLocale}`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/queries/messages", () => ({
  useUnreadCount: () => ({ data: mockUnread }),
}));

vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: () => ({
    data: { unread_count: mockNotificationsUnread.unread_count },
  }),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useHostBookings: () => ({ data: mockHostBookings }),
}));

vi.mock("@/lib/queries/hostListings", () => ({
  usePendingListings: () => ({ data: [] }),
}));

import { Header } from "./Header";
import { Footer } from "./Footer";

import arMessages from "@/messages/ar.json";

function renderWith(
  ui: React.ReactNode,
  opts: { locale?: string } = {}
) {
  const locale = opts.locale ?? "en";
  mockLocale = locale;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ar" ? arMessages : messages}
      >
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
const tAr = arMessages.nav as Record<string, string>;

describe("Header role visibility", () => {
  beforeEach(() => as(null));

  it("anonymous sees search/support/sign-in, no account or admin links", () => {
    renderWith(<Header />);
    expect(screen.getAllByText(t.search).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.signIn).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
    expect(screen.queryByText(t.account)).toBeNull();
    expect(screen.queryByText(t.messages)).toBeNull();
  });

  it("guest sees trips/favorites/payments but no admin link", () => {
    as("guest");
    renderWith(<Header />);
    expect(screen.getAllByText(t.trips).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.favorites).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.account).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: t.profile })).toHaveAttribute("href", "/en/profile");
    expect(screen.getByRole("link", { name: t.accountSettings })).toHaveAttribute("href", "/en/account-settings");
    expect(screen.getByRole("link", { name: t.notifications })).toHaveAttribute("href", "/en/notifications");
    expect(screen.queryByText(t.adminConsole)).toBeNull();
  });

  it("staff without permissions gets NO admin link (dead-end 403)", () => {
    as("staff", []);
    renderWith(<Header />);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
  });

  it("staff with a permission gets the admin link", () => {
    as("staff", ["listings"]);
    renderWith(<Header />);
    expect(screen.getAllByText(t.adminConsole).length).toBeGreaterThan(0);
  });

  it("field_staff never gets an admin link", () => {
    as("field_staff");
    renderWith(<Header />);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
  });

  it("host sees host workspace + earnings + trips but no admin link", () => {
    as("host");
    renderWith(<Header />);
    expect(screen.getAllByText(t.hostDashboard).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
    // Hosts book as marketplace users too — trips/favorites stay visible.
    expect(screen.getAllByText(t.trips).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.favorites).length).toBeGreaterThan(0);
  });

  it("host nav labels match their destinations (dashboard/earnings)", () => {
    as("host");
    const { container } = renderWith(<Header />);
    const links = Array.from(container.querySelectorAll("a"));
    const byHref = (href: string) =>
      links.filter((a) => a.getAttribute("href") === href);
    // /host is the dashboard — must not be labeled "List your property"
    for (const a of byHref("/en/host"))
      expect(a.textContent).toContain(t.hostDashboard);
    // /host/earnings is earnings — must not reuse the guest "Payments" label
    for (const a of byHref("/en/host/earnings"))
      expect(a.textContent).toContain(t.earnings);
    // hosts are already hosts — no guest CTA toward the host-entry page
    expect(byHref("/en/kyc")).toHaveLength(0);
    expect(byHref("/en/become-a-host")).toHaveLength(0);
  });

  it("admin sees the admin link", () => {
    as("admin");
    renderWith(<Header />);
    expect(screen.getAllByText(t.adminConsole).length).toBeGreaterThan(0);
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
    const anchors = Array.from(container.querySelectorAll("a"));
    const hrefs = anchors.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/host");
    expect(hrefs).toContain("/en/host/listings");
    expect(hrefs).toContain("/en/host/guide");
    expect(hrefs.filter((h) => h?.includes("/admin"))).toHaveLength(0);
    expect(hrefs).not.toContain("/en/kyc");
    expect(hrefs).not.toContain("/en/become-a-host");
    // /host link is labeled as the dashboard, not the guest CTA
    const dash = anchors.find((a) => a.getAttribute("href") === "/en/host");
    expect(dash?.textContent).toContain(t.hostDashboard);
    expect(screen.queryByText(t.becomeHost)).toBeNull();
  });

  it("guest footer uses the canonical 'Become a host' label for /become-a-host", () => {
    as("guest");
    const { container } = renderWith(<Footer />);
    const anchors = Array.from(container.querySelectorAll("a"));
    const entryLink = anchors.find(
      (a) => a.getAttribute("href") === "/en/become-a-host"
    );
    expect(entryLink?.textContent).toBe(t.becomeHost);
    // The host-side 'List your property' label must not appear for a guest.
    expect(
      Array.from(container.querySelectorAll("p, a")).some(
        (el) => el.textContent === t.host
      )
    ).toBe(false);
  });

  it("anonymous footer uses the canonical 'Become a host' label for /become-a-host", () => {
    as(null);
    const { container } = renderWith(<Footer />);
    const anchors = Array.from(container.querySelectorAll("a"));
    const entryLink = anchors.find(
      (a) => a.getAttribute("href") === "/en/become-a-host"
    );
    expect(entryLink?.textContent).toBe(t.becomeHost);
    expect(
      Array.from(container.querySelectorAll("p, a")).some(
        (el) => el.textContent === t.host
      )
    ).toBe(false);
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

/** Ordered hrefs + section labels inside the desktop account dropdown. */
function accountMenuEntries(container: HTMLElement): string[] {
  const menu = container.querySelector('[role="menu"]');
  expect(menu).not.toBeNull();
  return Array.from(menu!.querySelectorAll("a, p"))
    .filter((el) => el.tagName === "A" || el.className.includes("uppercase"))
    .map((el) =>
      el.tagName === "A" ? (el.getAttribute("href") ?? "") : `SECTION:${el.textContent}`
    );
}

describe("Account menu information architecture", () => {
  beforeEach(() => {
    as(null);
    mockLocale = "en";
    mockUnread = { total_unread: 0 };
    mockNotificationsUnread = { unread_count: 0 };
    mockHostBookings = [];
  });

  it("guest menu: profile → trips → favorites → comms → settings → support sections", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    const entries = accountMenuEntries(container);
    const order = [
      "/en/profile",
      "/en/bookings",
      "/en/favorites",
      "/en/messages",
      "/en/notifications",
      "/en/account-settings",
      "/en/become-a-host",
      "/en/account-settings/language",
      `SECTION:${t.helpSupport}`,
      "/en/help",
      "/en/support",
    ];
    expect(entries).toEqual(order);
    // payments/language are consolidated under Account Settings, not duplicated
    expect(entries).not.toContain("/en/payments");
    expect(entries.filter((e) => e === "/en/support")).toHaveLength(1);
  });

  it("host menu adds a Hosting section with dashboard/listings/earnings/guide", () => {
    as("host");
    const { container } = renderWith(<Header />);
    const entries = accountMenuEntries(container);
    const hostingIdx = entries.indexOf(`SECTION:${t.hosting}`);
    expect(hostingIdx).toBeGreaterThan(-1);
    const afterHosting = entries.slice(hostingIdx);
    expect(afterHosting).toEqual(
      expect.arrayContaining([
        "/en/host",
        "/en/host/listings",
        "/en/host/earnings",
        "/en/host/guide",
      ])
    );
    // dashboard comes first inside Hosting
    expect(entries.indexOf("/en/host")).toBeLessThan(entries.indexOf("/en/host/guide"));
    // language sits at top level before the Hosting section
    const langIdx = entries.indexOf("/en/account-settings/language");
    expect(langIdx).toBeGreaterThan(-1);
    expect(langIdx).toBeLessThan(hostingIdx);
    // payments stays inside account settings — no top-level duplicate
    expect(entries).not.toContain("/en/payments");
    expect(entries).not.toContain("/en/admin");
  });

  it("host unread + pending badges render inside the menu", () => {
    as("host");
    mockUnread = { total_unread: 3 };
    mockNotificationsUnread = { unread_count: 2 };
    mockHostBookings = [{ id: "b1" }];
    const { container } = renderWith(<Header />);
    const menu = container.querySelector('[role="menu"]')!;
    const messagesLink = Array.from(menu.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/en/messages"
    );
    const hostLink = Array.from(menu.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/en/host"
    );
    expect(messagesLink?.textContent).toContain("3");
    expect(hostLink?.textContent).toContain("1");
  });

  it("admin gets a lean ops menu: no favorites/messages duplicates", () => {
    as("admin");
    const { container } = renderWith(<Header />);
    const entries = accountMenuEntries(container);
    expect(entries).toContain("/en/admin");
    expect(entries).toContain("/en/profile");
    expect(entries).toContain("/en/account-settings");
    expect(entries).toContain("/en/account-settings/language");
    expect(entries).toContain("/en/help");
    expect(entries).toContain("/en/support");
    // Trips stays reachable — admins can book under the capability model.
    expect(entries).toContain("/en/bookings");
    // consumer marketplace links stay out of the ops menu
    expect(entries).not.toContain("/en/favorites");
    expect(entries).not.toContain("/en/messages");
    expect(entries).not.toContain("/en/payments");
    expect(entries).not.toContain("/en/host");
  });

  it("staff with console access gets the admin-style menu", () => {
    as("staff", ["kyc"]);
    const { container } = renderWith(<Header />);
    const entries = accountMenuEntries(container);
    expect(entries).toContain("/en/admin");
    expect(entries).toContain("/en/bookings");
  });

  it("staff without console access gets the marketplace menu without admin", () => {
    as("staff", []);
    const { container } = renderWith(<Header />);
    const entries = accountMenuEntries(container);
    expect(entries).toContain("/en/bookings");
    expect(entries).toContain("/en/messages");
    expect(entries).not.toContain("/en/admin");
  });

  it("Arabic labels render in the menu including Hosting guide", () => {
    as("host");
    const { container } = renderWith(<Header />, { locale: "ar" });
    const entries = accountMenuEntries(container);
    expect(entries).toContain(`SECTION:${tAr.hosting}`);
    expect(entries).toContain(`SECTION:${tAr.helpSupport}`);
    expect(entries).toContain("/ar/host/guide");
    const guideLink = Array.from(container.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/ar/host/guide"
    );
    expect(guideLink?.textContent).toContain("دليل الاستضافة");
  });

  it("mobile menu mirrors the same IA and closes on navigation", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    const toggle = screen.getByRole("button", { name: t.toggleMenu });
    fireEvent.click(toggle);
    const mobileNavs = container.querySelectorAll("nav");
    const mobileNav = mobileNavs[mobileNavs.length - 1];
    const entries = Array.from(mobileNav.querySelectorAll("a, p")).map((el) =>
      el.tagName === "A" ? (el.getAttribute("href") ?? "") : `SECTION:${el.textContent}`
    );
    expect(entries).toContain("/en/bookings");
    expect(entries).toContain(`SECTION:${t.helpSupport}`);
    // viewport-constrained scrollable drawer — Sign out must stay reachable
    expect(mobileNav.className).toContain("overflow-y-auto");
    expect(mobileNav.className).toContain("max-h-");
    // body scroll locks while the drawer is open
    expect(document.body.style.overflow).toBe("hidden");
    // click a menu link → the mobile drawer unmounts and scroll unlocks
    const link = Array.from(mobileNav.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/en/bookings"
    );
    fireEvent.click(link!);
    expect(container.querySelector("nav")).not.toBe(mobileNav);
    expect(document.body.style.overflow).toBe("");
  });
});
