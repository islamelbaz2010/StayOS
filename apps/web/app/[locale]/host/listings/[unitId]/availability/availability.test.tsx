import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockCalendar:
  | {
      days: { date: string; status: string; price_egp: number }[];
    }
  | undefined;
let mockCalendarError = false;
let mockListing: { permission_scope: string; title_en: string; cover_image: string | null } | undefined;

const mutateAsync = vi.fn(async () => ({}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en", unitId: "unit-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/host/listings/unit-1/availability",
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

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: { role: "host" },
    isLoading: false,
    isAuthenticated: true,
    refreshUser: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
  }),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/layouts", () => ({
  HostLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/lib/queries/hostListings", () => ({
  useHostListingDetail: () => ({
    data: mockListing,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/queries/calendar", () => ({
  useDefaultHostCalendarRange: () => ({
    data: mockCalendar,
    isLoading: false,
    isError: mockCalendarError,
    refetch: vi.fn(),
  }),
  useCreateCalendarRule: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
  }),
}));

import AvailabilityPage from "./page";

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AvailabilityPage />
    </NextIntlClientProvider>,
  );
}

function iso(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

beforeEach(() => {
  cleanup();
  mutateAsync.mockClear();
  mockCalendarError = false;
  mockListing = {
    permission_scope: "owner",
    title_en: "Cozy flat",
    cover_image: null,
  };
  mockCalendar = {
    days: [
      { date: iso(0), status: "AVAILABLE", price_egp: 500 },
      { date: iso(1), status: "BOOKED", price_egp: 0 },
      { date: iso(2), status: "BLOCKED", price_egp: 0 },
      { date: iso(3), status: "AVAILABLE", price_egp: 500 },
    ],
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Host availability page", () => {
  it("renders uppercase API statuses with correct counts", () => {
    renderPage();
    // 2 available, 1 booked, 1 blocked — the API returns UPPERCASE statuses.
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBe(2);
    expect(
      screen.getAllByText(enMessages.hostListings.calendarBooked).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(enMessages.hostListings.calendarBlocked).length,
    ).toBeGreaterThan(0);
  });

  it("lists only non-available days", () => {
    renderPage();
    // Non-available day rows show the blocked/booked dates.
    expect(screen.getByText(iso(1))).toBeInTheDocument();
    expect(screen.getByText(iso(2))).toBeInTheDocument();
    // Available days are excluded from the list.
    expect(screen.queryByText(iso(0))).not.toBeInTheDocument();
  });

  it("submits canonical uppercase rule payload", async () => {
    renderPage();
    fireEvent.click(
      screen.getByText(enMessages.hostListings.blockDates),
    );
    fireEvent.change(screen.getByLabelText(enMessages.hostListings.dateFrom), {
      target: { value: "2026-11-01" },
    });
    fireEvent.change(screen.getByLabelText(enMessages.hostListings.dateTo), {
      target: { value: "2026-11-05" },
    });
    fireEvent.click(screen.getByText(enMessages.hostListings.addRule));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      unitId: "unit-1",
      payload: {
        date_from: "2026-11-01",
        date_to: "2026-11-05",
        status: "BLOCKED",
        block_type: "MANUAL",
        price_override: null,
      },
    });
  });

  it("shows error state when the calendar request fails", () => {
    mockCalendarError = true;
    renderPage();
    expect(
      screen.getByText(enMessages.common.error),
    ).toBeInTheDocument();
  });

  it("hides the block form for read-only scopes", () => {
    mockListing = {
      permission_scope: "messaging_only",
      title_en: "Cozy flat",
      cover_image: null,
    };
    renderPage();
    expect(
      screen.queryByText(enMessages.hostListings.blockDates),
    ).not.toBeInTheDocument();
  });
});
