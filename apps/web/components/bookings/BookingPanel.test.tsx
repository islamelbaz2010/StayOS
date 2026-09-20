import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/listings/unit-1",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isGuest: true,
    isLoading: false,
    user: { id: "guest-1", role: "guest", kyc_status: "verified" },
  }),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useBookingQuote: () => ({
    data: {
      nightly_rate_egp: 1000,
      accommodation_egp: 4000,
      cleaning_fee_egp: 300,
      service_fee_egp: 0,
      service_fee_waived: true,
      total_egp: 4300,
    },
    isLoading: false,
  }),
  useCreateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/listings", () => ({
  useListingAvailability: () => ({ data: { days: [] } }),
}));

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
