import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";
import type { PaymentListItem } from "@/lib/queries/payments";

let mockPayments: PaymentListItem[] = [];

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/payments",
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", role: "guest" },
    isLoading: false,
    isAuthenticated: true,
    refreshUser: vi.fn(async () => {}),
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/queries/payments", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/queries/payments")>();
  return {
    ...mod,
    useMyPayments: () => ({
      data: mockPayments,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
  };
});

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img alt="" {...props} />
  ),
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import PaymentsPage from "./page";

const paymentsMsgs = messages.payments as Record<string, unknown>;
const tabs = paymentsMsgs.tabs as Record<string, string>;

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function makePayment(over: Partial<PaymentListItem>): PaymentListItem {
  return {
    id: "p1",
    booking_id: "b1",
    guest_id: "u1",
    host_id: "h1",
    unit_id: "u1",
    status: "verified",
    method: "card",
    amount_egp: 1760.16,
    reference_number: "STY-AAA",
    proof_s3_key: null,
    proof_url: null,
    proof_uploaded_at: null,
    reject_reason: null,
    accommodation_amount_egp: null,
    guest_service_fee_egp: null,
    payment_deadline_at: null,
    refund_amount_egp: null,
    refunded_at: null,
    proof_rejection_count: 0,
    unit_title: "Cairo Flat",
    unit_cover_image: null,
    check_in: null,
    check_out: null,
    booking_status: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...over,
  };
}

function renderPage(items: PaymentListItem[]) {
  mockPayments = items;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <PaymentsPage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("PaymentsPage", () => {
  it("renders all payments under the All tab", () => {
    renderPage([
      makePayment({ id: "p1", reference_number: "STY-AAA" }),
      makePayment({ id: "p2", reference_number: "STY-BBB", status: "pending" }),
    ]);
    expect(screen.getByText("STY-AAA", { exact: false })).toBeTruthy();
    expect(screen.getByText("STY-BBB", { exact: false })).toBeTruthy();
  });

  it("filters to pending payments", () => {
    renderPage([
      makePayment({ id: "p1", reference_number: "STY-AAA" }),
      makePayment({ id: "p2", reference_number: "STY-BBB", status: "pending" }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: tabs.pending }));
    expect(screen.queryByText("STY-AAA", { exact: false })).toBeNull();
    expect(screen.getByText("STY-BBB", { exact: false })).toBeTruthy();
  });

  it("filters upcoming verified payments by future check-in", () => {
    renderPage([
      makePayment({
        id: "p1",
        reference_number: "STY-AAA",
        check_in: futureDate(10),
        check_out: futureDate(12),
      }),
      makePayment({
        id: "p2",
        reference_number: "STY-BBB",
        check_in: pastDate(10),
        check_out: pastDate(8),
      }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: tabs.upcoming }));
    expect(screen.getByText("STY-AAA", { exact: false })).toBeTruthy();
    expect(screen.queryByText("STY-BBB", { exact: false })).toBeNull();
  });

  it("filters completed stays", () => {
    renderPage([
      makePayment({
        id: "p1",
        reference_number: "STY-AAA",
        check_in: pastDate(10),
        check_out: pastDate(8),
      }),
      makePayment({
        id: "p2",
        reference_number: "STY-BBB",
        check_in: futureDate(10),
        check_out: futureDate(12),
      }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: tabs.completed }));
    expect(screen.getByText("STY-AAA", { exact: false })).toBeTruthy();
    expect(screen.queryByText("STY-BBB", { exact: false })).toBeNull();
  });

  it("filters cancelled and refunded", () => {
    renderPage([
      makePayment({ id: "p1", reference_number: "STY-AAA", status: "cancelled" }),
      makePayment({ id: "p2", reference_number: "STY-BBB", status: "refunded" }),
      makePayment({ id: "p3", reference_number: "STY-CCC" }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: tabs.cancelled }));
    expect(screen.getByText("STY-AAA", { exact: false })).toBeTruthy();
    expect(screen.queryByText("STY-CCC", { exact: false })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: tabs.refunded }));
    expect(screen.getByText("STY-BBB", { exact: false })).toBeTruthy();
    expect(screen.queryByText("STY-AAA", { exact: false })).toBeNull();
  });

  it("searches by reference number", () => {
    renderPage([
      makePayment({ id: "p1", reference_number: "STY-AAA" }),
      makePayment({ id: "p2", reference_number: "STY-BBB" }),
    ]);
    fireEvent.change(
      screen.getByPlaceholderText(
        paymentsMsgs.searchPlaceholder as string
      ),
      { target: { value: "BBB" } }
    );
    expect(screen.queryByText("STY-AAA", { exact: false })).toBeNull();
    expect(screen.getByText("STY-BBB", { exact: false })).toBeTruthy();
  });

  it("shows empty-filtered state when nothing matches", () => {
    renderPage([makePayment({ id: "p1", status: "verified" })]);
    fireEvent.click(screen.getByRole("button", { name: tabs.cancelled }));
    expect(
      screen.getByText(paymentsMsgs.emptyFiltered as string)
    ).toBeTruthy();
  });

  it("states that StayOS does not store card details", () => {
    renderPage([]);
    expect(
      screen.getByText(paymentsMsgs.methodsNote as string)
    ).toBeTruthy();
  });
});
