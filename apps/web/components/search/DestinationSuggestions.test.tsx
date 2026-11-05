import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";

import messages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ api: mockApi }));

import { DestinationSuggestions } from "./DestinationSuggestions";

const POPULAR = [
  { canonical_name_en: "Alexandria", canonical_name_ar: "الإسكندرية", city: "Alexandria", governorate: "Alexandria Governorate", lat: null, lng: null },
  { canonical_name_en: "Aswan", canonical_name_ar: "أسوان", city: "Aswan", governorate: "Aswan Governorate", lat: null, lng: null },
];
const MATCHES = [
  { canonical_name_en: "New Cairo", canonical_name_ar: "القاهرة الجديدة", city: "New Cairo", governorate: "Cairo", lat: null, lng: null },
];

function harness(initial = "", locale = "en") {
  const onSelect = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper() {
    const [v, setV] = useState(initial);
    return (
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale={locale}
          messages={locale === "ar" ? arMessages : messages}
        >
          <DestinationSuggestions
            value={v}
            onChange={setV}
            onSelect={onSelect}
            inputClassName=""
          />
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  }
  const utils = render(<Wrapper />);
  return { onSelect, ...utils };
}

function mockEndpoints() {
  mockApi.get.mockImplementation((url: string, opts?: { params?: { q?: string } }) => {
    if (url === "/locations/popular") return Promise.resolve({ data: { suggestions: POPULAR } });
    if (url === "/locations/autocomplete")
      return Promise.resolve({
        data: { suggestions: opts?.params?.q?.toLowerCase().includes("zzz") ? [] : MATCHES },
      });
    return Promise.reject(new Error(`unmocked ${url}`));
  });
}

describe("DestinationSuggestions", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockEndpoints();
  });

  it("shows popular destinations as defaults on an empty input", async () => {
    harness("");
    expect((await screen.findAllByText("Alexandria")).length).toBeGreaterThan(0);
    expect(screen.getByText("Aswan")).toBeTruthy();
    // Empty input must NOT fire the autocomplete endpoint.
    expect(
      mockApi.get.mock.calls.some((c) => c[0] === "/locations/autocomplete")
    ).toBe(false);
  });

  it("queries autocomplete once the query reaches 2 chars", async () => {
    harness("");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ca" } });
    expect(await screen.findByText("New Cairo")).toBeTruthy();
  });

  it("shows the empty state when nothing matches", async () => {
    harness("");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });
    expect(await screen.findByText(messages.search.noSuggestions)).toBeTruthy();
  });

  it("shows a retryable error state on request failure", async () => {
    mockApi.get.mockRejectedValue(new Error("network"));
    harness("");
    expect(await screen.findByText(messages.search.suggestionsError)).toBeTruthy();
    expect(screen.getByText(messages.search.retry)).toBeTruthy();
  });

  it("selecting a suggestion passes the suggestion object", async () => {
    const { onSelect } = harness("");
    fireEvent.click((await screen.findAllByText("Alexandria"))[0]);
    expect(onSelect).toHaveBeenCalledWith(POPULAR[0]);
  });

  it("arrow keys + Enter select the highlighted suggestion", async () => {
    const { onSelect } = harness("");
    const input = screen.getByRole("combobox");
    await screen.findAllByText("Alexandria");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(POPULAR[1]);
  });

  it("renders Arabic names under the ar locale", async () => {
    harness("", "ar");
    expect(await screen.findByText("الإسكندرية")).toBeTruthy();
  });
});
