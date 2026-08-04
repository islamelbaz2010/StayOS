import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  api: mockApi,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layouts", () => ({
  HostLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: { role: "admin", id: "test-id", display_name: "Admin" },
  }),
}));

import AdminImportPage from "@/app/[locale]/admin/import/page";

const messages = {
  adminImport: {
    title: "Bulk Import Listings",
    selectFile: "Select file",
    formatsHint: "CSV or Excel (.xlsx) - max 10MB",
    parsing: "Parsing file...",
    previewFailed: "Failed to parse file.",
    importFailed: "Import failed.",
    noValidRows: "No valid rows to import.",
    totalRows: "Total rows",
    validRows: "Valid rows",
    invalidRows: "Invalid / duplicates",
    colTitle: "Title",
    colCity: "City",
    colType: "Type",
    colPrice: "Price",
    colHost: "Host",
    colStatus: "Status",
    colError: "Error",
    valid: "Valid",
    invalid: "Invalid",
    duplicate: "Duplicate",
    cancel: "Cancel",
    importValid: "Import valid rows",
    importing: "Importing listings...",
    importComplete: "Import complete",
    totalRequested: "Requested",
    created: "Created",
    failed: "Failed",
    importAnother: "Import another file",
    resultStatus: {
      created: "Created",
      skipped: "Skipped",
      failed: "Failed",
    },
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminImportPage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("AdminImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload UI on initial load", () => {
    renderPage();
    expect(screen.getByText("Bulk Import Listings")).toBeInTheDocument();
    expect(screen.getByText("Select file")).toBeInTheDocument();
  });

  it("shows preview table after file upload", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        total_rows: 2,
        valid_rows: 1,
        invalid_rows: 1,
        duplicate_rows: 0,
        rows: [
          {
            row_number: 1,
            title: "Apartment 1",
            city: "Cairo",
            governorate: "Cairo",
            price: 500,
            property_type: "APARTMENT",
            host_name: "Host 1",
            host_phone: "+201234567890",
            host_email: null,
            is_valid: true,
            is_duplicate: false,
            errors: [],
          },
          {
            row_number: 2,
            title: "Bad Apt",
            city: "",
            governorate: "Giza",
            price: 50,
            property_type: "MANSION",
            host_name: null,
            host_phone: null,
            host_email: null,
            is_valid: false,
            is_duplicate: false,
            errors: [
              { row_number: 2, field: "city", message: "city is required" },
              { row_number: 2, field: "price", message: "price must be at least 100" },
            ],
          },
        ],
      },
    });

    renderPage();

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Apartment 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Total rows")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import valid rows/ })).toBeInTheDocument();
  });

  it("shows summary after successful import", async () => {
    mockApi.post
      .mockResolvedValueOnce({
        data: {
          total_rows: 1,
          valid_rows: 1,
          invalid_rows: 0,
          duplicate_rows: 0,
          rows: [
            {
              row_number: 1,
              title: "Good Apt",
              city: "Cairo",
              governorate: "Cairo",
              price: 500,
              property_type: "APARTMENT",
              host_name: "Host",
              host_phone: "+201234567890",
              host_email: null,
              is_valid: true,
              is_duplicate: false,
              errors: [],
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total_requested: 1,
          created: 1,
          failed: 0,
          results: [
            {
              row_number: 1,
              title: "Good Apt",
              unit_id: "unit-123",
              status: "created",
              error: null,
            },
          ],
        },
      });

    renderPage();

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import valid rows/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Import valid rows/ }));

    await waitFor(() => {
      expect(screen.getByText("Import complete")).toBeInTheDocument();
    });

    expect(screen.getByText("Import another file")).toBeInTheDocument();
  });
});
