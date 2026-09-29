import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

let mockLocale = "en";
let mockReportKey = "booking_financials";
let mockAuth: {
  user: { role: string; staff_permissions?: string[] } | null;
} = { user: null };

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: mockLocale, reportKey: mockReportKey }),
  usePathname: () => `/${mockLocale}/admin/reports`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layouts", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const catalogFixture = [
  {
    key: "booking_financials",
    category: "financial",
    columns: ["booking_id", "vat_egp"],
    date_basis: "booking_created",
    filters: ["status", "governorate", "date_from", "date_to"],
    sortable: ["created_at"],
    money_columns: ["vat_egp"],
    implemented: true,
    unavailable_reason: null,
  },
  {
    key: "rebooked_bookings",
    category: "bookings",
    columns: ["booking_id"],
    date_basis: "booking_created",
    filters: [],
    sortable: [],
    money_columns: [],
    implemented: false,
    unavailable_reason: "no_rebooking_linkage",
  },
];

const reportFixture = {
  key: "booking_financials",
  category: "financial",
  date_basis: "booking_created",
  columns: ["booking_id", "vat_egp"],
  rows: [{ booking_id: "b-1", vat_egp: 216.16 }],
  total: 1,
  page: 1,
  page_size: 50,
  totals: { vat_egp: 216.16 },
  generated_at: "2026-01-01T12:00:00Z",
  filters_applied: {},
};

let mockCatalog: { data?: unknown; isPending: boolean; isError: boolean; refetch: () => void } = {
  data: undefined,
  isPending: true,
  isError: false,
  refetch: vi.fn(),
};
let mockReport: { data?: unknown; isPending: boolean; isError: boolean; refetch: () => void } = {
  data: undefined,
  isPending: true,
  isError: false,
  refetch: vi.fn(),
};
const exportSpy = vi.fn();

vi.mock("@/lib/queries/reports", () => ({
  useReportCatalog: () => mockCatalog,
  useReport: () => mockReport,
  downloadReportExport: (...args: unknown[]) => exportSpy(...args),
}));

import CatalogPage from "./page";
import ViewerPage from "./[reportKey]/page";

function renderWith(ui: React.ReactNode, locale = "en") {
  mockLocale = locale;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={locale === "ar" ? arMessages : messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const t = messages.adminReports as Record<string, unknown>;
const tReports = t.reports as Record<string, string>;
const tAr = arMessages.adminReports as Record<string, unknown>;
const tArReports = tAr.reports as Record<string, string>;

describe("Admin Reports catalog", () => {
  beforeEach(() => {
    mockCatalog = { data: catalogFixture, isPending: false, isError: false, refetch: vi.fn() };
    mockAuth = { user: { role: "admin" } };
  });

  it("renders grouped report catalog with implemented links", () => {
    renderWith(<CatalogPage />);
    expect(screen.getByText(tReports.booking_financials)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: new RegExp(tReports.booking_financials) });
    expect(link).toHaveAttribute("href", "/en/admin/reports/booking_financials");
  });

  it("shows unimplemented reports disabled with a reason", () => {
    renderWith(<CatalogPage />);
    expect(screen.getByText(tReports.rebooked_bookings)).toBeInTheDocument();
    expect(screen.getByText(new RegExp("Not yet implemented"))).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: new RegExp(tReports.rebooked_bookings) })
    ).toBeNull();
  });

  it("denies staff without the reports permission", () => {
    mockAuth = { user: { role: "staff", staff_permissions: ["kyc"] } };
    renderWith(<CatalogPage />);
    expect(screen.getByText(t.noPermission as string)).toBeInTheDocument();
  });

  it("admits staff holding the reports permission", () => {
    mockAuth = { user: { role: "staff", staff_permissions: ["reports"] } };
    renderWith(<CatalogPage />);
    expect(screen.getByText(tReports.booking_financials)).toBeInTheDocument();
  });

  it("renders Arabic labels in ar locale", () => {
    renderWith(<CatalogPage />, "ar");
    expect(screen.getByText(tArReports.booking_financials)).toBeInTheDocument();
    expect(screen.getByText(tAr.title as string)).toBeInTheDocument();
  });
});

