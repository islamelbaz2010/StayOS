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

  it("anonymous sees stays/search/sign-in, no account or admin links", () => {
    renderWith(<Header />);
    expect(screen.getAllByText(t.stays).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.explore).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.signIn).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
    expect(screen.queryByText(t.account)).toBeNull();
    expect(screen.queryByText(t.messages)).toBeNull();
  });

  it("guest sees account categories with trips/favorites inside, no admin link", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    expect(screen.getAllByText(t.account).length).toBeGreaterThan(0);
    openGroup(container, t.account);
    expect(screen.getAllByText(t.trips).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.favorites).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: t.profile })).toHaveAttribute("href", "/en/profile");
    expect(screen.getByRole("link", { name: t.notifications })).toHaveAttribute("href", "/en/notifications");
    expect(screen.queryByText(t.adminConsole)).toBeNull();
    openGroup(container, t.preferences);
    expect(screen.getByRole("link", { name: t.accountSettings })).toHaveAttribute("href", "/en/account-settings");
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
    const { container } = renderWith(<Header />);
    openGroup(container, t.hosting);
    expect(screen.getAllByText(t.hostDashboard).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.adminConsole)).toBeNull();
    // Hosts book as marketplace users too — trips/favorites stay visible.
    openGroup(container, t.account);
    expect(screen.getAllByText(t.trips).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.favorites).length).toBeGreaterThan(0);
  });

  it("host nav labels match their destinations (dashboard/earnings)", () => {
    as("host");
    const { container } = renderWith(<Header />);
    openGroup(container, t.hosting);
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

/** Ordered root-level entries of the desktop account dropdown —
 *  `GROUP:label` for category buttons, hrefs for direct links. */
function menuRootEntries(container: HTMLElement): string[] {
  const menu = container.querySelector('[role="menu"]');
  expect(menu).not.toBeNull();
  const rows = Array.from(menu!.querySelectorAll("button, a"))
    .filter((el) => !el.closest(".sm\\:hidden") || true) // keep all; dedupe below
    .filter((el) => {
      // Only direct nav rows — exclude the Sign out button and the
      // language switcher buttons.
      const text = el.textContent ?? "";
      return text !== messages.nav.signOut && text !== "English" && text !== "العربية";
    });
  return rows.map((el) =>
    el.tagName === "A"
      ? (el.getAttribute("href") ?? "")
      : `GROUP:${(el.textContent ?? "").replace(/\d+\+?/g, "").trim()}`
  );
}

/** Click a root category button inside the desktop account dropdown —
 *  navigates Back to the root first when a submenu is open. */
function openGroup(container: HTMLElement, label: string) {
  const menu = container.querySelector('[role="menu"]')!;
  const backBtn = Array.from(menu.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(messages.nav.back)
  );
  if (backBtn) fireEvent.click(backBtn);
  const btn = Array.from(menu.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(label)
  );
  expect(btn, `group button "${label}"`).toBeTruthy();
  fireEvent.click(btn!);
}

/** Hrefs of the links currently visible inside the dropdown (submenu). */
function submenuHrefs(container: HTMLElement): string[] {
  const menu = container.querySelector('[role="menu"]')!;
  return Array.from(menu.querySelectorAll("a")).map(
    (a) => a.getAttribute("href") ?? ""
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

  it("guest root shows only categories; destinations live in submenus", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    const entries = menuRootEntries(container);
    expect(entries).toEqual([
      `GROUP:${t.account}`,
      `GROUP:${t.preferences}`,
      `GROUP:${t.helpSupport}`,
    ]);
    // Become-a-host lives in the header pill for guests, not the menu.
    // The root level renders no deep destinations — that's the point of
    // the hierarchical redesign.
    for (const deep of [
      "/en/profile",
      "/en/bookings",
      "/en/messages",
      "/en/account-settings",
      "/en/help",
      "/en/support",
    ]) {
      expect(entries).not.toContain(deep);
    }
  });

  it("guest Account submenu holds profile/trips/favorites/messages/notifications", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    openGroup(container, t.account);
    expect(submenuHrefs(container)).toEqual([
      "/en/profile",
      "/en/bookings",
      "/en/favorites",
      "/en/messages",
      "/en/notifications",
    ]);
  });

  it("guest Preferences + Help submenus; Back returns to root", () => {
    as("guest");
    const { container } = renderWith(<Header />);
    openGroup(container, t.preferences);
    expect(submenuHrefs(container)).toEqual([
      "/en/account-settings",
      "/en/account-settings/language",
    ]);
    // Back restores the root level
    const menu = container.querySelector('[role="menu"]')!;
    fireEvent.click(
      Array.from(menu.querySelectorAll("button")).find((b) =>
        (b.textContent ?? "").includes(t.back)
      )!
    );
    expect(menuRootEntries(container)).toContain(`GROUP:${t.helpSupport}`);
    openGroup(container, t.helpSupport);
    expect(submenuHrefs(container)).toEqual(["/en/help", "/en/support"]);
  });

  it("host menu adds a Hosting submenu with dashboard/listings/reservations/earnings/guide", () => {
    as("host");
    const { container } = renderWith(<Header />);
    const entries = menuRootEntries(container);
    expect(entries).toEqual([
      `GROUP:${t.account}`,
      `GROUP:${t.hosting}`,
      `GROUP:${t.preferences}`,
      `GROUP:${t.helpSupport}`,
    ]);
    openGroup(container, t.hosting);
    expect(submenuHrefs(container)).toEqual([
      "/en/host",
      "/en/host/listings",
      "/en/host/bookings",
      "/en/host/earnings",
      "/en/host/guide",
    ]);
  });

  it("host unread + pending badges render on groups and inside submenus", () => {
    as("host");
    mockUnread = { total_unread: 3 };
    mockNotificationsUnread = { unread_count: 2 };
    mockHostBookings = [{ id: "b1" }];
    const { container } = renderWith(<Header />);
    const menu = container.querySelector('[role="menu"]')!;
    // Root rows surface the aggregate badge (3 unread + 2 notifs = 5).
    const accountRow = Array.from(menu.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").includes(t.account)
    )!;
    expect(accountRow.textContent).toContain("5");
    openGroup(container, t.account);
    const messagesLink = Array.from(menu.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/en/messages"
    );
    expect(messagesLink?.textContent).toContain("3");
    openGroup(container, t.hosting);
    const reservationsLink = Array.from(menu.querySelectorAll("a")).find(
      (a) => a.getAttribute("href") === "/en/host/bookings"
    );
    expect(reservationsLink?.textContent).toContain("1");
  });

  it("admin gets a lean ops menu: console at root, no consumer duplicates", () => {
    as("admin");
    const { container } = renderWith(<Header />);
    const entries = menuRootEntries(container);
    expect(entries).toEqual([
      `GROUP:${t.account}`,
      "/en/admin",
      `GROUP:${t.preferences}`,
      `GROUP:${t.helpSupport}`,
    ]);
    // consumer marketplace surfaces stay out of the ops root
    expect(entries).not.toContain("/en/favorites");
    expect(entries).not.toContain("/en/messages");
    expect(entries).not.toContain("/en/host");
    openGroup(container, t.account);
    const hrefs = submenuHrefs(container);
    expect(hrefs).toContain("/en/profile");
    // Trips stays reachable — admins can book under the capability model.
    expect(hrefs).toContain("/en/bookings");
    expect(hrefs).not.toContain("/en/favorites");
    expect(hrefs).not.toContain("/en/messages");
  });

  it("staff with console access gets the admin-style menu", () => {
    as("staff", ["kyc"]);
    const { container } = renderWith(<Header />);
    expect(menuRootEntries(container)).toContain("/en/admin");
    openGroup(container, t.account);
    expect(submenuHrefs(container)).toContain("/en/bookings");
  });

  it("staff without console access gets the marketplace menu without admin", () => {
    as("staff", []);
    const { container } = renderWith(<Header />);
    expect(menuRootEntries(container)).not.toContain("/en/admin");
    openGroup(container, t.account);
    const hrefs = submenuHrefs(container);
    expect(hrefs).toContain("/en/bookings");
    expect(hrefs).toContain("/en/messages");
  });

  it("Arabic labels render in the menu including Hosting guide", () => {
    as("host");
    const { container } = renderWith(<Header />, { locale: "ar" });
    const entries = menuRootEntries(container);
    expect(entries).toContain(`GROUP:${tAr.hosting}`);
    expect(entries).toContain(`GROUP:${tAr.helpSupport}`);
    openGroup(container, tAr.hosting);
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
    // Root shows categories, not deep destinations.
    const rootTexts = Array.from(
      mobileNav.querySelectorAll("button, a")
    ).map((el) => el.textContent ?? "");
    expect(rootTexts.some((x) => x.includes(t.account))).toBe(true);
    expect(rootTexts.some((x) => x.includes(t.helpSupport))).toBe(true);
    expect(
      Array.from(mobileNav.querySelectorAll("a")).some(
        (a) => a.getAttribute("href") === "/en/bookings"
      )
    ).toBe(false);
    // Drill into Account → destinations appear.
    fireEvent.click(
      Array.from(mobileNav.querySelectorAll("button")).find((b) =>
        (b.textContent ?? "").includes(t.account)
      )!
    );
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
