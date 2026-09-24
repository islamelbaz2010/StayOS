import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/listings/unit-1",
  useRouter: () => ({ push: pushMock }),
}));

let mockAuth: Record<string, unknown> = {
  isAuthenticated: true,
  isGuest: true,
  isLoading: false,
  user: { id: "guest-1", role: "guest", kyc_status: "verified" },
};

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/queries/bookings", () => ({
  useBookingQuote: () => ({
    data: {
      nightly_rate_egp: 1000,
      total_egp: 4300,
    },
    isLoading: false,
  }),
  useCreateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

let mockDays: { date: string; status: string; price_egp: number }[] | null = [];

vi.mock("@/lib/queries/listings", () => ({
  useListingAvailability: () => ({
    data: {
      days:
        mockDays ??
        // Derive availability for whatever window the calendar requests.
        [],
    },
  }),
}));

function dayStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

import { BookingPanel } from "./BookingPanel";
import type { ListingDetail } from "@/lib/queries/listings";

const listing = {
  id: "unit-1",
  price: 1000,
  currency: "EGP",
  cleaningFee: 300,
  maxGuests: 4,
  minNights: 1,
  maxNights: 30,
  instantBook: false,
} as ListingDetail;

beforeEach(() => {
  mockAuth = {
    isAuthenticated: true,
    isGuest: true,
    isLoading: false,
    user: { id: "guest-1", role: "guest", kyc_status: "verified" },
  };
});

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <BookingPanel
          listing={listing}
          initialCheckIn="2030-01-10"
          initialCheckOut="2030-01-14"
        />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("BookingPanel unauthenticated CTA", () => {
  beforeEach(() => {
    mockDays = [];
    pushMock.mockClear();
    mockAuth = {
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      user: null,
    };
  });

  it("keeps the CTA clickable as a sign-in prompt for visitors", () => {
    renderPanel();
    const cta = screen.getByRole("button", { name: "Sign in to book" });
    expect(cta).toBeEnabled();
  });

  it("redirects to login preserving listing, dates and guests", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Sign in to book" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const target = pushMock.mock.calls[0][0] as string;
    expect(target).toMatch(/^\/en\/auth\/login\?redirect=/);
    const redirect = decodeURIComponent(target.split("redirect=")[1]);
    expect(redirect).toContain("/en/listings/unit-1");
    expect(redirect).toContain("checkin=2030-01-10");
    expect(redirect).toContain("checkout=2030-01-14");
    expect(redirect).toContain("adults=1");
  });

  it("does not create a booking before authentication", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Sign in to book" }));
    // The mutation is never invoked — no unauthenticated booking.
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});

describe("BookingPanel calendar popover", () => {
  beforeEach(() => {
    mockDays = [];
  });

  const monthGrid = () =>
    document.querySelector("[aria-label='Previous month']");

  it("calendar is closed on initial render — only date controls visible", () => {
    renderPanel();
    expect(monthGrid()).toBeNull();
    expect(screen.getByLabelText("Check-in")).toBeInTheDocument();
    expect(screen.getByLabelText("Check-out")).toBeInTheDocument();
  });

  it("clicking the check-in field opens the calendar", () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText("Check-in"));
    expect(monthGrid()).not.toBeNull();
  });

  it("clicking the check-out field opens the calendar", () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText("Check-out"));
    expect(monthGrid()).not.toBeNull();
  });

  it("check-in pick keeps the calendar open; check-out pick closes it", () => {
    mockDays = Array.from({ length: 120 }, (_, i) => ({
      date: dayStr(i + 1),
      status: "AVAILABLE",
      price_egp: 1000,
    }));
    renderPanel();

    fireEvent.click(screen.getByLabelText("Check-in"));
    expect(monthGrid()).not.toBeNull();

    // Select check-in — calendar stays open awaiting check-out.
    fireEvent.click(screen.getByRole("button", { name: dayStr(2) }));
    expect(monthGrid()).not.toBeNull();
    expect(
      (screen.getByLabelText("Check-in") as HTMLInputElement).value
    ).toBe(dayStr(2));

    // Select check-out — complete range closes the popover.
    fireEvent.click(screen.getByRole("button", { name: dayStr(5) }));
    expect(monthGrid()).toBeNull();
    expect(
      (screen.getByLabelText("Check-out") as HTMLInputElement).value
    ).toBe(dayStr(5));
  });

  it("reopening a completed range from check-out replaces the end date", () => {
    renderPanel(); // defaults: check-in tomorrow, check-out day after
    fireEvent.click(screen.getByLabelText("Check-out"));
    expect(monthGrid()).not.toBeNull();
  });

  it("Escape closes the calendar", () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText("Check-in"));
    expect(monthGrid()).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(monthGrid()).toBeNull();
  });
});

describe("BookingPanel guest-facing summary", () => {
  it("hides the internal fee breakdown but keeps total + includes-all-fees", () => {
    renderPanel();

    // Internal fee decomposition must not be exposed to guests.
    expect(screen.queryByText(/cleaning fee/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/service fee/i)).not.toBeInTheDocument();

    // Total and the all-inclusive note remain.
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Includes all fees")).toBeInTheDocument();
  });

  it("keeps the total mathematically correct (accommodation + fees)", () => {
    renderPanel();

    // 4,000 accommodation + 300 cleaning + 0 service = EGP 4,300.
    expect(screen.getByText(/4,300/)).toBeInTheDocument();
  });
});

describe("BookingPanel date validation feedback", () => {
  it("shows a live error when check-out is not after check-in", () => {
    renderPanel();

    const checkInInput = screen.getByLabelText("Check-in") as HTMLInputElement;
    const checkOutInput = screen.getByLabelText("Check-out") as HTMLInputElement;

    fireEvent.change(checkInInput, { target: { value: "2030-02-10" } });
    fireEvent.change(checkOutInput, { target: { value: "2030-02-05" } });

    expect(
      screen.getByText("Check-out must be after check-in.")
    ).toBeInTheDocument();
  });

  it("auto-bumps check-out when check-in moves past it", () => {
    renderPanel();

    const checkInInput = screen.getByLabelText("Check-in") as HTMLInputElement;
    const checkOutInput = screen.getByLabelText("Check-out") as HTMLInputElement;

    fireEvent.change(checkInInput, { target: { value: "2030-03-20" } });

    expect(checkOutInput.value).toBe("2030-03-21");
  });

  it("shows a live min-nights error instead of silently disabling submit", () => {
    const minNightsListing = { ...listing, minNights: 3 } as ListingDetail;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <BookingPanel
            listing={minNightsListing}
            initialCheckIn="2030-01-10"
            initialCheckOut="2030-01-11"
          />
        </NextIntlClientProvider>
      </QueryClientProvider>
    );

    expect(
      screen.getByText("Minimum stay is 3 nights.")
    ).toBeInTheDocument();
  });
});
