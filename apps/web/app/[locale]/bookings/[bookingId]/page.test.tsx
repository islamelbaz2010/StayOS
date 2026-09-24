import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

let mockStay: Record<string, unknown> | null = null;

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
  usePaymentByBooking: () => ({ data: null }),
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

function renderPage(messages: Record<string, unknown>, locale: string) {
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
