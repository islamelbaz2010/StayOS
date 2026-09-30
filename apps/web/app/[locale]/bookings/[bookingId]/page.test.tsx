import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

let mockStay: Record<string, unknown> | null = null;
let mockPayment: Record<string, unknown> | null = null;
let mockUser: { id: string; role: string } | null = null;

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockUser !== null,
    isGuest: mockUser?.role === "guest",
    isHost: mockUser?.role === "host",
    isLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en", bookingId: "b1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/bookings/b1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useStayInfo: () => ({
    data: mockStay,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCheckIn: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCheckOut: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/payments", () => ({
  usePaymentByBooking: () => ({ data: mockPayment }),
}));

vi.mock("@/lib/queries/messages", () => ({
  useBookingConversation: () => ({ data: null }),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/bookings/StayTimeline", () => ({
  StayTimeline: () => <div data-testid="timeline" />,
}));

vi.mock("@/components/bookings/CancelBookingButton", () => ({
  CancelBookingButton: () => null,
}));

vi.mock("@/components/bookings/LeaveReviewForm", () => ({
  LeaveReviewForm: () => null,
}));

vi.mock("@/components/disputes/ReportProblem", () => ({
  ReportProblem: () => null,
}));

import TripDetailPage from "./page";

function makeStay(cancelReason: string | null) {
  return {
    booking: {
      id: "b1",
      unit_id: "u1",
      guest_id: "guest-1",
      status: "cancelled",
      stay_phase: "cancelled",
      cancel_reason: cancelReason,
      reject_reason: null,
      check_in: "2026-03-01",
      check_out: "2026-03-04",
      adults: 2,
      children: 0,
      checked_in_at: null,
    },
    property: { title: "Test flat", cover_image: null },
    host: { id: "h1", display_name: "Host" },
    arrival: {},
    review_eligible: false,
    review_window_expired: false,
  };
}

function renderPage(messages: AbstractIntlMessages, locale: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <TripDetailPage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("Trip detail — cancellation reason", () => {
  it("renders free-text cancellation reasons verbatim (no raw i18n key)", () => {
    mockStay = makeStay("هاجي مش");
    renderPage(en as never, "en");
    expect(screen.getByText("هاجي مش")).toBeInTheDocument();
    expect(
      screen.queryByText(/cancelReasons\./)
    ).toBeNull();
  });

  it("renders free-text Arabic reason under ar locale", () => {
    mockStay = makeStay("ظروف طارئة");
    renderPage(ar as never, "ar");
    expect(screen.getByText("ظروف طارئة")).toBeInTheDocument();
  });

  it.each(["en", "ar"] as const)(
    "localizes the machine-coded reason host_cancelled (%s)",
    (locale) => {
      const messages = locale === "en" ? en : ar;
      mockStay = makeStay("host_cancelled");
      renderPage(messages as never, locale);
      const expected = (
        messages.trips as { cancelReasons: Record<string, string> }
      ).cancelReasons.host_cancelled;
      expect(screen.getByText(expected)).toBeInTheDocument();
      expect(screen.queryByText("host_cancelled")).toBeNull();
    }
  );
});

function makeAcceptedStay() {
  const stay = makeStay(null);
  return {
    ...stay,
    booking: {
      ...stay.booking,
      status: "accepted",
      stay_phase: "upcoming",
      cancel_reason: null,
    },
    host: {
      name: "Host Person",
      phone: "+201000000000",
      kyc_status: "verified",
      languages: ["Arabic"],
    },
    arrival: {
      eligible: false,
      check_in_instructions: null,
      default_check_in_time: "15:00",
      default_check_out_time: "11:00",
    },
  };
}

function makeHostViewerStay() {
  const stay = makeStay(null);
  return {
    ...stay,
    booking: {
      ...stay.booking,
      status: "confirmed",
      stay_phase: "check_in_ready",
      cancel_reason: null,
      permission_scope: "owner",
      guest_name: "Guest Person",
      guest_kyc_status: "verified",
      guest_member_since: "2025-01-15T00:00:00Z",
      guest_reviews_count: 3,
      guest_average_rating: 4.5,
    },
    host: {
      name: "Host Person",
      phone: "+201000000000",
      kyc_status: "verified",
      languages: [],
    },
    arrival: {
      eligible: false,
      check_in_instructions: null,
      default_check_in_time: "15:00",
      default_check_out_time: "11:00",
    },
  };
}

describe("Trip detail — capability-based access", () => {
  it("booking owner sees checkout CTA and payment card", () => {
    mockUser = { id: "guest-1", role: "host" }; // host CAN be a booking owner
    mockStay = makeAcceptedStay();
    mockPayment = { status: "pending", amount_egp: 1200 };
    renderPage(en as never, "en");

    expect(screen.getByText("Complete payment")).toBeInTheDocument();
    expect(screen.getByText("Payment status")).toBeInTheDocument();
  });

  it("non-owner host viewer sees payment + guest context, not guest actions", () => {
    mockUser = { id: "host-1", role: "host" };
    mockStay = makeHostViewerStay();
    mockPayment = { status: "verified", amount_egp: 1200 };
    renderPage(en as never, "en");

    // Payment surface is visible to the authorized host viewer.
    expect(screen.getByText("Payment status")).toBeInTheDocument();
    // Guest trust context replaces the guest's "Your stay" host card.
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("Guest Person")).toBeInTheDocument();
    expect(screen.queryByText("Your stay")).toBeNull();
    // Guest-only actions are never rendered for non-owners.
    expect(screen.queryByText("Complete payment")).toBeNull();
    // Back link goes to host bookings, not the guest trips list.
    const back = screen.getByText("My trips").closest("a");
    expect(back?.getAttribute("href")).toContain("/host/bookings");
  });

  it("non-owner admin viewer without scope stays on the page", () => {
    mockUser = { id: "admin-1", role: "admin" };
    mockStay = makeHostViewerStay();
    (mockStay.booking as Record<string, unknown>).permission_scope = null;
    mockPayment = { status: "verified", amount_egp: 1200 };
    renderPage(en as never, "en");

    expect(screen.getByText("Payment status")).toBeInTheDocument();
    expect(screen.queryByText("Complete payment")).toBeNull();
  });
});
