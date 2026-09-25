import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

let mockSearch = "";
let mockAuth = { isAuthenticated: false, isLoading: false };
let mockReturnStatus: {
  data: Record<string, unknown> | null;
  error: unknown;
  isLoading: boolean;
} = { data: null, error: null, isLoading: false };
let mockReturnStatusCalled = false;
let mockBooking: Record<string, unknown> | null = null;
let mockPayment: Record<string, unknown> | null = null;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en", bookingId: "booking-1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/checkout/booking-1",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/queries/bookings", () => ({
  useBooking: () => ({
    data: mockBooking,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useStayInfo: () => ({ data: null }),
}));

vi.mock("@/lib/queries/payments", () => ({
  usePaymentByBooking: () => ({
    data: mockPayment,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCheckoutSession: () => ({ mutate: vi.fn(), isPending: false }),
  usePaymentProofDownloadUrl: () => ({ mutate: vi.fn(), isPending: false }),
  usePaymentReturnStatus: () => {
    mockReturnStatusCalled = true;
    return mockReturnStatus;
  },
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/payments/ProofUpload", () => ({
  ProofUpload: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={String(alt ?? "")} {...props} />
  ),
}));

import CheckoutPage from "./page";

function renderPage(messages: AbstractIntlMessages, locale = "en") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <CheckoutPage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const payment = (en.payment ?? ar.payment) as Record<string, unknown>;

beforeEach(() => {
  mockSearch = "";
  mockAuth = { isAuthenticated: false, isLoading: false };
  mockReturnStatus = { data: null, error: null, isLoading: false };
  mockReturnStatusCalled = false;
  mockBooking = null;
  mockPayment = null;
});

describe("Checkout guest pricing", () => {
  it("shows exactly Accommodation, Total and the all-fees notice", () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    mockBooking = {
      id: "booking-1",
      check_in: "2030-01-10",
      check_out: "2030-01-13",
      unit_title: "Alexandria flat",
      unit_cover_image: null,
    };
    mockPayment = {
      id: "payment-1",
      status: "verified",
      // Canonical example: the guest's Accommodation line IS the final
      // all-inclusive price — VAT and fees are internal components.
      amount_egp: 4058.4,
      accommodation_amount_egp: 4058.4,
      cleaning_fee_egp: null,
      vat_egp: null,
      nights: 3,
      reference_number: "STY-PRICE",
      proof_rejection_count: 0,
      payment_deadline_at: null,
      checkout_url: null,
      reject_reason: null,
    };

    renderPage(en as never);

    expect(screen.getByText("Accommodation")).toBeInTheDocument();
    expect(screen.getByText("Total amount")).toBeInTheDocument();
    expect(screen.getByText("Prices include all fees")).toBeInTheDocument();
    // No VAT, cleaning, service-fee or percentage lines for guests.
    expect(screen.queryByText(/VAT/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Cleaning fee")).not.toBeInTheDocument();
    expect(screen.queryByText(/service fee/i)).not.toBeInTheDocument();
    // Accommodation equals the charged total — no surprise at checkout.
    expect(screen.getAllByText(/4,058\.4/).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Checkout — unauthenticated Paymob return", () => {
  it("shows the confirming state while the payment is still pending", () => {
    mockSearch = "from=paymob&pr=tok-1";
    mockReturnStatusCalled = false;
    mockReturnStatus = {
      data: {
        booking_id: "booking-1",
        payment_id: "p1",
        payment_status: "pending",
        booking_status: "accepted",
        amount_egp: 3150,
        reference_number: "STY-ABC12345",
        verified_at: null,
      },
      error: null,
      isLoading: false,
    };
    renderPage(en as never);
    expect(
      screen.getByText(String(payment.paymobReturnConfirming))
    ).toBeInTheDocument();
    expect(mockReturnStatusCalled).toBe(true);
    // Never sends the user to a bare login redirect as the result itself.
    expect(screen.queryByText(String(payment.checkoutTitle))).toBeNull();
  });

  it("shows the confirmed state once the server verifies the payment", () => {
    mockSearch = "from=paymob&pr=tok-1&success=true&id=123";
    mockReturnStatus = {
      data: {
        booking_id: "booking-1",
        payment_id: "p1",
        payment_status: "verified",
        booking_status: "confirmed",
        amount_egp: 3150,
        reference_number: "STY-ABC12345",
        verified_at: "2026-09-24T06:14:23Z",
      },
      error: null,
      isLoading: false,
    };
    renderPage(en as never);
    expect(
      screen.getByText(String(payment.paymobReturnConfirmed))
    ).toBeInTheDocument();
    expect(
      screen.getByText("STY-ABC12345")
    ).toBeInTheDocument();
  });

  it("renders the invalid-link state for a bad/expired token", () => {
    mockSearch = "from=paymob&pr=bad";
    mockReturnStatus = { data: null, error: new Error("404"), isLoading: false };
    renderPage(en as never);
    expect(
      screen.getByText(String(payment.returnLinkInvalidTitle))
    ).toBeInTheDocument();
    expect(
      screen.getByText(String(payment.signInToViewBooking))
    ).toBeInTheDocument();
  });

  it("localizes the public return view under ar", () => {
    const arPayment = ar.payment as Record<string, unknown>;
    mockSearch = "from=paymob&pr=tok-1";
    mockReturnStatus = {
      data: {
        booking_id: "booking-1",
        payment_id: "p1",
        payment_status: "pending",
        booking_status: "accepted",
        amount_egp: 3150,
        reference_number: "STY-ABC12345",
        verified_at: null,
      },
      error: null,
      isLoading: false,
    };
    renderPage(ar as never, "ar");
    expect(
      screen.getByText(String(arPayment.paymobReturnConfirming))
    ).toBeInTheDocument();
  });

  it("keeps the protected checkout path when a session exists", () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    mockSearch = "from=paymob&pr=tok-1";
    mockReturnStatusCalled = false;
    renderPage(en as never);
    // Authenticated users stay on the normal checkout — the public
    // return-status fetcher is not used.
    expect(mockReturnStatusCalled).toBe(false);
    mockAuth = { isAuthenticated: false, isLoading: false };
  });
});
