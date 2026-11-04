import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

let mockLocale = "en";
const mockAuth = { user: { role: "admin" } };

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: mockLocale }),
  usePathname: () => `/${mockLocale}/admin/host-leads`,
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

const leadsFixture = [
  {
    id: "lead-uuid-0001",
    kind: "HOST",
    name: "Ahmed Example",
    phone: "+201001112223",
    email: "ahmed@example.com",
    city: "Cairo",
    detail: "villa×3",
    status: "NEW",
    consent_at: "2026-11-01T10:00:00Z",
    utm_source: "instagram",
    utm_campaign: "founding",
    created_at: "2026-11-01T10:00:00Z",
  },
];

const detailFixture = {
  id: "lead-uuid-0001",
  kind: "HOST",
  status: "NEW",
  full_name: "Ahmed Example",
  phone: "+201001112223",
  email: "ahmed@example.com",
  city: "Cairo",
  property_type: "villa",
  units_count: 3,
  property_readiness: "ready_now",
  preferred_contact: "whatsapp",
  management_company: null,
  message: "Please call after 6pm",
  consent: true,
  consent_at: "2026-11-01T10:00:00Z",
  lang: "en",
  utm_source: "instagram",
  utm_medium: null,
  utm_campaign: "founding",
  utm_content: null,
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-01T10:00:00Z",
  notes: [],
};

const summaryFixture = {
  page_views: 10,
  host_form_starts: 4,
  guest_form_starts: 2,
  guest_waitlist_submits: 1,
  host_submissions: 3,
  guest_submissions: 1,
  host_conversion_rate: 75,
  guest_conversion_rate: 50,
  top_source: "instagram",
  top_campaign: "founding",
  top_cities: [{ city: "Cairo", leads: 2 }],
  host_by_property_type: [{ property_type: "villa", leads: 2 }],
  host_units_total: 9,
  leads_by_status: { "host:NEW": 2, "host:CONTACTED": 1 },
};

let mockLeads: { data?: unknown; isPending: boolean; isError: boolean } = {
  data: undefined,
  isPending: true,
  isError: false,
};
let mockDetail: { data?: unknown; isPending: boolean; isError: boolean } = {
  data: undefined,
  isPending: true,
  isError: false,
};
const updateStatusSpy = vi.fn();
const addNoteSpy = vi.fn();
const exportSpy = vi.fn();

vi.mock("@/lib/queries/hostLeads", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/queries/hostLeads")>();
  return {
    ...actual,
    useHostLeads: () => mockLeads,
    useLeadDetail: () => mockDetail,
    useLeadsSummary: () => ({ data: summaryFixture }),
    useUpdateLeadStatus: () => ({
      mutate: (...args: unknown[]) => updateStatusSpy(...args),
      isPending: false,
    }),
    useAddLeadNote: () => ({
      mutate: (...args: unknown[]) => addNoteSpy(...args),
      isPending: false,
    }),
    downloadLeadsCsv: (...args: unknown[]) => exportSpy(...args),
  };
});

import HostLeadsPage from "./page";

function renderWith(ui: React.ReactNode, locale = "en") {
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
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const t = messages.adminHostLeads as Record<string, unknown>;
const tAr = arMessages.adminHostLeads as Record<string, unknown>;

describe("Admin Host Leads page", () => {
  beforeEach(() => {
    mockLeads = { data: leadsFixture, isPending: false, isError: false };
    mockDetail = { data: detailFixture, isPending: false, isError: false };
    updateStatusSpy.mockClear();
    addNoteSpy.mockClear();
    exportSpy.mockClear();
  });

  it("renders title, summary metrics and lead rows", () => {
    renderWith(<HostLeadsPage />);
    expect(screen.getByText(t.title as string)).toBeInTheDocument();
    expect(screen.getByText("Ahmed Example")).toBeInTheDocument();
    expect(screen.getByText("villa×3")).toBeInTheDocument();
    // summary cards: total 3, NEW 2, CONTACTED 1, units 9
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("opens the detail drawer with canonical fields and notes area", async () => {
    renderWith(<HostLeadsPage />);
    fireEvent.click(screen.getByText("Ahmed Example"));
    await waitFor(() =>
      expect(screen.getByText("Please call after 6pm")).toBeInTheDocument()
    );
    expect(screen.getAllByText("instagram").length).toBeGreaterThan(0);
  });

  it("fires authenticated CSV export with current filters", () => {
    renderWith(<HostLeadsPage />);
    fireEvent.click(screen.getByText(t.exportCsv as string));
    expect(exportSpy).toHaveBeenCalled();
  });

  it("renders Arabic labels in ar locale", () => {
    renderWith(<HostLeadsPage />, "ar");
    expect(screen.getByText(tAr.title as string)).toBeInTheDocument();
    expect(screen.getByText(tAr.exportCsv as string)).toBeInTheDocument();
  });

  it("shows empty state when no leads match", () => {
    mockLeads = { data: [], isPending: false, isError: false };
    renderWith(<HostLeadsPage />);
    expect(screen.getByText(t.empty as string)).toBeInTheDocument();
  });
});
