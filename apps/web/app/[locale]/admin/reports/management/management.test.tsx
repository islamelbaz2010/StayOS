import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import type { ManagementReport } from "@/lib/queries/reports";

let mockLocale = "en";
let mockAuth: {
  user: { role: string; staff_permissions?: string[] } | null;
} = { user: null };

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: mockLocale }),
  usePathname: () => `/${mockLocale}/admin/reports/management`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/layouts", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const fixture: ManagementReport = {
  generated_at: "2026-09-28T12:00:00Z",
  period: { date_from: null, date_to: null },
  filters_applied: {},
  kpis: {
    collected_egp: 27110.02,
    stayos_revenue_egp: 3674.4,
    vat_payable_egp: 2185.62,
    host_payable_egp: 9328.0,
    funds_held_egp: 21078.48,
    refunded_egp: 5445.96,
    payouts_pending_egp: 0,
    payouts_paid_egp: 0,
    refund_pending_egp: 0,
  },
  revenue: {
    gross_credits_egp: 3764.4,
    debits_egp: 90.0,
    net_egp: 3674.4,
    pending_in_escrow_egp: 1224.0,
    by_month: [{ month: "2026-09", amount_egp: 3674.4 }],
  },
  vat: {
    calculated_egp: 2467.58,
    recognised_egp: 529.14,
    held_egp: 1656.48,
    reversed_egp: 0,
    payable_egp: 2185.62,
  },
  bookings: {
    total: 38,
    by_status: { cancelled: 28, completed: 6, confirmed: 4 },
    by_governorate: [{ governorate: "Cairo", count: 20 }],
  },
  settlement: {
    funds_held_egp: 21078.48,
    escrows_held: 6,
    host_payable_egp: 9328.0,
    host_net_pending_egp: 10608.0,
    payouts_pending_egp: 0,
    payouts_paid_egp: 0,
    escrows_by_status: [
      { status: "held", count: 3, amount_egp: 13488.48 },
      { status: "created", count: 3, amount_egp: 7590.0 },
    ],
    open_escrows: [
      {
        escrow_id: "e1",
        booking_id: "6310f3c9-aaaa-bbbb-cccc-ddddeeeeffff",
        status: "held",
        amount_egp: 10579.2,
        host_amount_egp: 8320.0,
        platform_share_egp: 960.0,
        vat_egp: 1299.2,
      },
    ],
  },
  refunds: {
    refunded_egp: 5445.96,
    refund_pending_egp: 0,
    vat_reversed_egp: 281.96,
    adjustments: [
      {
        adjustment_id: "adj-1",
        created_at: "2026-09-26T10:00:00Z",
        booking_id: "b-1",
        adjustment_type: "host_credit",
        amount_egp: 90,
        status: "applied",
        reason: "goodwill",
        actor: "admin-1",
      },
    ],
  },
  top_bookings: [
    {
      booking_id: "6310f3c9",
      property: "Luxury Villa in Marassi",
      status: "confirmed",
      guest_total_egp: 10579.2,
      host_net_egp: 8320.0,
      stayos_revenue_egp: 960.0,
      vat_egp: 1299.2,
    },
  ],
  date_bases: {
    kpis: "payment_verified_or_recognised",
    revenue: "ledger_recognised",
    vat: "ledger_plus_escrow_held",
    bookings: "booking_created",
    refunds: "refund_completed",
    top_bookings: "payment_created",
  },
};

let mockReport: {
  data?: ManagementReport;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
} = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };

vi.mock("@/lib/queries/reports", () => ({
  useManagementReport: () => mockReport,
}));

import ManagementPage from "./page";

function renderWith(locale = "en") {
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
        <ManagementPage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const tMgmt = messages.managementReport as Record<string, unknown>;
const tMgmtAr = arMessages.managementReport as Record<string, unknown>;

describe("Management report (PDF view)", () => {
  beforeEach(() => {
    mockReport = { data: fixture, isPending: false, isError: false, refetch: vi.fn() };
    mockAuth = { user: { role: "admin" } };
  });

  it("renders the executive KPIs matching the dashboard values", () => {
    renderWith();
    const kpi = tMgmt.kpi as Record<string, string>;
    expect(screen.getByText(kpi.stayosRevenue)).toBeInTheDocument();
    // 3,674.40 net revenue + 2,185.62 VAT payable + 21,078.48 funds held
    expect(screen.getAllByText(/3,674\.40/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2,185\.62/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/21,078\.48/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/27,110\.02/).length).toBeGreaterThan(0);
  });

  it("shows VAT decomposition: recognised + held − reversed = payable", () => {
    renderWith();
    const vat = tMgmt.vat as Record<string, string>;
    expect(screen.getByText(vat.recognised)).toBeInTheDocument();
    expect(screen.getByText(vat.held)).toBeInTheDocument();
    expect(screen.getByText(vat.reversed)).toBeInTheDocument();
    expect(screen.getByText(vat.payable)).toBeInTheDocument();
    // 1,656.48 held VAT inside the Sept-28 escrows
    expect(screen.getAllByText(/1,656\.48/).length).toBeGreaterThan(0);
  });

  it("shows pending held-escrow revenue as not-yet-recognised", () => {
    renderWith();
    const revenue = tMgmt.revenue as Record<string, string>;
    expect(screen.getByText(revenue.pending)).toBeInTheDocument();
    expect(screen.getAllByText(/1,224/).length).toBeGreaterThan(0);
  });

  it("renders bookings-by-status, top bookings and the appendix", () => {
    renderWith();
    expect(screen.getByText("Luxury Villa in Marassi")).toBeInTheDocument();
    expect(screen.getByText("Cairo")).toBeInTheDocument();
    expect(screen.getByText("6310f3c9")).toBeInTheDocument();
    expect(screen.getByText(/38 bookings|38/)).toBeInTheDocument();
  });

  it("denies staff without the reports permission", () => {
    mockAuth = { user: { role: "staff", staff_permissions: ["kyc"] } };
    renderWith();
    expect(
      screen.getByText(tMgmt.noPermission as string)
    ).toBeInTheDocument();
  });

  it("renders Arabic labels", () => {
    renderWith("ar");
    expect(
      screen.getByText(tMgmtAr.title as string)
    ).toBeInTheDocument();
    const kpi = tMgmtAr.kpi as Record<string, string>;
    expect(screen.getAllByText(kpi.vatPayable).length).toBeGreaterThan(0);
  });

  it("exposes a Download PDF print affordance", () => {
    renderWith();
    expect(
      screen.getByRole("button", {
        name: new RegExp(tMgmt.downloadPdf as string),
      })
    ).toBeInTheDocument();
  });
});