describe("Admin Report viewer", () => {
  beforeEach(() => {
    mockReportKey = "booking_financials";
    mockCatalog = { data: catalogFixture, isPending: false, isError: false, refetch: vi.fn() };
    mockReport = { data: reportFixture, isPending: false, isError: false, refetch: vi.fn() };
    mockAuth = { user: { role: "admin" } };
    exportSpy.mockClear();
  });

  it("renders rows, columns and totals", () => {
    renderWith(<ViewerPage />);
    expect(screen.getByText("b-1")).toBeInTheDocument();
    // VAT column header + value + totals row
    expect(screen.getAllByText(/VAT/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/216/).length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no rows", () => {
    mockReport = { data: { ...reportFixture, rows: [], total: 0, totals: {} }, isPending: false, isError: false, refetch: vi.fn() };
    renderWith(<ViewerPage />);
    expect(screen.getByText(t.noRows as string)).toBeInTheDocument();
  });

  it("shows error state on failure", () => {
    mockReport = { data: undefined, isPending: false, isError: true, refetch: vi.fn() };
    renderWith(<ViewerPage />);
    // ErrorState renders a retry affordance
    expect(screen.queryByText("b-1")).toBeNull();
  });

  it("shows not-implemented panel for catalog-disabled reports", () => {
    mockReportKey = "rebooked_bookings";
    mockReport = { data: undefined, isPending: false, isError: false, refetch: vi.fn() };
    renderWith(<ViewerPage />);
    expect(screen.getByText("Not yet implemented")).toBeInTheDocument();
  });

  it("renders labeled totals for non-column money keys (signed ledger)", () => {
    mockReport = {
      data: {
        ...reportFixture,
        key: "stayos_revenue",
        columns: ["created_at", "entry_type", "amount_egp"],
        rows: [
          { created_at: "2026-01-01T00:00:00Z", entry_type: "credit", amount_egp: 90 },
          { created_at: "2026-01-02T00:00:00Z", entry_type: "debit", amount_egp: -90 },
        ],
        totals: { credit_egp: 90, debit_egp: 90, amount_egp: 0 },
        total_labels: {
          credit_egp: "gross_credits",
          debit_egp: "gross_debits",
          amount_egp: "net_recognised_revenue",
        },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
    renderWith(<ViewerPage />);
    const tTotals = (messages.adminReports as Record<string, unknown>)
      .totalLabels as Record<string, string>;
    expect(screen.getByText(tTotals.gross_credits)).toBeInTheDocument();
    expect(screen.getByText(tTotals.gross_debits)).toBeInTheDocument();
    expect(
      screen.getByText(tTotals.net_recognised_revenue)
    ).toBeInTheDocument();
  });

  it("renders the report semantics note when present", () => {
    mockCatalog = {
      data: [
        {
          ...catalogFixture[0],
          note: "economics_not_revenue",
          total_labels: {},
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
    renderWith(<ViewerPage />);
    const notes = (messages.adminReports as Record<string, unknown>)
      .notes as Record<string, string>;
    expect(
      screen.getByText(new RegExp(notes.economics_not_revenue.slice(0, 30)))
    ).toBeInTheDocument();
  });

  it("export buttons call the export helper", async () => {
    renderWith(<ViewerPage />);
    fireEvent.click(screen.getByText(t.exportCsv as string));
    await waitFor(() => expect(exportSpy).toHaveBeenCalledWith("booking_financials", expect.any(Object), "csv"));
    fireEvent.click(screen.getByText(t.exportXlsx as string));
    await waitFor(() => expect(exportSpy).toHaveBeenCalledWith("booking_financials", expect.any(Object), "xlsx"));
  });
});
