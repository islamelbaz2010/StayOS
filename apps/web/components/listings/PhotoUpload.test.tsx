import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

import { PhotoUpload } from "@/components/listings/PhotoUpload";

const messages = {
  photos: {
    pageTitle: "Manage Photos",
    title: "Property Photos",
    subtitle: "Add photos of your property.",
    selectPhotos: "Select photos",
    formatsHint: "JPG, PNG, WebP - max 10MB",
    uploading: "Uploading",
    gallery: "Uploaded photos",
    noPhotos: "No photos yet.",
    loading: "Loading photos...",
    cover: "Cover",
    setCover: "Set as cover",
    delete: "Delete",
    confirmDelete: "Confirm delete",
    confirmDeleteMessage: "Are you sure?",
    cancel: "Cancel",
    deleting: "Deleting...",
    retry: "Retry",
    invalidType: "Unsupported file type.",
    fileTooLarge: "File too large.",
    uploadFailed: "Upload failed.",
  },
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

function makeFile(name: string, type: string, size: number = 1024): File {
  const file = new File(["x".repeat(size)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("PhotoUpload", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.patch.mockReset();
    mockApi.delete.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders select photos button and empty state", async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    expect(screen.getByText("Select photos")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("No photos yet.")).toBeInTheDocument();
    });
  });

  it("renders gallery with photos from API", async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: "photo-1",
          unit_id: "unit-1",
          s3_key: "listings/unit-1/photo_1.jpg",
          url: "https://s3.example.com/photo_1.jpg",
          display_order: 0,
          is_cover: true,
          caption: null,
        },
        {
          id: "photo-2",
          unit_id: "unit-1",
          s3_key: "listings/unit-1/photo_2.jpg",
          url: "https://s3.example.com/photo_2.jpg",
          display_order: 1,
          is_cover: false,
          caption: null,
        },
      ],
    });

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    await waitFor(() => {
      expect(screen.getByText("Uploaded photos")).toBeInTheDocument();
    });

    expect(screen.getByText("Cover")).toBeInTheDocument();
    expect(screen.getByText("Set as cover")).toBeInTheDocument();
    expect(screen.getAllByText("Delete")).toHaveLength(2);
  });

  it("shows delete confirmation modal", async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: "photo-1",
          unit_id: "unit-1",
          s3_key: "k",
          url: "https://s3.example.com/p.jpg",
          display_order: 0,
          is_cover: false,
          caption: null,
        },
      ],
    });
    mockApi.delete.mockResolvedValue({});

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    await waitFor(() => {
      expect(screen.getByText("Uploaded photos")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.getByText("Confirm delete")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });
  });

  it("calls delete API on confirm", async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: "photo-1",
          unit_id: "unit-1",
          s3_key: "k",
          url: "https://s3.example.com/p.jpg",
          display_order: 0,
          is_cover: false,
          caption: null,
        },
      ],
    });
    mockApi.delete.mockResolvedValue({});

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    await waitFor(() => {
      expect(screen.getByText("Uploaded photos")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.getByText("Confirm delete")).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText("Delete");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith("/listings/unit-1/photos/photo-1");
    });
  });

  it("calls set cover API on set cover click", async () => {
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: "photo-1",
          unit_id: "unit-1",
          s3_key: "k",
          url: "https://s3.example.com/p.jpg",
          display_order: 0,
          is_cover: false,
          caption: null,
        },
      ],
    });
    mockApi.patch.mockResolvedValue({
      data: {
        id: "photo-1",
        unit_id: "unit-1",
        s3_key: "k",
        url: "https://s3.example.com/p.jpg",
        display_order: 0,
        is_cover: true,
        caption: null,
      },
    });

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    await waitFor(() => {
      expect(screen.getByText("Uploaded photos")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Set as cover"));

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/listings/unit-1/photos/photo-1/cover"
      );
    });
  });

  it("validates file type and shows error for non-image", async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = makeFile("doc.pdf", "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Unsupported file type.")).toBeInTheDocument();
    });
  });

  it("validates file size and shows error for large file", async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    renderWithProviders(<PhotoUpload unitId="unit-1" />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = makeFile("big.jpg", "image/jpeg", 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("File too large.")).toBeInTheDocument();
    });
  });
});
