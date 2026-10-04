import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

import { ImportCandidateModal } from "./ImportCandidateModal";
import type { DiscoveryCandidate } from "@/lib/queries/discovery";

function makeCandidate(overrides: Partial<DiscoveryCandidate> = {}): DiscoveryCandidate {
  return {
    id: "cand-1",
    source: "overpass_osm",
    source_url: "https://example.com",
    external_listing_id: null,
    discovered_at: "2026-10-01",
    candidate_type: "SUPPLY_LEAD",
    raw_title: "Sonesta Hotel",
    raw_description: null,
    raw_price: null,
    raw_location: null,
    raw_images: [],
    raw_amenities: [],
    title: "Sonesta Hotel",
    description: null,
    country: "Egypt",
    city: "Cairo",
    zone: null,
    governorate: "Cairo",
    latitude: 30.0,
    longitude: 31.2,
    property_type: null,
    bedrooms: null,
    bathrooms: null,
    guest_capacity: null,
    nightly_price: null,
    currency: "EGP",
    image_urls: [],
    amenities: [],
    source_confidence: 0.8,
    data_completeness_score: 0.5,
    qualification_score: 70,
    contact_status: "FOUND",
    contact_type: "phone",
    contact_value: "+20 2 22641111",
    contact_confidence: 0.9,
    duplicate_status: "UNIQUE",
    duplicate_confidence: 0,
    duplicate_of_id: null,
    status: "READY_FOR_IMPORT",
    notes: null,
    imported_unit_id: null,
    run_id: null,
    created_at: "2026-10-01",
    updated_at: "2026-10-01",
    ...overrides,
  } as DiscoveryCandidate;
}

function renderModal(
  candidate: DiscoveryCandidate,
  onSubmit = vi.fn(),
  messages: AbstractIntlMessages = en as never,
  locale = "en"
) {
  return {
    onSubmit,
    ...render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ImportCandidateModal
          candidate={candidate}
          isPending={false}
          error={null}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />
      </NextIntlClientProvider>
    ),
  };
}

describe("ImportCandidateModal", () => {
  it("labels the property and contact fields semantically (not as host identity)", () => {
    renderModal(makeCandidate());
    expect(screen.getByText(/Property Name/)).toBeInTheDocument();
    expect(screen.getByText("Sonesta Hotel")).toBeInTheDocument();
    expect(screen.getByText("Contact Name")).toBeInTheDocument();
    expect(screen.getByText("Contact Phone")).toBeInTheDocument();
    expect(screen.getByText("Contact Email")).toBeInTheDocument();
    expect(screen.queryByText("Host Name")).not.toBeInTheDocument();
    // No host account may be implied
    expect(screen.getByText(/no StayOS host account is created/)).toBeInTheDocument();
  });

  it("requires a property type before import is allowed", () => {
    const { onSubmit } = renderModal(makeCandidate({ property_type: null }));
    const confirm = screen.getByRole("button", { name: "Confirm Import" });
    expect(confirm).toBeDisabled();
    expect(screen.getByText(/Property type is required/)).toBeInTheDocument();
    fireEvent.click(confirm);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("enables import once a valid property type is selected", () => {
    const { onSubmit } = renderModal(
      makeCandidate({ property_type: null, nightly_price: 1200 })
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "HOTEL_ROOM" },
    });
    const confirm = screen.getByRole("button", { name: "Confirm Import" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        overrides: expect.objectContaining({ property_type: "HOTEL_ROOM" }),
      })
    );
  });

  it("prefills the property type from the candidate when discovered", () => {
    renderModal(makeCandidate({ property_type: "VILLA", nightly_price: 2000 }));
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("VILLA");
    expect(
      screen.getByRole("button", { name: "Confirm Import" })
    ).toBeEnabled();
  });

  it("marks an admin-entered price as such (no discovered price)", () => {
    renderModal(makeCandidate({ nightly_price: null }));
    expect(
      screen.getByText(/recorded as admin-entered/)
    ).toBeInTheDocument();
  });

  it("sends a price override only when the admin supplies a missing price", () => {
    const { onSubmit } = renderModal(
      makeCandidate({ property_type: "APARTMENT", nightly_price: null })
    );
    fireEvent.change(screen.getByPlaceholderText(/min 100/), {
      target: { value: "800" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Import" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        overrides: expect.objectContaining({ price: 800 }),
      })
    );
  });

  it("does not send a price override when the discovered price is untouched", () => {
    const { onSubmit } = renderModal(
      makeCandidate({ property_type: "APARTMENT", nightly_price: 1500 })
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm Import" }));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.overrides.price).toBeUndefined();
    expect(payload.overrides.property_type).toBe("APARTMENT");
  });

  it("trims contact fields before submit", () => {
    const { onSubmit } = renderModal(
      makeCandidate({ property_type: "APARTMENT", nightly_price: 1500 })
    );
    fireEvent.change(screen.getByPlaceholderText("Contact person name"), {
      target: { value: "  Ahmed  " },
    });
    fireEvent.change(screen.getByPlaceholderText("owner@example.com"), {
      target: { value: "  Owner@Hotel.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Import" }));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.host_name).toBe("Ahmed");
    expect(payload.host_email).toBe("Owner@Hotel.com");
  });

  it("renders Arabic labels correctly", () => {
    renderModal(makeCandidate(), vi.fn(), ar as never, "ar");
    expect(screen.getByText(/اسم العقار/)).toBeInTheDocument();
    expect(screen.getByText("اسم جهة الاتصال")).toBeInTheDocument();
    expect(screen.getByText("اختر نوع العقار")).toBeInTheDocument();
  });
});
