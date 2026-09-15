import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
